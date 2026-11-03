import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { call, memory, newRequestId, type View } from './api';

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
  /** the bubbles of a conversation and the finds they hold (02c §6) */
  answer?: { lines: { speaker: string; text: string }[]; finds: string[] };
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
  /** the day that was just ended on this page (the page stays, 02c §9); null otherwise */
  ended: number | null;
  startNext(): void;
  answer(optionId: string): Promise<string | null>;
  hint(): Promise<string | null>;
  saveSettings(s: Record<string, unknown>): Promise<void>;
  daily(
    op: 'check' | 'hint' | 'skip',
    answer?: string,
  ): Promise<{ outcome?: string; hint?: string; solution?: boolean } | null>;
  say(msg: string): void;
  setTheory(theory: Record<string, string | null>): Promise<boolean>;
  setNote(
    n:
      | { kind: 'grid'; cat: string; candidate: string; mark: 'yes' | 'no' | null }
      | { kind: 'cell'; window: string; room: string; persons: string[] },
  ): Promise<boolean>;
  /** "In die Akte legen" (02c §7) and taking it out again */
  fileAdd(
    what: { kind: 'find'; id: string } | { kind: 'article'; day: number; id: string },
  ): Promise<boolean>;
  fileRemove(kind: 'find' | 'article', id: string): Promise<boolean>;
  pocket(sourceId: string): Promise<boolean>;
  accuse(theory: Record<string, string>, proof: Record<string, string[]>): Promise<boolean>;
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
  const [ended, setEnded] = useState<number | null>(null);
  // a slow older reply must never overwrite the view of a newer request
  const seq = useRef(0);

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
      const mine = ++seq.current;
      const r = await call<T>(fn, { player_id: playerId, ...body });
      setBusy(false);
      if (!r.ok) {
        if (r.error === 'player_not_found') logout();
        setNotice(r.message);
        return null;
      }
      const next = (r as { state?: View }).state;
      if (next && mine === seq.current) setView(next);
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
      ended,
      startNext: () => setEnded(null),
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
        const day = view?.day ?? null;
        const r = await run('end_day', { request_id: newRequestId(), next_room: room });
        if (r) {
          setEnded(day);
          setNotice('Der Tag ist zu Ende. Gute Nacht.');
        }
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
      async setTheory(theory) {
        const r = await run('set_theory', { theory });
        if (r) setNotice('Deine Theorie ist gespeichert.');
        return r !== null;
      },
      async setNote(n) {
        return (await run('set_note', n)) !== null;
      },
      async pocket(sourceId) {
        const r = await run('pocket', { source_id: sourceId });
        if (r) setNotice('Eingesteckt. Du findest es im Inventar.');
        return r !== null;
      },
      async fileAdd(what) {
        const r = await run('file_add', what);
        if (r) setNotice('In die Akte gelegt.');
        return r !== null;
      },
      async fileRemove(kind, id) {
        const r = await run('file_remove', { kind, id });
        if (r) setNotice('Aus der Akte genommen. Im Verlauf kannst du es weiter nachlesen.');
        return r !== null;
      },
      async accuse(theory, proof) {
        const r = await run('accuse', { request_id: newRequestId(), theory, proof });
        if (r) setNotice('Deine Anklage ist abgegeben.');
        return r !== null;
      },
      async saveSettings(s) {
        await run('settings', { settings: s });
      },
    }),
    [view, playerId, busy, notice, ended, login, logout, refresh, run],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
