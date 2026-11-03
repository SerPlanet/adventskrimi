import type { Category } from '../schemas';
import type { GameCtx, PlayerState } from './state';

export type Mark = 'yes' | 'no';

export const gridKey = (cat: Category, candidate: string) => `${cat}:${candidate}`;
/** A cell of the timeline table: time window of the night x room. */
export const cellKey = (window: string, room: string) => `${window}|${room}`;

export function setMark(
  st: PlayerState,
  ctx: GameCtx,
  cat: Category,
  candidate: string,
  mark: Mark | null,
): PlayerState | null {
  if (!ctx.c.case.categories[cat]?.includes(candidate)) return null;
  const grid = { ...st.grid };
  if (mark === null) delete grid[gridKey(cat, candidate)];
  else grid[gridKey(cat, candidate)] = mark;
  return { ...st, grid };
}

/**
 * Sets the people of one table cell (02c §8). Only the player's own entries: nothing is checked
 * against the case, nothing is marked. An empty list clears the cell.
 */
export function setCell(
  st: PlayerState,
  ctx: GameCtx,
  window: string,
  room: string,
  persons: string[],
): PlayerState | null {
  const npcs = new Set(ctx.c.npcs.npcs.map((n) => n.id));
  if (!ctx.c.case.windows.some((w) => w.id === window)) return null;
  if (!ctx.c.rooms.rooms.some((r) => r.id === room)) return null;
  if (!persons.every((p) => npcs.has(p))) return null;
  const table = { ...st.table };
  const unique = [...new Set(persons)];
  if (unique.length) table[cellKey(window, room)] = unique;
  else delete table[cellKey(window, room)];
  return { ...st, table };
}

/** What the notes screens show: only what the player entered, nothing derived. */
export const notesOf = (st: PlayerState) => ({ grid: st.grid, table: st.table });
