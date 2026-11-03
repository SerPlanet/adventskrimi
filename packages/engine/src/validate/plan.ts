import type { LoadedCase } from '../loader';
import type { CheckResult } from './types';

type Rect = { x: number; y: number; w: number; h: number };

const overlap = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** True when the point lies on an edge both rectangles share (touching, not overlapping). */
function onSharedWall(p: { x: number; y: number }, a: Rect, b: Rect): boolean {
  const eps = 1e-6;
  const inX = (r: Rect) => p.x >= r.x - eps && p.x <= r.x + r.w + eps;
  const inY = (r: Rect) => p.y >= r.y - eps && p.y <= r.y + r.h + eps;
  const vertical = [a.x + a.w, a.x].some(
    (x) => Math.abs(x - p.x) < eps && (b.x + b.w === x || b.x === x),
  );
  const horizontal = [a.y + a.h, a.y].some(
    (y) => Math.abs(y - p.y) < eps && (b.y + b.h === y || b.y === y),
  );
  return (vertical && inY(a) && inY(b)) || (horizontal && inX(a) && inX(b));
}

/** Docs/04 §5b: every graph edge has exactly one door on a shared wall, every door an edge. */
export function checkPlan(c: LoadedCase): CheckResult {
  const errors: string[] = [];
  const rooms = new Map(c.rooms.rooms.map((r) => [r.id, r]));
  const key = (a: string, b: string) => [a, b].sort().join('|');
  const edges = new Set<string>();
  for (const r of rooms.values())
    for (const n of r.neighbors) {
      if (!rooms.has(n)) errors.push(`room ${r.id}: unknown neighbor ${n}`);
      else edges.add(key(r.id, n));
    }
  const doors = new Map<string, number>();
  for (const d of c.rooms.doors) {
    const k = key(d.a, d.b);
    doors.set(k, (doors.get(k) ?? 0) + 1);
    if (!edges.has(k)) errors.push(`door ${d.a}-${d.b}: no such edge in the room graph`);
    const ra = rooms.get(d.a);
    const rb = rooms.get(d.b);
    if (ra && rb && !onSharedWall(d.at, ra.plan, rb.plan))
      errors.push(`door ${d.a}-${d.b}: not on a shared wall`);
  }
  for (const k of edges) {
    const n = doors.get(k) ?? 0;
    if (n !== 1) errors.push(`edge ${k}: ${n} doors (needs exactly 1)`);
  }
  const list = [...rooms.values()];
  for (let i = 0; i < list.length; i++)
    for (let j = i + 1; j < list.length; j++)
      if (overlap(list[i]!.plan, list[j]!.plan))
        errors.push(`rooms ${list[i]!.id} and ${list[j]!.id} overlap in the plan`);
  for (const st of c.rooms.stairs)
    if (!rooms.has(st.room)) errors.push(`stairs: unknown room ${st.room}`);
  return { name: 'plan', ok: errors.length === 0, errors, note: `${c.rooms.doors.length} doors` };
}
