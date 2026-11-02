import type { Category, FactBody } from '../schemas';
import { findContradictions, fitsTogether, type TimelineEntry } from './contradictions';
import type { GameCtx, PlayerState } from './state';

export type NoteLevel = 'auto' | 'half' | 'manual';
export type Mark = 'yes' | 'no';

/** One claim of a found fact or statement: the unit of the timeline. */
export interface NoteClaim {
  key: string;
  item: string;
  claim: number;
  kind: 'fact' | 'statement';
  body: FactBody;
}

export const claimKey = (item: string, claim: number) => `${item}#${claim}`;
export const gridKey = (cat: Category, candidate: string) => `${cat}:${candidate}`;

/** Claims that can sit on the timeline (positions and object states) of everything the player found. */
export function claimsOf(ctx: GameCtx, found: string[]): NoteClaim[] {
  const out: NoteClaim[] = [];
  const keep = (b: FactBody) =>
    b.type === 'presence' || b.type === 'absence' || b.type === 'object_state';
  for (const f of ctx.c.facts.facts)
    if (found.includes(f.id) && keep(f))
      out.push({ key: claimKey(f.id, 0), item: f.id, claim: 0, kind: 'fact', body: f });
  for (const s of ctx.c.statements.statements)
    if (found.includes(s.id))
      s.claims.forEach((body, i) => {
        if (keep(body))
          out.push({ key: claimKey(s.id, i), item: s.id, claim: i, kind: 'statement', body });
      });
  return out;
}

/** Eliminations that facts (never statements) state outright. */
export function derivedMarks(
  ctx: GameCtx,
  found: string[],
): { cat: Category; candidate: string; item: string }[] {
  const out: { cat: Category; candidate: string; item: string }[] = [];
  for (const f of ctx.c.facts.facts) {
    if (!found.includes(f.id)) continue;
    if (f.type === 'exclusion') out.push({ cat: f.category, candidate: f.candidate, item: f.id });
    if (f.type === 'object_state' && f.effect)
      for (const c of f.effect.excludes)
        out.push({ cat: f.effect.category, candidate: c, item: f.id });
  }
  return out;
}

export function setMark(
  st: PlayerState,
  ctx: GameCtx,
  cat: Category,
  candidate: string,
  mark: Mark | null,
): PlayerState | null {
  if (!ctx.c.case.categories[cat]?.includes(candidate)) return null;
  const grid = { ...st.grid };
  if (mark === null) delete grid[gridKey(cat, candidate)];
  else grid[gridKey(cat, candidate)] = mark;
  return { ...st, grid };
}

/** Puts a claim on the timeline or takes it off. Only claims the player really has. */
export function setPlaced(
  st: PlayerState,
  ctx: GameCtx,
  key: string,
  put: boolean,
): PlayerState | null {
  if (!claimsOf(ctx, st.found).some((c) => c.key === key)) return null;
  const rest = (st.timeline ?? []).filter((k) => k !== key);
  return { ...st, timeline: put ? [...rest, key] : rest };
}

const asEntry = (c: NoteClaim): TimelineEntry => ({ itemId: c.item, kind: c.kind, body: c.body });

/** The free "Passt das zusammen?" answer for two claims from the player's own file. */
export function fits(ctx: GameCtx, st: PlayerState, a: string, b: string): boolean | null {
  const all = claimsOf(ctx, st.found);
  const ca = all.find((c) => c.key === a);
  const cb = all.find((c) => c.key === b);
  return ca && cb ? fitsTogether(asEntry(ca), asEntry(cb)) : null;
}

const nameOf = (ctx: GameCtx, cat: Category, id: string): string => {
  if (cat === 'when') return ctx.c.case.windows.find((w) => w.id === id)?.label ?? id;
  if (cat === 'where') return ctx.c.rooms.rooms.find((r) => r.id === id)?.name ?? id;
  return ctx.c.npcs.npcs.find((n) => n.id === id)?.name ?? id;
};

const phrase = (ctx: GameCtx, b: FactBody): string =>
  b.type === 'presence' || b.type === 'absence'
    ? `${b.type === 'absence' ? 'nicht ' : ''}in ${nameOf(ctx, 'where', b.room)}`
    : '';

/** Everything the notes screens show. Contradictions and suggestions follow the note level. */
export function notesOf(st: PlayerState, ctx: GameCtx, level: NoteLevel) {
  const all = claimsOf(ctx, st.found);
  const derived = derivedMarks(ctx, st.found);
  const own = st.grid ?? {};

  const grid: Record<string, Mark> = { ...own };
  if (level === 'auto') for (const d of derived) grid[gridKey(d.cat, d.candidate)] ??= 'no';
  const gridSuggestions =
    level === 'half' ? derived.filter((d) => own[gridKey(d.cat, d.candidate)] === undefined) : [];

  const placedKeys = level === 'auto' ? all.map((c) => c.key) : (st.timeline ?? []);
  const placed = all.filter((c) => placedKeys.includes(c.key));
  const suggestions = level === 'half' ? all.filter((c) => !placedKeys.includes(c.key)) : [];

  const contradictions =
    level === 'manual'
      ? []
      : findContradictions(placed.map(asEntry)).flatMap((x) => {
          const ca = placed.find((c) => c.body === x.a.body);
          const cb = placed.find((c) => c.body === x.b.body);
          const pa = x.a.body;
          if (!ca || !cb || (pa.type !== 'presence' && pa.type !== 'absence')) return [];
          return [
            {
              a: ca.key,
              b: cb.key,
              text: `Passt nicht: ${nameOf(ctx, 'who', pa.person)} (${nameOf(ctx, 'when', pa.window)}) – ${phrase(ctx, x.a.body)} gegen ${phrase(ctx, x.b.body)}.`,
            },
          ];
        });

  return {
    grid,
    grid_suggestions: gridSuggestions.map((d) => ({ cat: d.cat, candidate: d.candidate })),
    claims: all.map((c) => ({
      key: c.key,
      item: c.item,
      kind: c.kind,
      // structural claim only: fact tags and ids must not reach the client
      body:
        c.body.type === 'object_state'
          ? { type: c.body.type, object: c.body.object, window: c.body.window, state: c.body.state }
          : c.body.type === 'presence' || c.body.type === 'absence'
            ? { type: c.body.type, person: c.body.person, window: c.body.window, room: c.body.room }
            : null,
    })),
    placed: placedKeys,
    suggestions: suggestions.map((c) => c.key),
    contradictions,
  };
}
