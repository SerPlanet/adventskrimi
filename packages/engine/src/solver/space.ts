import type { Category, FactBody } from '../schemas';
import type { LoadedCase } from '../loader';

const CATS: Category[] = ['who', 'accomplice', 'when', 'where'];

/** Candidate space = product of the four categories (mixed radix index). */
export interface Space {
  cats: Record<Category, string[]>;
  n: number;
  /** value index per category for every tuple */
  idx: Record<Category, Int16Array>;
  value(cat: Category, tuple: number): string;
  indexOf(sol: Record<Category, string>): number;
}

export function buildSpace(c: LoadedCase): Space {
  const cats = Object.fromEntries(CATS.map((k) => [k, c.case.categories[k] ?? []])) as Record<
    Category,
    string[]
  >;
  const sizes = CATS.map((k) => cats[k].length);
  const n = sizes.reduce((a, b) => a * b, 1);
  const idx = Object.fromEntries(CATS.map((k) => [k, new Int16Array(n)])) as Record<
    Category,
    Int16Array
  >;
  for (let i = 0; i < n; i++) {
    let rest = i;
    for (let k = CATS.length - 1; k >= 0; k--) {
      const size = sizes[k] as number;
      (idx[CATS[k] as Category] as Int16Array)[i] = rest % size;
      rest = Math.floor(rest / size);
    }
  }
  const value = (cat: Category, t: number) =>
    cats[cat][(idx[cat] as Int16Array)[t] as number] as string;
  const indexOf = (sol: Record<Category, string>) => {
    let i = 0;
    CATS.forEach((k, j) => {
      i = i * (sizes[j] as number) + cats[k].indexOf(sol[k]);
    });
    return i;
  };
  return { cats, n, idx, value, indexOf };
}

/**
 * 1 = tuple is consistent with the fact body. Rules of the crime (docs/07 §1):
 * thief is in the theft room during the chosen window, accomplice in the distraction room,
 * thief != accomplice, nobody is in two places at once.
 */
export function maskOf(b: FactBody, s: Space, c: LoadedCase): Uint8Array {
  const crime = c.world.crime;
  const m = new Uint8Array(s.n).fill(1);
  for (let t = 0; t < s.n; t++) {
    const who = s.value('who', t);
    const acc = s.value('accomplice', t);
    const when = s.value('when', t);
    const implied = (person: string, window: string): string | undefined => {
      if (window !== when) return undefined;
      if (person === who) return crime.theft_room;
      if (person === acc) return crime.distraction_room;
      return undefined;
    };
    switch (b.type) {
      case 'presence': {
        const at = implied(b.person, b.window);
        if (at !== undefined && at !== b.room) m[t] = 0;
        break;
      }
      case 'absence':
        if (implied(b.person, b.window) === b.room) m[t] = 0;
        break;
      case 'exclusion':
        if (s.value(b.category, t) === b.candidate) m[t] = 0;
        break;
      case 'link':
        if (
          s.value(b.if.category, t) === b.if.value &&
          !b.then.values.includes(s.value(b.then.category, t))
        )
          m[t] = 0;
        break;
      case 'object_state':
        if (b.effect && b.effect.excludes.includes(s.value(b.effect.category, t))) m[t] = 0;
        break;
    }
  }
  return m;
}

/** Tuples that violate the base rules (thief == accomplice). */
export function baseMask(s: Space): Uint8Array {
  const m = new Uint8Array(s.n).fill(1);
  for (let t = 0; t < s.n; t++) if (s.value('who', t) === s.value('accomplice', t)) m[t] = 0;
  return m;
}

export function andInto(acc: Uint8Array, m: Uint8Array): void {
  for (let i = 0; i < acc.length; i++) acc[i] = (acc[i] as number) & (m[i] as number);
}

export const count = (m: Uint8Array): number => {
  let n = 0;
  for (let i = 0; i < m.length; i++) n += m[i] as number;
  return n;
};

/** Remaining candidates per category for a mask. */
export function remaining(s: Space, m: Uint8Array): Record<Category, string[]> {
  const sets = Object.fromEntries(CATS.map((k) => [k, new Set<string>()])) as Record<
    Category,
    Set<string>
  >;
  for (let t = 0; t < s.n; t++) if (m[t]) for (const k of CATS) sets[k].add(s.value(k, t));
  return Object.fromEntries(CATS.map((k) => [k, [...sets[k]]])) as Record<Category, string[]>;
}
