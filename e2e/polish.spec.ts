import { execSync } from 'node:child_process';
import { expect, test } from '@playwright/test';
import postgres from 'postgres';
import { connInfo, readEnv } from '../tools/lib/db';

// Layout and keyboard checks at 360 to 1440 px (WP12): no horizontal scrolling, the time table
// and the popup work with the keyboard. SHOTS=<dir> also writes screenshots there.
test.use({ actionTimeout: 10_000 });
const env = readEnv();
const NAME = `E2E-polish-${Date.now().toString(36)}`;
const NOW = encodeURIComponent('2026-12-24T12:00:00+01:00');
const WIDTHS = [360, 768, 1440];

test.beforeAll(async () => {
  test.setTimeout(200_000);
  const sql = postgres({ ...connInfo('staging'), ssl: 'require', max: 1 });
  const [g] = await sql`select id from games where slug = 'e2e-freunde'`;
  await fetch(`${env.SUPABASE_STAGING_URL}/functions/v1/admin_players`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-admin-token': env.ADMIN_TOKEN_STAGING as string,
    },
    body: JSON.stringify({
      op: 'create',
      game_id: g?.id,
      player: { name: NAME, avatar: '\u{1F9EA}' },
    }),
  });
  execSync(`npx tsx tools/fast-forward/index.ts e2e-freunde ${NAME} 6`, { stdio: 'ignore' });
  await sql.end();
});

test.afterAll(async () => {
  const sql = postgres({ ...connInfo('staging'), ssl: 'require', max: 1 });
  await sql`delete from players where name = ${NAME}`;
  await sql.end();
});

for (const width of WIDTHS) {
  test(`${width}px: no horizontal scroll, time table by keyboard`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(`/?now=${NOW}#/e2e-freunde`);
    await page.getByRole('button', { name: NAME }).click();
    const shot = async (n: string) => {
      if (process.env.SHOTS)
        await page.screenshot({ path: `${process.env.SHOTS}/${n}-${width}.png` });
    };
    const noOverflow = async (where: string) =>
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        `overflow on ${where}`,
      ).toBe(true);
    for (const tab of ['Zeitung', 'Tag', 'Akte', 'Theorie', 'Rangliste']) {
      await page.getByRole('navigation').getByRole('button', { name: tab, exact: true }).click();
      await page.waitForSelector('h1, h2');
      await noOverflow(tab);
      await shot(tab.toLowerCase());
    }
    await page.getByRole('navigation').getByRole('button', { name: 'Akte', exact: true }).click();
    await page.getByRole('tab', { name: 'Zeit' }).click();
    const cell = page.locator('.timetable .cell').first();
    await cell.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await shot('zeit-dialog');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Space');
    const box = dialog.getByRole('checkbox').first();
    await expect(box).toBeChecked();
    // focus stays on the checkbox after toggling (no jump back to the dialog frame)
    await expect(box).toBeFocused();
    await page.keyboard.press('Space');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(cell).toBeFocused();
    await noOverflow('Zeit');
  });
}
