/* eslint-disable @typescript-eslint/no-explicit-any */
// Usage: npm run timelapse [-- cases/berghotel]
// WP13 part 1, offline (in-memory store, local case): both profiles, 1/2/4/20 players. Every player
// starts on day 1 with the clock on Dec 24 (catch-up), plays days 1..24 through the API (greedy
// actions for even players, "just end the day" for odd ones), then accuses. Checks: no API error,
// no secrets in any payload, points never negative and never falling, newspaper only up to the
// own day, accusation and resolution at the end.
import { existsSync } from 'node:fs';
import { makeCtx } from '../../packages/engine/src/game';
import { loadCase, loadProfile, loadScoring } from '../../packages/engine/src/loader';
import {
  adminPlayers,
  dispatch,
  MemoryStore,
  type HandlerName,
} from '../../packages/engine/src/api';
import { actionsHere } from '../../packages/engine/src/sim';
import { applyProfile } from '../../packages/engine/src/solver';

const dir = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? 'cases/berghotel';
if (!existsSync(dir)) {
  console.error(`case not found: ${dir}`);
  process.exit(2);
}
const loaded = loadCase(dir);
if (!loaded.ok) {
  loaded.errors.slice(0, 10).forEach((e) => console.error(e));
  process.exit(1);
}
const data = loaded.data;
const scoring = loadScoring('config/scoring.json');
const NOW = new Date('2026-12-24T12:00:00+01:00');
const SECRETS = ['"solution"', '"truth"', '"world"', '"correct"'];
const sol = data.case.solution as Record<string, string>;
const proofRight = Object.fromEntries(data.case.proof_questions.map((q) => [q.id, q.correct]));
const problems: string[] = [];
const bad = (m: string) => problems.length < 30 && problems.push(m);

for (const id of ['friends', 'family']) {
  const profile = loadProfile(`config/profiles/${id}.yaml`);
  for (const count of [1, 2, 4, 20]) {
    const tag = `${id}/${count}`;
    const store = new MemoryStore(
      { id: 'g', slug: 'tl', name: 'T', caseId: 'x', startDate: '2026-12-01', profile, scoring },
      data,
    );
    const ctx = makeCtx(applyProfile(data, profile), profile, scoring);
    const ids: string[] = [];
    for (let i = 0; i < count; i++) {
      const r = await adminPlayers(store, {
        op: 'create',
        game_id: 'g',
        player: { name: `P${i}` },
      });
      ids.push(r.player!.id);
    }
    let n = 0;
    const call = async (p: string, name: HandlerName, body: object, expectOk = true) => {
      const r = await dispatch(
        name,
        store,
        { slug: 'tl', player_id: p, request_id: `tl-${String(++n).padStart(8, '0')}`, ...body },
        NOW,
      );
      const text = JSON.stringify(r.body);
      if (expectOk && r.status !== 200) bad(`${tag} ${name}: ${r.status} ${text.slice(0, 80)}`);
      if (name !== 'accuse')
        for (const s of SECRETS) if (text.includes(s)) bad(`${tag} ${name}: payload contains ${s}`);
      return { status: r.status, body: r.body as any };
    };
    const last = new Map<string, number>();
    const seePoints = (p: string, pts: unknown, where: string) => {
      if (typeof pts !== 'number' || pts < 0) return bad(`${tag} ${where}: points ${String(pts)}`);
      if (pts < (last.get(p) ?? 0)) bad(`${tag} ${where}: points fell ${last.get(p)} -> ${pts}`);
      last.set(p, pts);
    };
    for (let d = 1; d <= 24; d++) {
      for (const [i, p] of ids.entries()) {
        const open = await call(p, 'open_day', {});
        if (open.body.state?.day !== d)
          bad(`${tag} P${i}: expected day ${d}, got ${open.body.state?.day}`);
        if (i % 2 === 0)
          for (const a of actionsHere(store.players.get(p)!.state, ctx)) {
            const r = await call(p, 'act', { action: a });
            seePoints(p, r.body.state?.points, `act d${d}`);
          }
        const end = await call(p, 'end_day', {});
        seePoints(p, end.body.state?.points, `end_day d${d}`);
        const paper = await call(p, 'newspaper', { day: d });
        if (!paper.body.newspaper && !paper.body.content) bad(`${tag} P${i}: no newspaper d${d}`);
        if (d < 23 && (await call(p, 'newspaper', { day: d + 2 }, false)).status === 200)
          bad(`${tag} P${i}: newspaper of day ${d + 2} readable after day ${d}`);
      }
      await call(ids[0]!, 'scoreboard', {});
    }
    for (const [i, p] of ids.entries()) {
      const right = i % 2 === 0;
      const r = await call(
        p,
        'accuse',
        {
          theory: right ? sol : { ...sol, who: Object.keys(proofRight).length ? 'x' : sol.who },
          proof: proofRight,
        },
        right,
      );
      if (right) {
        seePoints(p, r.body.state?.points, 'accuse');
        if (!r.body.state?.story?.solution) bad(`${tag} P${i}: no resolution after accusation`);
      }
    }
    console.log(`${problems.length ? '✗' : '✓'} ${tag}`);
  }
}
problems.forEach((p) => console.error(p));
process.exit(problems.length ? 1 : 0);
