// Integration tests against the deployed staging edge functions (case "test", fake clock via x-game-now).
// Run: npm run deploy:functions && npm run test:int
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import postgres from 'postgres';
import { loadProfile, loadScoring } from '../../packages/engine/src/loader';
import { connInfo, readEnv } from '../lib/db';

const env = readEnv();
const URL = env.SUPABASE_STAGING_URL as string;
const ANON = env.SUPABASE_STAGING_ANON_KEY as string;
const ADMIN = env.ADMIN_TOKEN_STAGING as string;
const DAY1 = '2026-12-01T12:00:00+01:00';
const DAY3 = '2026-12-03T12:00:00+01:00';

const sql = postgres({ ...connInfo('staging'), ssl: 'require', max: 2 });
let gameId = '';
let a = '';
let b = '';
let n = 0;
const rid = () => `int-${Date.now()}-${++n}-${Math.random().toString(36).slice(2, 8)}`;

async function post(fn: string, body: object, opts: { now?: string; admin?: string | null } = {}) {
  const res = await fetch(`${URL}/functions/v1/${fn}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      apikey: ANON,
      ...(opts.now ? { 'x-game-now': opts.now } : {}),
      ...(opts.admin ? { 'x-admin-token': opts.admin } : {}),
    },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: (await res.json()) as any }; // eslint-disable-line @typescript-eslint/no-explicit-any
}

beforeAll(async () => {
  const config = {
    profile: loadProfile('config/profiles/friends.yaml'),
    scoring: loadScoring('config/scoring.json'),
  };
  const [g] = await sql`insert into games (name, profile, start_date, config, case_id)
    values ('int-test', 'friends', '2026-12-01', ${sql.json(config as never)}, 'test') returning id`;
  gameId = g!.id;
  const mk = async (name: string) =>
    (
      await post(
        'admin_players',
        { op: 'create', game_id: gameId, player: { name } },
        { admin: ADMIN },
      )
    ).body.player.id as string;
  a = await mk('Int-A');
  b = await mk('Int-B');
});

afterAll(async () => {
  if (gameId) await sql`delete from games where id = ${gameId}`;
  await sql.end();
});

const talk = { type: 'talk', npc: 'anna', topic: 'nacht' };

describe('staging edge functions', () => {
  test('admin needs the token', async () => {
    expect((await post('admin_players', { op: 'list', game_id: gameId })).status).toBe(403);
    expect(
      (await post('admin_players', { op: 'list', game_id: gameId }, { admin: 'x'.repeat(24) }))
        .status,
    ).toBe(403);
    const ok = await post('admin_players', { op: 'list', game_id: gameId }, { admin: ADMIN });
    expect(ok.body.players).toHaveLength(2);
  });

  test('state shows nothing locked and never the solution', async () => {
    const r = await post('state', { player_id: a }, { now: DAY1 });
    expect(r.status).toBe(200);
    const text = JSON.stringify(r.body);
    for (const s of ['solution', 'truth', 'world', 'f_excl_ben', '"answer"'])
      expect(text).not.toContain(s);
    expect(r.body.state.finds).toEqual([]);
  });

  test('same request_id twice: one effect, same answer; empty action is free', async () => {
    const body = { player_id: a, request_id: rid(), action: talk };
    const first = await post('act', body, { now: DAY1 });
    const again = await post('act', body, { now: DAY1 });
    expect(first.body.result.status).toBe('found');
    expect(again.body).toEqual(first.body);
    const [{ n: ledger }] =
      await sql`select count(*)::int as n from score_ledger where player_id = ${a} and kind = 'find'`;
    expect(ledger).toBe(1);
    const empty = await post(
      'act',
      { player_id: a, request_id: rid(), action: { ...talk, topic: 'wetter' } },
      { now: DAY1 },
    );
    expect(empty.body.result.status).toBe('empty');
    expect(empty.body.state.actions.used).toBe(1);
  });

  test('a day that has not arrived is refused', async () => {
    const end = await post(
      'end_day',
      { player_id: a, request_id: rid(), next_room: 'keller' },
      { now: DAY1 },
    );
    expect(end.body.state.day).toBe(2);
    const early = await post(
      'act',
      { player_id: a, request_id: rid(), action: talk },
      { now: DAY1 },
    );
    expect(early.status).toBe(403);
  });

  test('first discoverer: unique insert decides', async () => {
    const lampe = { type: 'inspect', object: 'lampe' };
    const [x, y] = await Promise.all([
      post('act', { player_id: b, request_id: rid(), action: lampe }, { now: DAY1 }),
      post('act', { player_id: b, request_id: rid(), action: lampe }, { now: DAY1 }),
    ]);
    expect([x.body.plaque, y.body.plaque].filter(Boolean)).toEqual(['Sehr aufmerksam']);
    const [{ n: rows }] = await sql`select count(*)::int as n from plaques where player_id = ${b}`;
    expect(rows).toBe(1);
  });

  test('two simultaneous first newspaper requests create one newspaper', async () => {
    const [x, y] = await Promise.all([
      post('newspaper', { player_id: a, day: 2 }, { now: DAY3 }),
      post('newspaper', { player_id: b, day: 2 }, { now: DAY3 }),
    ]);
    expect(x.status).toBe(200);
    expect(x.body.newspaper).toEqual(y.body.newspaper);
    const [{ n: rows }] =
      await sql`select count(*)::int as n from newspaper where game_id = ${gameId} and day = 2`;
    expect(rows).toBe(1);
    expect((await post('newspaper', { player_id: a, day: 3 }, { now: DAY1 })).status).toBe(403);
  });

  test('scoreboard lists both players', async () => {
    const r = await post('scoreboard', { player_id: a }, { now: DAY1 });
    expect(r.body.rows.map((x: { name: string }) => x.name).sort()).toEqual(['Int-A', 'Int-B']);
    expect(r.body.rows.filter((x: { is_you: boolean }) => x.is_you)).toHaveLength(1);
  });

  test('the public anon key cannot read any table directly', async () => {
    for (const table of ['case_solution', 'case_facts', 'players', 'score_ledger', 'request_log']) {
      const res = await fetch(`${URL}/rest/v1/${table}?select=*`, {
        headers: { apikey: ANON, authorization: `Bearer ${ANON}` },
      });
      const text = await res.text();
      expect(res.status === 200 ? text : '[]').toBe(res.status === 200 ? '[]' : '[]');
      expect(text).not.toContain('"solution"');
    }
  });
});
