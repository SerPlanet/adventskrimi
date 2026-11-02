import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { loadCase, loadProfile, loadQuality, loadScoring } from '../loader';
import { balanceFindings, BOTS, runBots, summary } from './index';

const ROOT = join(__dirname, '../../../..');
const res = loadCase(join(ROOT, 'cases/_test'));
if (!res.ok) throw new Error(res.errors.join('\n'));
const scoring = loadScoring(join(ROOT, 'config/scoring.json'));
const quality = loadQuality(join(ROOT, 'config/quality.json'));

describe.each(['friends', 'family'])('bots on the test case (%s)', (id) => {
  const profile = loadProfile(join(ROOT, `config/profiles/${id}.yaml`));
  const runs = runBots(res.data, profile, scoring, quality, { seeds: 5 });

  test('every bot plays all 24 days and never loses points', () => {
    expect(runs.map((r) => r.bot)).toEqual([...BOTS]);
    for (const r of runs)
      for (const x of r.runs) {
        expect(x.pointsByDay).toHaveLength(24);
        expect(
          x.pointsByDay.every((p, i) => i === 0 || p >= (x.pointsByDay[i - 1] as number)),
        ).toBe(true);
        expect(x.candidates[24]).toBeDefined();
      }
  });

  test('random runs are reproducible and report at most 20 lines', () => {
    const again = runBots(res.data, profile, scoring, quality, { bots: ['random'], seeds: 5 });
    expect(again[0]?.runs).toEqual(runs.find((r) => r.bot === 'random')?.runs);
    for (const r of runs) expect(summary(r).length).toBeLessThanOrEqual(20);
  });

  test('the optimal bot is never behind greedy and the report names findings', () => {
    const get = (b: string) => runs.find((r) => r.bot === b)?.runs[0];
    expect(get('optimal')?.uniqueDay ?? 99).toBeLessThanOrEqual(get('greedy')?.uniqueDay ?? 99);
    expect(balanceFindings(runs, profile, quality, 22).every((f) => typeof f === 'string')).toBe(
      true,
    );
  });
});
