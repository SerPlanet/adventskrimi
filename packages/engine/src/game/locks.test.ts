import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { loadCase, loadProfile, loadScoring } from '../loader';
import { applyProfile } from '../solver';
import { lockOf, makeCtx, newPlayer, resolveAction, solvePuzzle } from './index';

const ROOT = join(__dirname, '../../../..');
const res = loadCase(join(ROOT, 'cases/_test'));
if (!res.ok) throw new Error(res.errors.join('\n'));
const profile = loadProfile(join(ROOT, 'config/profiles/friends.yaml'));
const ctx = makeCtx(
  applyProfile(res.data, profile),
  profile,
  loadScoring(join(ROOT, 'config/scoring.json')),
);
const inKeller = { ...newPlayer(ctx), day: 2, room: 'keller' };
const kiste = { type: 'inspect', object: 'kiste' } as const;

describe('locks (02c §5)', () => {
  test('the puzzle of a lock is unknown until the attempt; the attempt tells its text and costs nothing', () => {
    expect(lockOf(inKeller, ctx, 'kiste')).toBeUndefined();
    const r = resolveAction(inKeller, ctx, kiste);
    expect(r.result.status).toBe('locked');
    expect(r.result.status === 'locked' && r.result.message).toContain('Zettel in der Halle');
    expect(r.state.actionsUsed).toBe(0);
    const lock = lockOf(r.state, ctx, 'kiste');
    expect(lock?.prompt).toContain('Zahlen');
    expect(lock).not.toHaveProperty('answer');
  });

  test('solving opens the thing for the examination', () => {
    let st = resolveAction(inKeller, ctx, kiste).state;
    expect(solvePuzzle(st, ctx, 'p_code', '000').correct).toBe(false);
    st = solvePuzzle(st, ctx, 'p_code', '123').state;
    expect(lockOf(st, ctx, 'kiste')?.solved).toBe(true);
    expect(resolveAction(st, ctx, kiste).result.status).toBe('found');
  });
});
