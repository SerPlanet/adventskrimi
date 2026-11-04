import type { LoadedCase } from '../loader';
import type { Source } from '../schemas';

/** Last guided day of the case (WP20): the longest route; 1 = only day 1 is fixed, 0 = no guidance. */
export function guidedLastDay(c: LoadedCase): number {
  const k = c.routes.corridors[0];
  return k ? Math.max(1, ...Object.keys(k.route).map(Number)) : 0;
}

/** Day 1 starts in the lobby if the case has one, else in the first room. */
export function startRoom(c: LoadedCase): string {
  const rooms = c.rooms.rooms;
  return (rooms.find((r) => r.id === 'lobby') ?? rooms[0])?.id ?? '';
}

/** Corridor for the n-th player of a game: round robin, so 1 to 20 players need no more rooms. */
export const corridorFor = (c: LoadedCase, ordinal: number): string | undefined =>
  c.routes.corridors[ordinal % Math.max(1, c.routes.corridors.length)]?.id;

/** The player's corridor; states from before WP20 have none and use the first. */
export const corridorOf = (c: LoadedCase, st: { corridor?: string }): string | undefined =>
  st.corridor ?? c.routes.corridors[0]?.id;

/** The guided room of a day (day 1 = start room), or undefined when the day is free. */
export function guidedRoom(
  c: LoadedCase,
  corridor: string | undefined,
  day: number,
): string | undefined {
  if (day > guidedLastDay(c) || guidedLastDay(c) === 0) return undefined;
  if (day === 1) return startRoom(c);
  return c.routes.corridors.find((k) => k.id === corridor)?.route[day];
}

/** `route` limits a source to some corridors on guided days only; from the free phase on it is open. */
export function sourceOnRoute(
  c: LoadedCase,
  s: Pick<Source, 'route'>,
  corridor: string | undefined,
  day: number,
): boolean {
  if (!s.route || day > guidedLastDay(c) || day === 1) return true;
  return corridor !== undefined && s.route.includes(corridor);
}

/** The rooms of a corridor's guided way, day 1 first. */
export const ownWay = (c: LoadedCase, corridor: string | undefined): string[] => [
  startRoom(c),
  ...Object.values(c.routes.corridors.find((k) => k.id === corridor)?.route ?? {}),
];
