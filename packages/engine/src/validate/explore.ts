import type { Info } from '../solver/info';
import { expandDays, wordCount, type Quality } from '../schemas';
import type { CheckResult } from './types';

/** A visible text must not give the verdict (invariant 13). */
const VERDICT = [
  /war es nicht/i,
  /ist unschuldig/i,
  /ist nicht der dieb/i,
  /ist der dieb/i,
  /war der dieb/i,
  /ist ausgeschlossen/i,
];

/** Checks of docs/07 §2b: no verdicts, lie web, documents, day beats. */
export function checkExplore(info: Info, quality: Quality): CheckResult {
  const { c } = info;
  const errors: string[] = [];
  const texts: [string, string][] = [
    ...c.facts.facts.map((f) => [`fact ${f.id}`, f.text] as [string, string]),
    ...c.statements.statements.map((s) => [`statement ${s.id}`, s.text] as [string, string]),
    ...c.rooms.rooms.flatMap((r) =>
      r.objects.map((o) => [`object ${o.id}`, o.text] as [string, string]),
    ),
    ...c.sources.sources.flatMap((s) => [
      ...(s.lines ?? []).map((l) => [`source ${s.id}`, l.text] as [string, string]),
      ...(s.note ? [[`source ${s.id} note`, s.note.text] as [string, string]] : []),
    ]),
  ];
  for (const [where, t] of texts) {
    const hit = VERDICT.find((re) => re.test(t));
    if (hit) errors.push(`${where}: verdict pattern ${hit}`);
  }

  for (const s of c.sources.sources)
    if (s.document) {
      if (!s.room) errors.push(`document ${s.id}: needs a room (found_at)`);
      const words = wordCount(s.note?.text ?? '');
      if (words > 60) errors.push(`document ${s.id}: ${words} words`);
    }

  // answers are speech bubbles: every line of a dialog stays short (02c §6)
  for (const s of c.sources.sources)
    for (const l of s.lines ?? [])
      if (wordCount(l.text) > 60)
        errors.push(`source ${s.id}: a line has ${wordCount(l.text)} words`);

  // every topic of every figure has an answer somewhere (a talk source); a question is only offered where it has an answer (WP22c)
  for (const n of c.npcs.npcs)
    for (const t of n.topics)
      if (!c.sources.sources.some((s) => s.kind === 'talk' && s.npc === n.id && s.topic === t.id))
        errors.push(`npc ${n.id}: topic ${t.id} has no answer`);

  // a question of the course of the day: `until_day` lies inside the days of the source
  for (const s of c.sources.sources)
    if (s.until_day !== undefined && s.until_day < Math.min(...expandDays(s.days)))
      errors.push(`source ${s.id}: until_day ${s.until_day} lies before its first day`);

  if (!quality.lie_web)
    return { name: 'explore', ok: errors.length === 0, errors, note: 'lie web off' };

  // lie web: every figure keeps something back, with a reason; mentioned by at least two others
  const stmts = c.statements.statements;
  for (const n of c.npcs.npcs) {
    if (!n.lies?.length) errors.push(`npc ${n.id}: no lie/secret with reason`);
    for (const lie of n.lies ?? []) {
      const st = stmts.find((s) => s.id === lie.statement);
      if (!st) errors.push(`npc ${n.id}: lie refers to unknown statement ${lie.statement}`);
      else if (st.truth) errors.push(`npc ${n.id}: lie ${lie.statement} is marked true`);
      if (lie.refuted_by.length + lie.confirmed_by.length < 2)
        errors.push(`npc ${n.id}: reason of ${lie.statement} needs 2 ways to be found`);
    }
    const mentions = new Set(
      stmts
        .filter(
          (s) => s.npc !== n.id && s.claims.some((cl) => 'person' in cl && cl.person === n.id),
        )
        .map((s) => s.npc),
    );
    for (const s of c.sources.sources) if (s.witness_of === n.id && s.npc) mentions.add(s.npc);
    if (mentions.size < 2)
      errors.push(`npc ${n.id}: mentioned by ${mentions.size} others (need 2)`);
  }

  const days = new Set(c.case.beats.map((b) => b.day));
  const missing = Array.from({ length: 24 }, (_, i) => i + 1).filter((d) => !days.has(d));
  if (missing.length)
    errors.push(`beats missing for ${missing.length} days (first: ${missing[0]})`);

  return { name: 'explore', ok: errors.length === 0, errors };
}
