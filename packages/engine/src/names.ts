import { z } from 'zod';
import type { LoadedCase } from './loader';
import { Id } from './schemas';

/**
 * Case texts use placeholders so suspects can be renamed at load time:
 *   {n:<npc_id>}       display name
 *   {anrede:<npc_id>}  form of address, falls back to the name
 */
export const PLACEHOLDER = /\{(n|anrede):([a-z0-9_]+)\}/g;
const ANY_BRACES = /\{[^{}]*\}/g;

export const NamesFile = z.object({
  names: z
    .record(Id, z.object({ name: z.string().min(1), anrede: z.string().min(1).optional() }))
    .default({}),
});
export type Names = z.infer<typeof NamesFile>['names'];

export function renderText(text: string, names: Names, defaults: Record<string, string>): string {
  return text.replace(PLACEHOLDER, (m, kind: string, id: string) => {
    const name = names[id]?.name ?? defaults[id];
    if (name === undefined) return m;
    return kind === 'anrede' ? (names[id]?.anrede ?? name) : name;
  });
}

/** Returns a copy of the case with all placeholders replaced and npc names updated. */
export function renameCase(c: LoadedCase, names: Names): LoadedCase {
  const defaults = Object.fromEntries(c.npcs.npcs.map((n) => [n.id, n.name]));
  const walk = (v: unknown): unknown => {
    if (typeof v === 'string') return renderText(v, names, defaults);
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object')
      return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]));
    return v;
  };
  const out = walk(c) as LoadedCase;
  out.npcs.npcs = out.npcs.npcs.map((n) => ({ ...n, name: names[n.id]?.name ?? n.name }));
  return out;
}

/** Placeholder problems in a case: unknown npc ids or malformed braces. */
export function placeholderErrors(c: LoadedCase): string[] {
  const ids = new Set(c.npcs.npcs.map((n) => n.id));
  const errors: string[] = [];
  const seen = new Set<string>();
  const walk = (v: unknown, path: string) => {
    if (typeof v === 'string') {
      for (const b of v.match(ANY_BRACES) ?? []) {
        const m = /^\{(n|anrede):([a-z0-9_]+)\}$/.exec(b);
        const problem = !m
          ? 'malformed placeholder'
          : !ids.has(m[2] as string)
            ? 'unknown npc'
            : '';
        if (problem && !seen.has(path + b)) {
          seen.add(path + b);
          errors.push(`${path}: ${problem} ${b}`);
        }
      }
    } else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`));
    else if (v && typeof v === 'object')
      for (const [k, x] of Object.entries(v)) walk(x, path ? `${path}.${k}` : k);
  };
  walk(c, '');
  return errors;
}
