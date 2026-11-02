import { shuffle, type Rng } from './rng';
import type { DailyPuzzle, Level } from './types';

const ANIMALS = ['Fuchs', 'Bär', 'Eule', 'Hase', 'Igel'];
const SIZE: Record<Level, number> = { easy: 3, medium: 4, hard: 5 };

type Clue =
  | { t: 'at'; a: number; room: number }
  | { t: 'not'; a: number; room: number }
  | { t: 'left'; a: number; b: number }
  | { t: 'next'; a: number; b: number };

/** perm[room] = animal index living in that room */
const roomOf = (perm: number[], a: number) => perm.indexOf(a);
function holds(c: Clue, perm: number[]): boolean {
  switch (c.t) {
    case 'at':
      return roomOf(perm, c.a) === c.room;
    case 'not':
      return roomOf(perm, c.a) !== c.room;
    case 'left':
      return roomOf(perm, c.a) < roomOf(perm, c.b);
    case 'next':
      return Math.abs(roomOf(perm, c.a) - roomOf(perm, c.b)) === 1;
  }
}

function permutations(n: number): number[][] {
  if (n === 1) return [[0]];
  const out: number[][] = [];
  for (const p of permutations(n - 1))
    for (let i = 0; i <= p.length; i++) out.push([...p.slice(0, i), n - 1, ...p.slice(i)]);
  return out;
}

const text = (c: Clue, names: string[]): string => {
  switch (c.t) {
    case 'at':
      return `${names[c.a]} wohnt in Zimmer ${c.room + 1}.`;
    case 'not':
      return `${names[c.a]} wohnt nicht in Zimmer ${c.room + 1}.`;
    case 'left':
      return `${names[c.a]} wohnt weiter links als ${names[c.b]}.`;
    case 'next':
      return `${names[c.a]} und ${names[c.b]} wohnen direkt nebeneinander.`;
  }
};

type Out = Pick<DailyPuzzle, 'prompt' | 'data' | 'answer' | 'hints' | 'solutionText'>;

/** Rooms 1..n in a row. Clues are added until exactly one arrangement is left, then redundant ones are dropped. */
export function generateLogic(rng: Rng, level: Level): Out {
  const n = SIZE[level];
  const names = shuffle(rng, ANIMALS).slice(0, n);
  const all = permutations(n);
  const truth = all[Math.floor(rng() * all.length)] as number[];
  const candidates: Clue[] = [];
  for (let a = 0; a < n; a++) {
    for (let room = 0; room < n; room++)
      candidates.push(roomOf(truth, a) === room ? { t: 'at', a, room } : { t: 'not', a, room });
    for (let b = 0; b < n; b++) {
      if (a === b) continue;
      if (roomOf(truth, a) < roomOf(truth, b)) candidates.push({ t: 'left', a, b });
      if (Math.abs(roomOf(truth, a) - roomOf(truth, b)) === 1 && a < b)
        candidates.push({ t: 'next', a, b });
    }
  }
  const count = (cs: Clue[]) => all.filter((p) => cs.every((c) => holds(c, p))).length;
  const clues: Clue[] = [];
  for (const c of shuffle(rng, candidates)) {
    if (count(clues) === 1) break;
    if (count([...clues, c]) < count(clues)) clues.push(c);
  }
  // drop clues that are not needed
  for (const c of [...clues]) {
    const rest = clues.filter((x) => x !== c);
    if (count(rest) === 1) clues.splice(clues.indexOf(c), 1);
  }
  const order = [...Array(n).keys()].map((room) => names[truth[room] as number] as string);
  const firstAt = clues.find((c) => c.t === 'at');
  return {
    prompt: `${n} Tiere wohnen in ${n} Zimmern, die der Reihe nach von 1 bis ${n} nummeriert sind. Wer wohnt wo? Trage für jedes Zimmer ein Tier ein.`,
    data: { names, rooms: n, clues: clues.map((c) => text(c, names)) },
    answer: order.join(','),
    hints: [
      firstAt
        ? 'Fang mit dem Hinweis an, der ein Zimmer ganz genau nennt.'
        : 'Streiche mit den „nicht“-Hinweisen Möglichkeiten weg.',
      `In Zimmer 1 wohnt: ${order[0]}.`,
    ],
    solutionText: order.map((o, i) => `Zimmer ${i + 1}: ${o}`).join(', '),
  };
}
