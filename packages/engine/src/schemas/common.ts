import { z } from 'zod';

/** Lowercase snake_case identifier used for all content references. */
export const Id = z.string().regex(/^[a-z0-9_]+$/, 'id must match [a-z0-9_]+');
export const Day = z.number().int().min(1).max(24);
export const Category = z.enum(['who', 'accomplice', 'when', 'where']);
export type Category = z.infer<typeof Category>;

export const wordCount = (s: string): number => s.trim().split(/\s+/).filter(Boolean).length;

/** Text card: at most 60 words (invariant 5). */
export const CardText = z
  .string()
  .min(1)
  .refine((s) => wordCount(s) <= 60, 'card text exceeds 60 words');

/** Day selector: explicit list or inclusive range. */
export const Days = z.union([
  z.array(Day).min(1),
  z.object({ from: Day, to: Day }).refine((r) => r.from <= r.to, 'from > to'),
]);

export function expandDays(d: z.infer<typeof Days>): number[] {
  if (Array.isArray(d)) return d;
  return Array.from({ length: d.to - d.from + 1 }, (_, i) => d.from + i);
}

/** Wraps a list file as `{ <key>: [...] }`. */
export const listFile = <K extends string, T extends z.ZodType>(key: K, item: T) =>
  z.object({ [key]: z.array(item) } as { [P in K]: z.ZodArray<T> });
