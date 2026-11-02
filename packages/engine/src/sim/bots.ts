import { nextRooms, resolveAction, type Action, type GameCtx, type PlayerState } from '../game';
import { combine, count, type Info } from '../solver';

export const BOTS = ['optimal', 'greedy', 'random', 'casual', 'newspaper_only', 'worst'] as const;
export type BotName = (typeof BOTS)[number];

export type Rng = () => number;
export function makeRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Every action a source in this room today could be used with. */
export function actionsHere(st: PlayerState, ctx: GameCtx): Action[] {
  const out = new Map<string, Action>();
  for (const s of ctx.c.sources.sources) {
    if (ctx.reach.roomOn(s.id, st.day) !== st.room) continue;
    const a: Action | null =
      s.kind === 'talk' && s.npc && s.topic
        ? { type: 'talk', npc: s.npc, topic: s.topic }
        : s.kind === 'inspect' && s.object
          ? { type: 'inspect', object: s.object }
          : s.kind === 'use' && s.requires && (s.object ?? s.npc)
            ? { type: 'use', item: s.requires, target: (s.object ?? s.npc) as string }
            : s.kind === 'hotelbook'
              ? { type: 'hotelbook' }
              : null;
    if (a) out.set(JSON.stringify(a), a);
  }
  return [...out.values()];
}

export interface Option {
  action: Action;
  /** tuples the new finds remove from the candidate space */
  gain: number;
  newItems: string[];
}

/** Options that would really yield something new (budget ignored), with their information gain. */
export function options(st: PlayerState, ctx: GameCtx, info: Info): Option[] {
  const before = count(combine(info, st.found));
  const out: Option[] = [];
  for (const action of actionsHere(st, ctx)) {
    const r = resolveAction(st, ctx, action);
    if (r.result.status !== 'found') continue;
    const after = count(combine(info, [...st.found, ...r.result.newItems]));
    out.push({ action, gain: before - after, newItems: r.result.newItems });
  }
  return out;
}

/** Sum of the best `n` gains one could collect in `room` on `day` (used to choose where to walk). */
function roomValue(
  st: PlayerState,
  ctx: GameCtx,
  info: Info,
  room: string,
  day: number,
  n: number,
  pick: (o: Option[]) => number[],
): number {
  const opts = options({ ...st, day, room }, ctx, info);
  return pick(opts)
    .slice(0, n)
    .reduce((a, b) => a + b, 0);
}

const desc = (o: Option[]) => o.map((x) => x.gain).sort((a, b) => b - a);

/**
 * What the bot explores in today's room (no action budget since WP06c).
 * optimal/greedy: everything that brings a find; random: as many random picks as there are things;
 * casual: a random 60 %; worst: everything, but in the least informative rooms (see chooseRoom).
 */
export function planDay(
  bot: BotName,
  st: PlayerState,
  ctx: GameCtx,
  info: Info,
  rng: Rng,
): Action[] {
  if (bot === 'newspaper_only') return [];
  const all = actionsHere(st, ctx);
  if (bot === 'random') return all.map(() => all[Math.floor(rng() * all.length)] as Action);
  if (bot === 'casual') {
    const mixed = [...all].sort(() => rng() - 0.5);
    return mixed.slice(0, Math.ceil(all.length * 0.6));
  }
  const opts = options(st, ctx, info);
  return opts.map((o) => o.action);
}

/** Room for the next day. */
export function chooseRoom(
  bot: BotName,
  st: PlayerState,
  ctx: GameCtx,
  info: Info,
  rng: Rng,
  budget: number,
): string | undefined {
  const rooms = nextRooms(st, ctx);
  if (!rooms.length || bot === 'newspaper_only') return undefined;
  if (bot === 'random' || bot === 'casual') return rooms[Math.floor(rng() * rooms.length)];
  const day = st.day + 1;
  const scored = rooms.map((r) => ({
    r,
    // optimal: most information; greedy: most things to do; worst: least, but at least one find
    v:
      bot === 'greedy'
        ? roomValue(st, ctx, info, r, day, budget, (o) => o.map(() => 1))
        : roomValue(st, ctx, info, r, day, budget, desc),
    any: roomValue(st, ctx, info, r, day, budget, (o) => o.map(() => 1)) > 0,
  }));
  const usable = scored.filter((s) => s.any);
  const pool = usable.length ? usable : scored;
  pool.sort((a, b) => (bot === 'worst' ? a.v - b.v : b.v - a.v));
  return pool[0]?.r;
}
