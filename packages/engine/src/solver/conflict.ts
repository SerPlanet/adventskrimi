import type { FactBody } from '../schemas';

/** Direct position conflict between two bodies (same person + window). */
export function conflicts(a: FactBody, b: FactBody): boolean {
  const pa = a.type === 'presence' || a.type === 'absence';
  const pb = b.type === 'presence' || b.type === 'absence';
  if (!pa || !pb || a.person !== b.person || a.window !== b.window) return false;
  if (a.type === 'presence' && b.type === 'presence') return a.room !== b.room;
  return a.room === b.room && a.type !== b.type;
}
