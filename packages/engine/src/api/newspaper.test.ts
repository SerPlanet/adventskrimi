import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { makeCtx } from '../game';
import { loadCase, loadProfile, loadScoring } from '../loader';
import { renameCase } from '../names';
import { applyProfile } from '../solver';
import { adminPlayers, dispatch, MemoryStore } from './index';
import { generateNewspaper } from './newspaper';

const ROOT = join(__dirname, '../../../..');
const scoring = loadScoring(join(ROOT, 'config/scoring.json'));
const DAY24 = new Date('2026-12-24T12:00:00+01:00');

// The test case is always there; the real case only on the author's machine (it is not in the repo).
const CASES = [
  'cases/_test',
  ...(existsSync(join(ROOT, 'cases/berghotel')) ? ['cases/berghotel'] : []),
];
const PROFILES = ['friends', 'family'] as const;

/** Every string anywhere in the page. */
function strings(v: unknown, out: string[] = []): string[] {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => strings(x, out));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => strings(x, out));
  return out;
}

for (const dir of CASES) {
  const res = loadCase(join(ROOT, dir));
  if (!res.ok) throw new Error(res.errors.join('\n'));

  describe(`no raw placeholder in any field of the newspaper (${dir})`, () => {
    for (const id of PROFILES) {
      // the real family profile selects Berghotel rooms; on the test case use it without the subset
      const real = loadProfile(join(ROOT, `config/profiles/${id}.yaml`));
      const profile = dir.endsWith('_test')
        ? { ...real, include: { exclude_facts: [], exclude_sources: [] } }
        : real;

      test(`${id}: days 1 to 24, from the raw case (as stored) and from the rendered one`, () => {
        for (const c of [res.data, renameCase(res.data, {})]) {
          const ctx = makeCtx(applyProfile(c, profile), profile, scoring);
          for (let day = 1; day <= 24; day++) {
            const paper = generateNewspaper(
              ctx,
              day,
              [
                { playerId: 'p1', name: 'Mia', room: ctx.c.rooms.rooms[0]!.id, points: 12 },
                { playerId: 'p2', name: 'Tom', room: ctx.c.rooms.rooms[0]!.id, points: 7 },
                { playerId: 'p3', name: 'Lena', room: null, points: 0 },
              ],
              [{ title: 'Erste Spur', player: 'Mia' }],
              ['Tom'],
            );
            const bad = strings(paper).filter((t) => t.includes('{'));
            expect(bad, `day ${day}`).toEqual([]);
          }
        }
      });
    }
  });
}

describe('a paper stored with placeholders is rendered when it is read', () => {
  test('article, ads, rumors and filler lose their {n:..}', async () => {
    const res = loadCase(join(ROOT, 'cases/_test'));
    if (!res.ok) throw new Error(res.errors.join('\n'));
    const profile = loadProfile(join(ROOT, 'config/profiles/friends.yaml'));
    const store = new MemoryStore(
      {
        id: 'g1',
        slug: 'test',
        name: 'T',
        caseId: 'test',
        startDate: '2026-12-01',
        profile,
        scoring,
      },
      res.data,
    );
    const a = (await adminPlayers(store, { op: 'create', game_id: 'g1', player: { name: 'A' } }))
      .player!.id;
    const st = store.players.get(a)!;
    store.players.set(a, { ...st, state: { ...st.state, day: 3 } });
    const raw = '{n:anna} und {anrede:anna}';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (store as any).papers.set(2, {
      day: 2,
      articles: [{ id: 'a2_lead', title: raw, text: raw }],
      blocked_rooms: [],
      bonus_rooms: [],
      ads: [raw],
      filler: [raw],
      rumors: [raw],
      plaques: [],
      accusations: [],
      detective_of_day: null,
    });
    const r = await dispatch('newspaper', store, { slug: 'test', player_id: a, day: 2 }, DAY24);
    expect(r.status).toBe(200);
    expect(strings(r.body).filter((t) => t.includes('{'))).toEqual([]);
    expect(strings(r.body)).toContain('Anna und Anna');
  });
});
