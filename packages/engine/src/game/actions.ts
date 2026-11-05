import { normalize } from '../puzzles';
import type { Source } from '../schemas';
import { budgetOf, costsAction } from './budget';
import { corridorOf, sourceOnRoute } from './route';
import { addLedger, type GameCtx, type PlayerState } from './state';

export type Action =
  | { type: 'talk'; npc: string; topic: string }
  | { type: 'inspect'; object: string }
  | { type: 'use'; item: string; target: string }
  | { type: 'hotelbook' };

export type ActionResult =
  | {
      status: 'found';
      newItems: string[];
      sourceIds: string[];
      plaques: { sourceId: string; title: string }[];
      points: number;
    }
  | { status: 'empty' | 'known' | 'locked' | 'unavailable' | 'budget'; message: string };

const MSG = {
  empty: 'Dazu gibt es nichts zu holen.',
  known: 'Das weißt du schon.',
  locked: 'Hier ist etwas verschlossen. Vielleicht hilft ein Rätsel oder ein Gegenstand.',
  unavailable: 'Das geht hier und heute nicht.',
  budget: 'Für heute genug untersucht. Gespräche und Lesen sind weiter frei.',
} as const;

const fail = (status: keyof typeof MSG, st: PlayerState) => ({
  state: st,
  result: { status, message: MSG[status] } as ActionResult,
});

function matches(s: Source, a: Action): boolean {
  switch (a.type) {
    case 'talk':
      return s.kind === 'talk' && s.npc === a.npc && s.topic === a.topic;
    case 'inspect':
      return s.kind === 'inspect' && s.object === a.object;
    case 'use':
      return (
        s.kind === 'use' && s.requires === a.item && (s.object === a.target || s.npc === a.target)
      );
    case 'hotelbook':
      return s.kind === 'hotelbook';
  }
}

/** Is the target of the action in the player's room today? */
function targetHere(a: Action, st: PlayerState, ctx: GameCtx): boolean {
  const { c } = ctx;
  const npcAt = (id: string) =>
    (c.npcs.npcs.find((n) => n.id === id)?.schedule as Record<number, string> | undefined)?.[
      st.day
    ];
  if (a.type === 'talk') return npcAt(a.npc) === st.room;
  const target = a.type === 'inspect' ? a.object : a.type === 'use' ? a.target : undefined;
  if (!target) return true;
  const room = c.rooms.rooms.find((r) => r.objects.some((o) => o.id === target))?.id;
  return room ? room === st.room : npcAt(target) === st.room;
}

/** Does the source exist for the player? `unlock` (WP20) keeps a thing or question away until it holds, `once`/`until_day` take it away again (WP22c). */
export function unlockMet(s: Source, st: PlayerState): boolean {
  const seen = new Set(st.discoveries.map((d) => d.sourceId));
  // a question of the course of the day: once, or only until a day (WP22c)
  if (s.once && seen.has(s.id)) return false;
  if (s.until_day !== undefined && st.day > s.until_day) return false;
  const u = s.unlock;
  if (!u) return true;
  return (
    (u.day_from === undefined || st.day >= u.day_from) &&
    u.asked.every((id) => seen.has(id)) &&
    u.has.every((id) => st.found.includes(id))
  );
}

/** Is the source part of the player's way (guided days) and visible to them (`unlock`)? */
export const existsFor = (s: Source, st: PlayerState, ctx: GameCtx): boolean =>
  sourceOnRoute(ctx.c, s, corridorOf(ctx.c, st), st.day) && unlockMet(s, st);

/** Sources of an action that exist in the player's room today (open or still locked). */
export function hereSources(st: PlayerState, ctx: GameCtx, a: Action): Source[] {
  return ctx.c.sources.sources.filter(
    (s) =>
      matches(s, a) &&
      existsFor(s, st, ctx) &&
      [st.room, '*'].includes(ctx.reach.roomOn(s.id, st.day) ?? ''),
  );
}

/** The sources of an action the player can use right now. */
export const openSources = (st: PlayerState, ctx: GameCtx, a: Action): Source[] =>
  hereSources(st, ctx, a).filter((s) => unlocked(s, st, ctx));

/** A source is unlocked if its puzzle is solved (inspect/talk) or its item is carried (use). */
function unlocked(s: Source, st: PlayerState, ctx: GameCtx): boolean {
  if (!s.requires) return true;
  if (ctx.c.puzzles.puzzles.some((p) => p.id === s.requires))
    return st.puzzles[s.requires]?.solved === true;
  return st.inventory.includes(s.requires);
}

/** Pure: returns the new state and what happened. Only a new find changes anything; "inspect" then costs one action. */
export function resolveAction(
  st: PlayerState,
  ctx: GameCtx,
  a: Action,
): { state: PlayerState; result: ActionResult } {
  if (st.day > 24) return fail('unavailable', st);
  if (!targetHere(a, st, ctx)) return fail('unavailable', st);

  const here = hereSources(st, ctx, a);
  if (!here.length) return fail('empty', st);
  const open = here.filter((s) => unlocked(s, st, ctx));
  if (!open.length) {
    // the attempt: the lock tells its text, and a puzzle lock shows its puzzle from now on
    const lock = here[0]?.lock;
    const pid = here
      .map((s) => s.requires)
      .find((r) => ctx.c.puzzles.puzzles.some((p) => p.id === r));
    const prev = pid ? st.puzzles[pid] : undefined;
    const state =
      pid && !prev?.seen
        ? {
            ...st,
            puzzles: {
              ...st.puzzles,
              [pid]: { attempts: 0, hints: 0, solved: false, ...prev, seen: true },
            },
          }
        : st;
    return {
      state,
      result: { status: 'locked' as const, message: lock?.versuchstext ?? MSG.locked },
    };
  }

  const newItems = [...new Set(open.flatMap((s) => s.yields))].filter((y) => !st.found.includes(y));
  if (!newItems.length) return fail('known', st);
  // only a new find costs an action; without budget the thing stays untouched
  if (costsAction(a) && st.actionsUsed >= budgetOf(ctx, st.day)) return fail('budget', st);

  const gaining = open.filter((s) => s.yields.some((y) => newItems.includes(y)));
  const itemIds = new Set(ctx.c.puzzles.items.map((i) => i.id));
  let next: PlayerState = {
    ...st,
    started: true,
    actionsUsed: costsAction(a) ? st.actionsUsed + 1 : st.actionsUsed,
    found: [...st.found, ...newItems],
    inventory: [...st.inventory, ...newItems.filter((i) => itemIds.has(i))],
    discoveries: [
      ...st.discoveries,
      ...gaining.map((s) => ({
        sourceId: s.id,
        itemIds: s.yields.filter((y) => newItems.includes(y)),
        day: st.day,
      })),
    ],
  };
  const before = next.ledger.reduce((n, l) => n + l.points, 0);
  next = addLedger(next, {
    kind: 'day_played',
    ref: String(st.day),
    points: ctx.scoring.day.played,
    day: st.day,
  });
  next = awardFinds(next, ctx, newItems);
  const points = next.ledger.reduce((n, l) => n + l.points, 0) - before;
  const plaques = gaining
    .filter((s) => s.plaque)
    .map((s) => ({ sourceId: s.id, title: s.plaque as string }));
  return {
    state: next,
    result: { status: 'found', newItems, sourceIds: gaining.map((s) => s.id), plaques, points },
  };
}

/** +find per new find, capped per day. */
export function awardFinds(st: PlayerState, ctx: GameCtx, items: string[]): PlayerState {
  let next = st;
  let earned = st.ledger
    .filter((l) => l.kind === 'find' && l.day === st.day)
    .reduce((n, l) => n + l.points, 0);
  for (const id of items) {
    const pts = Math.min(ctx.scoring.day.find, ctx.scoring.day.find_cap - earned);
    if (pts <= 0) break;
    next = addLedger(next, { kind: 'find', ref: id, points: pts, day: st.day });
    earned += pts;
  }
  return next;
}

/** Reading the day's newspaper is free; its finds still count as finds. */
export function readNewspaper(
  st: PlayerState,
  ctx: GameCtx,
): { state: PlayerState; newItems: string[] } {
  const papers = ctx.c.sources.sources.filter(
    (s) => s.kind === 'newspaper' && ctx.reach.roomOn(s.id, st.day) === '*',
  );
  const newItems = [...new Set(papers.flatMap((s) => s.yields))].filter(
    (y) => !st.found.includes(y),
  );
  if (!newItems.length) return { state: st, newItems };
  const gaining = papers.filter((s) => s.yields.some((y) => newItems.includes(y)));
  const next = awardFinds(
    {
      ...st,
      found: [...st.found, ...newItems],
      discoveries: [
        ...st.discoveries,
        ...gaining.map((s) => ({
          sourceId: s.id,
          itemIds: s.yields.filter((y) => newItems.includes(y)),
          day: st.day,
        })),
      ],
    },
    ctx,
    newItems,
  );
  return { state: next, newItems };
}

/** Puzzle answer check; no budget needed, no penalty for wrong answers. */
export function solvePuzzle(
  st: PlayerState,
  ctx: GameCtx,
  puzzleId: string,
  answer: string,
): { state: PlayerState; correct: boolean } {
  const p = ctx.c.puzzles.puzzles.find((x) => x.id === puzzleId);
  if (!p || p.room !== st.room) return { state: st, correct: false };
  const prev = st.puzzles[puzzleId] ?? { attempts: 0, hints: 0, solved: false };
  const correct = normalize(answer) === normalize(p.answer);
  const puzzles = {
    ...st.puzzles,
    [puzzleId]: { ...prev, attempts: prev.attempts + 1, solved: prev.solved || correct },
  };
  return { state: { ...st, puzzles }, correct };
}

/** Tip ladder: tip 1, tip 2, then the solution. */
export function puzzleHint(
  st: PlayerState,
  ctx: GameCtx,
  puzzleId: string,
): { state: PlayerState; text: string } | null {
  const p = ctx.c.puzzles.puzzles.find((x) => x.id === puzzleId);
  if (!p) return null;
  const prev = st.puzzles[puzzleId] ?? { attempts: 0, hints: 0, solved: false };
  const hints = Math.min(prev.hints + 1, 3);
  const text = hints <= 2 ? (p.hints[hints - 1] as string) : p.answer;
  return { state: { ...st, puzzles: { ...st.puzzles, [puzzleId]: { ...prev, hints } } }, text };
}
