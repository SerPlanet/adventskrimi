import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { loadCase, loadProfile, loadScoring } from '../loader';
import { applyProfile } from '../solver';
import { answerOf, makeCtx, newPlayer, resolveAction } from './index';

const ROOT = join(__dirname, '../../../..');
const res = loadCase(join(ROOT, 'cases/_test'));
if (!res.ok) throw new Error(res.errors.join('\n'));
const profile = loadProfile(join(ROOT, 'config/profiles/friends.yaml'));
const ctx = makeCtx(
  applyProfile(res.data, profile),
  profile,
  loadScoring(join(ROOT, 'config/scoring.json')),
);

// the question about the night is part of the free phase (unlock from day 3, WP20)
const day3 = () => ({ ...newPlayer(ctx), day: 3 });

describe('every question has an answer (02c §6)', () => {
  test('a source answers with its lines and holds the finds', () => {
    const a = answerOf(day3(), ctx, { type: 'talk', npc: 'cora', topic: 'nacht' });
    expect(a?.lines.map((l) => l.speaker)).toEqual(['Du', 'Cora']);
    expect(a?.finds).toEqual(['s_cora_halle']);
  });

  test('a question without a source says "Dazu weiß ich nichts." and holds nothing', () => {
    const a = answerOf(newPlayer(ctx), ctx, { type: 'talk', npc: 'anna', topic: 'wetter' });
    expect(a?.lines.at(-1)?.text).toBe('Dazu weiß ich nichts.');
    expect(a?.finds).toEqual([]);
  });

  test('asking again gives the same answer, free of charge, nothing changes', () => {
    const q = { type: 'talk', npc: 'cora', topic: 'nacht' } as const;
    const once = resolveAction(day3(), ctx, q).state;
    const again = resolveAction(once, ctx, q);
    expect(again.result.status).toBe('known');
    expect(again.state).toBe(once);
    expect(answerOf(once, ctx, q)).toEqual(answerOf(day3(), ctx, q));
  });

  test('a person who is not here has no answer', () => {
    expect(answerOf(newPlayer(ctx), ctx, { type: 'inspect', object: 'lampe' })).toBeUndefined();
  });
});
