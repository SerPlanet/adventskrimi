import type { Riddles } from '../schemas';
import { int, normalize, pick, type Rng } from './rng';
import type { DailyPuzzle } from './types';

const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const clean = (s: string) =>
  s.toUpperCase().replace(/Ä/g, 'AE').replace(/Ö/g, 'OE').replace(/Ü/g, 'UE').replace(/ß/g, 'SS');
const shiftBy = (s: string, k: number) =>
  [...s].map((ch) => (A.includes(ch) ? (A[(A.indexOf(ch) + k) % 26] as string) : ch)).join('');

/** Caesar cipher: every letter moved on in the alphabet; the example in the prompt gives the key. */
export function generateCipher(
  rng: Rng,
  phrases: Riddles['phrases'],
): Pick<DailyPuzzle, 'prompt' | 'data' | 'answer' | 'hints' | 'solutionText'> {
  const plain = clean(pick(rng, phrases)).trim();
  const k = int(rng, 1, 5);
  const first = plain.replace(/[^A-Z]/g, '')[0] as string;
  return {
    prompt: `Ein Geheimsatz: Jeder Buchstabe ist im Alphabet weitergerückt. Aus ${first} wurde ${shiftBy(first, k)}. Wie lautet der Satz?`,
    data: { text: shiftBy(plain, k), example: [first, shiftBy(first, k)] },
    answer: normalize(plain),
    hints: [
      `Gehe vom Geheimbuchstaben ${k} Schritte im Alphabet zurück.`,
      `Das erste Wort lautet „${plain.split(' ')[0]}“.`,
    ],
    solutionText: plain,
  };
}
