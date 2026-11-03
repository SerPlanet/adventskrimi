/* eslint-disable @typescript-eslint/no-explicit-any */
import { join } from 'node:path';
import { beforeEach, describe, expect, test } from 'vitest';
import { loadCase, loadProfile, loadScoring } from '../loader';
import { adminPlayers, dispatch, MemoryStore, type HandlerName } from './index';

const ROOT = join(__dirname, '../../../..');
const res = loadCase(join(ROOT, 'cases/_test'));
if (!res.ok) throw new Error(res.errors.join('\n'));
const profile = loadProfile(join(ROOT, 'config/profiles/friends.yaml'));
const scoring = loadScoring(join(ROOT, 'config/scoring.json'));

const at = (day: number) => new Date(`2026-12-${String(day).padStart(2, '0')}T12:00:00+01:00`);
const right = { who: 'anna', accomplice: 'cora', when: 'w2', where: 'keller' };
const proof = { pq1: ['b', 'c'], pq2: ['c'] };

let store: MemoryStore;
let p: string;
let n = 0;
const call = (name: HandlerName, body: object, now = at(1)) =>
  dispatch(
    name,
    store,
    { slug: 'test', player_id: p, request_id: `req-${String(++n).padStart(6, '0')}`, ...body },
    now,
  );
const out = (r: { body: unknown }): any => r.body;
const patch = (f: (s: any) => object) => {
  const rec = store.players.get(p)!;
  rec.state = { ...rec.state, ...f(rec.state) };
};

beforeEach(async () => {
  store = new MemoryStore(
    {
      id: 'g1',
      slug: 'test',
      name: 'Test',
      caseId: 'test',
      startDate: '2026-12-01',
      profile,
      scoring,
    },
    res.data,
  );
  p = (await adminPlayers(store, { op: 'create', game_id: 'g1', player: { name: 'Pia' } })).player!
    .id;
});

describe('timeline table (02c §8)', () => {
  const cell = (window: string, room: string, persons: string[]) =>
    call('set_note', { kind: 'cell', window, room, persons });

  test('several people per cell, stored as entered, cleared with an empty list', async () => {
    const r = out(await cell('w1', 'halle', ['anna', 'cora']));
    expect(r.state.notes.table['w1|halle']).toEqual(['anna', 'cora']);
    expect(out(await cell('w1', 'halle', ['anna', 'anna'])).state.notes.table['w1|halle']).toEqual([
      'anna',
    ]);
    expect(out(await cell('w1', 'halle', [])).state.notes.table).toEqual({});
  });

  test('nothing is checked, marked or filled in: only what the player entered', async () => {
    patch(() => ({ found: ['f_cora_keller', 's_cora_halle', 'f_ben_keller'] }));
    const notes = out(await call('state', {})).state.notes;
    expect(notes).toEqual({ grid: {}, table: {} });
    await cell('w1', 'keller', ['cora']);
    await cell('w1', 'halle', ['cora']);
    const v = out(await call('state', {})).state;
    expect(Object.keys(v.notes).sort()).toEqual(['grid', 'table']);
    expect(JSON.stringify(v)).not.toMatch(/Passt nicht|contradiction|suggest/);
  });

  test('unknown window, room or person is refused', async () => {
    expect((await cell('w9', 'halle', [])).status).toBe(400);
    expect((await cell('w1', 'nirgends', [])).status).toBe(400);
    expect((await cell('w1', 'halle', ['niemand'])).status).toBe(400);
  });
});

describe('grid', () => {
  test('marks are stored and unknown candidates refused; nothing is suggested or filled in', async () => {
    patch(() => ({ found: ['f_excl_ben', 's_cora_halle'] }));
    const mark = { kind: 'grid', cat: 'who', candidate: 'ben' };
    expect(out(await call('state', {})).state.notes.grid).toEqual({});
    const r = out(await call('set_note', { ...mark, mark: 'no' }));
    expect(r.state.notes.grid['who:ben']).toBe('no');
    expect((await call('set_note', { ...mark, candidate: 'zed', mark: 'no' })).status).toBe(400);
    expect(out(await call('set_note', { ...mark, mark: null })).state.notes.grid).toEqual({});
  });
});

describe('the dossier (02c §7)', () => {
  test('a find the player has can be filed and taken out again; unknown ones are refused', async () => {
    patch(() => ({
      found: ['f_excl_ben'],
      discoveries: [{ sourceId: 'src_anna', itemIds: ['f_excl_ben'], day: 1 }],
    }));
    expect(out(await call('state', {})).state.filed).toEqual([]);
    expect((await call('file_add', { kind: 'find', id: 's_cora_halle' })).status).toBe(400);
    const r = out(await call('file_add', { kind: 'find', id: 'f_excl_ben' }));
    expect(r.state.filed).toEqual([{ kind: 'find', ref: 'f_excl_ben', day: 1 }]);
    expect(
      out(await call('file_add', { kind: 'find', id: 'f_excl_ben' })).state.filed,
    ).toHaveLength(1);
    expect(out(await call('file_remove', { kind: 'find', id: 'f_excl_ben' })).state.filed).toEqual(
      [],
    );
    // history stays: the find is still the player's
    expect(out(await call('state', {})).state.finds).toHaveLength(1);
  });

  test('an article of a readable paper can be filed with its text, a future one not', async () => {
    const paper = out(await call('newspaper', { day: 1 })).newspaper;
    const art = paper.articles[0];
    const r = out(await call('file_add', { kind: 'article', day: 1, id: art.id }));
    expect(r.state.filed).toEqual([
      { kind: 'article', ref: art.id, day: 1, title: art.title, text: art.text },
    ]);
    expect((await call('file_add', { kind: 'article', day: 2, id: 'a2_lead' })).status).toBe(403);
    expect((await call('file_add', { kind: 'article', day: 1, id: 'a1_nope' })).status).toBe(400);
  });

  test('nothing is filed by itself: finding things leaves the dossier empty', async () => {
    await call('act', { action: { type: 'talk', npc: 'anna', topic: 'nacht' } });
    expect(out(await call('state', {})).state.filed).toEqual([]);
  });
});

describe('theory', () => {
  test('saved with history, invalid ids refused', async () => {
    expect((await call('set_theory', { theory: { who: 'zed' } })).status).toBe(400);
    await call('set_theory', { theory: { who: 'anna' } });
    await call('set_theory', { theory: { who: 'anna' } });
    await call('set_theory', { theory: { who: 'ben', where: 'keller' } });
    const t = out(await call('get_theory', {}));
    expect(t.theory).toEqual({ who: 'ben', where: 'keller' });
    expect(t.history).toHaveLength(2);
  });
});

describe('report card', () => {
  test('booked once at the end of day 10 from the theory of that moment', async () => {
    patch(() => ({ day: 10, theory: { who: 'anna', where: 'halle' } }));
    const r = out(await call('end_day', {}, at(10)));
    expect(r.state.points).toBe(5);
    expect(r.state.reports).toEqual([{ day: 10, right: 1, sentence: expect.any(String) }]);
    const day9 = (
      await adminPlayers(store, { op: 'create', game_id: 'g1', player: { name: 'Quinn' } })
    ).player!.id;
    store.players.get(day9)!.state.day = 9;
    const early = await dispatch(
      'end_day',
      store,
      { slug: 'test', player_id: day9, request_id: 'req-other-1' },
      at(10),
    );
    expect(out(early).state.reports).toEqual([]);
  });
});

describe('accusation and resolution', () => {
  test('refused before day 20', async () => {
    patch(() => ({ day: 19 }));
    expect((await call('accuse', { theory: right, proof }, at(20))).status).toBe(403);
  });

  test('early bonus on time, final, no resolution before day 24', async () => {
    patch(() => ({ day: 20 }));
    const r = out(await call('accuse', { theory: right, proof }, at(20)));
    expect(r.state.accusation.done).toBe(true);
    expect(r.state.story).toBeNull();
    const kinds = r.state.breakdown.map((b: any) => [b.kind, b.points]);
    expect(kinds).toContainEqual(['early_accusation', 24]);
    expect(r.state.points).toBe(24 + 4 * 0 + sumFinale());
    expect((await call('accuse', { theory: right, proof }, at(20))).status).toBe(409);
    expect((await call('set_theory', { theory: { who: 'ben' } }, at(20))).status).toBe(409);
    const late = out(await call('state', {}, at(24)));
    expect(late.state.story.chapters.length).toBeGreaterThan(0);
    expect(late.state.story.solution.every((s: any) => s.right)).toBe(true);
  });

  test('catch-up players get no early bonus; points are never doubled', async () => {
    patch(() => ({ day: 20 }));
    const r = out(await call('accuse', { theory: right, proof }, at(23)));
    expect(r.state.breakdown.map((b: any) => b.kind)).not.toContain('early_accusation');
    const before = r.state.points;
    const again = await call('accuse', { theory: right, proof }, at(23));
    expect(again.status).toBe(409);
    expect(out(await call('state', {}, at(23))).state.points).toBe(before);
  });

  test('the solution never reaches the client before the conditions are met', async () => {
    patch(() => ({ day: 20 }));
    const view = out(await call('state', {}, at(24))).state;
    expect(view.accusation.can).toBe(true);
    expect(view.story).toBeNull();
    expect(JSON.stringify(view)).not.toContain('"correct"');
    expect(JSON.stringify(view)).not.toContain('Cora lenkt');
  });

  test('the newspaper names the accuser, nothing else', async () => {
    patch(() => ({ day: 20 }));
    await call('accuse', { theory: right, proof }, at(20));
    // the next morning: the accuser has reached day 21 and may read its issue
    patch(() => ({ day: 21 }));
    const paper = out(await call('newspaper', { day: 21 }, at(21))).newspaper;
    expect(paper.accusations).toEqual(['Pia']);
  });
});

function sumFinale(): number {
  const f = scoring.finale;
  return f.who + f.accomplice + f.when + f.where + 2 * f.proof;
}

describe('visible texts', () => {
  test('no placeholder braces reach the player, not even in the prolog or page texts', async () => {
    const state = out(await call('state', {})).state;
    const json = JSON.stringify(state);
    const strings: string[] = [];
    JSON.parse(json, (_k, v) => (typeof v === 'string' ? strings.push(v) : v));
    expect(strings.filter((t) => /[{}]/.test(t))).toEqual([]);
    expect(json).toContain('Sprich mit Anna');
    expect(json).not.toContain('{n:');
    expect(json.toLowerCase()).not.toContain('aktion');
  });
});

describe('classes of things and the action budget in the view', () => {
  test('things carry a class, never a "!" marker, and the view shows the budget', async () => {
    const view = out(await call('state', {})).state;
    expect(JSON.stringify(view)).not.toContain('auffaellig');
    const klasse = Object.fromEntries(
      view.room.objects.map((o: { id: string; klasse: string }) => [o.id, o.klasse]),
    );
    expect(klasse.lampe).toBe('untersuchbar');
    expect(
      Object.values(klasse).every((k) => ['deko', 'ansehen', 'untersuchbar'].includes(k as string)),
    ).toBe(true);
    expect(view.actions).toEqual({ used: 0, budget: 1 });
  });
});

describe('documents (Einstecken)', () => {
  test('only found documents can be pocketed; the full text stays readable', async () => {
    expect((await call('pocket', { source_id: 'src_kiste' })).status).toBe(400);
    patch((s: { discoveries: unknown[] }) => ({
      found: ['f_kiste_offen', 'f_ben_keller'],
      discoveries: [
        ...s.discoveries,
        { sourceId: 'src_kiste', itemIds: ['f_kiste_offen', 'f_ben_keller'], day: 2 },
      ],
    }));
    expect(out(await call('state', {})).state.documents).toEqual([]);
    const r = out(await call('pocket', { source_id: 'src_kiste' }));
    expect(r.state.documents).toHaveLength(1);
    expect(r.state.documents[0].note.text).toMatch(/Keller/);
    expect(out(await call('pocket', { source_id: 'src_kiste' })).state.documents).toHaveLength(1);
  });
});
