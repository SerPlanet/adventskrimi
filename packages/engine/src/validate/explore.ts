import type { Info } from '../solver/info';
import { wordCount, type Quality } from '../schemas';
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

/** Checks of docs/07 §2b: no verdicts, lie web, links, documents, day beats. */
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

  const finds = new Set([...c.facts.facts, ...c.statements.statements].map((x) => x.id));
  const items = new Set(c.puzzles.items.map((i) => i.id));
  for (const l of c.case.links)
    for (const id of [l.a, l.b])
      if (!finds.has(id) && !items.has(id)) errors.push(`link ${l.id}: unknown find ${id}`);

  for (const s of c.sources.sources)
    if (s.document) {
      if (!s.room) errors.push(`document ${s.id}: needs a room (found_at)`);
      const words = wordCount(s.note?.text ?? '');
      if (words > 60) errors.push(`document ${s.id}: ${words} words`);
    }

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
