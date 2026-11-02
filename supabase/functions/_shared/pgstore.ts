// Postgres implementation of the engine's Store contract (see packages/engine/src/api/types.ts).
// Runs in Deno (edge functions) and in Node (integration tests via tsx).
import postgres from 'postgres';
import { ApiError, kindOfDay } from './engine.js';
import type {
  GameRecord,
  GameTx,
  NewspaperContent,
  PlayerRecord,
  PlayerTx,
  Store,
} from '../../../packages/engine/src/api/types.ts';
import type { LoadedCase } from '../../../packages/engine/src/loader.ts';
import type { PlayerState } from '../../../packages/engine/src/game/state.ts';

type Sql = postgres.Sql;
type Q = postgres.TransactionSql;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CASE_TTL_MS = 5 * 60_000;
const caseCache = new Map<string, { at: number; data: LoadedCase }>();

/* eslint-disable @typescript-eslint/no-explicit-any */
const rowsOf = async (sql: Sql | Q, table: string, caseId: string): Promise<any[]> =>
  (await sql`select data from ${sql(table)} where case_id = ${caseId} order by seq`).map(
    (r) => r.data,
  );

/** Rebuilds the validated case from the case_* tables. Server only: it contains the solution. */
async function loadCaseData(sql: Sql, caseId: string): Promise<LoadedCase> {
  const hit = caseCache.get(caseId);
  if (hit && Date.now() - hit.at < CASE_TTL_MS) return hit.data;
  const [meta] =
    await sql`select title, to_char(start_date, 'YYYY-MM-DD') as start_date, data from case_meta where case_id = ${caseId}`;
  const [sol] =
    await sql`select solution, world, proof_questions from case_solution where case_id = ${caseId}`;
  if (!meta || !sol) throw new ApiError('case_not_loaded', 500);
  const get = (t: string) => rowsOf(sql, t, caseId);
  const [
    rooms,
    npcs,
    facts,
    statements,
    sources,
    puzzles,
    items,
    events,
    questions,
    paper,
    prolog,
  ] = await Promise.all(
    [
      'case_rooms',
      'case_npcs',
      'case_facts',
      'case_statements',
      'case_sources',
      'case_puzzles',
      'case_items',
      'case_events',
      'case_questions',
      'case_newspaper_templates',
      'case_prolog',
    ].map(get),
  );
  const data = {
    case: {
      id: caseId,
      title: meta.title,
      start_date: meta.start_date,
      ...meta.data,
      solution: sol.solution,
      proof_questions: sol.proof_questions,
    },
    world: sol.world,
    rooms: { rooms },
    npcs: { npcs },
    facts: { facts },
    statements: { statements },
    sources: { sources },
    puzzles: { puzzles, items },
    events: { events },
    newspaper: paper[0],
    questions: { questions },
    prolog: prolog[0],
  } as unknown as LoadedCase;
  caseCache.set(caseId, { at: Date.now(), data });
  return data;
}

const toGame = (r: any): GameRecord => ({
  id: r.g_id,
  slug: r.slug,
  name: r.g_name,
  caseId: r.case_id,
  startDate: r.start_date,
  profile: r.config.profile,
  scoring: r.config.scoring,
});
const toPlayer = (r: any): PlayerRecord => ({
  id: r.id,
  gameId: r.game_id,
  name: r.name,
  avatar: r.avatar,
  isDuo: r.is_duo,
  settings: r.settings ?? {},
  state: r.state,
});

const PLAYER_SELECT = (q: Sql | Q) => q`
  select p.*, g.id as g_id, g.name as g_name, g.slug, g.case_id, g.config,
         to_char(g.start_date, 'YYYY-MM-DD') as start_date
  from players p join games g on g.id = p.game_id`;

function gameTx(sql: Sql | Q, game: GameRecord, base: Sql): GameTx {
  return {
    game,
    caseData: () => loadCaseData(base, game.caseId),
    async activity(day) {
      const rows = await sql`
        select p.id, p.name, d.room_id,
               coalesce((select sum(points) from score_ledger l where l.player_id = p.id and l.day = ${day}), 0)::int as points
        from players p left join player_days d on d.player_id = p.id and d.day = ${day}
        where p.game_id = ${game.id}`;
      return rows.map((r) => ({ playerId: r.id, name: r.name, room: r.room_id, points: r.points }));
    },
    async plaquesOnDay(day) {
      const rows = await sql`
        select pl.title, p.name from plaques pl join players p on p.id = pl.player_id
        where p.game_id = ${game.id} and pl.day = ${day} order by pl.ts`;
      return rows.map((r) => ({ title: r.title, player: r.name }));
    },
    async scoreboard() {
      const rows = await sql`
        select p.id, p.name, p.avatar,
               coalesce((select sum(points) from score_ledger l where l.player_id = p.id), 0)::int as points,
               (select count(*) from plaques x where x.player_id = p.id)::int as plaques,
               coalesce((select array_agg(x.title order by x.ts) from plaques x where x.player_id = p.id), '{}') as titles
        from players p where p.game_id = ${game.id}`;
      return rows.map((r) => ({
        playerId: r.id,
        name: r.name,
        avatar: r.avatar,
        points: r.points,
        plaques: r.plaques,
        plaqueTitles: r.titles as string[],
      }));
    },
    async newspaper(day) {
      const [r] =
        await sql`select content from newspaper where game_id = ${game.id} and day = ${day}`;
      return r?.content as NewspaperContent | undefined;
    },
    async storeNewspaper(day, content) {
      await sql`insert into newspaper (game_id, day, content) values (${game.id}, ${day}, ${sql.json(content as any)})
                on conflict (game_id, day) do nothing`;
      const [r] =
        await sql`select content from newspaper where game_id = ${game.id} and day = ${day}`;
      return r?.content as NewspaperContent;
    },
  };
}

export class PgStore implements Store {
  constructor(private sql: Sql) {}

  async transaction<T>(
    playerId: string,
    fn: (tx: PlayerTx) => Promise<T>,
    opts: { lock: boolean; slug?: string } = { lock: true },
  ): Promise<T> {
    if (!UUID.test(playerId)) throw new ApiError('player_not_found', 404);
    const base = this.sql;
    return this.sql.begin(async (q) => {
      const [row] = opts.lock
        ? await q`${PLAYER_SELECT(q)} where p.id = ${playerId} for update of p`
        : await q`${PLAYER_SELECT(q)} where p.id = ${playerId}`;
      if (!row) throw new ApiError('player_not_found', 404);
      const game = toGame(row);
      if (opts.slug !== undefined && opts.slug !== game.slug)
        throw new ApiError('player_not_found', 404);
      let cur = toPlayer(row);
      const tx: PlayerTx = {
        ...gameTx(q, game, base),
        get player() {
          return cur;
        },
        async saved(requestId) {
          const [r] =
            await q`select response from request_log where player_id = ${playerId} and request_id = ${requestId}`;
          return r?.response;
        },
        async remember(requestId, response) {
          await q`insert into request_log (player_id, request_id, response)
                  values (${playerId}, ${requestId}, ${q.json(response as any)}) on conflict do nothing`;
        },
        async save(next, settings) {
          await persist(
            q,
            cur,
            next,
            settings ?? cur.settings,
            await loadCaseData(base, game.caseId),
          );
          cur = { ...cur, state: next, settings: settings ?? cur.settings };
        },
        async tryPlaque(sourceId, title) {
          const r =
            await q`insert into plaques (source_id, player_id, title, day) values (${sourceId}, ${playerId}, ${title}, ${cur.state.day})
                            on conflict do nothing returning source_id`;
          return r.length > 0;
        },
      };
      return fn(tx);
    }) as Promise<T>;
  }

  async game<T>(gameId: string, fn: (tx: GameTx) => Promise<T>): Promise<T> {
    if (!UUID.test(gameId)) throw new ApiError('game_not_found', 404);
    const [g] = await this
      .sql`select id as g_id, name as g_name, slug, case_id, config, to_char(start_date, 'YYYY-MM-DD') as start_date from games where id = ${gameId}`;
    if (!g) throw new ApiError('game_not_found', 404);
    return fn(gameTx(this.sql, toGame(g), this.sql));
  }

  async gameBySlug(slug: string) {
    const [r] = await this.sql`select id, name, profile from games where slug = ${slug}`;
    return r
      ? { id: r.id as string, name: r.name as string, profile: r.profile as string }
      : undefined;
  }

  async listPlayers(gameId: string) {
    if (!UUID.test(gameId)) throw new ApiError('game_not_found', 404);
    const rows = await this
      .sql`${PLAYER_SELECT(this.sql)} where p.game_id = ${gameId} order by p.name`;
    return rows.map(toPlayer);
  }

  async createPlayer(
    gameId: string,
    p: { name: string; avatar: string | null; isDuo: boolean; state: PlayerState },
  ) {
    if (!UUID.test(gameId)) throw new ApiError('game_not_found', 404);
    const [r] = await this.sql`insert into players (game_id, name, avatar, is_duo, state, next_day)
      values (${gameId}, ${p.name}, ${p.avatar}, ${p.isDuo}, ${this.sql.json(p.state as any)}, 1) returning *`;
    return toPlayer(r);
  }

  async updatePlayer(
    playerId: string,
    patch: { name?: string; avatar?: string | null; isDuo?: boolean },
  ) {
    if (!UUID.test(playerId)) return undefined;
    const [r] = await this.sql`update players set
        name = coalesce(${patch.name ?? null}, name),
        avatar = case when ${patch.avatar !== undefined} then ${patch.avatar ?? null} else avatar end,
        is_duo = coalesce(${patch.isDuo ?? null}, is_duo)
      where id = ${playerId} returning *`;
    return r ? toPlayer(r) : undefined;
  }
}

/** Writes the engine state plus the derived rows (ledger, discoveries, days, ...). */
async function persist(q: Q, prev: PlayerRecord, next: PlayerState, settings: any, c: LoadedCase) {
  const id = prev.id;
  await q`update players set state = ${q.json(next as any)}, settings = ${q.json(settings)}, next_day = ${Math.min(next.day, 25)} where id = ${id}`;

  const days = new Set([prev.state.day, next.day].filter((d) => d >= 1 && d <= 24));
  for (const day of days) {
    const ended = day < next.day;
    const st = day === next.day ? next : prev.state;
    await q`insert into player_days (player_id, day, room_id, actions_used, finished_at, next_room_id)
      values (${id}, ${day}, ${st.room}, ${st.actionsUsed}, ${ended ? new Date() : null}, ${ended ? next.room : null})
      on conflict (player_id, day) do update set room_id = excluded.room_id, actions_used = excluded.actions_used,
        finished_at = coalesce(excluded.finished_at, player_days.finished_at),
        next_room_id = coalesce(excluded.next_room_id, player_days.next_room_id)`;
  }
  for (const d of next.discoveries.slice(prev.state.discoveries.length))
    for (const item of d.itemIds)
      await q`insert into discoveries (player_id, source_id, item_id, day) values (${id}, ${d.sourceId}, ${item}, ${d.day}) on conflict do nothing`;
  for (const item of next.inventory.filter((i) => !prev.state.inventory.includes(i)))
    await q`insert into inventory (player_id, item_id, from_day) values (${id}, ${item}, ${next.day}) on conflict do nothing`;
  for (const l of next.ledger.slice(prev.state.ledger.length))
    await q`insert into score_ledger (player_id, kind, ref, points, day) values (${id}, ${l.kind}, ${l.ref}, ${l.points}, ${l.day}) on conflict do nothing`;
  for (const [pid, pr] of Object.entries(next.puzzles))
    if (JSON.stringify(prev.state.puzzles[pid]) !== JSON.stringify(pr))
      await q`insert into puzzle_state (player_id, puzzle_id, attempts, hints_used, solved_at)
        values (${id}, ${pid}, ${pr.attempts}, ${pr.hints}, ${pr.solved ? new Date() : null})
        on conflict (player_id, puzzle_id) do update set attempts = excluded.attempts, hints_used = excluded.hints_used,
          solved_at = coalesce(puzzle_state.solved_at, excluded.solved_at)`;
  for (const [day, dp] of Object.entries(next.daily))
    if (JSON.stringify(prev.state.daily[Number(day)]) !== JSON.stringify(dp))
      await q`insert into daily_puzzles (player_id, day, type, level, solved, hint_used)
        values (${id}, ${Number(day)}, ${kindOfDay(Number(day))}, ${dp.level}, ${dp.solved}, ${dp.hints > 0})
        on conflict (player_id, day) do update set solved = excluded.solved, hint_used = excluded.hint_used`;
  for (const [day, qp] of Object.entries(next.questions))
    if (qp.done && !prev.state.questions[Number(day)]?.done) {
      const qid = c.questions.questions.find((x) => x.day === Number(day))?.id ?? `q${day}`;
      await q`insert into daily_answers (player_id, day, question_id, correct, hint_used)
        values (${id}, ${Number(day)}, ${qid}, ${qp.correct}, ${qp.hint}) on conflict do nothing`;
    }
}
