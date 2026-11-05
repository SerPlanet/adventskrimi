import { budgetOf } from '../game/budget';
import { guidedLastDay } from '../game/route';
import type { LoadedCase } from '../loader';
import { expandDays, type FactBody, type Profile, type Quality } from '../schemas';
import { makeRng } from '../sim/bots';
import { buildInfo } from '../solver/info';
import { planTempo, profileBudget } from '../solver/planner';
import { buildReach, type Reach } from '../solver/reach';
import { routeErrors } from './route';
import type { CheckResult } from './types';

const NIGHT_TYPES = new Set<FactBody['type']>(['presence', 'absence', 'object_state']);
const escapeRe = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** All checks of the insight structure (WP20 §4). Skipped while a case has no `insights.yaml` (D81). */
export function checkInsights(c: LoadedCase, profile: Profile, q: Quality): CheckResult {
  const insights = c.insights.insights;
  if (!insights.length)
    return { name: 'insights', ok: true, errors: [], note: 'no insights (old structure)' };
  const errors: string[] = [];
  const cfg = q.insights;
  const sources = c.sources.sources;
  const corridors = c.routes.corridors.map((k) => k.id);
  const last = guidedLastDay(c);

  // proofs: finds (facts, statements) that support an insight
  const proofs = new Map<string, { kind: 'statement' | 'fact'; supports: string[] }>();
  for (const f of c.facts.facts)
    if (f.supports.length) proofs.set(f.id, { kind: 'fact', supports: f.supports });
  for (const s of c.statements.statements)
    if (s.supports.length) proofs.set(s.id, { kind: 'statement', supports: s.supports });
  const sourcesOfInsight = (reach: Reach, insight: string): Set<string> =>
    new Set(
      sources
        .filter(
          (s) =>
            reach.daysOf(s.id).length > 0 &&
            s.yields.some((y) => proofs.get(y)?.supports.includes(insight)),
        )
        .map((s) => s.id),
    );

  // 1. at least `min_proofs` proofs from different sources
  const global = buildReach(c);
  for (const i of insights) {
    const n = sourcesOfInsight(global, i.id).size;
    if (n < cfg.min_proofs)
      errors.push(`insight ${i.id}: ${n} source(s) of proof, need >= ${cfg.min_proofs}`);
  }

  // 2. every corridor (or everybody, without corridors) reaches every insight by two sources
  //    at least, so no single source decides; each corridor alone names the solution (3.)
  const reaches: [string, Reach][] = corridors.length
    ? corridors.map((k) => [k, buildReach(c, k)] as [string, Reach])
    : [['all', global]];
  for (const [name, reach] of reaches)
    for (const i of insights) {
      const own = sourcesOfInsight(reach, i.id);
      if (!own.size) errors.push(`corridor ${name}: insight ${i.id} cannot be reached`);
      else if (own.size === 1)
        errors.push(`corridor ${name}: insight ${i.id} hangs on the single source ${[...own][0]}`);
    }
  for (const k of corridors) {
    const info = buildInfo(c, profile, k);
    if (planTempo(info, profileBudget(info)).solveDay === null)
      errors.push(`corridor ${k}: the solution is not reachable on this way alone`);
  }

  // 4. every corridor yields the same number of insights and the same proof pattern in the guided days
  const pattern = (k: string) => {
    const reach = buildReach(c, k);
    const got = new Set<string>();
    for (const s of sources)
      if (reach.daysOf(s.id).some((d) => d <= last)) s.yields.forEach((y) => got.add(y));
    const own = [...got].filter((y) => proofs.has(y));
    const ins = new Set(own.flatMap((y) => proofs.get(y)?.supports ?? []));
    const kinds = (t: string) => own.filter((y) => proofs.get(y)?.kind === t).length;
    return `${ins.size} insights, ${kinds('statement')} statements, ${kinds('fact')} facts`;
  };
  const patterns = corridors.map((k) => [k, pattern(k)] as const);
  if (new Set(patterns.map((p) => p[1])).size > 1)
    errors.push(
      `corridors differ in the guided days: ${patterns.map((p) => `${p[0]}: ${p[1]}`).join('; ')}`,
    );
  if (corridors.length > 1 && new Set(c.routes.corridors.map((k) => k.route[last])).size > 1)
    errors.push(`corridors do not meet on day ${last}`);

  // 5. more things with a find than actions: a real choice, and no action runs dry
  const proofThings = (reach: Reach, day: number, room: string, withProof = false) =>
    new Set(
      sources
        .filter(
          (s) =>
            s.kind === 'inspect' &&
            s.object &&
            reach.roomOn(s.id, day) === room &&
            (withProof ? s.yields.some((y) => proofs.has(y)) : s.yields.length > 0),
        )
        .map((s) => s.object),
    ).size;
  for (const k of c.routes.corridors) {
    const reach = buildReach(c, k.id);
    for (let d = 2; d <= last; d++) {
      const need = budgetOf({ profile }, d) + 1;
      const have = proofThings(reach, d, k.route[d] as string);
      if (have < need)
        errors.push(`corridor ${k.id} day ${d}: ${have} thing(s) with a find, need >= ${need}`);
    }
  }
  // free phase: a room that offers proofs by examining offers more than the day's budget
  const freeDays = Array.from({ length: 24 - last }, (_, i) => last + 1 + i);
  for (const r of c.rooms.rooms)
    for (const d of freeDays) {
      // a room that offers proofs by examining offers more finds than the day's budget
      const have = proofThings(global, d, r.id);
      const need = budgetOf({ profile }, d) + 1;
      if (proofThings(global, d, r.id, true) > 0 && have < need) {
        errors.push(`room ${r.id} day ${d}: ${have} thing(s) with a find, need >= ${need}`);
        break;
      }
    }

  // 6. no verdicts in finds, notes and lines
  const verdict = new RegExp(
    `(^|[^\\p{L}])(${cfg.verdict_words.map(escapeRe).join('|')})(?![\\p{L}])`,
    'iu',
  );
  const texts: [string, string][] = [
    ...c.facts.facts.map((f) => [`fact ${f.id}`, f.text] as [string, string]),
    ...c.statements.statements.map((s) => [`statement ${s.id}`, s.text] as [string, string]),
    ...c.rooms.rooms.flatMap((r) =>
      r.objects.flatMap((o) => [
        [`object ${o.id}`, o.text] as [string, string],
        [`object ${o.id} look_note`, o.look_note ?? ''] as [string, string],
      ]),
    ),
    ...sources.map(
      (s) =>
        [
          `source ${s.id}`,
          [...(s.lines ?? []).map((l) => l.text), s.note?.text ?? ''].join(' '),
        ] as [string, string],
    ),
  ];
  for (const [where, t] of texts)
    if (t && verdict.test(t)) errors.push(`${where}: names a verdict`);

  // 7. a random sample of the proofs still solves the case (a sample, never a worst-case proof)
  const reachable = [...proofs.keys()].filter((id) =>
    sources.some((s) => s.yields.includes(id) && global.daysOf(s.id).length > 0),
  );
  const take = Math.round(reachable.length * cfg.sample_share);
  const rng = makeRng(20);
  let ok = 0;
  for (let run = 0; run < cfg.sample_runs; run++) {
    const pool = [...reachable];
    const got = new Set<string>();
    for (let n = 0; n < take; n++)
      got.add(pool.splice(Math.floor(rng() * pool.length), 1)[0] as string);
    if (insights.every((i) => [...got].some((id) => proofs.get(id)?.supports.includes(i.id)))) ok++;
  }
  const rate = ok / cfg.sample_runs;
  if (rate < cfg.sample_min_success)
    errors.push(
      `a random ${cfg.sample_share * 100}% sample of the proofs solves ${(rate * 100).toFixed(0)}% of runs, need >= ${cfg.sample_min_success * 100}%`,
    );

  // 8. questions about the night come only in the free phase
  const free = last + 1;
  for (const s of sources) {
    if (s.kind !== 'talk' || last === 0) continue;
    const about = s.yields.some((y) => {
      const f = c.facts.facts.find((x) => x.id === y);
      const st = c.statements.statements.find((x) => x.id === y);
      return (f && NIGHT_TYPES.has(f.type)) || st?.claims.some((b) => NIGHT_TYPES.has(b.type));
    });
    const early = expandDays(s.days).filter((d) => d >= (s.unlock?.day_from ?? 1) && d < free);
    if (about && early.length)
      errors.push(
        `source ${s.id}: a question about the night is open on day ${early[0]} (free phase starts on ${free})`,
      );
  }

  errors.push(...routeErrors(c));

  return {
    name: 'insights',
    ok: errors.length === 0,
    errors,
    note: `${insights.length} insights, ${corridors.length} corridors`,
  };
}
