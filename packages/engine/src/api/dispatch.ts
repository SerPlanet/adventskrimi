import { ZodError } from 'zod';
import { handlers, MUTATING, type HandlerName } from './handlers';
import { ApiError, Requests, type Store } from './types';

export interface ApiResponse {
  status: number;
  body: unknown;
}

/**
 * Staging may fake the clock (env GAME_NOW_OVERRIDE or header x-game-now); prod must not.
 * A prod function with GAME_NOW_OVERRIDE set refuses to run at all.
 */
export function resolveNow(
  env: { appEnv?: string; override?: string },
  header?: string | null,
  real = new Date(),
): Date {
  const prod = env.appEnv !== 'staging';
  if (prod && env.override) throw new ApiError('override_in_prod', 500);
  if (prod && header) throw new ApiError('override_in_prod', 400);
  const raw = header || env.override;
  if (!raw) return real;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) throw new ApiError('bad_override', 400);
  return d;
}

export const isHandlerName = (s: string): s is HandlerName => s in handlers;

/** Validates the body, runs the handler in a transaction and maps errors to HTTP status codes. */
export async function dispatch(
  name: HandlerName,
  store: Store,
  body: unknown,
  now: Date,
): Promise<ApiResponse> {
  try {
    const req = Requests[name].parse(body);
    const run = handlers[name] as (tx: never, req: never, now: Date) => Promise<unknown>;
    const out = await store.transaction(
      req.player_id,
      (tx) => run(tx as never, req as never, now),
      {
        lock: MUTATING.includes(name),
      },
    );
    return { status: 200, body: { ok: true, ...(out as object) } };
  } catch (e) {
    if (e instanceof ApiError) return { status: e.status, body: { ok: false, error: e.code } };
    if (e instanceof ZodError) return { status: 400, body: { ok: false, error: 'bad_request' } };
    console.error('internal error', e instanceof Error ? e.message : e);
    return { status: 500, body: { ok: false, error: 'internal' } };
  }
}
