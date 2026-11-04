import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { loadCase, loadProfile, loadScoring, type LoadedCase } from '../loader';
import { applyProfile } from '../solver/profile';
import {
  accuse,
  awardDailyPuzzle,
  awardFinds,
  awardMiniCase,
  awardPlaque,
  awardQuestion,
  bonusDay,
  canPlayDay,
  dayOf,
  endDay,
  actionsLeft,
  budgetOf,
  classOf,
  isOnTime,
  makeCtx,
  newPlayer,
  nextRooms,
  puzzleHint,
  rankOf,
  readNewspaper,
  reportCard,
  resolveAction,
  setTheory,
  solvePuzzle,
  totalPoints,
  type Action,
  type GameCtx,
  type PlayerState,
} from './index';

const ROOT = join(__dirname, '../../../..');
const res = loadCase(join(ROOT, 'cases/_test'));
if (!res.ok) throw new Error(res.errors.join('\n'));
const friends = loadProfile(join(ROOT, 'config/profiles/friends.yaml'));
const scoring = loadScoring(join(ROOT, 'config/scoring.json'));

const mk = (mutate?: (c: LoadedCase) => void, profile = friends): GameCtx => {
  const full = structuredClone(res.data);
  mutate?.(full);
  return makeCtx(applyProfile(full, profile), profile, scoring);
};
const ctx = mk();
const talkAnna: Action = { type: 'talk', npc: 'anna', topic: 'nacht' };
const at = (day: number, room: string, st = newPlayer(ctx)): PlayerState => ({ ...st, day, room });

describe('only new finds change anything', () => {
  test('empty action costs nothing', () => {
    const { state, result } = resolveAction(newPlayer(ctx), ctx, {
      type: 'talk',
      npc: 'anna',
      topic: 'wetter',
    });
    expect(result.status).toBe('empty');
    expect(state.actionsUsed).toBe(0);
    expect(state.ledger).toEqual([]);
  });

  test('new find gives points; repeat changes nothing', () => {
    const first = resolveAction(newPlayer(ctx), ctx, talkAnna);
    expect(first.result.status).toBe('found');
    expect(totalPoints(first.state)).toBe(scoring.day.played + scoring.day.find);
    const again = resolveAction(first.state, ctx, talkAnna);
    expect(again.result.status).toBe('known');
    expect(again.state).toBe(first.state);
  });

  test('talking has no limit: a second new find in a row works', () => {
    const one = resolveAction(at(3, 'halle'), ctx, talkAnna).state;
    const r = resolveAction(one, ctx, { type: 'talk', npc: 'cora', topic: 'nacht' });
    expect(r.result.status).toBe('found');
  });

  test('person who is not here today is unavailable', () => {
    const r = resolveAction(newPlayer(ctx), ctx, { type: 'talk', npc: 'ben', topic: 'nacht' });
    expect(r.result.status).toBe('unavailable');
  });

  test('blocked room by event makes sources unavailable', () => {
    const c2 = mk((c) => {
      c.events.events.find((e) => e.day === 1)!.blocked_rooms = ['halle'];
    });
    expect(resolveAction(newPlayer(c2), c2, talkAnna).result.status).toBe('empty');
  });

  test('puzzle lock: locked until solved, then opens; wrong answers are free', () => {
    const inKeller = at(2, 'keller');
    const kiste: Action = { type: 'inspect', object: 'kiste' };
    expect(resolveAction(inKeller, ctx, kiste).result.status).toBe('locked');
    const wrong = solvePuzzle(inKeller, ctx, 'p_code', '999');
    expect(wrong.correct).toBe(false);
    const right = solvePuzzle(wrong.state, ctx, 'p_code', ' 123 ');
    expect(right.correct).toBe(true);
    expect(right.state.puzzles.p_code?.attempts).toBe(2);
    expect(resolveAction(right.state, ctx, kiste).result.status).toBe('found');
  });

  test('tip ladder ends with the solution', () => {
    let st = at(2, 'keller');
    const texts: string[] = [];
    for (let i = 0; i < 3; i++) {
      const h = puzzleHint(st, ctx, 'p_code')!;
      st = h.state;
      texts.push(h.text);
    }
    expect(texts[2]).toBe('123');
  });

  test('newspaper is free and does not count as a played day', () => {
    const { state, newItems } = readNewspaper(newPlayer(ctx), ctx);
    expect(newItems.length).toBeGreaterThan(0);
    expect(state.actionsUsed).toBe(0);
    expect(state.ledger.some((l) => l.kind === 'day_played')).toBe(false);
  });
});

describe('movement', () => {
  test('an unknown room is rejected', () => {
    expect(endDay(at(3, 'halle'), ctx, 'nirgends')).toEqual({ ok: false, reason: 'bad_room' });
  });

  test('event block for tomorrow prevents entering a room', () => {
    const c2 = mk((c) => {
      c.events.events.push({ ...c.events.events[0]!, day: 4, blocked_rooms: ['keller'] });
    });
    const st = at(3, 'halle', newPlayer(c2));
    expect(nextRooms(st, c2)).not.toContain('keller');
    expect(endDay(st, c2, 'keller')).toEqual({ ok: false, reason: 'blocked' });
  });

  test('ending the day moves on in order; skipping keeps the position', () => {
    const played = resolveAction(at(3, 'halle'), ctx, talkAnna).state;
    const r = endDay(played, ctx, 'keller');
    expect(r.ok && r.state.day).toBe(4);
    expect(r.ok && r.state.room).toBe('keller');
    expect(r.ok && r.state.actionsUsed).toBe(0);
    const skip = endDay(at(3, 'halle'), ctx);
    expect(skip.ok && skip.state.room).toBe('halle');
  });

  test('free phase: every room can be chosen', () => {
    expect(nextRooms(at(3, 'halle'), ctx).sort()).toEqual(['halle', 'keller']);
  });
});

describe('days', () => {
  const start = '2026-12-01';
  test('day numbering follows Berlin midnight', () => {
    expect(dayOf(new Date('2026-11-30T23:30:00+01:00'), start)).toBe(0);
    expect(dayOf(new Date('2026-12-01T00:00:00+01:00'), start)).toBe(1);
    expect(dayOf(new Date('2026-12-24T23:59:00+01:00'), start)).toBe(24);
  });

  test('catch-up in order, never beyond today', () => {
    const now = new Date('2026-12-04T12:00:00+01:00');
    expect(canPlayDay({ ...newPlayer(ctx), day: 2 }, now, start)).toBe(true);
    expect(canPlayDay({ ...newPlayer(ctx), day: 4 }, now, start)).toBe(true);
    expect(canPlayDay({ ...newPlayer(ctx), day: 5 }, now, start)).toBe(false);
    expect(canPlayDay({ ...newPlayer(ctx), day: 25 }, now, start)).toBe(false);
  });

  test('grace until 03:00 for a day begun before midnight', () => {
    const begun = { ...newPlayer(ctx), day: 1, started: true };
    const night = new Date('2026-12-02T00:30:00+01:00');
    expect(bonusDay(begun, night, start)).toBe(1);
    expect(isOnTime(begun, night, start)).toBe(true);
    expect(bonusDay(begun, new Date('2026-12-02T03:30:00+01:00'), start)).toBe(2);
    expect(bonusDay({ ...begun, started: false }, night, start)).toBe(2);
  });

  test('catch-up players are not on time', () => {
    const late = { ...newPlayer(ctx), day: 2 };
    expect(isOnTime(late, new Date('2026-12-05T12:00:00+01:00'), start)).toBe(false);
  });
});

describe('points', () => {
  const total = (s: PlayerState) => totalPoints(s);
  const base = newPlayer(ctx);
  const right = { who: 'anna', accomplice: 'cora', when: 'w2', where: 'keller' } as const;
  const early = (st: PlayerState) => st.ledger.find((l) => l.kind === 'early_accusation')?.points;

  test('question: full, halved with tip, 0 when wrong; idempotent per day', () => {
    expect(total(awardQuestion(base, ctx, true, false))).toBe(2 + 3);
    expect(total(awardQuestion(base, ctx, true, true))).toBe(2 + 1);
    expect(total(awardQuestion(base, ctx, false, false))).toBe(2);
    const once = awardQuestion(base, ctx, true, false);
    expect(awardQuestion(once, ctx, true, false)).toEqual(once);
  });

  test('daily puzzle: full, tip, skipped', () => {
    expect(total(awardDailyPuzzle(base, ctx, true, false))).toBe(3);
    expect(total(awardDailyPuzzle(base, ctx, true, true))).toBe(1);
    expect(total(awardDailyPuzzle(base, ctx, false, false))).toBe(0);
  });

  test('finds are capped per day', () => {
    const st = awardFinds(base, ctx, ['a', 'b', 'c', 'd', 'e']);
    expect(total(st)).toBe(scoring.day.find_cap);
  });

  test('plaque and mini case are booked once', () => {
    const st = awardMiniCase(awardPlaque(awardPlaque(base, ctx, 'src_x'), ctx, 'src_x'), ctx);
    expect(total(st)).toBe(5 + 10);
  });

  test('no entry is ever negative or zero', () => {
    const st = accuse(base, ctx, { theory: {}, proof: {} }, null).state;
    expect(st.ledger.every((l) => l.points > 0)).toBe(true);
  });

  test('ranks follow the thresholds', () => {
    expect(rankOf(0, scoring)).toBe('Praktikant');
    expect(rankOf(59, scoring)).toBe('Praktikant');
    expect(rankOf(60, scoring)).toBe('Ermittler');
    expect(rankOf(500, scoring)).toBe('Meisterdetektiv');
  });

  test('report card: +5 per right category on report days only, booked once', () => {
    let st = base;
    for (const [k, v] of Object.entries(right)) st = setTheory(st, k as keyof typeof right, v);
    st = setTheory(st, 'where', 'halle');
    const r = reportCard(st, ctx, 10);
    expect(r.correct).toHaveLength(3);
    expect(total(r.state)).toBe(15);
    expect(reportCard(r.state, ctx, 10).state).toBe(r.state);
    expect(reportCard(st, ctx, 11).correct).toEqual([]);
  });

  test('accusation: finale points, proof questions, locked theory', () => {
    const proof = { pq1: ['b', 'c'], pq2: ['c'] };
    const r = accuse(base, ctx, { theory: right, proof }, null);
    expect(total(r.state)).toBe(160 + 50);
    expect(setTheory(r.state, 'who', 'ben').theory.who).toBe('anna');
    expect(accuse(r.state, ctx, { theory: right, proof }, null).state).toBe(r.state);
    const partly = accuse(base, ctx, { theory: right, proof: { pq1: ['b'], pq2: ['c'] } }, null);
    expect(partly.proofCorrect).toEqual(['pq2']);
  });

  test('early accusation bonus: 6 x (24 - day) x correct/4', () => {
    const acc = { theory: right, proof: {} };
    expect(early(accuse(base, ctx, acc, 20).state)).toBe(24);
    expect(early(accuse(base, ctx, acc, 23).state)).toBe(6);
    const half = { theory: { who: 'anna', accomplice: 'cora' }, proof: {} };
    expect(early(accuse(base, ctx, half, 20).state)).toBe(12);
    expect(early(accuse(base, ctx, acc, 19).state)).toBeUndefined();
    expect(early(accuse(base, ctx, acc, null).state)).toBeUndefined();
  });
});

describe('action budget: only examining costs, and only with a new find (D62)', () => {
  const lamp: Action = { type: 'inspect', object: 'lampe' };
  const lamp2: Action = { type: 'inspect', object: 'lampe' };

  test('budget comes from the profile, prolog days override', () => {
    expect(budgetOf(ctx, 1)).toBe(friends.actions_by_day.days[1]);
    expect(budgetOf(ctx, 20)).toBe(friends.actions_by_day.default);
  });

  test('talking and a known or empty examination cost nothing, a new find costs one', () => {
    let st = resolveAction(newPlayer(ctx), ctx, talkAnna).state;
    expect(st.actionsUsed).toBe(0);
    st = resolveAction(st, ctx, { type: 'inspect', object: 'kiste' }).state;
    expect(st.actionsUsed).toBe(0);
    const r = resolveAction(st, ctx, lamp);
    expect(r.result.status).toBe('found');
    expect(r.state.actionsUsed).toBe(1);
    expect(resolveAction(r.state, ctx, lamp2).state.actionsUsed).toBe(1);
  });

  test('without budget the examination is refused and nothing changes; talking still works', () => {
    const none = { ...newPlayer(ctx), actionsUsed: budgetOf(ctx, 1) };
    const r = resolveAction(none, ctx, lamp);
    expect(r.result.status).toBe('budget');
    expect(r.state).toBe(none);
    expect(actionsLeft(none, ctx)).toBe(0);
    expect(resolveAction(none, ctx, talkAnna).result.status).toBe('found');
  });

  test('the budget is new every day', () => {
    const used = { ...newPlayer(ctx), actionsUsed: 1 };
    const r = endDay(used, ctx, 'halle');
    expect(r.ok && r.state.actionsUsed).toBe(0);
  });

  test('classes: examinable with a find, look-only as a target, decoration without a source', () => {
    expect(classOf({ id: 'lampe' }, ctx.c)).toBe('untersuchbar');
    expect(classOf({ id: 'nichts' }, ctx.c)).toBe('deko');
    expect(classOf({ id: 'nichts', klasse: 'ansehen' }, ctx.c)).toBe('ansehen');
  });
});

describe('full run, day 1 to 24 on the test case', () => {
  test('a bot plays every day in order without breaking any invariant', () => {
    let st = newPlayer(ctx);
    const actions: Action[] = ctx.c.sources.sources.flatMap((s): Action[] => {
      if (s.kind === 'talk') return [{ type: 'talk', npc: s.npc!, topic: s.topic! }];
      if (s.kind === 'inspect') return [{ type: 'inspect', object: s.object! }];
      if (s.kind === 'hotelbook') return [{ type: 'hotelbook' }];
      return [];
    });
    for (let day = 1; day <= 24; day++) {
      expect(st.day).toBe(day);
      st = readNewspaper(st, ctx).state;
      for (const p of ctx.c.puzzles.puzzles) st = solvePuzzle(st, ctx, p.id, p.answer).state;
      for (const a of actions) st = resolveAction(st, ctx, a).state;
      const options = nextRooms(st, ctx);
      const r = endDay(st, ctx, options[day % options.length]);
      if (!r.ok) throw new Error(r.reason);
      st = r.state;
    }
    expect(st.day).toBe(25);
    expect(st.finishedDays).toHaveLength(24);
    expect(st.ledger.every((l) => l.points > 0)).toBe(true);
    const keys = st.ledger.map((l) => `${l.kind}:${l.ref}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(['f_excl_ben', 'f_lampe_an', 'f_kiste_offen'].every((f) => st.found.includes(f))).toBe(
      true,
    );
    const theory = { who: 'anna', accomplice: 'cora', when: 'w2', where: 'keller' } as const;
    expect(accuse(st, ctx, { theory, proof: {} }, null).correct).toHaveLength(4);
  });
});
