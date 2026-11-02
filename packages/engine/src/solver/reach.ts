import type { LoadedCase } from '../loader';
import { expandDays, type Profile } from '../schemas';

/** Where and when a source can be used, given schedules, events and the room graph. */
export interface Reach {
  /** rooms the player can ever enter (graph-connected, not blocked every day) */
  rooms: Set<string>;
  blocked(room: string, day: number): boolean;
  /** room in which the source is used on `day`; '*' = no room (newspaper); null = not available */
  roomOn(sourceId: string, day: number): string | null;
  /** all days on which the source is available somewhere */
  daysOf(sourceId: string): number[];
}

export function buildReach(c: LoadedCase, profile: Profile): Reach {
  const roomIds = c.rooms.rooms.map((r) => r.id);
  const adj = new Map<string, Set<string>>(roomIds.map((r) => [r, new Set()]));
  for (const r of c.rooms.rooms)
    for (const n of r.neighbors) {
      adj.get(r.id)?.add(n);
      adj.get(n)?.add(r.id);
    }
  const rooms = new Set<string>();
  if (profile.movement === 'free') roomIds.forEach((r) => rooms.add(r));
  else if (roomIds[0]) {
    const stack = [roomIds[0]];
    while (stack.length) {
      const r = stack.pop() as string;
      if (rooms.has(r)) continue;
      rooms.add(r);
      adj.get(r)?.forEach((n) => stack.push(n));
    }
  }
  const blockedBy = new Map<number, Set<string>>(
    c.events.events.map((e) => [e.day, new Set(e.blocked_rooms)]),
  );
  const blocked = (room: string, day: number) => blockedBy.get(day)?.has(room) ?? false;

  const npcRoom = new Map<string, Record<number, string>>();
  for (const n of c.npcs.npcs) npcRoom.set(n.id, n.schedule as Record<number, string>);
  const objRoom = new Map<string, string>();
  for (const r of c.rooms.rooms) for (const o of r.objects) objRoom.set(o.id, r.id);
  const puzzleRoom = new Map(c.puzzles.puzzles.map((p) => [p.id, p.room]));
  const byId = new Map(c.sources.sources.map((s) => [s.id, s]));

  const roomOn = (id: string, day: number): string | null => {
    const s = byId.get(id);
    if (!s || !expandDays(s.days).includes(day)) return null;
    if (s.kind === 'newspaper') return '*';
    let room = s.room ?? (s.object ? objRoom.get(s.object) : undefined);
    if (s.kind === 'talk' && s.npc) {
      const at = npcRoom.get(s.npc)?.[day];
      if (!at || (s.room && s.room !== at)) return null;
      room = at;
    }
    if (!room) return s.kind === 'hotelbook' ? '*' : null;
    if (!rooms.has(room) || blocked(room, day)) return null;
    const pr = s.requires ? puzzleRoom.get(s.requires) : undefined;
    if (pr && !rooms.has(pr)) return null;
    return room;
  };
  const daysOf = (id: string) => {
    const s = byId.get(id);
    return s ? expandDays(s.days).filter((d) => roomOn(id, d) !== null) : [];
  };
  return { rooms, blocked, roomOn, daysOf };
}
