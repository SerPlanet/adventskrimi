// Usage: npm run reset-player -- <slug> <player name> <day 1..24>
// STAGING ONLY. Puts a test player back to the start of <day>: everything the player did is erased,
// days before <day> are played with the "greedy" bot, <day> itself is unfinished with a full budget.
// Day 1 means completely new. Stored newspapers of that game are dropped (they name other players).
import postgres from 'postgres';
import { makeCtx, newPlayer } from '../../packages/engine/src/game';
import { simulate, buildInfo } from '../../packages/engine/src/sim';
import { applyProfile } from '../../packages/engine/src/solver';
import { PgStore } from '../../supabase/functions/_shared/pgstore';
import { connInfo } from '../lib/db';

const [slug, name, dayArg] = process.argv.slice(2);
const day = Number(dayArg);
if (!slug || !name || !Number.isInteger(day) || day < 1 || day > 24) {
  console.error('usage: reset-player <slug> <player name> <day 1..24>');
  process.exit(2);
}

const sql = postgres({ ...connInfo('staging'), ssl: 'require', max: 1, prepare: false });
try {
  const [row] =
    await sql`select p.id, p.state->>'corridor' as corridor, g.id as game from players p join games g on g.id = p.game_id
    where g.slug = ${slug} and p.name = ${name}`;
  if (!row) throw new Error(`no player "${name}" in game "${slug}" (staging)`);
  const id = row.id as string;
  const store = new PgStore(sql as never);

  // 1) a fresh state for this game's case and profile
  const fresh = await store.transaction(
    id,
    async (tx) => {
      const c = applyProfile(await tx.caseData(), tx.game.profile);
      // keep the player's corridor: the way of days 1-5 belongs to the person
      const st = newPlayer(makeCtx(c, tx.game.profile, tx.game.scoring));
      return row.corridor ? { ...st, corridor: row.corridor as string } : st;
    },
    { lock: true, slug },
  );

  // 2) erase everything the player did (all tables that point to the player) and the stored papers
  const tables = await sql`select table_name from information_schema.columns
    where table_schema = 'public' and column_name = 'player_id' and table_name <> 'players'`;
  for (const t of tables)
    await sql`delete from ${sql(t.table_name as string)} where player_id = ${id}`;
  await sql`delete from newspaper where game_id = ${row.game as string}`;
  await sql`update players set state = ${sql.json(fresh as never)} where id = ${id}`;

  // 3) play the days before <day>
  const out = await store.transaction(
    id,
    async (tx) => {
      if (day === 1) return `${name} is new (day 1)`;
      const profile = tx.game.profile;
      const c = applyProfile(await tx.caseData(), profile);
      const ctx = makeCtx(c, profile, tx.game.scoring);
      const r = simulate(ctx, buildInfo(c, profile), 'greedy', 1, 150, slug, {
        state: tx.player.state,
        until: day,
      });
      await tx.save(r.state);
      return `${name} is at the start of day ${r.state.day} with ${r.points} points, budget full`;
    },
    { lock: true, slug },
  );
  console.log(`✓ ${out}`);
} catch (e) {
  console.error(`✗ ${(e as Error).message}`);
  process.exitCode = 1;
} finally {
  await sql.end();
}
