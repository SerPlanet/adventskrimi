// Shared by the CLI tools: connects to the staging/prod database through the Supabase pooler.
// Needs `supabase link` for that project (writes supabase/.temp/pooler-url) and .env with the DB password.
import { existsSync, readFileSync } from 'node:fs';

export function readEnv(): Record<string, string> {
  if (!existsSync('.env')) return {};
  const out: Record<string, string> = {};
  for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line);
    if (m?.[1]) out[m[1]] = m[2] ?? '';
  }
  return out;
}

export interface Conn {
  host: string;
  user: string;
  password: string;
  database: string;
  port: number;
  ref: string;
}

export function connInfo(envName: string): Conn {
  const env = readEnv();
  const key = envName.toUpperCase();
  const ref = env[`SUPABASE_${key}_PROJECT_REF`];
  const password = env[`SUPABASE_${key}_DB_PASSWORD`];
  if (!ref || !password)
    throw new Error(`missing SUPABASE_${key}_PROJECT_REF / SUPABASE_${key}_DB_PASSWORD in .env`);
  const pooler = existsSync('supabase/.temp/pooler-url')
    ? readFileSync('supabase/.temp/pooler-url', 'utf8').trim()
    : '';
  const host = /@([^:/]+)/.exec(pooler)?.[1];
  if (!host)
    throw new Error('pooler URL not found, run `npx supabase link` for this project first');
  return { host, user: `postgres.${ref}`, password, database: 'postgres', port: 5432, ref };
}
