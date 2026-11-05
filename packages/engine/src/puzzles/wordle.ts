import type { Riddles } from '../schemas';
import { pick, type Rng } from './rng';
import type { DailyPuzzle } from './types';

export const WORDLE_TRIES = 6;

/** Marks per letter: g = right place, y = elsewhere in the word, n = not in the word. */
export function wordleMarks(answer: string, guess: string): string {
  const marks = Array<string>(answer.length).fill('n');
  const left = new Map<string, number>();
  for (let i = 0; i < answer.length; i++) {
    if (guess[i] === answer[i]) marks[i] = 'g';
    else left.set(answer[i] as string, (left.get(answer[i] as string) ?? 0) + 1);
  }
  for (let i = 0; i < answer.length; i++) {
    const n = left.get(guess[i] as string) ?? 0;
    if (marks[i] === 'n' && n > 0) {
      marks[i] = 'y';
      left.set(guess[i] as string, n - 1);
    }
  }
  return marks.join('');
}

/**
 * Umlauts and ß count as one letter: Ä→A, Ö→O, Ü→U, ß→S (D90), so a guess keeps its length.
 * Returns the five letters of a guess, or null when it is not exactly five letters.
 */
export function wordleGuess(input: string): string | null {
  const g = input
    .trim()
    .replace(/ß/g, 's') // before upper-casing, which would turn ß into SS
    .toUpperCase()
    .replace(/Ä/g, 'A')
    .replace(/Ö/g, 'O')
    .replace(/Ü/g, 'U');
  return /^[A-Z]{5}$/.test(g) ? g : null;
}

/** German five-letter word game: six tries, any five letters are a guess, the server answers with marks. */
export function generateWordle(
  rng: Rng,
  list: Riddles['wordle'],
): Pick<DailyPuzzle, 'prompt' | 'data' | 'answer' | 'hints' | 'solutionText'> {
  const word = pick(rng, list);
  return {
    prompt: `Finde das Wort mit 5 Buchstaben. Du hast ${WORDLE_TRIES} Versuche. Nach jedem Versuch siehst du, welche Buchstaben stimmen.`,
    data: { length: word.length, tries: WORDLE_TRIES },
    answer: word,
    hints: [
      `Das Wort fängt mit „${word[0]}“ an.`,
      `Es fängt mit „${word[0]}“ an und hört mit „${word[word.length - 1]}“ auf.`,
    ],
    solutionText: word,
  };
}
