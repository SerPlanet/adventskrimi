import { corridorOf, guidedRoom } from './route';
import type { GameCtx, PlayerState } from './state';

export type EndDayResult =
  | { ok: true; state: PlayerState }
  | { ok: false; reason: 'bad_room' | 'blocked' | 'too_far' | 'game_over' };

const blockedOn = (ctx: GameCtx, room: string, day: number) => ctx.reach.blocked(room, day);

/** Rooms the player may choose when ending the day: the one guided room, or (free phase) every room not blocked by an event. */
export function nextRooms(st: PlayerState, ctx: GameCtx): string[] {
  const fixed = guidedRoom(ctx.c, corridorOf(ctx.c, st), st.day + 1);
  if (fixed) return [fixed];
  const { rooms } = ctx.c.rooms;
  return rooms.map((r) => r.id).filter((r) => !blockedOn(ctx, r, st.day + 1));
}

/**
 * Ends the current day. `nextRoom` omitted = stay (also how a skipped day keeps its position).
 * Days are always played in order, so the next day is simply day + 1.
 */
export function endDay(st: PlayerState, ctx: GameCtx, nextRoom?: string): EndDayResult {
  if (st.day > 24) return { ok: false, reason: 'game_over' };
  // on guided days there is no choice: the corridor leads the way
  const fixed = st.day < 24 ? guidedRoom(ctx.c, corridorOf(ctx.c, st), st.day + 1) : undefined;
  if (fixed && nextRoom && nextRoom !== fixed) return { ok: false, reason: 'too_far' };
  const target = fixed ?? nextRoom ?? st.room;
  if (!ctx.c.rooms.rooms.some((r) => r.id === target)) return { ok: false, reason: 'bad_room' };
  if (st.day < 24 && !fixed) {
    if (nextRoom && nextRoom !== st.room) {
      if (!nextRooms(st, ctx).includes(nextRoom)) {
        return { ok: false, reason: blockedOn(ctx, nextRoom, st.day + 1) ? 'blocked' : 'too_far' };
      }
    }
  }
  return {
    ok: true,
    state: {
      ...st,
      day: st.day + 1,
      room: target,
      prevRoom: st.room,
      actionsUsed: 0,
      started: false,
      finishedDays: [...st.finishedDays, st.day],
    },
  };
}
