import {
  checkDaily,
  generateDaily,
  publicPuzzle,
  WORDLE_TRIES,
  wordleMarks,
  type DailyPuzzle,
  type Level,
} from '../puzzles';
import type { Riddles } from '../schemas';
import { awardDailyPuzzle } from './points';
import type { DailyProgress, GameCtx, PlayerState } from './state';

/** Everybody gets the same level: medium (D71, no easier options). Once started it stays. */
export function dailyLevel(st: PlayerState, day = st.day): Level {
  return st.daily[day]?.level ?? 'medium';
}

const caches = new WeakMap<Riddles, Map<string, DailyPuzzle>>();
/** Generation is deterministic; cache it so repeated views stay cheap. */
export function dailyPuzzleFor(salt: string, day: number, level: Level, cfg: Riddles): DailyPuzzle {
  let cache = caches.get(cfg);
  if (!cache) caches.set(cfg, (cache = new Map()));
  const key = `${salt}:${day}:${level}`;
  let p = cache.get(key);
  if (!p) {
    p = generateDaily(salt, day, level, cfg);
    if (cache.size > 200) cache.clear();
    cache.set(key, p);
  }
  return p;
}

const progressOf = (st: PlayerState, level: Level, day: number): DailyProgress =>
  st.daily[day] ?? { level, attempts: 0, hints: 0, solved: false, done: false };
const put = (st: PlayerState, day: number, p: DailyProgress): PlayerState => ({
  ...st,
  daily: { ...st.daily, [day]: p },
});

export type DailyOutcome = 'correct' | 'wrong' | 'failed' | 'unknown_word' | 'already_done';

/** Wrong attempts cost nothing. A right answer pays full points, or half after a tip. */
export function submitDaily(
  st: PlayerState,
  ctx: GameCtx,
  puzzle: DailyPuzzle,
  day: number,
  attempt: string,
  late = false,
): { state: PlayerState; outcome: DailyOutcome } {
  const p = progressOf(st, puzzle.level, day);
  if (p.done) return { state: st, outcome: 'already_done' };
  const correct = checkDaily(puzzle, attempt);
  // wordle: a guess must be a word of the list; it is kept, and the tries are limited (no penalty)
  let guesses = p.guesses;
  let exhausted = false;
  if (puzzle.kind === 'wordle') {
    const g = attempt.trim().toUpperCase();
    if (!puzzle.words?.includes(g)) return { state: st, outcome: 'unknown_word' };
    guesses = [...(p.guesses ?? []), g];
    exhausted = !correct && guesses.length >= WORDLE_TRIES;
  }
  const done = correct || exhausted;
  const next = put(st, day, {
    ...p,
    attempts: p.attempts + 1,
    solved: correct,
    done,
    ...(guesses ? { guesses } : {}),
  });
  return {
    state: correct ? awardDailyPuzzle(next, ctx, true, p.hints > 0, late, day) : next,
    outcome: correct ? 'correct' : exhausted ? 'failed' : 'wrong',
  };
}

/** Tip ladder: tip 1, tip 2, then the solution (which ends the puzzle without points). */
export function hintDaily(
  st: PlayerState,
  puzzle: DailyPuzzle,
  day: number,
): { state: PlayerState; text: string; solution: boolean } | null {
  const p = progressOf(st, puzzle.level, day);
  if (p.done) return null;
  const hints = Math.min(p.hints + 1, 3);
  if (hints <= 2)
    return {
      state: put(st, day, { ...p, hints }),
      text: puzzle.hints[hints - 1] as string,
      solution: false,
    };
  return {
    state: put(st, day, { ...p, hints, done: true }),
    text: puzzle.solutionText,
    solution: true,
  };
}

/** Skipping is always possible, gives 0 points and costs nothing else. */
export function skipDaily(st: PlayerState, puzzle: DailyPuzzle, day: number): PlayerState {
  const p = progressOf(st, puzzle.level, day);
  return p.done ? st : put(st, day, { ...p, done: true });
}

/** Client view of the puzzle of the day: the public part plus how far the player got. */
export function dailyView(st: PlayerState, puzzle: DailyPuzzle, day: number) {
  const p = st.daily[day];
  const shown = p?.hints ?? 0;
  return {
    ...publicPuzzle(puzzle),
    attempts: p?.attempts ?? 0,
    hints: puzzle.hints.slice(0, Math.min(shown, 2)),
    solved: p?.solved ?? false,
    done: p?.done ?? false,
    guesses: (p?.guesses ?? []).map((g) => ({ word: g, marks: wordleMarks(puzzle.answer, g) })),
    // the solution is shown after the last tip, or when the wordle tries are used up
    solution:
      shown >= 3 || (puzzle.kind === 'wordle' && p?.done && !p.solved)
        ? puzzle.solutionText
        : undefined,
  };
}
