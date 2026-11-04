import { existsFor } from './actions';
import type { GameCtx, PlayerState } from './state';

/** The puzzle of a lock on a thing, once the player has tried it. Before that nothing is known. */
export function lockOf(st: PlayerState, ctx: GameCtx, objectId: string) {
  for (const s of ctx.c.sources.sources) {
    if (s.kind !== 'inspect' || s.object !== objectId || !s.requires || !existsFor(s, st, ctx))
      continue;
    const p = ctx.c.puzzles.puzzles.find((x) => x.id === s.requires);
    const prog = p && st.puzzles[p.id];
    if (p && prog?.seen)
      return {
        puzzle_id: p.id,
        type: p.type,
        prompt: p.prompt,
        solved: prog.solved,
        hints: p.hints.slice(0, Math.min(prog.hints, 2)),
      };
  }
  return undefined;
}
