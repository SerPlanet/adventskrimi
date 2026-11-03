import type { LoadedCase } from '../loader';

export type ThingClass = 'deko' | 'ansehen' | 'untersuchbar';

/**
 * Class of a thing (04 §5b). An explicit `klasse` wins. Otherwise: a thing with an inspect
 * source that yields something can be examined, a thing that is the target of another source
 * (use) can be looked at, everything else is decoration. Independent of the day, so the client
 * learns nothing about what brings a find today.
 */
export function classOf(o: { id: string; klasse?: ThingClass }, c: LoadedCase): ThingClass {
  if (o.klasse) return o.klasse;
  const mine = c.sources.sources.filter((s) => s.object === o.id);
  if (mine.some((s) => s.kind === 'inspect' && s.yields.length > 0)) return 'untersuchbar';
  return mine.length ? 'ansehen' : 'deko';
}
