import { defineConfig } from '@playwright/test';

// Smoke test against the built app (vite preview) talking to the staging functions.
// Uses the locally installed Chrome, so no browser download is needed.
export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  reporter: [['dot']],
  use: {
    baseURL: 'http://localhost:4173',
    channel: 'chrome',
    viewport: { width: 360, height: 740 },
  },
  webServer: {
    command: 'npm run build -w app && npm run preview -w app',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
