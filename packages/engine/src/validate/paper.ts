import type { LoadedCase } from '../loader';
import { wordCount, type Quality } from '../schemas';
import type { CheckResult } from './types';

/** The newspaper tells facts, never lies and never verdicts (02c §3). */
const VERDICT = [
  /war es nicht/i,
  /ist unschuldig/i,
  /ist der dieb/i,
  /war der dieb/i,
  /ist ausgeschlossen/i,
];
const ARTICLES_PER_DAY = { min: 3, max: 5 };
const WORDS = { min: 50, max: 100 };

/** Checks of docs/02c §2/§3 (WP19): articles, facts only, relations told, narrative blocks. */
export function checkPaper(c: LoadedCase, quality: Quality): CheckResult {
  const errors: string[] = [];
  const facts = new Map(c.facts.facts.map((f) => [f.id, f]));
  const statements = new Set(c.statements.statements.map((s) => s.id));

  for (const a of c.newspaper.articles) {
    const w = wordCount(a.text);
    if (w < WORDS.min || w > WORDS.max)
      errors.push(`article ${a.id}: ${w} words (${WORDS.min}-${WORDS.max})`);
    if (VERDICT.some((re) => re.test(a.text) || re.test(a.title)))
      errors.push(`article ${a.id}: verdict`);
    for (const id of a.traegt) {
      if (statements.has(id)) errors.push(`article ${a.id}: carries statement ${id} (facts only)`);
      else if (!facts.has(id)) errors.push(`article ${a.id}: unknown fact ${id}`);
    }
  }
  if (!quality.lie_web)
    return { name: 'paper', ok: errors.length === 0, errors, note: 'paper off' };

  for (let day = 1; day <= 24; day++) {
    const n = c.newspaper.articles.filter((a) => a.day === day).length;
    if (n < ARTICLES_PER_DAY.min || n > ARTICLES_PER_DAY.max)
      errors.push(`day ${day}: ${n} articles (${ARTICLES_PER_DAY.min}-${ARTICLES_PER_DAY.max})`);
    if (!c.events.events.find((e) => e.day === day)?.morgen)
      errors.push(`day ${day}: event without morgen`);
  }
  for (const r of c.rooms.rooms) {
    if (!r.abgang) errors.push(`room ${r.id}: no abgang`);
    if (!r.ankunft) errors.push(`room ${r.id}: no ankunft`);
  }
  // every relation is told in a paper or yielded by a talk
  const told = new Set([
    ...c.newspaper.articles.flatMap((a) => a.traegt),
    ...c.sources.sources.filter((s) => s.kind === 'talk').flatMap((s) => s.yields),
  ]);
  for (const f of c.facts.facts)
    if (f.relation && !told.has(f.id))
      errors.push(`fact ${f.id}: relation is never told (paper or talk)`);
  return {
    name: 'paper',
    ok: errors.length === 0,
    errors,
    note: `${c.newspaper.articles.length} articles`,
  };
}
