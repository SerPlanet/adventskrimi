import { checkDaily, generateDaily, publicPuzzle, type DailyPuzzle, type Level } from '../puzzles';
import { awardDailyPuzzle } from './points';
import type { DailyProgress, GameCtx, PlayerState } from './state';

/** Everybody gets the same level: medium (D71, no easier options). Once started it stays. */
export function dailyLevel(st: PlayerState): Level {
  return st.daily[st.day]?.level ?? 'medium';
}

const cache = new Map<string, DailyPuzzle>();
/** Generation is deterministic; cache it so repeated views stay cheap. */
export function dailyPuzzleFor(salt: string, day: number, level: Level): DailyPuzzle {
  const key = `${salt}:${day}:${level}`;
  let p = cache.get(key);
  if (!p) {
    p = generateDaily(salt, day, level);
    if (cache.size > 200) cache.clear();
    cache.set(key, p);
  }
  return p;
}

const progressOf = (st: PlayerState, level: Level): DailyProgress =>
  st.daily[st.day] ?? { level, attempts: 0, hints: 0, solved: false, done: false };
const put = (st: PlayerState, p: DailyProgress): PlayerState => ({
  ...st,
  daily: { ...st.daily, [st.day]: p },
});

export type DailyOutcome = 'correct' | 'wrong' | 'already_done';

/** Wrong attempts cost nothing. A right answer pays full points, or half after a tip. */
export function submitDaily(
  st: PlayerState,
  ctx: GameCtx,
  puzzle: DailyPuzzle,
  attempt: string,
  late = false,
): { state: PlayerState; outcome: DailyOutcome } {
  const p = progressOf(st, puzzle.level);
  if (p.done) return { state: st, outcome: 'already_done' };
  const correct = checkDaily(puzzle, attempt);
  const next = put(st, { ...p, attempts: p.attempts + 1, solved: correct, done: correct });
  return {
    state: correct ? awardDailyPuzzle(next, ctx, true, p.hints > 0, late) : next,
    outcome: correct ? 'correct' : 'wrong',
  };
}

/** Tip ladder: tip 1, tip 2, then the solution (which ends the puzzle without points). */
export function hintDaily(
  st: PlayerState,
  puzzle: DailyPuzzle,
): { state: PlayerState; text: string; solution: boolean } | null {
  const p = progressOf(st, puzzle.level);
  if (p.done) return null;
  const hints = Math.min(p.hints + 1, 3);
  if (hints <= 2)
    return {
      state: put(st, { ...p, hints }),
      text: puzzle.hints[hints - 1] as string,
      solution: false,
    };
  return { state: put(st, { ...p, hints, done: true }), text: puzzle.solutionText, solution: true };
}

/** Skipping is always possible, gives 0 points and costs nothing else. */
export function skipDaily(st: PlayerState, puzzle: DailyPuzzle): PlayerState {
  const p = progressOf(st, puzzle.level);
  return p.done ? st : put(st, { ...p, done: true });
}

/** Client view of the puzzle of the day: the public part plus how far the player got. */
export function dailyView(st: PlayerState, puzzle: DailyPuzzle) {
  const p = st.daily[st.day];
  const shown = p?.hints ?? 0;
  return {
    ...publicPuzzle(puzzle),
    attempts: p?.attempts ?? 0,
    hints: puzzle.hints.slice(0, Math.min(shown, 2)),
    solved: p?.solved ?? false,
    done: p?.done ?? false,
    solution: shown >= 3 ? puzzle.solutionText : undefined,
  };
}
