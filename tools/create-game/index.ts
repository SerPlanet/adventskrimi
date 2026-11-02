// Usage: npm run create-game -- --case test --profile friends --name "Testspiel" [--start 2026-12-01] [--env staging]
// Creates a game row with a snapshot of the profile and scoring config. Prints the game id.
import postgres from 'postgres';
import { loadProfile, loadScoring } from '../../packages/engine/src/loader';
import { connInfo } from '../lib/db';

const args = process.argv.slice(2);
const opt = (n: string, d?: string) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const caseId = opt('--case');
const profileId = opt('--profile');
const name = opt('--name');
const slug = opt('--slug');
const envName = opt('--env', 'staging') as string;
if (
  !caseId ||
  !profileId ||
  !name ||
  !slug ||
  !/^[a-z0-9-]{2,40}$/.test(slug) ||
  !['family', 'friends'].includes(profileId)
) {
  console.error(
    'usage: create-game --case <id> --profile <family|friends> --name <text> --slug <a-z0-9-> [--start YYYY-MM-DD] [--env staging|prod]',
  );
  process.exit(2);
}
if (envName === 'prod' && caseId === 'test') {
  console.error('✗ refusing to create a test game in prod');
  process.exit(1);
}

const sql = postgres({ ...connInfo(envName), ssl: 'require', max: 1 });
try {
  const [meta] =
    await sql`select to_char(start_date, 'YYYY-MM-DD') as start_date from case_meta where case_id = ${caseId}`;
  if (!meta) throw new Error(`case "${caseId}" is not loaded (run load-case first)`);
  const config = {
    profile: loadProfile(`config/profiles/${profileId}.yaml`),
    scoring: loadScoring('config/scoring.json'),
  };
  const [g] = await sql`insert into games (name, slug, profile, start_date, config, case_id)
    values (${name}, ${slug}, ${profileId}, ${opt('--start', meta.start_date as string) as string}, ${sql.json(config as never)}, ${caseId}) returning id`;
  console.log(`✓ game created in ${envName}: ${g?.id}`);
} catch (e) {
  console.error('✗', (e as Error).message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
