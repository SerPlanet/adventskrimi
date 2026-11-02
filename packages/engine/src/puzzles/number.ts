import { int, pick, type Rng } from './rng';
import type { DailyPuzzle, Level } from './types';

type Op = { sym: '+' | '-' | '×'; n: number };
const word = (o: Op) =>
  o.sym === '+'
    ? `Addiere ${o.n}.`
    : o.sym === '-'
      ? `Ziehe ${o.n} ab.`
      : `Multipliziere mit ${o.n}.`;
const apply = (v: number, o: Op) => (o.sym === '+' ? v + o.n : o.sym === '-' ? v - o.n : v * o.n);
const undo = (v: number, o: Op) => (o.sym === '+' ? v - o.n : o.sym === '-' ? v + o.n : v / o.n);

function chain(rng: Rng, start: number, steps: number): { ops: Op[]; values: number[] } {
  const ops: Op[] = [];
  const values = [start];
  for (let i = 0; i < steps; i++) {
    const cur = values[values.length - 1] as number;
    let op: Op;
    do {
      const sym = pick(rng, ['+', '-', '×'] as const);
      op = { sym, n: sym === '×' ? int(rng, 2, 4) : int(rng, 2, 15) };
    } while (apply(cur, op) < 1 || apply(cur, op) > 500);
    ops.push(op);
    values.push(apply(cur, op));
  }
  return { ops, values };
}

type Out = Pick<DailyPuzzle, 'prompt' | 'data' | 'answer' | 'hints' | 'solutionText'>;

/** Easy/medium: follow a chain of operations. Hard: think backwards from the result. */
export function generateNumber(rng: Rng, level: Level): Out {
  if (level === 'hard') {
    const x = int(rng, 3, 20);
    const { ops, values } = chain(rng, x, 3);
    const result = values[values.length - 1] as number;
    return {
      prompt: `Ich denke mir eine Zahl. ${ops.map(word).join(' ')} Dann kommt ${result} heraus. Welche Zahl habe ich mir gedacht?`,
      data: { result },
      answer: String(x),
      hints: [
        'Rechne rückwärts: Starte beim Ergebnis und mache jeden Schritt rückgängig.',
        `Vor dem letzten Schritt war die Zahl ${undo(result, ops[2] as Op)}.`,
      ],
      solutionText: String(x),
    };
  }
  const start = int(rng, 4, 20);
  const { ops, values } = chain(rng, start, level === 'easy' ? 3 : 5);
  const result = values[values.length - 1] as number;
  return {
    prompt: `Starte mit ${start}. ${ops.map(word).join(' ')} Was kommt am Ende heraus?`,
    data: { start },
    answer: String(result),
    hints: [
      'Rechne Schritt für Schritt, einen Satz nach dem anderen.',
      `Nach dem ersten Schritt hast du ${values[1]}.`,
    ],
    solutionText: String(result),
  };
}
