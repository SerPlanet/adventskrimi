/* eslint-disable @typescript-eslint/no-explicit-any */
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { makeCtx } from '../game';
import { loadCase, loadProfile, loadScoring } from '../loader';
import { actionsHere } from '../sim';
import { applyProfile } from '../solver';
import { adminPlayers, dispatch, MemoryStore, type HandlerName } from './index';

// M2: the test case, played through the API from day 1 to the resolution, with a fake clock.
const ROOT = join(__dirname, '../../../..');
const res = loadCase(join(ROOT, 'cases/_test'));
if (!res.ok) throw new Error(res.errors.join('\n'));
const scoring = loadScoring(join(ROOT, 'config/scoring.json'));
const day = (d: number, h = 12) => new Date(Date.UTC(2026, 11, d, h - 1));

// the family profile prunes suspects by Berghotel names, so on the tiny test case only 'friends' is meaningful
describe.each(['friends'])('time-lapse day 1..24 (%s)', (id) => {
  test('a player finishes every day in order and reaches the resolution', async () => {
    const profile = loadProfile(join(ROOT, `config/profiles/${id}.yaml`));
    const store = new MemoryStore(
      {
        id: 'g',
        slug: 'zeitraffer',
        name: 'Z',
        caseId: 'test',
        startDate: '2026-12-01',
        profile,
        scoring,
      },
      res.data,
    );
    const ctx = makeCtx(applyProfile(res.data, profile), profile, scoring);
    const p = (await adminPlayers(store, { op: 'create', game_id: 'g', player: { name: 'Zora' } }))
      .player!.id;
    let n = 0;
    const call = async (name: HandlerName, body: object, now: Date) => {
      const r = await dispatch(
        name,
        store,
        {
          slug: 'zeitraffer',
          player_id: p,
          request_id: `timelapse-${++n}-${Math.random()}`,
          ...body,
        },
        now,
      );
      expect(r.status, JSON.stringify(r.body)).toBe(200);
      return (r.body as any).state;
    };

    let view: any;
    for (let d = 1; d <= 24; d++) {
      const now = day(d);
      view = await call('open_day', {}, now);
      expect(view.day).toBe(d);
      expect(view.can_play).toBe(true);
      for (const a of actionsHere(store.players.get(p)!.state, ctx)) {
        const r = await dispatch(
          'act',
          store,
          { slug: 'zeitraffer', player_id: p, request_id: `timelapse-${++n}`, action: a },
          now,
        );
        expect(r.status).toBe(200);
      }
      view = await call('end_day', {}, now);
    }
    expect(view.finished).toBe(true);

    // accusation is open, but the story waits for the real day 24
    expect(view.accusation.can).toBe(true);
    const sol = res.data.case.solution as Record<string, string>;
    const proof = Object.fromEntries(res.data.case.proof_questions.map((q) => [q.id, q.correct]));
    view = await call('accuse', { theory: sol, proof }, day(24));
    expect(view.accusation.done).toBe(true);
    expect(view.story.chapters.length).toBeGreaterThan(0);
    expect(view.story.solution.every((s: any) => s.right)).toBe(true);
    expect(view.points).toBeGreaterThan(0);
  });
});
