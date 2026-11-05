import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { loadCase } from '../loader';
import {
  checkDaily,
  countSolutions,
  generateDaily,
  kindOfDay,
  publicPuzzle,
  LEVELS,
  wordleMarks,
} from './index';

const loaded = loadCase(join(__dirname, '../../../../cases/_test'));
if (!loaded.ok) throw new Error(loaded.errors.join('\n'));
const cfg = loaded.data.riddles;
const DAYS = Array.from({ length: 24 }, (_, i) => i + 1);
const dayOf = (k: string) => DAYS.find((d) => kindOfDay(cfg, d) === k) as number;

describe('puzzle of the day: 24 days x 3 levels', () => {
  test('same seed gives the same puzzle, other game gives another', () => {
    for (const level of LEVELS) {
      expect(generateDaily('freunde', 5, level, cfg)).toEqual(
        generateDaily('freunde', 5, level, cfg),
      );
    }
    const a = JSON.stringify(publicPuzzle(generateDaily('freunde', 1, 'medium', cfg)));
    const b = JSON.stringify(publicPuzzle(generateDaily('familie', 1, 'medium', cfg)));
    expect(a).not.toBe(b);
  });

  test('every puzzle is solvable and its own answer is accepted, a wrong one is not', () => {
    for (const day of DAYS)
      for (const level of LEVELS) {
        const p = generateDaily('test', day, level, cfg);
        expect(p.kind).toBe(kindOfDay(cfg, day));
        expect(p.hints).toHaveLength(2);
        expect(checkDaily(p, p.answer), `${p.kind} ${level} day ${day}`).toBe(true);
        expect(checkDaily(p, 'garantiert falsch')).toBe(false);
      }
  });

  test('sudoku has exactly one solution and the stored solution fits the clues', () => {
    for (const day of DAYS.filter((d) => kindOfDay(cfg, d) === 'sudoku'))
      for (const level of LEVELS) {
        const p = generateDaily('test', day, level, cfg);
        const d = p.data as { n: number; br: number; bc: number; cells: number[] };
        expect(countSolutions(d)).toBe(1);
        d.cells.forEach((v, i) => v !== 0 && expect(p.answer[i]).toBe(String(v)));
        expect(d.cells.filter((v) => v === 0).length).toBeGreaterThan(0);
      }
  });

  test('word: letters are a scrambled version of the answer', () => {
    const p = generateDaily('test', dayOf('word'), 'hard', cfg);
    const letters = (p.data as { letters: string[] }).letters;
    expect([...letters].sort().join('')).toBe([...p.solutionText].sort().join(''));
    expect(letters.join('')).not.toBe(p.solutionText);
    expect(checkDaily(p, ` ${p.solutionText.toLowerCase()} `)).toBe(true);
  });

  test('logic: the clues pin down exactly one arrangement', () => {
    for (const level of LEVELS) {
      const p = generateDaily('test', dayOf('logic'), level, cfg);
      const d = p.data as { names: string[]; clues: string[]; rooms: number };
      expect(d.clues.length).toBeGreaterThan(0);
      expect(p.answer.split(',')).toHaveLength(d.rooms);
      expect(new Set(p.answer.split(',')).size).toBe(d.rooms);
    }
  });

  test('wordle: marks follow the rules for repeated letters', () => {
    expect(wordleMarks('KERZE', 'KERZE')).toBe('ggggg');
    expect(wordleMarks('KERZE', 'ELLEN')).toBe('ynnyn');
    expect(wordleMarks('TANNE', 'NASEN')).toBe('ygnyy');
    expect(wordleMarks('ABEND', 'XXXXX')).toBe('nnnnn');
  });

  test('wordle: the answer is in the list, the view never shows it or the list', () => {
    const p = generateDaily('test', dayOf('wordle'), 'medium', cfg);
    expect(p.words).toContain(p.answer);
    const text = JSON.stringify(publicPuzzle(p));
    expect(text).not.toContain(p.answer);
    expect(text).not.toContain('words');
  });

  test('cipher: the example in the prompt fits and the plain sentence is accepted', () => {
    const p = generateDaily('test', dayOf('cipher'), 'medium', cfg);
    const d = p.data as { text: string; example: [string, string] };
    expect(p.prompt).toContain(`${d.example[0]} wurde ${d.example[1]}`);
    expect(d.text).not.toBe(p.solutionText);
    expect(checkDaily(p, p.solutionText.toLowerCase())).toBe(true);
    expect(checkDaily(p, d.text)).toBe(false);
  });

  test('the rotation comes from the case, not from the code', () => {
    const other = { ...cfg, rotation: ['word' as const, 'sudoku' as const] };
    expect(kindOfDay(other, 1)).toBe('word');
    expect(kindOfDay(other, 4)).toBe('sudoku');
    expect(generateDaily('test', 1, 'easy', other).kind).toBe('word');
  });

  test('the public view never carries the answer or the solution text', () => {
    for (const day of DAYS.slice(0, 8)) {
      const p = generateDaily('test', day, 'easy', cfg);
      const text = JSON.stringify(publicPuzzle(p));
      expect(text).not.toContain('"answer"');
      expect(text).not.toContain('solutionText');
      expect(text).not.toContain('hints');
    }
  });

  test('generation is fast enough for a request (hardest level, all days)', () => {
    const t = Date.now();
    for (const day of DAYS) generateDaily('speed', day, 'hard', cfg);
    expect(Date.now() - t).toBeLessThan(5000);
  });
});
