// Usage: npm run fast-forward -- <slug> <player name> <day>
// STAGING ONLY. Plays a test player with the "greedy" bot up to the start of <day>, so later days can be looked at.
import postgres from 'postgres';
import { makeCtx } from '../../packages/engine/src/game';
import { simulate, buildInfo } from '../../packages/engine/src/sim';
import { applyProfile } from '../../packages/engine/src/solver';
import { PgStore } from '../../supabase/functions/_shared/pgstore';
import { connInfo } from '../lib/db';

const [slug, name, dayArg] = process.argv.slice(2);
const day = Number(dayArg);
if (!slug || !name || !Number.isInteger(day) || day < 1 || day > 24) {
  console.error('usage: fast-forward <slug> <player name> <day 1..24>');
  process.exit(2);
}

const sql = postgres({ ...connInfo('staging'), ssl: 'require', max: 1, prepare: false });
try {
  const [row] = await sql`select p.id from players p join games g on g.id = p.game_id
    where g.slug = ${slug} and p.name = ${name}`;
  if (!row) throw new Error(`no player "${name}" in game "${slug}" (staging)`);
  const store = new PgStore(sql as never);
  const out = await store.transaction(
    row.id as string,
    async (tx) => {
      const st = tx.player.state;
      if (st.day >= day) return `${name} is already on day ${st.day}, nothing to do`;
      const profile = tx.game.profile;
      const c = applyProfile(await tx.caseData(), profile);
      const ctx = makeCtx(c, profile, tx.game.scoring);
      const r = simulate(ctx, buildInfo(c, profile), 'greedy', 1, 150, slug, {
        state: st,
        until: day,
      });
      await tx.save(r.state);
      return `${name} is now at the start of day ${r.state.day} with ${r.points} points`;
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
