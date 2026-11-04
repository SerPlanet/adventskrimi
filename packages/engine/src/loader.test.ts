import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { loadCase, loadQuality, loadScoring } from './loader';
import { CardText, Fact, Scoring } from './schemas';

const TEST_CASE = join(__dirname, '../../../cases/_test');
const CONFIG = join(__dirname, '../../../config');

function brokenCopy(file: string, from: string, to: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'case-'));
  cpSync(TEST_CASE, dir, { recursive: true });
  const p = join(dir, file);
  writeFileSync(p, readFileSync(p, 'utf8').replace(from, to));
  return dir;
}

describe('loadCase', () => {
  test('valid test case loads', () => {
    const res = loadCase(TEST_CASE);
    expect(res.ok).toBe(true);
  });

  test('broken reference is reported with file and id', () => {
    const res = loadCase(brokenCopy('sources.yaml', 'f_excl_ben]', 'f_gibt_es_nicht]'));
    expect(res.ok).toBe(false);
    if (!res.ok)
      expect(res.errors.join('\n')).toContain(
        'sources.yaml: src_anna: unknown fact/statement/item "f_gibt_es_nicht"',
      );
  });

  test('schema error is reported with path', () => {
    const res = loadCase(brokenCopy('facts.yaml', 'type: exclusion', 'type: unbekannt'));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors[0]).toContain('facts.yaml');
  });

  test('solution outside candidates is rejected', () => {
    const res = loadCase(brokenCopy('case.yaml', 'where: keller }', 'where: dach }'));
    expect(res.ok).toBe(false);
  });
});

describe('schemas', () => {
  test('card text over 60 words is invalid', () => {
    expect(CardText.safeParse('wort '.repeat(61)).success).toBe(false);
    expect(CardText.safeParse('wort '.repeat(60)).success).toBe(true);
  });

  test('fact with unknown type is invalid', () => {
    expect(Fact.safeParse({ id: 'x', text: 'y', type: 'nope' }).success).toBe(false);
  });

  test('negative points are invalid', () => {
    const s = loadScoring(join(CONFIG, 'scoring.json'));
    expect(Scoring.safeParse({ ...s, first_discoverer: -1 }).success).toBe(false);
  });

  test('config files load', () => {
    expect(loadQuality(join(CONFIG, 'quality.json')).card_words_max).toBe(60);
  });
});
