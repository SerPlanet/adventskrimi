import type { LoadedCase } from '../loader';
import { expandDays } from '../schemas';
import { guidedLastDay } from '../game/route';
import { buildReach } from '../solver/reach';

/**
 * Rules on what a corridor sees in the guided days (WP22b): every insight at most once, the
 * newspaper never repeats what a conversation or a thing of the same way already gave, and
 * every answer brings something the way has not had yet.
 */
export function routeErrors(c: LoadedCase): string[] {
  const last = guidedLastDay(c);
  if (last < 2) return [];
  const errors: string[] = [];
  const supports = new Map<string, string[]>();
  for (const f of [...c.facts.facts, ...c.statements.statements])
    if (f.supports.length) supports.set(f.id, f.supports);

  for (const k of c.routes.corridors) {
    const reach = buildReach(c, k.id);
    // sources of this way in the guided days, with the first day they are there for the player
    const mine = c.sources.sources.flatMap((s) => {
      const days = expandDays(s.days).filter(
        (d) => d <= last && d >= (s.unlock?.day_from ?? 1) && reach.roomOn(s.id, d) !== null,
      );
      return days.length ? [{ s, day: Math.min(...days) }] : [];
    });

    const proving = new Map<string, typeof mine>();
    for (const m of mine)
      for (const i of new Set(m.s.yields.flatMap((y) => supports.get(y) ?? [])))
        proving.set(i, [...(proving.get(i) ?? []), m]);
    for (const [i, list] of proving) {
      // 1. at most once in the guided days
      if (list.length > 1)
        errors.push(
          `corridor ${k.id}: insight ${i} is proven ${list.length} times in days 1-${last} (${list.map((m) => m.s.id).join(', ')})`,
        );
      // 2. the newspaper repeats nothing the way had before
      for (const n of list.filter((m) => m.s.kind === 'newspaper'))
        for (const o of list.filter((m) => m.s.kind !== 'newspaper' && m.day <= n.day))
          errors.push(
            `corridor ${k.id}: newspaper ${n.s.id} repeats insight ${i} that ${o.s.id} gave`,
          );
    }

    // 3. every answer brings a find the way has not had before (the paper of a day comes first)
    for (const t of mine.filter((m) => m.s.kind === 'talk' && m.s.yields.length)) {
      const before = new Set(
        mine
          .filter(
            (o) => o !== t && (o.day < t.day || (o.day === t.day && o.s.kind === 'newspaper')),
          )
          .flatMap((o) => o.s.yields),
      );
      if (t.s.yields.every((y) => before.has(y)))
        errors.push(`corridor ${k.id}: answer ${t.s.id} only repeats finds from before`);
    }
  }
  return [...new Set(errors)];
}
