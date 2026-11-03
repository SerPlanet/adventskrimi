import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { loadCase, loadProfile, loadScoring, type LoadedCase } from '../loader';
import { renameCase } from '../names';
import { applyProfile } from '../solver';
import { endDay, makeCtx, narrativeOf, newPlayer, resolveAction, type GameCtx } from './index';

const ROOT = join(__dirname, '../../../..');
const scoring = loadScoring(join(ROOT, 'config/scoring.json'));
const friends = loadProfile(join(ROOT, 'config/profiles/friends.yaml'));

const load = (dir: string): LoadedCase => {
  const r = loadCase(join(ROOT, dir));
  if (!r.ok) throw new Error(r.errors.join('\n'));
  return renameCase(r.data, {});
};
const ctxOf = (c: LoadedCase, profile = friends): GameCtx =>
  makeCtx(applyProfile(c, profile), profile, scoring);

describe('narrative of the day (02c §2)', () => {
  const ctx = ctxOf(load('cases/_test'));

  test('day 1 is the arrival and the first room', () => {
    const text = narrativeOf(newPlayer(ctx), ctx);
    expect(text).toContain('Testhaus');
    expect(text).toContain('Halle');
  });

  test('later days name the room left and the room entered, with an echo of the last find', () => {
    let st = resolveAction(newPlayer(ctx), ctx, {
      type: 'talk',
      npc: 'anna',
      topic: 'nacht',
    }).state;
    const r = endDay(st, ctx, 'keller');
    if (!r.ok) throw new Error(r.reason);
    st = r.state;
    const text = narrativeOf(st, ctx);
    expect(text).toContain('Du lässt die warme Halle hinter dir.');
    expect(text).toContain('Im Keller riecht es nach Stein');
    expect(text).toContain('Das Gespräch mit Anna geht dir noch nach.');
  });

  test('no placeholders, and no text of any find on any day', () => {
    const full = ctx.c;
    const finds = [
      ...full.facts.facts.map((f) => f.text),
      ...full.statements.statements.map((s) => s.text),
    ];
    let st = newPlayer(ctx);
    for (let day = 1; day <= 24; day++) {
      const text = narrativeOf({ ...st, day, prevRoom: 'keller' }, ctx);
      expect(text).not.toContain('{');
      for (const f of finds) expect(text).not.toContain(f);
      st = { ...st, day };
    }
  });
});

describe.runIf(existsSync(join(ROOT, 'cases/berghotel')))('narrative on the real case', () => {
  for (const id of ['friends', 'family'] as const) {
    test(`${id}: every day and room reads without placeholders or find texts`, () => {
      const c = load('cases/berghotel');
      const profile = loadProfile(join(ROOT, `config/profiles/${id}.yaml`));
      const ctx = ctxOf(c, profile);
      const finds = [...c.facts.facts, ...c.statements.statements].map((f) => f.text);
      for (const room of ctx.c.rooms.rooms)
        for (let day = 1; day <= 24; day++) {
          const text = narrativeOf(
            { ...newPlayer(ctx), day, room: room.id, prevRoom: room.id },
            ctx,
          );
          expect(text).not.toContain('{');
          for (const f of finds) expect(text).not.toContain(f);
        }
    });
  }
});
