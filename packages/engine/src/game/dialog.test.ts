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

  test('a question without an answer today is not offered and has no reply', () => {
    expect(answerOf(newPlayer(ctx), ctx, { type: 'talk', npc: 'anna', topic: 'wetter' })).toBe(
      undefined,
    );
  });

  test('a question of the story can be asked again with the same answer; a question of the course is gone after it', () => {
    const c = structuredClone(res.data);
    c.sources.sources.find((s) => s.id === 'src_anna')!.once = true;
    const once = makeCtx(applyProfile(c, profile), profile, ctx.scoring);
    const q = { type: 'talk', npc: 'anna', topic: 'nacht' } as const;
    // story question (no `once`): again and again, the same
    const first = resolveAction(day3(), ctx, q).state;
    expect(answerOf(first, ctx, q)).toEqual(answerOf(day3(), ctx, q));
    // `once`: the first ask is answered, afterwards the source is gone
    const st = resolveAction(day3(), once, q);
    expect(st.result.status).toBe('found');
    expect(answerOf(day3(), once, q)).toBeDefined();
    expect(answerOf(st.state, once, q)).toBeUndefined();
    expect(resolveAction(st.state, once, q).result.status).toBe('empty');
  });

  test('until_day: offered up to that day, then gone', () => {
    const c = structuredClone(res.data);
    c.sources.sources.find((s) => s.id === 'src_anna')!.until_day = 3;
    const u = makeCtx(applyProfile(c, profile), profile, ctx.scoring);
    const q = { type: 'talk', npc: 'anna', topic: 'nacht' } as const;
    expect(answerOf({ ...day3() }, u, q)).toBeDefined();
    expect(answerOf({ ...day3(), day: 4 }, u, q)).toBeUndefined();
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
