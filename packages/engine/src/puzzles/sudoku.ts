import { shuffle, type Rng } from './rng';
import type { Level } from './types';

interface Spec {
  n: number;
  br: number;
  bc: number;
  /** clues kept at most (we stop earlier if removal would make the puzzle ambiguous) */
  keep: number;
}

export const SPECS: Record<Level, Spec> = {
  easy: { n: 4, br: 2, bc: 2, keep: 8 },
  medium: { n: 6, br: 2, bc: 3, keep: 18 },
  hard: { n: 9, br: 3, bc: 3, keep: 34 },
};

function allowed(g: number[], s: Spec, cell: number): number[] {
  const r = Math.floor(cell / s.n);
  const c = cell % s.n;
  const used = new Set<number>();
  for (let i = 0; i < s.n; i++) {
    used.add(g[r * s.n + i] as number);
    used.add(g[i * s.n + c] as number);
  }
  const r0 = r - (r % s.br);
  const c0 = c - (c % s.bc);
  for (let i = 0; i < s.br; i++)
    for (let j = 0; j < s.bc; j++) used.add(g[(r0 + i) * s.n + c0 + j] as number);
  const out: number[] = [];
  for (let v = 1; v <= s.n; v++) if (!used.has(v)) out.push(v);
  return out;
}

/** Counts solutions up to `limit` (fill order: cell with fewest candidates). `order` randomises the first found grid. */
function solve(
  g: number[],
  s: Spec,
  limit: number,
  order?: (xs: number[]) => number[],
): { count: number; first?: number[] } {
  let count = 0;
  let first: number[] | undefined;
  const go = (): void => {
    let best = -1;
    let cands: number[] = [];
    for (let i = 0; i < g.length; i++) {
      if (g[i] !== 0) continue;
      const c = allowed(g, s, i);
      if (best === -1 || c.length < cands.length) {
        best = i;
        cands = c;
        if (c.length <= 1) break;
      }
    }
    if (best === -1) {
      count++;
      first ??= [...g];
      return;
    }
    for (const v of order ? order(cands) : cands) {
      g[best] = v;
      go();
      g[best] = 0;
      if (count >= limit) return;
    }
  };
  go();
  return { count, first };
}

export interface SudokuPuzzle {
  n: number;
  br: number;
  bc: number;
  /** 0 = empty */
  cells: number[];
  solution: number[];
}

/** A puzzle with exactly one solution. */
export function generateSudoku(rng: Rng, level: Level): SudokuPuzzle {
  const s = SPECS[level];
  const full = solve(new Array(s.n * s.n).fill(0), s, 1, (xs) => shuffle(rng, xs))
    .first as number[];
  const cells = [...full];
  let clues = cells.length;
  for (const i of shuffle(
    rng,
    cells.map((_, k) => k),
  )) {
    if (clues <= s.keep) break;
    const keepValue = cells[i] as number;
    cells[i] = 0;
    if (solve([...cells], s, 2).count !== 1) cells[i] = keepValue;
    else clues--;
  }
  return { n: s.n, br: s.br, bc: s.bc, cells, solution: full };
}

export const countSolutions = (
  p: Pick<SudokuPuzzle, 'n' | 'br' | 'bc' | 'cells'>,
  limit = 2,
): number => solve([...p.cells], { n: p.n, br: p.br, bc: p.bc, keep: 0 }, limit).count;
