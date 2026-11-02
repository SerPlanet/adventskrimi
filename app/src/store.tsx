import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { call, memory, newRequestId, OFFLINE, type View } from './api';

export type Action =
  | { type: 'talk'; npc: string; topic: string }
  | { type: 'inspect'; object: string }
  | { type: 'use'; item: string; target: string }
  | { type: 'hotelbook' };

export interface ActResult {
  status: string;
  message?: string;
  new_items?: string[];
  points?: number;
}

interface Session {
  view: View | null;
  playerId: string | null;
  busy: boolean;
  /** polite status line for screen readers and the page header */
  notice: string;
  login(id: string): void;
  logout(): void;
  refresh(): Promise<void>;
  act(a: Action): Promise<{ result: ActResult; plaque: string | null } | null>;
  endDay(room?: string): Promise<boolean>;
  answer(optionId: string): Promise<string | null>;
  hint(): Promise<string | null>;
  saveSettings(s: Record<string, unknown>): Promise<void>;
  daily(
    op: 'check' | 'hint' | 'skip',
    answer?: string,
  ): Promise<{ outcome?: string; hint?: string; solution?: boolean } | null>;
  objectPuzzle(
    id: string,
    op: 'check' | 'hint',
    answer?: string,
  ): Promise<{ correct?: boolean; hint?: string } | null>;
  say(msg: string): void;
}

const Ctx = createContext<Session | null>(null);
export const useSession = (): Session => {
  const s = useContext(Ctx);
  if (!s) throw new Error('SessionProvider missing');
  return s;
};

const KEY = 'advent.player';

export function SessionProvider({ slug, children }: { slug: string; children: ReactNode }) {
  const key = `${KEY}.${slug}`;
  const [playerId, setPlayerId] = useState<string | null>(() => memory.get(key));
  const [view, setView] = useState<View | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const logout = useCallback(() => {
    memory.set(key, null);
    setPlayerId(null);
    setView(null);
  }, [key]);
  const login = useCallback(
    (id: string) => {
      memory.set(key, id);
      setPlayerId(id);
    },
    [key],
  );

  /** Runs a request, applies the returned state, turns errors into a friendly notice. */
  const run = useCallback(
    async <T extends object>(fn: string, body: object): Promise<T | null> => {
      if (!playerId) return null;
      setBusy(true);
      const r = await call<T>(fn, { player_id: playerId, ...body });
      setBusy(false);
      if (!r.ok) {
        if (r.error === 'player_not_found') logout();
        setNotice(r.message);
        return null;
      }
      const next = (r as { state?: View }).state;
      if (next) setView(next);
      return r;
    },
    [playerId, logout],
  );

  const refresh = useCallback(async () => {
    await run('open_day', {});
  }, [run]);

  useEffect(() => {
    if (playerId) void refresh();
  }, [playerId, refresh]);

  const value = useMemo<Session>(
    () => ({
      view,
      playerId,
      busy,
      notice,
      login,
      logout,
      refresh,
      say: setNotice,
      async act(action) {
        const r = await run<{ result: ActResult; plaque: string | null }>('act', {
          request_id: newRequestId(),
          action,
        });
        if (!r) return null;
        setNotice(
          r.result.status === 'found' ? 'Du hast etwas Neues gefunden.' : (r.result.message ?? ''),
        );
        return { result: r.result, plaque: r.plaque };
      },
      async endDay(room) {
        const r = await run('end_day', { request_id: newRequestId(), next_room: room });
        if (r) setNotice('Der Tag ist zu Ende. Ein neuer Tag beginnt.');
        return r !== null;
      },
      async answer(optionId) {
        const r = await run<{ outcome: { status: string } }>('answer_daily', {
          request_id: newRequestId(),
          option_id: optionId,
        });
        return r?.outcome.status ?? null;
      },
      async hint() {
        const r = await run<{ hint: string }>('answer_daily', {
          request_id: newRequestId(),
          hint: true,
        });
        return r?.hint ?? null;
      },
      async daily(op, answer) {
        return run('daily_puzzle', { request_id: newRequestId(), op, answer });
      },
      async objectPuzzle(id, op, answer) {
        return run('object_puzzle', { request_id: newRequestId(), puzzle_id: id, op, answer });
      },
      async saveSettings(s) {
        await run('settings', { settings: s });
      },
    }),
    [view, playerId, busy, notice, login, logout, refresh, run],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export { OFFLINE };
