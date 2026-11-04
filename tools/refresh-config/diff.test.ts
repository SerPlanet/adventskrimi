import { describe, expect, test } from 'vitest';
import { changedFields } from './diff';

describe('changedFields', () => {
  test('lists new, removed and changed fields by path, without values', () => {
    const before = { profile: { id: 'x', actions_per_day: { default: 3 } }, scoring: { a: 1 } };
    const after = { profile: { id: 'x', actions_by_day: { default: 3 } }, scoring: { a: 2 } };
    expect(changedFields(before, after)).toEqual([
      'profile.actions_by_day',
      'profile.actions_per_day',
      'scoring.a',
    ]);
  });

  test('equal configs give nothing; arrays compare as a whole', () => {
    expect(changedFields({ a: [1, 2] }, { a: [1, 2] })).toEqual([]);
    expect(changedFields({ a: [1, 2] }, { a: [1, 3] })).toEqual(['a']);
  });
});
