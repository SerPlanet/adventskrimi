import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { loadCase, loadProfile, loadScoring, type LoadedCase } from '../loader';
import { applyProfile } from '../solver';
import {
  awardDailyPuzzle,
  endDay,
  existsFor,
  makeCtx,
  newPlayer,
  nextRooms,
  resolveAction,
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
const mk = (mutate?: (c: LoadedCase) => void): GameCtx => {
  const full = structuredClone(res.data);
  mutate?.(full);
  return makeCtx(applyProfile(full, friends), friends, scoring);
};
const ctx = mk();
const at = (day: number, room: string, corridor: string, c = ctx): PlayerState => ({
  ...newPlayer(c),
  day,
  room,
  corridor,
});
const inspect = (object: string): Action => ({ type: 'inspect', object });
const status = (st: PlayerState, a: Action, c = ctx) => resolveAction(st, c, a).result.status;

describe('corridors and guided days (WP20 §2)', () => {
  test('players get the corridors round robin, so any number of players needs no more rooms', () => {
    const ids = [0, 1, 2, 3, 19].map((n) => newPlayer(ctx, n).corridor);
    expect(ids).toEqual(['a', 'b', 'a', 'b', 'b']);
  });

  test('a case without routes has no corridor and no guided day', () => {
    const c = mk((x) => (x.routes.corridors = []));
    expect(newPlayer(c).corridor).toBeUndefined();
    expect(nextRooms({ ...newPlayer(c), day: 1 }, c).sort()).toEqual(['halle', 'keller']);
  });

  test('on a guided day the corridor leads the way and the player cannot choose', () => {
    const st = newPlayer(ctx);
    expect(nextRooms(st, ctx)).toEqual(['halle']);
    expect(endDay(st, ctx, 'keller')).toEqual({ ok: false, reason: 'too_far' });
    const r = endDay(st, ctx);
    expect(r.ok && [r.state.day, r.state.room]).toEqual([2, 'halle']);
  });

  test('a corridor leads to its own room on its guided day', () => {
    const c = mk((x) => {
      x.routes.corridors = [
        { id: 'a', route: { 2: 'halle' } },
        { id: 'b', route: { 2: 'keller' } },
      ];
    });
    const r = endDay({ ...newPlayer(c), corridor: 'b' }, c);
    expect(r.ok && r.state.room).toBe('keller');
  });

  test('things of another corridor do not exist on guided days, but do in the free phase', () => {
    const a2 = at(2, 'halle', 'a');
    expect(status(a2, inspect('schrank_b'))).toBe('empty');
    expect(status(a2, inspect('schrank_a'))).toBe('found');
    expect(status(at(2, 'halle', 'b'), inspect('schrank_a'))).toBe('empty');
    expect(status(at(3, 'halle', 'a'), inspect('schrank_b'))).toBe('found');
  });

  test('a state from before WP20 without a corridor uses the first one', () => {
    const old = { ...at(2, 'halle', 'a'), corridor: undefined };
    expect(status(old, inspect('schrank_a'))).toBe('found');
    expect(status(old, inspect('schrank_b'))).toBe('empty');
  });
});

describe('unlock: a thing or question does not exist until it holds (WP20)', () => {
  const talkCora: Action = { type: 'talk', npc: 'cora', topic: 'nacht' };
  const src = (c: GameCtx, id: string) => c.c.sources.sources.find((s) => s.id === id)!;

  test('day_from: the question about the night is not there before day 3', () => {
    expect(existsFor(src(ctx, 'src_cora'), at(1, 'halle', 'a'), ctx)).toBe(false);
    expect(status(at(1, 'halle', 'a'), talkCora)).toBe('empty');
    expect(status(at(3, 'halle', 'a'), talkCora)).toBe('found');
  });

  test('asked: opens after another source was found', () => {
    const c = mk((x) => {
      x.sources.sources.find((s) => s.id === 'src_cora')!.unlock = {
        asked: ['src_anna'],
        has: [],
      };
    });
    const st = at(3, 'halle', 'a', c);
    expect(status(st, talkCora, c)).toBe('empty');
    const asked = resolveAction(st, c, { type: 'talk', npc: 'anna', topic: 'nacht' }).state;
    expect(status(asked, talkCora, c)).toBe('found');
  });

  test('has: opens after a find was made', () => {
    const c = mk((x) => {
      x.sources.sources.find((s) => s.id === 'src_cora')!.unlock = {
        asked: [],
        has: ['f_excl_ben'],
      };
    });
    const st = at(3, 'halle', 'a', c);
    expect(status(st, talkCora, c)).toBe('empty');
    expect(status({ ...st, found: ['f_excl_ben'] }, talkCora, c)).toBe('found');
  });
});

describe('newspaper puzzle solved after its day (D77)', () => {
  test('points times the factor from the configuration, never below 0', () => {
    const st = newPlayer(ctx);
    const onTime = totalPoints(awardDailyPuzzle(st, ctx, true, false));
    const late = totalPoints(awardDailyPuzzle(st, ctx, true, false, true));
    expect(onTime).toBe(scoring.day.puzzle);
    expect(late).toBe(Math.floor(scoring.day.puzzle * scoring.newspaper_puzzle_late_factor));
    expect(late).toBeLessThan(onTime);
    expect(late).toBeGreaterThanOrEqual(0);
  });
});
