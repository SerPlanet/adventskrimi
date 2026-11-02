// Integration tests against the deployed staging edge functions (case "test", fake clock via x-game-now).
// Run: npm run deploy:functions && npm run test:int
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import postgres from 'postgres';
import { loadProfile, loadScoring } from '../../packages/engine/src/loader';
import { connInfo, readEnv } from '../lib/db';

const env = readEnv();
const URL = env.SUPABASE_STAGING_URL as string;
const ANON = env.SUPABASE_STAGING_ANON_KEY as string;
const ADMIN = env.ADMIN_TOKEN_STAGING as string;
const DAY1 = '2026-12-01T12:00:00+01:00';
const SLUG = 'int-test';
const DAY3 = '2026-12-03T12:00:00+01:00';

const sql = postgres({ ...connInfo('staging'), ssl: 'require', max: 2 });
let gameId = '';
let a = '';
let b = '';
let n = 0;
const rid = () => `int-${Date.now()}-${++n}-${Math.random().toString(36).slice(2, 8)}`;

async function post(fn: string, body: object, opts: { now?: string; admin?: string | null } = {}) {
  const res = await fetch(`${URL}/functions/v1/${fn}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      apikey: ANON,
      ...(opts.now ? { 'x-game-now': opts.now } : {}),
      ...(opts.admin ? { 'x-admin-token': opts.admin } : {}),
    },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: (await res.json()) as any }; // eslint-disable-line @typescript-eslint/no-explicit-any
}

beforeAll(async () => {
  const config = {
    profile: loadProfile('config/profiles/friends.yaml'),
    scoring: loadScoring('config/scoring.json'),
  };
  const [g] = await sql`insert into games (name, slug, profile, start_date, config, case_id)
    values ('int-test', 'int-test', 'friends', '2026-12-01', ${sql.json(config as never)}, 'test') returning id`;
  gameId = g!.id;
  const mk = async (name: string) =>
    (
      await post(
        'admin_players',
        { op: 'create', game_id: gameId, player: { name } },
        { admin: ADMIN },
      )
    ).body.player.id as string;
  a = await mk('Int-A');
  b = await mk('Int-B');
});

afterAll(async () => {
  if (gameId) await sql`delete from games where id = ${gameId}`;
  await sql.end();
});

const talk = { type: 'talk', npc: 'anna', topic: 'nacht' };

describe('staging edge functions', () => {
  test('admin needs the token', async () => {
    expect((await post('admin_players', { op: 'list', game_id: gameId })).status).toBe(403);
    expect(
      (await post('admin_players', { op: 'list', game_id: gameId }, { admin: 'x'.repeat(24) }))
        .status,
    ).toBe(403);
    const ok = await post('admin_players', { op: 'list', game_id: gameId }, { admin: ADMIN });
    expect(ok.body.players).toHaveLength(2);
  });

  test('state shows nothing locked and never the solution', async () => {
    const r = await post('state', { slug: SLUG, player_id: a }, { now: DAY1 });
    expect(r.status).toBe(200);
    const text = JSON.stringify(r.body);
    for (const s of ['solution', 'truth', 'world', 'f_excl_ben', '"answer"'])
      expect(text).not.toContain(s);
    expect(r.body.state.finds).toEqual([]);
  });

  test('same request_id twice: one effect, same answer; empty action is free', async () => {
    const body = { slug: SLUG, player_id: a, request_id: rid(), action: talk };
    const first = await post('act', body, { now: DAY1 });
    const again = await post('act', body, { now: DAY1 });
    expect(first.body.result.status).toBe('found');
    expect(again.body).toEqual(first.body);
    const [{ n: ledger }] =
      await sql`select count(*)::int as n from score_ledger where player_id = ${a} and kind = 'find'`;
    expect(ledger).toBe(1);
    const empty = await post(
      'act',
      { slug: SLUG, player_id: a, request_id: rid(), action: { ...talk, topic: 'wetter' } },
      { now: DAY1 },
    );
    expect(empty.body.result.status).toBe('empty');
    expect(empty.body.state.actions.used).toBe(1);
  });

  test('a day that has not arrived is refused', async () => {
    const end = await post(
      'end_day',
      { slug: SLUG, player_id: a, request_id: rid(), next_room: 'keller' },
      { now: DAY1 },
    );
    expect(end.body.state.day).toBe(2);
    const early = await post(
      'act',
      { slug: SLUG, player_id: a, request_id: rid(), action: talk },
      { now: DAY1 },
    );
    expect(early.status).toBe(403);
  });

  test('first discoverer: unique insert decides', async () => {
    const lampe = { type: 'inspect', object: 'lampe' };
    const [x, y] = await Promise.all([
      post('act', { slug: SLUG, player_id: b, request_id: rid(), action: lampe }, { now: DAY1 }),
      post('act', { slug: SLUG, player_id: b, request_id: rid(), action: lampe }, { now: DAY1 }),
    ]);
    expect([x.body.plaque, y.body.plaque].filter(Boolean)).toEqual(['Sehr aufmerksam']);
    const [{ n: rows }] = await sql`select count(*)::int as n from plaques where player_id = ${b}`;
    expect(rows).toBe(1);
  });

  test('two simultaneous first newspaper requests create one newspaper', async () => {
    const [x, y] = await Promise.all([
      post('newspaper', { slug: SLUG, player_id: a, day: 2 }, { now: DAY3 }),
      post('newspaper', { slug: SLUG, player_id: b, day: 2 }, { now: DAY3 }),
    ]);
    expect(x.status).toBe(200);
    expect(x.body.newspaper).toEqual(y.body.newspaper);
    const [{ n: rows }] =
      await sql`select count(*)::int as n from newspaper where game_id = ${gameId} and day = 2`;
    expect(rows).toBe(1);
    expect(
      (await post('newspaper', { slug: SLUG, player_id: a, day: 3 }, { now: DAY1 })).status,
    ).toBe(403);
  });

  test('the link slug chooses the game: tiles per game, wrong slug refused', async () => {
    const tiles = await post('lobby', { slug: SLUG });
    expect(tiles.body.players.map((p: { name: string }) => p.name).sort()).toEqual([
      'Int-A',
      'Int-B',
    ]);
    expect(JSON.stringify(tiles.body)).not.toContain('state');
    expect((await post('lobby', { slug: 'gibt-es-nicht' })).status).toBe(404);
    const other = await post('state', { slug: 'test', player_id: a }, { now: DAY1 });
    expect(other.status).toBe(404);
  });

  test('puzzle of the day: tip and skip over HTTP, never an answer in the state', async () => {
    const day = '2026-12-01T12:00:00+01:00';
    const h = await post(
      'daily_puzzle',
      { slug: SLUG, player_id: b, request_id: rid(), op: 'hint' },
      { now: day },
    );
    expect(h.body.hint).toBeTruthy();
    expect(JSON.stringify(h.body.state.daily_puzzle)).not.toContain('"answer"');
    const skip = await post(
      'daily_puzzle',
      { slug: SLUG, player_id: b, request_id: rid(), op: 'skip' },
      { now: day },
    );
    expect(skip.body.state.daily_puzzle.done).toBe(true);
    const [{ n: rows }] =
      await sql`select count(*)::int as n from daily_puzzles where player_id = ${b}`;
    expect(rows).toBe(1);
  });

  test('parallel requests of one player do not overwrite each other', async () => {
    const id = (
      await post(
        'admin_players',
        { op: 'create', game_id: gameId, player: { name: 'Int-P' } },
        { admin: ADMIN },
      )
    ).body.player.id as string;
    await sql`update players set state = jsonb_set(state, '{found}', '["f_cora_keller","s_cora_halle"]'::jsonb) where id = ${id}`;
    const base = { slug: SLUG, player_id: id };
    const opts = { now: DAY1 };
    const res = await Promise.all([
      post('set_note', { ...base, kind: 'timeline', key: 'f_cora_keller#0', put: true }, opts),
      post('set_note', { ...base, kind: 'timeline', key: 's_cora_halle#0', put: true }, opts),
      post('set_theory', { ...base, theory: { who: 'anna' } }, opts),
      post('set_note', { ...base, kind: 'grid', cat: 'who', candidate: 'ben', mark: 'no' }, opts),
      post('settings', { ...base, settings: { note_level: 'half' } }, opts),
      post('open_day', base, opts),
    ]);
    expect(res.map((r) => r.status)).toEqual([200, 200, 200, 200, 200, 200]);
    const [row] = await sql`select state, settings from players where id = ${id}`;
    expect([...row!.state.timeline].sort()).toEqual(['f_cora_keller#0', 's_cora_halle#0']);
    expect(row!.state.theory).toEqual({ who: 'anna' });
    expect(row!.state.grid).toEqual({ 'who:ben': 'no' });
    expect(row!.settings.note_level).toBe('half');
  });

  test('scoreboard lists both players', async () => {
    const r = await post('scoreboard', { slug: SLUG, player_id: a }, { now: DAY1 });
    expect(r.body.rows.map((x: { name: string }) => x.name).sort()).toEqual(['Int-A', 'Int-B']);
    expect(r.body.rows.filter((x: { is_you: boolean }) => x.is_you)).toHaveLength(1);
  });

  test('the public anon key cannot read any table directly', async () => {
    for (const table of ['case_solution', 'case_facts', 'players', 'score_ledger', 'request_log']) {
      const res = await fetch(`${URL}/rest/v1/${table}?select=*`, {
        headers: { apikey: ANON, authorization: `Bearer ${ANON}` },
      });
      const text = await res.text();
      expect(res.status === 200 ? text : '[]').toBe(res.status === 200 ? '[]' : '[]');
      expect(text).not.toContain('"solution"');
    }
  });
});
