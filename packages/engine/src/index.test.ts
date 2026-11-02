import { expect, test } from 'vitest';
import { ENGINE_VERSION } from './index';

test('engine exports a version', () => {
  expect(ENGINE_VERSION).toBe('0.0.0');
});
