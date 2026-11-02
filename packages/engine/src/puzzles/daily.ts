import { generateLogic } from './logic';
import { generateNumber } from './number';
import { normalize, rngFrom } from './rng';
import { generateSudoku } from './sudoku';
import { LEVELS, type DailyPuzzle, type Kind, type Level } from './types';
import { generateWord } from './word';

/** Rotation over the days so every kind comes up regularly. */
export const KINDS: Kind[] = ['sudoku', 'word', 'number', 'logic'];
export const kindOfDay = (day: number): Kind => KINDS[(day - 1) % KINDS.length] as Kind;

const TITLES: Record<Kind, string> = {
  sudoku: 'Zahlenfeld',
  word: 'Buchstabensalat',
  number: 'Zahlenrätsel',
  logic: 'Logelei',
};

/**
 * Puzzle of the day. Same salt + day + level always gives the same puzzle, independent of the player.
 * The salt keeps different games apart; the level is the player's choice (docs/02 §9).
 */
export function generateDaily(salt: string, day: number, level: Level): DailyPuzzle {
  const rng = rngFrom(`${salt}:${day}:${level}`);
  const kind = kindOfDay(day);
  const base = { kind, level, day, title: TITLES[kind] };
  switch (kind) {
    case 'sudoku': {
      const s = generateSudoku(rng, level);
      const answer = s.solution.join('');
      const firstEmpty = s.cells.findIndex((v) => v === 0);
      return {
        ...base,
        prompt: `Fülle das Feld. In jeder Zeile, jeder Spalte und jedem umrandeten Block kommt jede Zahl von 1 bis ${s.n} genau einmal vor.`,
        data: { n: s.n, br: s.br, bc: s.bc, cells: s.cells },
        answer,
        hints: [
          'Suche eine Zeile oder Spalte, in der nur eine Zahl fehlt.',
          `In Zeile ${Math.floor(firstEmpty / s.n) + 1}, Spalte ${(firstEmpty % s.n) + 1} steht die ${s.solution[firstEmpty]}.`,
        ],
        solutionText: answer,
      };
    }
    case 'word':
      return { ...base, ...generateWord(rng, level) };
    case 'number':
      return { ...base, ...generateNumber(rng, level) };
    case 'logic':
      return { ...base, ...generateLogic(rng, level) };
  }
}

/** Checks an attempt: sudoku = digits row by row, logic = names joined by commas, others = text. */
export function checkDaily(p: DailyPuzzle, attempt: string): boolean {
  const a = normalize(attempt);
  if (p.kind === 'sudoku') return a === p.answer;
  if (p.kind === 'logic') return a === normalize(p.answer);
  return a === normalize(p.answer) || (p.alternatives ?? []).includes(a);
}

/** What a client may see of the puzzle. Never the answer. */
export const publicPuzzle = (p: DailyPuzzle) => ({
  kind: p.kind,
  level: p.level,
  title: p.title,
  prompt: p.prompt,
  data: p.data,
});

export { LEVELS };
export type { DailyPuzzle, Kind, Level };
