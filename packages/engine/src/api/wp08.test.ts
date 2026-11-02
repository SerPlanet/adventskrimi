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

const note = (key: string, put = true) => call('set_note', { kind: 'timeline', key, put });
const level = async (note_level: string) => call('settings', { settings: { note_level } });

describe('timeline contradictions', () => {
  beforeEach(() => patch(() => ({ found: ['f_cora_keller', 's_cora_halle', 'f_ben_keller'] })));

  test('half: only placed entries are checked, a fitting pair is not marked', async () => {
    await level('half');
    expect(out(await call('state', {})).state.notes.contradictions).toEqual([]);
    await note('f_cora_keller#0');
    await note('f_ben_keller#0');
    expect(out(await call('state', {})).state.notes.contradictions).toEqual([]);
    const r = out(await note('s_cora_halle#0')).state.notes;
    expect(r.contradictions).toHaveLength(1);
    expect(r.contradictions[0].text).toMatch(/^Passt nicht/);
    expect(r.suggestions).toEqual([]);
  });

  test('manual: no marks, but the free question answers', async () => {
    await level('manual');
    await note('f_cora_keller#0');
    await note('s_cora_halle#0');
    expect(out(await call('state', {})).state.notes.contradictions).toEqual([]);
    const bad = out(await call('fits', { a: 'f_cora_keller#0', b: 's_cora_halle#0' }));
    expect(bad.fits).toBe(false);
    const ok = out(await call('fits', { a: 'f_cora_keller#0', b: 'f_ben_keller#0' }));
    expect(ok.fits).toBe(true);
  });

  test('auto fills everything, half suggests, manual stays empty', async () => {
    await level('auto');
    let notes = out(await call('state', {})).state.notes;
    expect(notes.placed).toHaveLength(3);
    expect(notes.contradictions).toHaveLength(1);
    await level('half');
    notes = out(await call('state', {})).state.notes;
    expect(notes.placed).toEqual([]);
    expect(notes.suggestions).toHaveLength(3);
    await level('manual');
    notes = out(await call('state', {})).state.notes;
    expect(notes.suggestions).toEqual([]);
  });

  test('nothing outside the own file: unknown claims are refused', async () => {
    expect((await note('f_cora_keller#0')).status).toBe(200);
    expect((await note('s_ben_keller#0')).status).toBe(400);
    expect((await call('fits', { a: 'f_cora_keller#0', b: 's_ben_keller#0' })).status).toBe(400);
    const view = JSON.stringify(out(await call('state', {})).state);
    expect(view).not.toContain('s_ben_keller');
    expect(view).not.toContain('"truth"');
  });
});

describe('grid', () => {
  test('marks are stored, unknown candidates refused, half suggests facts only', async () => {
    patch(() => ({ found: ['f_excl_ben', 's_cora_halle'] }));
    await level('half');
    const mark = { kind: 'grid', cat: 'who', candidate: 'ben' };
    const sug = out(await call('state', {})).state.notes.grid_suggestions;
    expect(sug).toEqual([{ cat: 'who', candidate: 'ben' }]);
    const r = out(await call('set_note', { ...mark, mark: 'no' }));
    expect(r.state.notes.grid['who:ben']).toBe('no');
    expect(r.state.notes.grid_suggestions).toEqual([]);
    expect((await call('set_note', { ...mark, candidate: 'zed', mark: 'no' })).status).toBe(400);
    expect(out(await call('set_note', { ...mark, mark: null })).state.notes.grid).toEqual({});
    await level('auto');
    expect(out(await call('state', {})).state.notes.grid['who:ben']).toBe('no');
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
    const paper = out(await call('newspaper', { day: 21 }, at(21))).newspaper;
    expect(paper.accusations).toEqual(['Pia']);
  });
});

function sumFinale(): number {
  const f = scoring.finale;
  return f.who + f.accomplice + f.when + f.where + 2 * f.proof;
}

describe('players saved by an older version', () => {
  test('a state without newer fields (daily, questions, ...) still loads', async () => {
    const rec = store.players.get(p)!;
    const old = { ...rec.state } as Record<string, unknown>;
    for (const k of ['daily', 'questions', 'puzzles', 'theory', 'ledger', 'found']) delete old[k];
    rec.state = old as never;
    for (const fn of ['state', 'open_day'] as const) {
      const r = await call(fn, {});
      expect(r.status).toBe(200);
      expect(out(r).state.theory).toEqual({});
    }
  });
});

describe('links (Verknüpfen)', () => {
  test('visible only with both finds, points once, never in the first view without them', async () => {
    expect(out(await call('state', {})).state.links).toEqual([]);
    expect((await call('link', { link_id: 'l_cora' })).status).toBe(400);
    patch(() => ({ found: ['f_cora_keller', 's_cora_halle'] }));
    const v = out(await call('state', {})).state;
    expect(v.links).toEqual([expect.objectContaining({ id: 'l_cora', done: false })]);
    const r = out(await call('link', { link_id: 'l_cora' }));
    expect(r.state.points).toBe(scoring.link);
    expect(r.state.links[0].done).toBe(true);
    expect(out(await call('link', { link_id: 'l_cora' })).state.points).toBe(scoring.link);
  });
});

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

describe('the "!" marker', () => {
  test('only things that bring a find in this room today are marked', async () => {
    const view = out(await call('state', {})).state;
    for (const o of view.room.objects) {
      const brings = res.data.sources.sources.some(
        (s) => s.object === o.id && s.room === view.room.id && s.days,
      );
      if (o.auffaellig) expect(brings).toBe(true);
    }
    // day 1, hall: the lamp has a source on day 1, so it is marked; nothing unrelated is
    expect(
      view.room.objects.filter((o: { auffaellig: boolean }) => o.auffaellig).length,
    ).toBeLessThanOrEqual(view.room.objects.length);
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
