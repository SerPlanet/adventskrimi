import { join } from 'node:path';
import { beforeEach, describe, expect, test } from 'vitest';
import { loadCase, loadProfile, loadScoring } from '../loader';
import { generateDaily } from '../puzzles';
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

describe('idempotency and costs (talking is free)', () => {
  test('same request_id twice changes nothing and replays the answer', async () => {
    const body = { slug: 'test', player_id: a, request_id: rid(), action: talk };
    const first = await call('act', body);
    const again = await call('act', body);
    expect(again.body).toEqual(first.body);
    expect(bodyOf(again).state.actions.used).toBe(0);
    expect(bodyOf(again).state.points).toBe(bodyOf(first).state.points);
  });

  test('repeating the action with a new request_id is known and free', async () => {
    await call('act', { slug: 'test', player_id: a, request_id: rid(), action: talk });
    const r = await call('act', { slug: 'test', player_id: a, request_id: rid(), action: talk });
    expect(bodyOf(r).result.status).toBe('known');
    expect(bodyOf(r).state.actions.used).toBe(0);
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
  test('after end_day the page keeps the state "day over" until the next calendar day', async () => {
    expect(bodyOf(await call('state', { slug: 'test', player_id: a })).state.day_over).toBe(false);
    await call('end_day', { slug: 'test', player_id: a, request_id: rid() });
    const v = bodyOf(await call('state', { slug: 'test', player_id: a })).state;
    expect(v.day_over).toBe(true);
    expect(v.can_play).toBe(false);
    expect(typeof v.narrative).toBe('string');
    expect('puzzles' in v).toBe(false);
  });

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
    // day 2 is guided: the corridor leads into the hall, there is no other choice
    expect(
      (
        await call('end_day', {
          slug: 'test',
          player_id: a,
          request_id: rid(),
          next_room: 'keller',
        })
      ).status,
    ).toBe(400);
    const r = await call('end_day', { slug: 'test', player_id: a, request_id: rid() });
    expect(bodyOf(r).state.day).toBe(2);
    expect(bodyOf(r).state.room.id).toBe('halle');
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

describe('admin overview (WP11)', () => {
  test('counts and flags only: no theory, no find text, no solution; regen forgets a stored paper', async () => {
    await call('set_theory', { slug: 'test', player_id: a, theory: { who: 'anna' } });
    await call('act', { slug: 'test', player_id: a, request_id: rid(), action: talk });
    const o = (await adminPlayers(store, { op: 'overview', game_id: 'g1' }, DAY3)) as unknown as {
      today: number;
      players: { name: string }[];
    };
    expect(o.today).toBe(3);
    const row = o.players.find((p) => p.name === 'Anna-Spielerin')!;
    expect(row).toMatchObject({ finds: 1, accused: false, days_finished: 0 });
    const json = JSON.stringify(o);
    expect(json).not.toContain('"theory"');
    expect(json).not.toMatch(/solution|Ben ist als Dieb/);
    expect(
      ((await adminPlayers(store, { op: 'games' })) as { games: unknown[] }).games,
    ).toHaveLength(1);
    await call('newspaper', { slug: 'test', player_id: a, day: 1 });
    expect(await adminPlayers(store, { op: 'regen_paper', game_id: 'g1', day: 1 })).toEqual({
      regenerated: 1,
    });
  });
});

describe('newspaper and scoreboard', () => {
  test('two simultaneous first requests produce one newspaper', async () => {
    // both players are on day 2 (the issue of day 2 is readable from there)
    for (const id of [a, b]) {
      const st = store.players.get(id)!;
      store.players.set(id, { ...st, state: { ...st.state, day: 2 } });
    }
    const [x, y] = await Promise.all([
      call('newspaper', { slug: 'test', player_id: a, day: 2 }, DAY3),
      call('newspaper', { slug: 'test', player_id: b, day: 2 }, DAY3),
    ]);
    expect(x.status).toBe(200);
    expect(bodyOf(x).newspaper).toEqual(bodyOf(y).newspaper);
    expect(bodyOf(x).newspaper.articles[0].title).toBe('Der Keller ist kalt');
  });

  test('future newspapers are refused', async () => {
    const r = await call('newspaper', { slug: 'test', player_id: a, day: 2 }, DAY1);
    expect(r.status).toBe(403);
  });

  test('nobody reads ahead of their own game: min(today, own day), earlier issues always', async () => {
    const DAY24 = new Date('2026-12-24T12:00:00+01:00');
    // a is on day 1 although the calendar says day 24
    for (const day of [2, 3, 24]) {
      const r = await call('newspaper', { slug: 'test', player_id: a, day }, DAY24);
      expect(r.status).toBe(403);
    }
    expect((await call('newspaper', { slug: 'test', player_id: a, day: 1 }, DAY24)).status).toBe(
      200,
    );
    expect(
      bodyOf(await call('state', { slug: 'test', player_id: a }, DAY24)).state.newspaper_days,
    ).toBe(1);
    // and with the calendar behind the player the calendar wins
    expect((await call('newspaper', { slug: 'test', player_id: a, day: 2 }, DAY1)).status).toBe(
      403,
    );
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

describe('puzzle of the day', () => {
  const daily = (player: string, body: object) =>
    call('daily_puzzle', { slug: 'test', player_id: player, request_id: rid(), ...body });
  // level "medium" is the default; day 1 is a sudoku
  const answer = () => generateDaily('test', 1, 'medium').answer;
  const puzzleOf = (state: { daily_puzzles: { day: number }[] }, day: number) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    state.daily_puzzles.find((d) => d.day === day) as any;

  test('the state offers the puzzle without answer or solution', async () => {
    const s = bodyOf(await call('state', { slug: 'test', player_id: a })).state;
    const p = puzzleOf(s, 1);
    expect(p.kind).toBe('sudoku');
    const text = JSON.stringify(s.daily_puzzles);
    expect(text).not.toContain(answer());
    expect(text).not.toContain('solutionText');
  });

  test('wrong attempts are free, the right answer pays full points once', async () => {
    const wrong = await daily(a, { op: 'check', answer: '0000' });
    expect(bodyOf(wrong).outcome).toBe('wrong');
    expect(bodyOf(wrong).state.points).toBe(0);
    const right = await daily(a, { op: 'check', answer: answer() });
    expect(bodyOf(right).outcome).toBe('correct');
    expect(bodyOf(right).state.points).toBe(3);
    expect(bodyOf(await daily(a, { op: 'check', answer: answer() })).outcome).toBe('already_done');
  });

  test('a tip halves the points', async () => {
    const h = await daily(b, { op: 'hint' });
    expect(bodyOf(h).hint).toBeTruthy();
    expect(puzzleOf(bodyOf(h).state, 1).hints).toHaveLength(1);
    const right = await daily(b, { op: 'check', answer: answer() });
    expect(bodyOf(right).state.points).toBe(1);
  });

  test('tip ladder ends with the solution; skipping is free and final', async () => {
    await daily(a, { op: 'hint' });
    await daily(a, { op: 'hint' });
    const last = await daily(a, { op: 'hint' });
    expect(bodyOf(last).solution).toBe(true);
    expect(puzzleOf(bodyOf(last).state, 1).done).toBe(true);
    expect(bodyOf(last).state.points).toBe(0);
    expect((await daily(a, { op: 'hint' })).status).toBe(400);
    const skip = await daily(b, { op: 'skip' });
    expect(puzzleOf(bodyOf(skip).state, 1).done).toBe(true);
    expect(bodyOf(skip).state.points).toBe(0);
  });

  test('the puzzle of an earlier newspaper stays solvable and counts a share, never a minus', async () => {
    const st = store.players.get(a)!;
    store.players.set(a, { ...st, state: { ...st.state, day: 3 } });
    const view = bodyOf(await call('state', { slug: 'test', player_id: a }, DAY3)).state;
    expect(view.daily_puzzles.map((d: { day: number }) => d.day)).toEqual([1, 2, 3]);
    expect(puzzleOf(view, 1).late).toBe(true);
    expect(puzzleOf(view, 3).late).toBe(false);
    expect(view.late_percent).toBe(Math.round(scoring.newspaper_puzzle_late_factor * 100));
    const late = await call(
      'daily_puzzle',
      { slug: 'test', player_id: a, request_id: rid(), op: 'check', day: 1, answer: answer() },
      DAY3,
    );
    expect(bodyOf(late).outcome).toBe('correct');
    expect(bodyOf(late).state.points).toBe(Math.floor(3 * scoring.newspaper_puzzle_late_factor));
    // a day that has not arrived yet cannot be played
    const ahead = await call(
      'daily_puzzle',
      { slug: 'test', player_id: a, request_id: rid(), op: 'skip', day: 4 },
      DAY3,
    );
    expect(ahead.status).toBe(400);
  });

  test('same request_id twice changes nothing', async () => {
    const body = { slug: 'test', player_id: a, request_id: rid(), op: 'check', answer: answer() };
    const first = await call('daily_puzzle', body);
    const again = await call('daily_puzzle', body);
    expect(again.body).toEqual(first.body);
    expect(bodyOf(again).state.points).toBe(3);
  });
});

describe('object puzzle', () => {
  const inKeller = () => {
    const st = store.players.get(a)!;
    store.players.set(a, { ...st, state: { ...st.state, day: 2, room: 'keller' } });
  };
  const obj = (body: object) =>
    call(
      'object_puzzle',
      { slug: 'test', player_id: a, request_id: rid(), puzzle_id: 'p_code', ...body },
      DAY3,
    );

  test('the view does not list the puzzles of the room, and never the answer', async () => {
    inKeller();
    const s = bodyOf(await call('state', { slug: 'test', player_id: a }, DAY3)).state;
    expect('puzzles' in s).toBe(false);
    expect(JSON.stringify(s)).not.toContain('"answer"');
  });

  test('wrong answers cost nothing, the right one opens the lock', async () => {
    inKeller();
    const kiste = { type: 'inspect', object: 'kiste' };
    const locked = await call(
      'act',
      { slug: 'test', player_id: a, request_id: rid(), action: kiste },
      DAY3,
    );
    expect(bodyOf(locked).result.status).toBe('locked');
    expect(bodyOf(await obj({ op: 'check', answer: '999' })).correct).toBe(false);
    expect(bodyOf(await obj({ op: 'check', answer: ' 123 ' })).correct).toBe(true);
    const open = await call(
      'act',
      { slug: 'test', player_id: a, request_id: rid(), action: kiste },
      DAY3,
    );
    expect(bodyOf(open).result.status).toBe('found');
  });

  test('tip ladder gives two tips and then the solution', async () => {
    inKeller();
    const t1 = bodyOf(await obj({ op: 'hint' })).hint;
    const t2 = bodyOf(await obj({ op: 'hint' })).hint;
    const t3 = bodyOf(await obj({ op: 'hint' })).hint;
    expect([t1, t2]).not.toContain('123');
    expect(t3).toBe('123');
  });
});

describe('ranking and my points', () => {
  test('breakdown adds up to the points and never has a negative entry', async () => {
    await call('answer_daily', { slug: 'test', player_id: a, request_id: rid(), option_id: 'b' });
    await call('act', {
      slug: 'test',
      player_id: a,
      request_id: rid(),
      action: { type: 'inspect', object: 'lampe' },
    });
    const s = bodyOf(await call('state', { slug: 'test', player_id: a })).state;
    const sum = s.breakdown.reduce((n: number, b: { points: number }) => n + b.points, 0);
    expect(sum).toBe(s.points);
    expect(s.breakdown.every((b: { points: number }) => b.points > 0)).toBe(true);
    expect(s.breakdown.map((b: { kind: string }) => b.kind)).toContain('plaque');
  });

  test('the plaque collection is public in the ranking, without places or contents', async () => {
    await call('act', {
      slug: 'test',
      player_id: a,
      request_id: rid(),
      action: { type: 'inspect', object: 'lampe' },
    });
    const rows = bodyOf(await call('scoreboard', { slug: 'test', player_id: b })).rows;
    const anna = rows.find((r: { name: string }) => r.name === 'Anna-Spielerin');
    expect(anna.plaque_titles).toEqual(['Sehr aufmerksam']);
    expect(rows.find((r: { is_you: boolean }) => r.is_you).plaque_titles).toEqual([]);
  });
});

describe('guided days in the view (WP20)', () => {
  const stateOf = async (id: string) =>
    bodyOf(await call('state', { slug: 'test', player_id: id })).state;
  const setDay = (id: string, day: number) => {
    const rec = store.players.get(id)!;
    store.players.set(id, { ...rec, state: { ...rec.state, day, room: 'halle' } });
  };

  test('each player gets a corridor and only sees the things of their own way', async () => {
    setDay(a, 2);
    setDay(b, 2);
    const ids = async (id: string) =>
      (await stateOf(id)).room.objects.map((o: { id: string }) => o.id);
    const forA = await ids(a);
    const forB = await ids(b);
    expect(forA).toContain('schrank_a');
    expect(forA).not.toContain('schrank_b');
    expect(forB).toContain('schrank_b');
    expect(forB).not.toContain('schrank_a');
  });

  test('a question that is not unlocked yet is not offered, and the proof lists stay private', async () => {
    setDay(a, 2);
    const v = await stateOf(a);
    const cora = v.room.npcs.find((n: { id: string }) => n.id === 'cora');
    expect(cora.topics).toEqual([]);
    expect(JSON.stringify(v)).not.toMatch(/supports|i_halle|i_keller|corridor/);
    setDay(a, 3);
    const later = (await stateOf(a)).room.npcs.find((n: { id: string }) => n.id === 'cora');
    expect(later.topics).toHaveLength(1);
  });
});

describe('good night, role and the plan on guided days (WP21)', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stateOf = async (id: string, now = DAY1): Promise<any> =>
    bodyOf(await call('state', { slug: 'test', player_id: id }, now)).state;
  const setDay = (id: string, day: number) => {
    const rec = store.players.get(id)!;
    store.players.set(id, { ...rec, state: { ...rec.state, day, room: 'halle' } });
  };

  test('after end_day the page tells the evening, the day and what comes next', async () => {
    await call('act', { slug: 'test', player_id: a, request_id: rid(), action: talk });
    expect((await stateOf(a)).map.guided_next).toBe(true);
    await call('end_day', { slug: 'test', player_id: a, request_id: rid() });
    const v = await stateOf(a);
    expect(v.night.day).toBe(1);
    expect(v.night.talks).toBe(1);
    expect(v.night.finds).toBeGreaterThan(0);
    expect(v.night.text).toContain('Halle');
    expect(v.night.room.name).toBe('Halle');
    expect(v.can_play).toBe(false);
  });

  test('a latecomer can play the next day at once', async () => {
    await call('end_day', { slug: 'test', player_id: a, request_id: rid() }, DAY3);
    expect((await stateOf(a, DAY3)).can_play).toBe(true);
  });

  test('the role is chosen from the profile, fills the address, and is locked after day 1', async () => {
    const before = await stateOf(a);
    expect(before.role_chosen).toBe(false);
    expect(before.roles.map((r: { id: string }) => r.id)).toEqual([
      'privatdetektiv',
      'journalist',
      'polizist',
    ]);
    expect(
      (await call('settings', { slug: 'test', player_id: a, settings: { role: 'zauberer' } }))
        .status,
    ).toBe(400);
    const set = await call('settings', {
      slug: 'test',
      player_id: a,
      settings: { role: 'polizist' },
    });
    expect(bodyOf(set).state.role.name).toBe('Polizist');
    expect(bodyOf(set).state.narrative).toContain('Kommissar');
    expect(JSON.stringify(bodyOf(set).state)).not.toMatch(/\{rolle\}|\{anrede\}/);
    setDay(a, 2);
    const late = await call('settings', {
      slug: 'test',
      player_id: a,
      settings: { role: 'journalist' },
    });
    expect(late.status).toBe(403);
    expect(bodyOf(late).error).toBe('role_locked');
  });

  test('on guided days the plan and the room names show only the own way', async () => {
    setDay(a, 2);
    const v = await stateOf(a, DAY3);
    expect(v.map.rooms.map((r: { id: string }) => r.id)).toEqual(['halle']);
    expect(v.options.where.map((r: { id: string }) => r.id)).toEqual(['halle']);
    setDay(a, 3);
    const free = await stateOf(a, DAY3);
    expect(free.map.rooms).toHaveLength(2);
    expect(free.map.guided_next).toBe(false);
  });
});
