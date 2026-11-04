// Usage: npm run a11y   (needs `npm run preview -w app` running on :4173 and the staging test game)
// Runs Lighthouse (mobile profile, accessibility only) on newspaper and hotel as a fresh test player.
import { readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';
import lighthouse from 'lighthouse';
import postgres from 'postgres';

const env = Object.fromEntries(
  readFileSync('.env', 'utf8')
    .split(/\r?\n/)
    .map((l) => l.match(/^([A-Z0-9_]+)=(.*)$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2]]),
);
const API = `${env.SUPABASE_STAGING_URL}/functions/v1`;
const BASE = 'http://localhost:4173';
const NOW = encodeURIComponent('2026-12-02T12:00:00+01:00');
const THRESHOLD = 95;

async function admin(body) {
  const res = await fetch(`${API}/admin_players`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-admin-token': env.ADMIN_TOKEN_STAGING },
    body: JSON.stringify(body),
  });
  return res.json();
}

const pooler = readFileSync('supabase/.temp/pooler-url', 'utf8');
const sql = postgres({
  host: /@([^:/]+)/.exec(pooler)[1],
  port: 5432,
  user: `postgres.${env.SUPABASE_STAGING_PROJECT_REF}`,
  password: env.SUPABASE_STAGING_DB_PASSWORD,
  database: 'postgres',
  ssl: 'require',
  max: 1,
});
const [game] = await sql`select id from games where slug = 'e2e-test'`;
const name = `A11Y-${Date.now().toString(36)}`;
const { player } = await admin({
  op: 'create',
  game_id: game.id,
  player: { name, avatar: '\u{1F9EA}' },
});

const browser = await chromium.launch({
  channel: 'chrome',
  args: ['--remote-debugging-port=9222'],
});
let failed = false;
try {
  const page = await browser.newPage();
  await page.goto(`${BASE}/?now=${NOW}#/e2e-test/zeitung`);
  await page.evaluate((id) => localStorage.setItem('advent.player.e2e-test', id), player.id);
  for (const tab of ['zeitung', 'tag', 'akte', 'theorie', 'rangliste', 'einstellungen']) {
    const url = `${BASE}/?now=${NOW}#/e2e-test/${tab}`;
    await page.goto(url);
    await page.reload();
    await page.waitForSelector('h1');
    const { lhr } = await lighthouse(url, {
      port: 9222,
      onlyCategories: ['accessibility'],
      formFactor: 'mobile',
      screenEmulation: {
        mobile: true,
        width: 360,
        height: 740,
        deviceScaleFactor: 2,
        disabled: false,
      },
      disableStorageReset: true,
      output: 'json',
      logLevel: 'error',
    });
    const score = Math.round((lhr.categories.accessibility.score ?? 0) * 100);
    const bad = Object.values(lhr.audits)
      .filter((a) => a.score !== null && a.score < 1 && a.scoreDisplayMode === 'binary')
      .map((a) => a.id);
    console.log(
      `${score >= THRESHOLD ? '✓' : '✗'} ${tab}: ${score}${bad.length ? ` (${bad.join(', ')})` : ''}`,
    );
    if (score < THRESHOLD) failed = true;
  }
} finally {
  await browser.close();
  await sql`delete from players where name = ${name}`;
  await sql.end();
}
process.exit(failed ? 1 : 0);
