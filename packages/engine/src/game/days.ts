import type { PlayerState } from './state';

const TZ = 'Europe/Berlin';
const GRACE_UNTIL_HOUR = 3;

/** Calendar date and hour in Europe/Berlin for an instant. */
export function berlinParts(now: Date): { y: number; m: number; d: number; hour: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { y: get('year'), m: get('month'), d: get('day'), hour: get('hour') };
}

const dayNumber = (y: number, m: number, d: number) => Date.UTC(y, m - 1, d) / 86_400_000;

/** Game day of an instant: 1 on `startDate` (YYYY-MM-DD), <1 before, >24 after the game. */
export function dayOf(now: Date, startDate: string): number {
  const [sy, sm, sd] = startDate.split('-').map(Number) as [number, number, number];
  const p = berlinParts(now);
  return dayNumber(p.y, p.m, p.d) - dayNumber(sy, sm, sd) + 1;
}

/** Highest day a player may play right now (catch-up upper bound). 0 = game has not started. */
export function maxPlayableDay(now: Date, startDate: string): number {
  return Math.max(0, Math.min(24, dayOf(now, startDate)));
}

/** Players play days in order: only the player's own next day, and only if it has arrived. */
export function canPlayDay(st: PlayerState, now: Date, startDate: string): boolean {
  return st.day >= 1 && st.day <= 24 && st.day <= maxPlayableDay(now, startDate);
}

/**
 * Day to use for bonuses tied to the real time (first discoverer, early accusation).
 * A day begun before midnight may be finished until 03:00 and still counts for that day.
 */
export function bonusDay(st: PlayerState, now: Date, startDate: string): number {
  const today = dayOf(now, startDate);
  const inGrace = berlinParts(now).hour < GRACE_UNTIL_HOUR;
  if (inGrace && st.started && st.day === today - 1) return st.day;
  return today;
}

/** Catch-up players do not get time-bound bonuses. */
export const isOnTime = (st: PlayerState, now: Date, startDate: string): boolean =>
  st.day === bonusDay(st, now, startDate);
