import type { LoadedCase } from '../loader';
import type { Profile } from '../schemas';
import { andInto, baseMask, buildSpace, maskOf, type Space } from './space';
import { buildReach, type Reach } from './reach';

/** Everything the validator and planner need, precomputed once per (case, profile). */
export interface Info {
  c: LoadedCase;
  profile: Profile;
  space: Space;
  base: Uint8Array;
  reach: Reach;
  /** fact/statement id -> mask. True statements act like facts, false statements give no information. */
  masks: Map<string, Uint8Array>;
  solutionIndex: number;
}

/** With a `corridor` the info describes a player who walks only that guided route (WP20). */
export function buildInfo(c: LoadedCase, profile: Profile, corridor?: string): Info {
  const space = buildSpace(c);
  const masks = new Map<string, Uint8Array>();
  for (const f of c.facts.facts) masks.set(f.id, maskOf(f, space, c));
  for (const s of c.statements.statements) {
    if (!s.truth) {
      masks.set(s.id, new Uint8Array(space.n).fill(1));
      continue;
    }
    const m = new Uint8Array(space.n).fill(1);
    for (const claim of s.claims) andInto(m, maskOf(claim, space, c));
    masks.set(s.id, m);
  }
  const sol = c.case.solution as Record<'who' | 'accomplice' | 'when' | 'where', string>;
  return {
    c,
    profile,
    space,
    base: baseMask(space),
    reach: buildReach(c, corridor),
    masks,
    solutionIndex: space.indexOf(sol),
  };
}

/** Consistent tuples after combining the given item ids on top of the base rules. */
export function combine(info: Info, ids: Iterable<string>): Uint8Array {
  const acc = Uint8Array.from(info.base);
  for (const id of ids) {
    const m = info.masks.get(id);
    if (m) andInto(acc, m);
  }
  return acc;
}

/** Item ids of all sources that are reachable at least once. */
export function reachableItems(info: Info): Set<string> {
  const out = new Set<string>();
  for (const s of info.c.sources.sources)
    if (info.reach.daysOf(s.id).length) s.yields.forEach((y) => out.add(y));
  return out;
}
