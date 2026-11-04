// Usage: npm run refresh-config -- --slug <slug> [--env staging|prod] [--yes]
// Rewrites only `games.config` (profile and scoring snapshot, D64) from config/. Players, points,
// dossiers and the case stay untouched. Without --yes it only names the fields that would change.
import postgres from 'postgres';
import { loadProfile, loadScoring } from '../../packages/engine/src/loader';
import { connInfo } from '../lib/db';
import { changedFields } from './diff';

const args = process.argv.slice(2);
const opt = (n: string, d?: string) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const slug = opt('--slug');
const envName = opt('--env', 'staging') as string;
const yes = args.includes('--yes');
if (!slug || !['staging', 'prod'].includes(envName)) {
  console.error('usage: refresh-config --slug <slug> [--env staging|prod] [--yes]');
  process.exit(2);
}

const sql = postgres({ ...connInfo(envName as 'staging' | 'prod'), ssl: 'require', max: 1 });
try {
  const [g] = await sql`select id, profile, config from games where slug = ${slug}`;
  if (!g) throw new Error(`no game with slug "${slug}" in ${envName}`);
  const config = {
    profile: loadProfile(`config/profiles/${g.profile}.yaml`),
    scoring: loadScoring('config/scoring.json'),
  };
  // compare as stored JSON, so defaults and key order do not count as changes
  const fields = changedFields(g.config, JSON.parse(JSON.stringify(config)));
  console.log(
    `game "${slug}" (${envName}, profile ${g.profile}): ${fields.length} field(s) differ`,
  );
  fields.forEach((f) => console.log(`  ${f}`));
  if (!fields.length) console.log('✓ nothing to do');
  else if (!yes) console.log('· dry run, add --yes to write');
  else {
    await sql`update games set config = ${sql.json(config as never)} where id = ${g.id}`;
    console.log('✓ config written');
  }
} catch (e) {
  console.error('✗', (e as Error).message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
