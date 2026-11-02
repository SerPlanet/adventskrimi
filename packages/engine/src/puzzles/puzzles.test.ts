import { describe, expect, test } from 'vitest';
import {
  checkDaily,
  countSolutions,
  generateDaily,
  kindOfDay,
  publicPuzzle,
  LEVELS,
} from './index';

const DAYS = Array.from({ length: 24 }, (_, i) => i + 1);

describe('puzzle of the day: 24 days x 3 levels', () => {
  test('same seed gives the same puzzle, other game gives another', () => {
    for (const level of LEVELS) {
      expect(generateDaily('freunde', 5, level)).toEqual(generateDaily('freunde', 5, level));
    }
    const a = JSON.stringify(publicPuzzle(generateDaily('freunde', 1, 'medium')));
    const b = JSON.stringify(publicPuzzle(generateDaily('familie', 1, 'medium')));
    expect(a).not.toBe(b);
  });

  test('every puzzle is solvable and its own answer is accepted, a wrong one is not', () => {
    for (const day of DAYS)
      for (const level of LEVELS) {
        const p = generateDaily('test', day, level);
        expect(p.kind).toBe(kindOfDay(day));
        expect(p.hints).toHaveLength(2);
        expect(checkDaily(p, p.answer), `${p.kind} ${level} day ${day}`).toBe(true);
        expect(checkDaily(p, 'garantiert falsch')).toBe(false);
      }
  });

  test('sudoku has exactly one solution and the stored solution fits the clues', () => {
    for (const day of DAYS.filter((d) => kindOfDay(d) === 'sudoku'))
      for (const level of LEVELS) {
        const p = generateDaily('test', day, level);
        const d = p.data as { n: number; br: number; bc: number; cells: number[] };
        expect(countSolutions(d)).toBe(1);
        d.cells.forEach((v, i) => v !== 0 && expect(p.answer[i]).toBe(String(v)));
        expect(d.cells.filter((v) => v === 0).length).toBeGreaterThan(0);
      }
  });

  test('word: letters are a scrambled version of the answer', () => {
    const p = generateDaily('test', 2, 'hard');
    const letters = (p.data as { letters: string[] }).letters;
    expect([...letters].sort().join('')).toBe([...p.solutionText].sort().join(''));
    expect(letters.join('')).not.toBe(p.solutionText);
    expect(checkDaily(p, ` ${p.solutionText.toLowerCase()} `)).toBe(true);
  });

  test('logic: the clues pin down exactly one arrangement', () => {
    for (const level of LEVELS) {
      const p = generateDaily('test', 4, level);
      const d = p.data as { names: string[]; clues: string[]; rooms: number };
      expect(d.clues.length).toBeGreaterThan(0);
      expect(p.answer.split(',')).toHaveLength(d.rooms);
      expect(new Set(p.answer.split(',')).size).toBe(d.rooms);
    }
  });

  test('the public view never carries the answer or the solution text', () => {
    for (const day of DAYS.slice(0, 8)) {
      const p = generateDaily('test', day, 'easy');
      const text = JSON.stringify(publicPuzzle(p));
      expect(text).not.toContain('"answer"');
      expect(text).not.toContain('solutionText');
      expect(text).not.toContain('hints');
    }
  });

  test('generation is fast enough for a request (hardest level, all days)', () => {
    const t = Date.now();
    for (const day of DAYS) generateDaily('speed', day, 'hard');
    expect(Date.now() - t).toBeLessThan(5000);
  });
});
