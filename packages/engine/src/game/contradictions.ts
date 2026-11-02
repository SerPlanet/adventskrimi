import { conflicts } from '../solver/conflict';
import type { FactBody } from '../schemas';
import type { GameCtx } from './state';

/** A timeline entry: a position claim taken from a fact or a statement. */
export interface TimelineEntry {
  itemId: string;
  kind: 'fact' | 'statement';
  body: FactBody;
}

export interface Contradiction {
  a: TimelineEntry;
  b: TimelineEntry;
  kind: 'statement-fact' | 'statement-statement' | 'fact-fact';
}

/** Auto mode: every found fact/statement with a position claim becomes an entry. */
export function timelineFromFound(ctx: GameCtx, found: string[]): TimelineEntry[] {
  const out: TimelineEntry[] = [];
  for (const f of ctx.c.facts.facts)
    if (found.includes(f.id)) out.push({ itemId: f.id, kind: 'fact', body: f });
  for (const s of ctx.c.statements.statements)
    if (found.includes(s.id))
      for (const claim of s.claims) out.push({ itemId: s.id, kind: 'statement', body: claim });
  return out.filter((e) => e.body.type === 'presence' || e.body.type === 'absence');
}

/** Does this pair fit together? (the free "Passt das zusammen?" button) */
export const fitsTogether = (a: TimelineEntry, b: TimelineEntry): boolean =>
  !conflicts(a.body, b.body);

/** Contradictions among the player's OWN entries only; never reveals anything the player lacks. */
export function findContradictions(entries: TimelineEntry[]): Contradiction[] {
  const out: Contradiction[] = [];
  for (let i = 0; i < entries.length; i++)
    for (let j = i + 1; j < entries.length; j++) {
      const a = entries[i] as TimelineEntry;
      const b = entries[j] as TimelineEntry;
      if (a.itemId === b.itemId || fitsTogether(a, b)) continue;
      const kind =
        a.kind === 'fact' && b.kind === 'fact'
          ? 'fact-fact'
          : a.kind === 'statement' && b.kind === 'statement'
            ? 'statement-statement'
            : 'statement-fact';
      out.push({ a, b, kind });
    }
  return out;
}
