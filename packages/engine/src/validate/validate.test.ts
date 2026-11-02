import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { loadCase, loadProfile, loadQuality, type LoadedCase } from '../loader';
import { Quality } from '../schemas';
import { applyProfile } from '../solver/profile';
import { buildInfo } from '../solver/info';
import { runChecks, type CheckName } from './index';

const ROOT = join(__dirname, '../../../..');
const CASE_DIR = join(ROOT, 'cases/_test');
const res = loadCase(CASE_DIR);
if (!res.ok) throw new Error(res.errors.join('\n'));
const good: LoadedCase = res.data;
const friends = loadProfile(join(ROOT, 'config/profiles/friends.yaml'));
// the real family profile selects Berghotel rooms; for the test case use the same settings without the subset
const family = {
  ...loadProfile(join(ROOT, 'config/profiles/family.yaml')),
  include: { exclude_facts: [], exclude_sources: [] },
};
const quality = Quality.parse({
  ...loadQuality(join(ROOT, 'config/quality.json')),
  ...JSON.parse(readFileSync(join(CASE_DIR, 'quality.override.json'), 'utf8')),
});

const broken = (mutate: (c: LoadedCase) => void): LoadedCase => {
  const c = structuredClone(good);
  mutate(c);
  return c;
};
const failing = (c: LoadedCase, q = quality) =>
  runChecks(c, friends, q)
    .filter((r) => !r.ok)
    .map((r) => r.name);

describe('validator on the test case', () => {
  test.each([friends, family])('passes all checks for profile %#', (p) => {
    const results = runChecks(good, p, quality);
    expect(results.filter((r) => !r.ok)).toEqual([]);
  });

  test('--only runs a single check', () => {
    expect(runChecks(good, friends, quality, 'unique' as CheckName)).toHaveLength(1);
  });

  test('candidate space is computed quickly', () => {
    const t = Date.now();
    const info = buildInfo(applyProfile(good, friends), friends);
    expect(info.space.n).toBe(16);
    expect(Date.now() - t).toBeLessThan(2000);
  });
});

describe('broken mini cases are rejected by the expected check', () => {
  test('ambiguous: dropping the only fact on the time window leaves several tuples', () => {
    const c = broken((x) => {
      x.sources.sources.forEach((s) => (s.yields = s.yields.filter((y) => y !== 'f_lampe_an')));
      x.sources.sources = x.sources.sources.filter((s) => s.yields.length);
    });
    expect(failing(c)).toContain('unique');
  });

  test('unreachable: source on a day nobody is there', () => {
    const c = broken((x) => {
      x.sources.sources.find((s) => s.id === 'src_anna')!.days = [9];
    });
    expect(failing(c)).toContain('reach');
  });

  test('unrefutable lie', () => {
    const c = broken((x) => {
      x.statements.statements.push({
        id: 's_ben_lie',
        npc: 'ben',
        text: 'Ich war am Abend in der Halle.',
        claims: [{ type: 'presence', person: 'ben', window: 'w1', room: 'halle' }],
        truth: false,
        red_herring: false,
      });
    });
    expect(failing(c)).toContain('refute');
  });

  test('statement marked true but false in the world', () => {
    const c = broken((x) => {
      x.statements.statements.find((s) => s.id === 's_cora_halle')!.truth = true;
    });
    expect(failing(c)).toContain('truth');
  });

  test('puzzle as the only way to a key fact', () => {
    const c = broken((x) => {
      x.sources.sources = x.sources.sources.filter(
        (s) => s.id === 'src_kiste' || !s.yields.includes('f_kiste_offen'),
      );
    });
    expect(failing(c)).toEqual(expect.arrayContaining(['riddle']));
  });

  test('too little redundancy', () => {
    const c = broken((x) => {
      x.sources.sources = x.sources.sources.filter(
        (s) => !['src_news_a', 'src_book_a'].includes(s.id),
      );
    });
    expect(failing(c)).toContain('redundancy');
  });

  test('plaque title that names a room is a spoiler', () => {
    const c = broken((x) => {
      x.sources.sources.find((s) => s.id === 'src_lampe')!.plaque = 'Held der Halle';
    });
    expect(failing(c)).toContain('texts');
  });

  test('too early: tempo window is enforced', () => {
    expect(failing(good, { ...quality, tempo: { earliest_day: 20, latest_day: 22 } })).toContain(
      'tempo',
    );
  });
});

describe('performance', () => {
  test('friends-size candidate space (8x7x8x9) builds and solves in under 2 s', () => {
    const c = structuredClone(good);
    const pad = (base: string[], n: number, p: string) => [
      ...base,
      ...Array.from({ length: n - base.length }, (_, i) => `${p}${i}`),
    ];
    c.case.categories = {
      who: pad(c.case.categories.who ?? [], 8, 'w'),
      accomplice: pad(c.case.categories.accomplice ?? [], 7, 'a'),
      when: pad(c.case.categories.when ?? [], 8, 't'),
      where: pad(c.case.categories.where ?? [], 9, 'r'),
    };
    const t = Date.now();
    const info = buildInfo(c, friends);
    const results = runChecks(c, friends, quality, 'unique');
    expect(info.space.n).toBe(8 * 7 * 8 * 9);
    expect(results).toHaveLength(1);
    expect(Date.now() - t).toBeLessThan(2000);
  });
});
