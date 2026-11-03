import type { LoadedCase } from '../loader';
import type { Quality } from '../schemas';
import type { CheckResult } from './types';

/** Locks (docs/02c §5, WP18): each has an attempt text, a way to its key or none on purpose, a reward. */
export function checkLocks(c: LoadedCase, quality: Quality): CheckResult {
  const errors: string[] = [];
  const locked = c.sources.sources.filter((s) => s.requires);
  const roomOf = (s: (typeof locked)[number]) =>
    s.room ?? c.rooms.rooms.find((r) => r.objects.some((o) => o.id === s.object))?.id;
  let cross = 0;

  for (const s of locked) {
    if (!s.lock) {
      errors.push(`source ${s.id}: requires ${s.requires} but has no lock`);
      continue;
    }
    const h = s.lock.hinweis_quelle;
    if (h === 'ohne_hinweis') continue;
    const room = c.rooms.rooms.find((r) => r.id === h.room);
    if (!room) errors.push(`source ${s.id}: lock hint room ${h.room} unknown`);
    else if (h.ding && !room.objects.some((o) => o.id === h.ding))
      errors.push(`source ${s.id}: lock hint thing ${h.ding} is not in ${h.room}`);
    if (h.room !== roomOf(s)) cross++;
  }
  // a puzzle is only ever met as a lock on a thing
  for (const p of c.puzzles.puzzles)
    if (!c.sources.sources.some((s) => s.requires === p.id))
      errors.push(`puzzle ${p.id}: no source requires it`);

  if (quality.lie_web && locked.length && cross * 2 < locked.length)
    errors.push(`only ${cross} of ${locked.length} locks point to another room (half needed)`);
  return {
    name: 'locks',
    ok: errors.length === 0,
    errors,
    note: `${locked.length} locks, ${cross} cross-room`,
  };
}
