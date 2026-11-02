import type { Info } from '../solver/info';
import { placeholderErrors } from '../names';
import { wordCount, type Quality } from '../schemas';
import { planTempo, profileBudget } from '../solver/planner';
import type { CheckResult } from './types';

const sentences = (t: string) =>
  t
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean);

export function checkTexts(info: Info, q: Quality): CheckResult {
  const { c, profile } = info;
  const errors: string[] = [];
  const cards: [string, string][] = [
    ...c.rooms.rooms.map((r) => [`room ${r.id}`, r.description] as [string, string]),
    ...c.rooms.rooms.flatMap((r) =>
      r.objects.map((o) => [`object ${o.id}`, o.text] as [string, string]),
    ),
    ...c.facts.facts.map((f) => [`fact ${f.id}`, f.text] as [string, string]),
    ...c.statements.statements.map((s) => [`statement ${s.id}`, s.text] as [string, string]),
    ...c.puzzles.puzzles.map((p) => [`puzzle ${p.id}`, p.prompt] as [string, string]),
    ...c.events.events.map((e) => [`event day ${e.day}`, e.text] as [string, string]),
  ];
  for (const [where, text] of cards) {
    const w = wordCount(text);
    if (w > q.card_words_max) errors.push(`${where}: ${w} words (max ${q.card_words_max})`);
    if (profile.id === 'family') {
      const long = sentences(text).find((s) => wordCount(s) > q.family_sentence_words_max);
      if (long) errors.push(`${where}: sentence over ${q.family_sentence_words_max} words`);
    }
  }
  const paper = [
    ...c.newspaper.gossip.map((g) => [`gossip ${g.id}`, g.text] as [string, string]),
    ...c.newspaper.ads.map((a) => [`ad ${a.id}`, a.text] as [string, string]),
    ...c.newspaper.filler.map((f) => [`filler ${f.id}`, f.text] as [string, string]),
  ];
  for (const [where, text] of paper) {
    const w = wordCount(text);
    if (w > q.newspaper_words_max)
      errors.push(`${where}: ${w} words (max ${q.newspaper_words_max})`);
  }
  // Spoiler-free: plaque titles and gossip never name a room or an object.
  const names = [...c.rooms.rooms.flatMap((r) => [r.name, ...r.objects.map((o) => o.name)])].map(
    (n) => n.toLowerCase(),
  );
  const spoilerTexts: [string, string][] = [
    ...c.newspaper.gossip.map((g) => [`gossip ${g.id}`, g.text] as [string, string]),
    ...c.newspaper.plaque_titles.map((t) => [`plaque title "${t}"`, t] as [string, string]),
    ...c.sources.sources
      .filter((s) => s.plaque)
      .map((s) => [`plaque of ${s.id}`, s.plaque!] as [string, string]),
  ];
  for (const [where, text] of spoilerTexts) {
    const hit = names.find((n) => text.toLowerCase().includes(n));
    if (hit) errors.push(`${where}: names "${hit}" (spoiler)`);
  }
  errors.push(...placeholderErrors(c));
  for (const [where, text] of spoilerTexts)
    if (text.includes('{')) errors.push(`${where}: contains a name placeholder (spoiler)`);
  return { name: 'texts', ok: errors.length === 0, errors };
}

export function checkTempo(info: Info, q: Quality): CheckResult {
  const r = planTempo(info, profileBudget(info));
  const { earliest_day: lo, latest_day: hi } = q.tempo;
  const errors: string[] = [];
  if (r.solveDay === null)
    errors.push('a perfect player never reaches a unique solution (case too hard / unreachable)');
  else if (r.solveDay < lo)
    errors.push(
      `solvable on day ${r.solveDay}, before day ${lo}: lower actions/day, spread key sources, lengthen paths`,
    );
  else if (r.solveDay > hi)
    errors.push(`solvable only on day ${r.solveDay}, after day ${hi}: case too hard`);
  return { name: 'tempo', ok: errors.length === 0, errors, note: `solve day ${r.solveDay ?? '-'}` };
}
