import type { PlayerView, NewspaperContent } from '@advent/engine';

export type View = PlayerView;
export type Paper = NewspaperContent;

const MESSAGES: Record<string, string> = {
  day_not_available: 'Dieser Tag ist für dich noch nicht freigeschaltet.',
  unknown_game: 'Bitte öffne den Link, den du bekommen hast.',
  not_yet: 'Diese Zeitung gibt es noch nicht.',
  player_not_found: 'Diesen Spieler gibt es nicht mehr. Bitte wähle deinen Namen neu.',
  too_far: 'Dorthin kannst du von hier nicht gehen.',
  blocked: 'Dieser Raum ist morgen gesperrt.',
  bad_room: 'Diesen Raum gibt es nicht.',
  no_hint: 'Hier gibt es keinen Tipp.',
  already_accused: 'Du hast schon Anklage erhoben. Danach kann man nichts mehr ändern.',
  too_early: 'Die Anklage ist für dich noch nicht möglich.',
};
const OFFLINE = 'Das Hotel ist gerade nicht erreichbar, versuche es gleich noch einmal.';

/** Staging only: ?now=2026-12-03T12:00:00+01:00 fakes the clock. The server ignores it in prod. */
function clockOverride(): string | null {
  try {
    const q =
      new URLSearchParams(location.search).get('now') ??
      location.hash.match(/[?&]now=([^&]+)/)?.[1];
    if (q) sessionStorage.setItem('advent.now', decodeURIComponent(q));
    return sessionStorage.getItem('advent.now');
  } catch {
    return null;
  }
}

let currentSlug = '';
/** The game of the current link; sent with every request. */
export const setSlug = (s: string) => {
  currentSlug = s;
};

export type Reply<T> = ({ ok: true } & T) | { ok: false; error: string; message: string };

export async function call<T>(fn: string, body: object): Promise<Reply<T>> {
  if (!__API_URL__)
    return { ok: false, error: 'config', message: 'Die App ist noch nicht eingerichtet.' };
  const now = clockOverride();
  try {
    const res = await fetch(`${__API_URL__}/${fn}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(__ANON_KEY__ ? { apikey: __ANON_KEY__ } : {}),
        ...(now ? { 'x-game-now': now } : {}),
      },
      body: JSON.stringify({ slug: currentSlug, ...body }),
    });
    const json = await res.json();
    if (json.ok) return json as Reply<T>;
    return {
      ok: false,
      error: json.error,
      message: MESSAGES[json.error as string] ?? 'Das hat leider nicht geklappt.',
    };
  } catch {
    return { ok: false, error: 'offline', message: OFFLINE };
  }
}

export const newRequestId = (): string =>
  globalThis.crypto?.randomUUID?.() ?? `r-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

/** localStorage that never throws (blocked cookies, private mode). */
export const memory = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string | null) {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch {
      /* storage blocked: the name tiles simply show again next time */
    }
  },
};
