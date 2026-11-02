import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { loadCase, loadNames, loadProfile, loadQuality, type LoadedCase } from './loader';
import { placeholderErrors, renameCase, renderText } from './names';
import { Quality } from './schemas';
import { runChecks } from './validate';

const ROOT = join(__dirname, '../../..');
const res = loadCase(join(ROOT, 'cases/_test'));
if (!res.ok) throw new Error(res.errors.join('\n'));
const good: LoadedCase = res.data;

describe('name placeholders', () => {
  test('renders name and form of address, falls back to defaults', () => {
    const defaults = { anna: 'Anna' };
    expect(renderText('{n:anna} war da.', {}, defaults)).toBe('Anna war da.');
    expect(renderText('{anrede:anna} war da.', {}, defaults)).toBe('Anna war da.');
    const names = { anna: { name: 'Mira', anrede: 'Frau Berger' } };
    expect(renderText('{n:anna} / {anrede:anna}', names, defaults)).toBe('Mira / Frau Berger');
  });

  test('unknown ids are left untouched and reported', () => {
    expect(renderText('{n:nobody}', {}, { anna: 'Anna' })).toBe('{n:nobody}');
    const c = structuredClone(good);
    c.facts.facts[0]!.text = '{n:nobody} und {kaputt} waren da.';
    const errors = placeholderErrors(c);
    expect(errors.some((e) => e.includes('unknown npc'))).toBe(true);
    expect(errors.some((e) => e.includes('malformed'))).toBe(true);
  });

  test('renameCase replaces placeholders everywhere and updates npc names', () => {
    const c = structuredClone(good);
    c.facts.facts[0]!.text = '{n:ben} war im Keller.';
    c.case.proof_questions[0]!.options[0]!.text = '{n:ben}';
    const out = renameCase(c, { ben: { name: 'Kai' } });
    expect(out.facts.facts[0]!.text).toBe('Kai war im Keller.');
    expect(out.case.proof_questions[0]!.options[0]!.text).toBe('Kai');
    expect(out.npcs.npcs.find((n) => n.id === 'ben')?.name).toBe('Kai');
    expect(c.facts.facts[0]!.text).toBe('{n:ben} war im Keller.'); // input not mutated
    expect(out.case.solution).toEqual(c.case.solution); // ids never change
  });

  test('validator flags bad placeholders and placeholders in plaque titles', () => {
    const q = Quality.parse({
      ...loadQuality(join(ROOT, 'config/quality.json')),
      tempo: { earliest_day: 1, latest_day: 5 },
      min_statement_fact_contradictions: 0,
      min_reinterpreted_finds: 0,
      min_statement_statement_contradictions: 0,
      red_herrings_min: { friends: 0, family: 0 },
    });
    const friends = loadProfile(join(ROOT, 'config/profiles/friends.yaml'));
    const c = structuredClone(good);
    c.sources.sources.find((s) => s.plaque)!.plaque = 'Freund von {n:anna}';
    const texts = runChecks(c, friends, q, 'texts')[0]!;
    expect(texts.ok).toBe(false);
    expect(texts.errors.join('\n')).toContain('placeholder');
  });

  test('missing or empty insider file means no renames', () => {
    expect(loadNames(join(ROOT, 'cases/_test/insider.yaml'))).toEqual({});
  });
});
