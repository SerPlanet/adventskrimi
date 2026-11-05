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
      const window = ['f_lampe_an', 'f_a1', 'f_a2', 'f_b1', 'f_b2', 'f_h3', 'f_h4', 'f_k3', 'f_k4'];
      x.sources.sources.forEach((s) => (s.yields = s.yields.filter((y) => !window.includes(y))));
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
        supports: [],
      });
      // the route fact that would refute it is not part of this broken case
      x.sources.sources = x.sources.sources.filter(
        (s) => !s.yields.includes('f_b2') && !s.yields.includes('f_k3'),
      );
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

describe('plan check', () => {
  const plan = (c: LoadedCase) => runChecks(c, friends, quality, 'plan' as CheckName)[0]!;

  test('doors match the room graph', () => {
    expect(plan(good).ok).toBe(true);
  });
  test('a missing or a doubled door is rejected', () => {
    const noDoor = plan(broken((c) => (c.rooms.doors = [])));
    expect(noDoor.errors.join()).toMatch(/0 doors/);
    const extra = plan(broken((c) => c.rooms.doors.push({ ...c.rooms.doors[0]! })));
    expect(extra.errors.join()).toMatch(/2 doors/);
  });
  test('a door away from the shared wall is rejected', () => {
    const off = plan(broken((c) => (c.rooms.doors[0]!.at = { x: 20, y: 20 })));
    expect(off.errors.join()).toMatch(/shared wall/);
  });
});

describe('insight checks (WP20 §4)', () => {
  const errorsOf = (c: LoadedCase, q = quality, profile = friends) =>
    runChecks(c, profile, q, 'insights' as CheckName).flatMap((r) => r.errors);
  const fact = (c: LoadedCase, id: string) => c.facts.facts.find((f) => f.id === id)!;
  const source = (c: LoadedCase, id: string) => c.sources.sources.find((s) => s.id === id)!;

  test('the extended test case passes for both profiles', () => {
    expect(errorsOf(good)).toEqual([]);
    expect(errorsOf(good, quality, family)).toEqual([]);
  });

  test('a case without insights skips the check', () => {
    const c = broken((x) => (x.insights.insights = []));
    expect(runChecks(c, friends, quality, 'insights' as CheckName)[0]?.note).toMatch(/no insights/);
  });

  test('1: an insight needs proofs from at least two sources', () => {
    const c = broken((x) => {
      for (const id of ['f_cora_keller', 'f_k3', 'f_k4']) fact(x, id).supports = [];
    });
    expect(errorsOf(c).join()).toMatch(/insight i_keller: 1 source/);
  });

  test('2: a corridor must not hang on a single source', () => {
    const c = broken((x) => {
      for (const id of ['f_k3', 'f_k4']) fact(x, id).supports = [];
      Object.assign(source(x, 'src_lampe'), { days: [2], route: ['a'] });
    });
    expect(errorsOf(c).join()).toMatch(/corridor b: insight i_keller hangs on the single source/);
  });

  test('3: each corridor on its own must name the solution', () => {
    const c = broken((x) => {
      x.sources.sources = [];
    });
    expect(errorsOf(c).join()).toMatch(/not reachable on this way alone/);
  });

  test('4: corridors give the same number of insights and proofs in the guided days', () => {
    const c = broken(
      (x) => (x.sources.sources = x.sources.sources.filter((s) => s.id !== 'src_a1')),
    );
    expect(errorsOf(c).join()).toMatch(/corridors differ in the guided days/);
  });

  test('4: corridors meet on the last guided day', () => {
    const c = broken((x) => (x.routes.corridors[1]!.route = { 2: 'keller' }));
    expect(errorsOf(c).join()).toMatch(/do not meet on day 2/);
  });

  test('5: more things with a proof than actions, on guided and on free days', () => {
    const guided = broken((x) => {
      x.sources.sources = x.sources.sources.filter((s) => !['src_a2', 'src_b2'].includes(s.id));
    });
    expect(errorsOf(guided).join()).toMatch(
      /corridor a day 2: 2 thing\(s\) with a find, need >= 3/,
    );
    const free = broken((x) => {
      // day 3 on: the hall offers the lamp only, but not enough things
      for (const id of ['src_a1', 'src_a2', 'src_b1', 'src_b2']) source(x, id).days = [2];
    });
    const strict = { ...quality, rooms_need_budget_plus_one: true };
    expect(errorsOf(free, strict).join()).toMatch(/room halle day 3/);
    // off in the test case's own settings
    expect(errorsOf(free).join()).not.toMatch(/room halle day 3/);
  });

  test('every room needs an object puzzle when the settings ask for it (D89)', () => {
    const r = runChecks(good, friends, { ...quality, room_puzzles_min: 1 }).find(
      (x) => x.name === 'locks',
    )!;
    expect(r.ok).toBe(false);
    expect(r.errors.join()).toMatch(/room \w+: 0 object puzzle\(s\), need 1/);
  });

  test('6: no proof names a verdict', () => {
    const c = broken((x) => (fact(x, 'f_a1').text = 'Anna war es nicht.'));
    expect(errorsOf(c).join()).toMatch(/fact f_a1: names a verdict/);
    const note = broken((x) => (x.rooms.rooms[0]!.objects[0]!.look_note = 'Also unschuldig.'));
    expect(errorsOf(note).join()).toMatch(/look_note: names a verdict/);
  });

  test('7: a random sample of the proofs must still solve the case', () => {
    const q = Quality.parse({ ...quality, insights: { ...quality.insights, sample_share: 0.2 } });
    expect(errorsOf(good, q).join()).toMatch(/random 20% sample/);
  });

  test('8: a question about the night is not open before the free phase', () => {
    const c = broken((x) => delete source(x, 'src_ben').unlock);
    expect(errorsOf(c).join()).toMatch(
      /source src_ben: a question about the night is open on day 1/,
    );
  });
});

describe('story finds (WP22)', () => {
  test('a story fact and a story statement change no candidate and break no check', () => {
    const c = structuredClone(good);
    c.facts.facts.push({
      id: 'f_story',
      text: 'Der Laden der Brüder wurde im Herbst überfallen.',
      type: 'story',
      red_herring: false,
      supports: [],
    });
    c.statements.statements.push({
      id: 's_story',
      npc: 'anna',
      text: 'Ich komme erst am Sechsten.',
      claims: [{ type: 'story' }],
      truth: false,
      red_herring: false,
      supports: [],
    });
    c.sources.sources.push({
      id: 'src_story',
      kind: 'newspaper',
      days: [1],
      yields: ['f_story', 's_story'],
    });
    const failed = runChecks(c, friends, quality)
      .filter((r) => !r.ok)
      .map((r) => r.name);
    expect(failed).not.toContain('truth');
    expect(failed).not.toContain('unique');
    expect(failed).not.toContain('refute');
  });
});

describe('what a corridor sees in the guided days (WP22b)', () => {
  const errorsOf = (c: LoadedCase) =>
    runChecks(c, friends, quality, 'insights' as CheckName).flatMap((r) => r.errors);

  test('an insight is proven at most once on one way in days 1-2', () => {
    const c = broken((x) => (x.facts.facts.find((f) => f.id === 'f_a2')!.supports = ['i_halle']));
    expect(errorsOf(c).join()).toMatch(/corridor a: insight i_halle is proven 2 times/);
  });

  test('the newspaper does not repeat what the way already gave', () => {
    const c = broken((x) =>
      x.sources.sources.find((s) => s.id === 'src_news_a')!.yields.push('f_cora_keller'),
    );
    expect(errorsOf(c).join()).toMatch(
      /newspaper src_news_a repeats insight i_keller that src_lampe gave/,
    );
  });

  test('an answer that only repeats earlier finds is refused', () => {
    const c = broken(
      (x) => (x.sources.sources.find((s) => s.id === 'src_anna')!.yields = ['f_lampe_an']),
    );
    expect(errorsOf(c).join()).toMatch(/answer src_anna only repeats finds from before/);
  });
});

describe('paper structure (WP24, D87)', () => {
  const paper = (mutate: (c: LoadedCase) => void) =>
    runChecks(broken(mutate), friends, quality).find((r) => r.name === 'paper')!;

  test('an incomplete day is reported, a day after the limit only says content follows', () => {
    const open = paper((c) => (c.newspaper.paper_required_through = 1));
    expect(open.ok).toBe(false);
    expect(open.errors.join('\n')).toContain('day 1: 0 jokes (need 1)');
    const later = paper((c) => (c.newspaper.paper_required_through = 0));
    expect(later.errors).toEqual([]);
    expect(later.note).toContain('content follows (D80) from day 1');
  });

  test('a joke that names a figure, is too long, repeats a kind or carries a find is refused', () => {
    const r = paper((c) => {
      c.newspaper.paper_required_through = 2;
      const fact = c.facts.facts[0]!.id;
      c.newspaper.jokes = [
        {
          id: 'j1',
          day: 1,
          kind: 'flachwitz',
          text: 'Warum hat Anna kalte Füße? Weil sie Schnee mag. Ach so. Ja.',
        },
        { id: fact, day: 2, kind: 'flachwitz', text: 'Kurz.' },
      ];
    });
    const text = r.errors.join('\n');
    expect(text).toContain('joke j1: longer than 2 sentences');
    expect(text).toContain('joke j1: refers to a figure');
    expect(text).toContain('same joke kind as day 1');
    expect(text).toContain('carries a find');
  });

  test('the story count and the mix are checked', () => {
    const r = paper((c) => {
      c.newspaper.paper_required_through = 2;
      c.newspaper.articles = [1, 2].flatMap((day) =>
        ['klatsch', 'klatsch', 'bericht'].map((kind, i) => ({
          id: `x${day}${i}`,
          day,
          title: 't',
          text: 'a b c',
          kind: kind as 'klatsch' | 'bericht',
          traegt: [],
        })),
      );
    });
    expect(r.errors.join('\n')).toContain('same mix of story kinds as day 1');
    const few = paper((c) => {
      c.newspaper.paper_required_through = 1;
      c.newspaper.articles = [];
    });
    expect(few.errors.join('\n')).toContain('day 1: 0 more stories (2-4)');
  });
});
