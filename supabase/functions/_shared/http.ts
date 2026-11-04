// HTTP glue for the edge functions: CORS, clock, store, error mapping. All logic lives in the engine bundle.
import postgres from 'postgres';
import { adminPlayers, ApiError, dispatch, lobby, resolveNow } from './engine.js';
import { PgStore } from './pgstore.ts';

declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (req: Request) => Promise<Response> | Response): void;
};

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'content-type, x-admin-token, x-game-now, apikey, authorization',
  'access-control-allow-methods': 'POST, OPTIONS',
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'content-type': 'application/json' },
  });

let store: PgStore | undefined;
function getStore(): PgStore {
  if (!store) {
    const url = Deno.env.get('SUPABASE_DB_URL');
    if (!url) throw new ApiError('no_db', 500);
    store = new PgStore(postgres(url, { max: 1, prepare: false, idle_timeout: 5 }));
  }
  return store;
}

function clock(req: Request): Date {
  return resolveNow(
    { appEnv: Deno.env.get('APP_ENV'), override: Deno.env.get('GAME_NOW_OVERRIDE') },
    req.headers.get('x-game-now'),
  );
}

async function readBody(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new ApiError('bad_request', 400);
  }
}

const fail = (e: unknown) =>
  e instanceof ApiError
    ? json(e.status, { ok: false, error: e.code })
    : json(500, { ok: false, error: 'internal' });

export function serveApi(name: string) {
  Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (req.method !== 'POST') return json(405, { ok: false, error: 'method_not_allowed' });
    try {
      const now = clock(req); // throws in prod if GAME_NOW_OVERRIDE is set
      const r = await dispatch(name, getStore(), await readBody(req), now);
      return json(r.status, r.body);
    } catch (e) {
      return fail(e);
    }
  });
}

/** Constant-time string compare so the admin token cannot be guessed by timing. */
function same(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function serveAdmin() {
  Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (req.method !== 'POST') return json(405, { ok: false, error: 'method_not_allowed' });
    try {
      const now = clock(req);
      const token = Deno.env.get('ADMIN_TOKEN') ?? '';
      if (token.length < 16 || !same(req.headers.get('x-admin-token') ?? '', token))
        throw new ApiError('forbidden', 403);
      return json(200, { ok: true, ...(await adminPlayers(getStore(), await readBody(req), now)) });
    } catch (e) {
      if (e && typeof e === 'object' && 'issues' in e)
        return json(400, { ok: false, error: 'bad_request' });
      return fail(e);
    }
  });
}

/** Public: games and name tiles. */
export function serveLobby() {
  Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (req.method !== 'POST') return json(405, { ok: false, error: 'method_not_allowed' });
    try {
      clock(req);
      return json(200, { ok: true, ...(await lobby(getStore(), await readBody(req))) });
    } catch (e) {
      if (e && typeof e === 'object' && 'issues' in e)
        return json(400, { ok: false, error: 'bad_request' });
      return fail(e);
    }
  });
}
