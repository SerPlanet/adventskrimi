import type { LoadedCase } from '../loader';
import type { FactBody } from '../schemas';
import type { CheckResult } from './types';

type Sol = Record<'who' | 'accomplice' | 'when' | 'where', string>;

/** Does the body hold in the real world (world.yaml + solution)? undefined = not decidable from the world. */
function holds(b: FactBody, c: LoadedCase): boolean | undefined {
  const sol = c.case.solution as Sol;
  switch (b.type) {
    case 'story':
      return true;
    case 'presence':
    case 'absence': {
      const at = c.world.positions[b.person]?.[b.window];
      if (at === undefined) return undefined;
      return b.type === 'presence' ? at === b.room : at !== b.room;
    }
    case 'exclusion':
      return sol[b.category] !== b.candidate;
    case 'link':
      return sol[b.if.category] !== b.if.value || b.then.values.includes(sol[b.then.category]);
    case 'object_state':
      return !b.effect || !b.effect.excludes.includes(sol[b.effect.category]);
  }
}

export function checkTruth(c: LoadedCase): CheckResult {
  const errors: string[] = [];
  const sol = c.case.solution as Sol;
  const cr = c.world.crime;
  if (cr.thief !== sol.who) errors.push('world.crime.thief differs from case.solution.who');
  if (cr.accomplice !== sol.accomplice) errors.push('world.crime.accomplice differs from solution');
  if (cr.window !== sol.when) errors.push('world.crime.window differs from solution.when');
  if (cr.hiding_place !== sol.where)
    errors.push('world.crime.hiding_place differs from solution.where');
  const pos = c.world.positions;
  if (pos[cr.thief]?.[cr.window] !== cr.theft_room)
    errors.push('thief is not in theft_room in the crime window');
  if (pos[cr.accomplice]?.[cr.window] !== cr.distraction_room)
    errors.push('accomplice is not in distraction_room in the crime window');

  for (const f of c.facts.facts) {
    const h = holds(f, c);
    if (h === undefined)
      errors.push(`fact ${f.id}: not decidable from world.yaml (missing position)`);
    else if (!h) errors.push(`fact ${f.id}: contradicts the world`);
  }
  for (const s of c.statements.statements) {
    if (s.claims.every((cl) => cl.type === 'story')) continue; // its truth is told by the story
    const results = s.claims.map((cl) => holds(cl, c));
    if (results.includes(undefined))
      errors.push(`statement ${s.id}: claim not decidable from world.yaml`);
    else {
      const allTrue = results.every(Boolean);
      if (s.truth && !allTrue) errors.push(`statement ${s.id}: marked true but a claim is false`);
      if (!s.truth && allTrue)
        errors.push(`statement ${s.id}: marked false but all claims are true`);
    }
  }
  return { name: 'truth', ok: errors.length === 0, errors };
}
