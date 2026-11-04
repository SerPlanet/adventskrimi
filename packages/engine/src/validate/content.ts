import { andInto, count, maskOf } from '../solver/space';
import { combine, reachableItems, type Info } from '../solver/info';
import { conflicts } from '../solver/conflict';
import { expandDays, type Quality } from '../schemas';
import type { CheckResult } from './types';

export function checkUnique(info: Info): CheckResult {
  const all = combine(info, reachableItems(info));
  const n = count(all);
  const errors: string[] = [];
  if (n !== 1)
    errors.push(`${n} consistent tuples remain with all reachable finds (need exactly 1)`);
  else if (!all[info.solutionIndex])
    errors.push('the single remaining tuple is not the declared solution');
  return { name: 'unique', ok: errors.length === 0, errors, note: `${n} tuple(s)` };
}

export function checkReach(info: Info): CheckResult {
  const errors = info.c.sources.sources
    .filter((s) => info.reach.daysOf(s.id).length === 0)
    .map((s) => `source ${s.id}: never reachable (schedule, room graph, events or requires)`);
  return { name: 'reach', ok: errors.length === 0, errors };
}

/** Facts whose removal leaves more consistent tuples than with all of them. */
function keyItems(info: Info): string[] {
  const items = [...reachableItems(info)].filter((id) => info.masks.has(id));
  const full = count(combine(info, items));
  return items.filter(
    (id) =>
      count(
        combine(
          info,
          items.filter((o) => o !== id),
        ),
      ) > full,
  );
}

function waysTo(info: Info, id: string, noPuzzle = false): number {
  return info.c.sources.sources.filter(
    (s) => s.yields.includes(id) && info.reach.daysOf(s.id).length > 0 && !(noPuzzle && s.requires),
  ).length;
}

export function checkRedundancy(info: Info, q: Quality): CheckResult {
  const min = info.profile.id === 'family' ? q.redundancy_min.family : q.redundancy_min.friends;
  const errors = keyItems(info)
    .filter((id) => waysTo(info, id) < min)
    .map((id) => `key item ${id}: ${waysTo(info, id)} way(s), need >= ${min}`);
  return { name: 'redundancy', ok: errors.length === 0, errors };
}

export function checkRiddle(info: Info): CheckResult {
  const errors = keyItems(info)
    .filter((id) => waysTo(info, id, true) === 0)
    .map((id) => `key item ${id}: only reachable through an object puzzle`);
  return { name: 'riddle', ok: errors.length === 0, errors };
}

/** false statement id -> refuting reason (undefined = not refutable) */
function refutations(info: Info): Map<string, string | undefined> {
  const reachable = reachableItems(info);
  const consistent = combine(info, reachable);
  const facts = info.c.facts.facts.filter((f) => reachable.has(f.id));
  const out = new Map<string, string | undefined>();
  for (const s of info.c.statements.statements.filter(
    // a story statement (no structural claim) is refuted by the evidence of the story, not here
    (x) => !x.truth && x.claims.some((cl) => cl.type !== 'story'),
  )) {
    let why: string | undefined;
    for (const cl of s.claims) {
      const direct = facts.find((f) => conflicts(cl, f));
      if (direct) {
        why = `fact ${direct.id}`;
        break;
      }
      const m = Uint8Array.from(consistent);
      andInto(m, maskOf(cl, info.space, info.c));
      if (count(m) === 0) {
        why = 'the established solution';
        break;
      }
    }
    out.set(s.id, why);
  }
  return out;
}

export function checkRefute(info: Info): CheckResult {
  const errors = [...refutations(info)]
    .filter(([, why]) => !why)
    .map(([id]) => `statement ${id}: false but not refutable by any reachable fact`);
  return { name: 'refute', ok: errors.length === 0, errors };
}

export function checkMinimums(info: Info, q: Quality): CheckResult {
  const { c, profile } = info;
  const errors: string[] = [];
  const refuted = [...refutations(info)].filter(([, why]) => why).length;
  if (refuted < q.min_statement_fact_contradictions)
    errors.push(
      `statement-fact contradictions: ${refuted}, need >= ${q.min_statement_fact_contradictions}`,
    );

  let pairs = 0;
  const st = c.statements.statements;
  for (let i = 0; i < st.length; i++)
    for (let j = i + 1; j < st.length; j++)
      if (st[i]!.claims.some((a) => st[j]!.claims.some((b) => conflicts(a, b)))) pairs++;
  if (pairs < q.min_statement_statement_contradictions)
    errors.push(
      `statement-statement contradictions: ${pairs}, need >= ${q.min_statement_statement_contradictions}`,
    );

  const early = new Set(
    c.sources.sources
      .filter((s) => expandDays(s.days).some((d) => d <= 5))
      .flatMap((s) => s.yields),
  );
  const items = [...c.facts.facts, ...c.statements.statements];
  const reinterpreted = items.filter(
    (i) => (i.reinterpreted_on ?? 0) >= 6 && early.has(i.id),
  ).length;
  if (reinterpreted < q.min_reinterpreted_finds)
    errors.push(
      `reinterpreted early finds: ${reinterpreted}, need >= ${q.min_reinterpreted_finds}`,
    );

  const herrings = items.filter((i) => i.red_herring).length;
  const minH = profile.id === 'family' ? q.red_herrings_min.family : q.red_herrings_min.friends;
  if (herrings < minH) errors.push(`red herrings: ${herrings}, need >= ${minH}`);

  const liars = new Set(st.filter((s) => !s.truth).map((s) => s.npc)).size;
  if (liars > profile.max_liars)
    errors.push(`liars: ${liars}, profile allows <= ${profile.max_liars}`);
  return { name: 'minimums', ok: errors.length === 0, errors };
}
