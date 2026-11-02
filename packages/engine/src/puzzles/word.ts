import { normalize, pick, shuffle, type Rng } from './rng';
import type { DailyPuzzle, Level } from './types';

/** Winter and hotel words without umlauts. Short words for "easy", long ones for "hard". */
export const WORDS: Record<Level, string[]> = {
  easy: ['KERZE', 'SCHAL', 'TANNE', 'STERN', 'FROST', 'LICHT', 'APFEL', 'KUGEL', 'WOLLE', 'ENGEL'],
  medium: ['WINTER', 'LATERNE', 'GLOCKEN', 'ZIMMER', 'SESSEL', 'TREPPE', 'KELLNER', 'PAKETE'],
  hard: [
    'SCHLITTEN',
    'SCHNEEMANN',
    'BERGBAHN',
    'LEBKUCHEN',
    'KAMINFEUER',
    'HANDSCHUH',
    'TANNENBAUM',
  ],
};

const sorted = (w: string) => [...normalize(w)].sort().join('');

export function generateWord(
  rng: Rng,
  level: Level,
): Pick<DailyPuzzle, 'prompt' | 'data' | 'answer' | 'hints' | 'solutionText' | 'alternatives'> {
  const list = WORDS[level];
  const word = pick(rng, list);
  let letters = shuffle(rng, [...word]);
  for (let i = 0; i < 20 && letters.join('') === word; i++) letters = shuffle(rng, [...word]);
  const all = Object.values(WORDS).flat();
  return {
    prompt: `Die Buchstaben sind durcheinander geraten. Welches Wort steckt darin? (${word.length} Buchstaben)`,
    data: { letters },
    answer: normalize(word),
    alternatives: all.filter((w) => w !== word && sorted(w) === sorted(word)).map(normalize),
    hints: [
      `Das Wort fängt mit „${word[0]}“ an.`,
      `Es fängt mit „${word[0]}“ an und hört mit „${word[word.length - 1]}“ auf.`,
    ],
    solutionText: word,
  };
}
