import { defineConfig } from 'vitest/config';

// Integration tests against the linked staging project. Run: npm run test:int
export default defineConfig({
  test: { include: ['tools/integration/**/*.int.ts'], testTimeout: 60_000, hookTimeout: 60_000 },
});
