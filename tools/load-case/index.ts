// Usage: npm run load-case -- cases/_test [--env staging|prod]
// Validates the case, then replaces its rows in the case_* tables (one transaction).
// Connection: pooler URL from `supabase link` (supabase/.temp/pooler-url) + password from .env.
import { existsSync, readFileSync } from 'node:fs';
import pg from 'pg';
import { loadCase, loadNames } from '../../packages/engine/src/loader';
import { renameCase } from '../../packages/engine/src/names';

const args = process.argv.slice(2);
const dir = args.find((a) => !a.startsWith('--'));
const envName = args.includes('--env') ? args[args.indexOf('--env') + 1] : 'staging';
if (!dir || !['staging', 'prod'].includes(envName ?? '')) {
  console.error('usage: load-case <case-dir> [--env staging|prod]');
  process.exit(2);
}

const res = loadCase(dir);
if (!res.ok) {
  console.error('✗ case invalid, nothing loaded');
  res.errors.slice(0, 10).forEach((e) => console.error('  ' + e));
  process.exit(1);
}
const names = loadNames(`${dir}/insider.yaml`);
const c = Object.keys(names).length ? renameCase(res.data, names) : res.data;
if (envName === 'prod' && c.case.id === 'test') {
  console.error('✗ refusing to load the test case into prod');
  process.exit(1);
}

function readEnv(): Record<string, string> {
  if (!existsSync('.env')) return {};
  const out: Record<string, string> = {};
  for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line);
    if (m?.[1]) out[m[1]] = m[2] ?? '';
  }
  return out;
}
const env = readEnv();
const KEY = envName.toUpperCase();
const ref = env[`SUPABASE_${KEY}_PROJECT_REF`];
const password = env[`SUPABASE_${KEY}_DB_PASSWORD`];
if (!ref || !password) {
  console.error(`✗ missing SUPABASE_${KEY}_PROJECT_REF / SUPABASE_${KEY}_DB_PASSWORD in .env`);
  process.exit(1);
}
const pooler = existsSync('supabase/.temp/pooler-url')
  ? readFileSync('supabase/.temp/pooler-url', 'utf8').trim()
  : '';
const host = /@([^:/]+)/.exec(pooler)?.[1];
if (!host) {
  console.error('✗ pooler URL not found, run `npx supabase link` for this project first');
  process.exit(1);
}

const J = (v: unknown) => JSON.stringify(v);
const rows = (items: { id: string }[]) => items.map((x) => [x.id, x]);
const tables: Record<string, [string, unknown][]> = {
  case_rooms: rows(c.rooms.rooms) as [string, unknown][],
  case_npcs: rows(c.npcs.npcs) as [string, unknown][],
  case_facts: rows(c.facts.facts) as [string, unknown][],
  case_statements: rows(c.statements.statements) as [string, unknown][],
  case_sources: rows(c.sources.sources) as [string, unknown][],
  case_puzzles: rows(c.puzzles.puzzles) as [string, unknown][],
  case_items: rows(c.puzzles.items) as [string, unknown][],
  case_events: c.events.events.map((e) => [String(e.day), e]),
  case_questions: rows(c.questions.questions) as [string, unknown][],
  case_newspaper_templates: [['main', c.newspaper]],
  case_prolog: [['main', c.prolog]],
};

const client = new pg.Client({
  host,
  port: 5432,
  user: `postgres.${ref}`,
  password,
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
});
await client.connect();
try {
  await client.query('begin');
  // Games reference case_meta, so an existing case is updated in place and its content rows are replaced.
  const meta = [
    c.case.id,
    c.case.title,
    c.case.start_date,
    JSON.stringify({
      night: c.case.night,
      windows: c.case.windows,
      categories: c.case.categories,
      links: c.case.links,
      beats: c.case.beats,
    }),
  ];
  const known = await client.query('select 1 from case_meta where case_id = $1', [c.case.id]);
  if (known.rowCount) {
    for (const t of ['case_solution', ...Object.keys(tables)])
      await client.query(`delete from ${t} where case_id = $1`, [c.case.id]);
    await client.query(
      'update case_meta set title = $2, start_date = $3, data = $4 where case_id = $1',
      meta,
    );
  } else {
    await client.query(
      'insert into case_meta (case_id, title, start_date, data) values ($1,$2,$3,$4)',
      meta,
    );
  }
  await client.query(
    'insert into case_solution (case_id, solution, world, proof_questions) values ($1,$2,$3,$4)',
    [c.case.id, J(c.case.solution), J(c.world), J(c.case.proof_questions)],
  );
  let n = 0;
  for (const [table, items] of Object.entries(tables)) {
    for (const [id, data] of items) {
      await client.query(`insert into ${table} (case_id, id, data) values ($1,$2,$3)`, [
        c.case.id,
        id,
        J(data),
      ]);
      n++;
    }
  }
  await client.query('commit');
  console.log(`✓ loaded case "${c.case.id}" into ${envName}: ${n} content rows`);
} catch (e) {
  await client.query('rollback');
  console.error('✗ load failed, rolled back:', (e as Error).message);
  process.exitCode = 1;
} finally {
  await client.end();
}
