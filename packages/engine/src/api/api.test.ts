import { join } from 'node:path';
import { beforeEach, describe, expect, test } from 'vitest';
import { loadCase, loadProfile, loadScoring } from '../loader';
import {
  adminPlayers,
  ApiError,
  dispatch,
  lobby,
  MemoryStore,
  resolveNow,
  type HandlerName,
} from './index';

const ROOT = join(__dirname, '../../../..');
const res = loadCase(join(ROOT, 'cases/_test'));
if (!res.ok) throw new Error(res.errors.join('\n'));
const profile = loadProfile(join(ROOT, 'config/profiles/friends.yaml'));
const scoring = loadScoring(join(ROOT, 'config/scoring.json'));

const DAY1 = new Date('2026-12-01T12:00:00+01:00');
const DAY3 = new Date('2026-12-03T12:00:00+01:00');
const before = new Date('2026-11-30T12:00:00+01:00');

let store: MemoryStore;
let a: string;
let b: string;
let n = 0;
const rid = () => `req-${String(++n).padStart(6, '0')}`;
const call = (name: HandlerName, body: object, now = DAY1) => dispatch(name, store, body, now);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const bodyOf = (r: { body: unknown }): any => r.body;

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
  const mk = async (name: string) => {
    const r = await adminPlayers(store, { op: 'create', game_id: 'g1', player: { name } });
    return r.player!.id;
  };
  a = await mk('Anna-Spielerin');
  b = await mk('Ben-Spieler');
});

const talk = { type: 'talk', npc: 'anna', topic: 'nacht' };

describe('safe views', () => {
  test('a fresh state shows nothing locked, no solution, no truth flags', async () => {
    const r = await call('state', { slug: 'test', player_id: a });
    expect(r.status).toBe(200);
    const text = JSON.stringify(r.body);
    for (const secret of [
      'solution',
      'truth',
      'world',
      'Ben ist als Dieb',
      'f_excl_ben',
      '"answer"',
      '123',
    ]) {
      expect(text).not.toContain(secret);
    }
    expect(bodyOf(r).state.finds).toEqual([]);
    expect(bodyOf(r).state.room.npcs.map((x: { id: string }) => x.id)).toContain('anna');
  });

  test('found statements carry no truth flag; facts show their text only after being found', async () => {
    await call('act', { slug: 'test', player_id: a, request_id: rid(), action: talk });
    const s = bodyOf(await call('state', { slug: 'test', player_id: a })).state;
    expect(s.finds.map((f: { id: string }) => f.id)).toEqual(['f_excl_ben']);
    expect(JSON.stringify(s)).not.toContain('truth');
  });
});

describe('idempotency and costs', () => {
  test('same request_id twice changes nothing and replays the answer', async () => {
    const body = { slug: 'test', player_id: a, request_id: rid(), action: talk };
    const first = await call('act', body);
    const again = await call('act', body);
    expect(again.body).toEqual(first.body);
    expect(bodyOf(again).state.actions.used).toBe(1);
    expect(bodyOf(again).state.points).toBe(bodyOf(first).state.points);
  });

  test('repeating the action with a new request_id is known and free', async () => {
    await call('act', { slug: 'test', player_id: a, request_id: rid(), action: talk });
    const r = await call('act', { slug: 'test', player_id: a, request_id: rid(), action: talk });
    expect(bodyOf(r).result.status).toBe('known');
    expect(bodyOf(r).state.actions.used).toBe(1);
  });

  test('empty action and foreign room cost nothing', async () => {
    const empty = await call('act', {
      slug: 'test',
      player_id: a,
      request_id: rid(),
      action: { type: 'talk', npc: 'anna', topic: 'wetter' },
    });
    expect(bodyOf(empty).result.status).toBe('empty');
    const away = await call('act', {
      slug: 'test',
      player_id: a,
      request_id: rid(),
      action: { type: 'talk', npc: 'ben', topic: 'nacht' },
    });
    expect(bodyOf(away).result.status).toBe('unavailable');
    expect(bodyOf(away).state.actions.used).toBe(0);
  });

  test('a foreign day is refused: before the start and beyond today', async () => {
    const early = await call(
      'act',
      { slug: 'test', player_id: a, request_id: rid(), action: talk },
      before,
    );
    expect(early.status).toBe(403);
    const st = store.players.get(a)!;
    store.players.set(a, { ...st, state: { ...st.state, day: 4 } });
    const ahead = await call(
      'act',
      { slug: 'test', player_id: a, request_id: rid(), action: talk },
      DAY3,
    );
    expect(ahead.status).toBe(403);
    expect(bodyOf(ahead).error).toBe('day_not_available');
  });

  test('unknown player and malformed requests', async () => {
    expect((await call('state', { slug: 'test', player_id: 'nobody' })).status).toBe(404);
    expect(
      (await call('act', { slug: 'test', player_id: a, request_id: 'x', action: { type: 'fly' } }))
        .status,
    ).toBe(400);
    expect(
      (await call('settings', { slug: 'test', player_id: a, settings: { is_admin: true } })).status,
    ).toBe(400);
  });
});

describe('days, rooms, question of the day', () => {
  test('end_day moves to a neighbour in order; a bad room is rejected', async () => {
    expect(
      (
        await call('end_day', {
          slug: 'test',
          player_id: a,
          request_id: rid(),
          next_room: 'nirgends',
        })
      ).status,
    ).toBe(400);
    const r = await call('end_day', {
      slug: 'test',
      player_id: a,
      request_id: rid(),
      next_room: 'keller',
    });
    expect(bodyOf(r).state.day).toBe(2);
    expect(bodyOf(r).state.room.id).toBe('keller');
    // day 2 has not arrived on day 1
    const early = await call('act', {
      slug: 'test',
      player_id: a,
      request_id: rid(),
      action: talk,
    });
    expect(early.status).toBe(403);
  });

  test('question: right answer pays once, tip halves, wrong never costs points', async () => {
    const right = await call('answer_daily', {
      slug: 'test',
      player_id: a,
      request_id: rid(),
      option_id: 'b',
    });
    expect(bodyOf(right).outcome.status).toBe('correct');
    expect(bodyOf(right).state.points).toBe(2 + 3);
    const hinted = await call('answer_daily', {
      slug: 'test',
      player_id: b,
      request_id: rid(),
      hint: true,
    });
    expect(bodyOf(hinted).hint).toBeTruthy();
    const ok = await call('answer_daily', {
      slug: 'test',
      player_id: b,
      request_id: rid(),
      option_id: 'b',
    });
    expect(bodyOf(ok).state.points).toBe(2 + 1);
    const wrong = await call('answer_daily', {
      slug: 'test',
      player_id: a,
      request_id: rid(),
      option_id: 'a',
    });
    expect(bodyOf(wrong).outcome.status).toBe('already_done');
  });
});

describe('first discoverer', () => {
  const lampe = { type: 'inspect', object: 'lampe' };
  test('only the first on-time player gets the plaque', async () => {
    const first = await call('act', {
      slug: 'test',
      player_id: a,
      request_id: rid(),
      action: lampe,
    });
    expect(bodyOf(first).plaque).toBe('Sehr aufmerksam');
    const second = await call('act', {
      slug: 'test',
      player_id: b,
      request_id: rid(),
      action: lampe,
    });
    expect(bodyOf(second).plaque).toBeNull();
    expect(bodyOf(first).state.points).toBe(bodyOf(second).state.points + 5);
  });

  test('catch-up players get no plaque', async () => {
    const r = await call(
      'act',
      { slug: 'test', player_id: a, request_id: rid(), action: lampe },
      DAY3,
    );
    expect(bodyOf(r).result.status).toBe('found');
    expect(bodyOf(r).plaque).toBeNull();
  });
});

describe('newspaper and scoreboard', () => {
  test('two simultaneous first requests produce one newspaper', async () => {
    const [x, y] = await Promise.all([
      call('newspaper', { slug: 'test', player_id: a, day: 2 }, DAY3),
      call('newspaper', { slug: 'test', player_id: b, day: 2 }, DAY3),
    ]);
    expect(x.status).toBe(200);
    expect(bodyOf(x).newspaper).toEqual(bodyOf(y).newspaper);
    expect(bodyOf(x).newspaper.headline).toBe('Der Keller ist kalt');
  });

  test('future newspapers are refused', async () => {
    const r = await call('newspaper', { slug: 'test', player_id: a, day: 2 }, DAY1);
    expect(r.status).toBe(403);
  });

  test('scoreboard ranks by points and marks the caller', async () => {
    await call('act', { slug: 'test', player_id: b, request_id: rid(), action: talk });
    const r = bodyOf(await call('scoreboard', { slug: 'test', player_id: a }));
    expect(r.rows[0].name).toBe('Ben-Spieler');
    expect(r.rows.find((x: { is_you: boolean }) => x.is_you).name).toBe('Anna-Spielerin');
    expect(r.rows[0].rank).toBeTruthy();
  });
});

describe('clock override', () => {
  const real = new Date('2026-12-05T10:00:00Z');
  test('staging accepts an override, prod refuses it', () => {
    expect(
      resolveNow({ appEnv: 'staging', override: '2026-12-10T10:00:00Z' }, null, real).toISOString(),
    ).toBe('2026-12-10T10:00:00.000Z');
    expect(resolveNow({ appEnv: 'staging' }, '2026-12-11T10:00:00Z', real).getUTCDate()).toBe(11);
    expect(() =>
      resolveNow({ appEnv: 'prod', override: '2026-12-10T10:00:00Z' }, null, real),
    ).toThrow();
    expect(() => resolveNow({ appEnv: 'prod' }, '2026-12-10T10:00:00Z', real)).toThrow();
    expect(() => resolveNow({}, '2026-12-10T10:00:00Z', real)).toThrow();
    expect(resolveNow({ appEnv: 'prod' }, null, real)).toBe(real);
  });
});

describe('admin', () => {
  test('create, list and update players', async () => {
    const list = await adminPlayers(store, { op: 'list', game_id: 'g1' });
    expect(list.players!.map((p) => p.name)).toEqual(['Anna-Spielerin', 'Ben-Spieler']);
    const up = await adminPlayers(store, {
      op: 'update',
      slug: 'test',
      player_id: a,
      player: { name: 'Neu', is_duo: true },
    });
    expect(up.player).toMatchObject({ name: 'Neu', is_duo: true });
    await expect(
      adminPlayers(store, { op: 'update', player_id: 'x', player: {} }),
    ).rejects.toThrow();
  });
});

describe('game by link slug', () => {
  test('a request with another game slug is refused like an unknown player', async () => {
    const r = await call('state', { slug: 'other-game', player_id: a });
    expect(r.status).toBe(404);
    expect(bodyOf(r).error).toBe('player_not_found');
  });

  test('a missing or malformed slug is a bad request', async () => {
    expect((await call('state', { player_id: a })).status).toBe(400);
    expect((await call('state', { slug: 'Bad Slug!', player_id: a })).status).toBe(400);
  });

  test('lobby shows the name tiles of that game only; unknown slug is 404', async () => {
    const out = await lobby(store, { slug: 'test' });
    expect(out.players.map((p) => p.name)).toEqual(['Anna-Spielerin', 'Ben-Spieler']);
    expect(JSON.stringify(out)).not.toContain('state');
    await expect(lobby(store, { slug: 'nope' })).rejects.toBeInstanceOf(ApiError);
  });
});
