import { andInto, count } from './space';
import type { Info } from './info';
import { budgetOf } from '../game/budget';

export interface TempoResult {
  /** first day on which a perfect player can name the single solution (null = never) */
  solveDay: number | null;
  /** fewest consistent tuples reachable at the end of each day (1..24) */
  remainingByDay: Record<number, number>;
}

interface State {
  room: string | null;
  found: Set<string>;
  alive: Uint8Array;
  n: number;
}

const key = (s: State) => `${s.room}|${[...s.found].sort().join(',')}`;

/**
 * Lean planner (docs WP02): beam search over (room, found items), greedy action choice per room.
 * It is a heuristic upper bound on the best player, so "too early" findings are reliable while
 * "too late" ones may be pessimistic. The interface is stable; WP03 may swap the internals.
 */
export function planTempo(info: Info, budgetOf: (day: number) => number, beam = 40): TempoResult {
  const { c, reach, masks } = info;
  const sources = c.sources.sources;
  const puzzleRoom = new Map(c.puzzles.puzzles.map((p) => [p.id, p.room]));
  const remainingByDay: Record<number, number> = {};

  const apply = (s: State, ids: string[]): State => {
    const alive = Uint8Array.from(s.alive);
    const found = new Set(s.found);
    for (const id of ids) {
      found.add(id);
      const m = masks.get(id);
      if (m) andInto(alive, m);
    }
    return { room: s.room, found, alive, n: count(alive) };
  };

  let states: State[] = [{ room: null, found: new Set(), alive: Uint8Array.from(info.base), n: 0 }];
  states[0]!.n = count(states[0]!.alive);
  let solveDay: number | null = null;

  for (let day = 1; day <= 24 && solveDay === null; day++) {
    const next = new Map<string, State>();
    for (const st of states) {
      // newspaper is free and can be read on any listed day up to today
      const free = sources
        .filter((s) => s.kind === 'newspaper' && reach.daysOf(s.id).some((d) => d <= day))
        .flatMap((s) => s.yields)
        .filter((y) => !st.found.has(y));
      const base = apply(st, free);

      const fixed = reach.guided(day);
      const options = fixed ? [fixed] : [...reach.rooms];
      for (const room of options) {
        if (reach.blocked(room, day) || !reach.rooms.has(room)) continue;
        let cur: State = { ...base, room };
        for (const [pid, pr] of puzzleRoom) if (pr === room) cur.found.add(`puzzle:${pid}`);
        // free finds (talk, show, read) are taken first and again after each examination;
        // examining ("inspect") costs one of the day's actions and takes the best gain
        const take = (costly: boolean): boolean => {
          let best: { ids: string[]; n: number; gain: number } | null = null;
          for (const s of sources) {
            if (s.kind === 'newspaper' || (s.kind === 'inspect') !== costly) continue;
            const at = reach.roomOn(s.id, day);
            if (at !== room && at !== '*') continue;
            if (s.requires && puzzleRoom.has(s.requires) && !cur.found.has(`puzzle:${s.requires}`))
              continue;
            const ids = s.yields.filter((y) => !cur.found.has(y));
            if (!ids.length) continue;
            const t = apply(cur, ids);
            const gain = cur.n - t.n;
            if (
              (!costly || gain > 0) &&
              (!best || gain > best.gain || (gain === best.gain && ids.length > best.ids.length))
            )
              best = { ids, n: t.n, gain };
          }
          if (!best) return false;
          cur = apply(cur, best.ids);
          return true;
        };
        const freeAll = () => {
          while (take(false));
        };
        freeAll();
        for (let a = 0; a < budgetOf(day) && take(true); a++) freeAll();
        const k = key(cur);
        if (!next.has(k)) next.set(k, cur);
      }
    }
    states = [...next.values()]
      .sort((a, b) => a.n - b.n || b.found.size - a.found.size)
      .slice(0, beam);
    const best = states[0]?.n ?? 0;
    remainingByDay[day] = best;
    if (best === 1) solveDay = day;
  }
  if (solveDay !== null) for (let d = solveDay + 1; d <= 24; d++) remainingByDay[d] = 1;
  return { solveDay, remainingByDay };
}

/** The profile's action budget per day (talking, showing and reading are free). */
export function profileBudget(info: Info): (day: number) => number {
  return (day) => budgetOf({ profile: info.profile }, day);
}
