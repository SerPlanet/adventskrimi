import { expect, test, type Page } from '@playwright/test';
import postgres from 'postgres';
import { connInfo, readEnv } from '../tools/lib/db';

// A fresh player plays all 24 days one after the other on the last calendar day (catch-up):
// narrative, newspaper, "Tag beenden", "Zum nächsten Tag", report cards on 10/14/18/22,
// accusation from day 20 and the resolution. One player only: no rumours, no plaques, and the
// paper must still be fine. Own games "e2e-*" on staging; the players are deleted at the end.
test.use({ actionTimeout: 15_000 });
const env = readEnv();
const NOW = encodeURIComponent('2026-12-24T12:00:00+01:00');
const TAG = Date.now().toString(36);
const GAMES = ['freunde', 'familie'] as const;
const nameOf = (g: string) => `E2E-run-${g}-${TAG}`;
const REPORT_DAYS = [10, 14, 18, 22];

async function admin(body: object) {
  const res = await fetch(`${env.SUPABASE_STAGING_URL}/functions/v1/admin_players`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-admin-token': env.ADMIN_TOKEN_STAGING as string,
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

test.beforeAll(async () => {
  const sql = postgres({ ...connInfo('staging'), ssl: 'require', max: 1 });
  for (const g of GAMES) {
    const [row] = await sql`select id from games where slug = ${'e2e-' + g}`;
    await admin({
      op: 'create',
      game_id: row?.id,
      player: { name: nameOf(g), avatar: '\u{1F3C3}' },
    });
  }
  await sql.end();
});

test.afterAll(async () => {
  const sql = postgres({ ...connInfo('staging'), ssl: 'require', max: 1 });
  await sql`delete from players where name like ${`E2E-run-%-${TAG}`}`;
  await sql.end();
});

const nav = (page: Page, name: string) =>
  page.getByRole('navigation').getByRole('button', { name, exact: true }).click();

for (const g of GAMES) {
  test(`${g}: days 1 to 24 in a row, report cards, accusation, resolution`, async ({ page }) => {
    test.setTimeout(900_000);
    const problems: string[] = [];
    page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
    page.on('response', (r) => {
      if (r.url().includes('/functions/v1/') && r.status() >= 400)
        problems.push(`${r.status()} ${r.url().split('/').pop()}`);
    });

    await page.goto(`/?now=${NOW}#/e2e-${g}`);
    await page.getByRole('button', { name: new RegExp(nameOf(g)) }).click();
    // day 1 starts with the question who you are (the role is only an address, D78)
    await expect(page.getByRole('heading', { name: 'Wer bist du?' })).toBeVisible();
    await page.getByRole('button', { name: 'Weiter' }).click();

    for (let day = 1; day <= 24; day++) {
      // narrative, then the newspaper of this day
      await expect(page.getByRole('heading', { name: `Tag ${day}`, exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Weiter' }).click();
      await expect(page.getByText(`Ausgabe Nr. ${day}`)).toBeVisible();
      await expect(page.locator('.front .lead')).toBeVisible();
      expect(
        await page.locator('.paper').innerText(),
        `placeholder in paper of day ${day}`,
      ).not.toContain('{');

      // theory in time for the report cards, accusation on day 20
      if (day === 5) {
        await nav(page, 'Theorie');
        for (const label of [
          'Wer war der Dieb?',
          'Wer hat geholfen (Komplize)?',
          'Wann ist es passiert?',
          'Wo ist es passiert?',
        ])
          await page.getByLabel(label).selectOption({ index: 1 });
        await page.getByRole('button', { name: 'Theorie speichern' }).click();
        await expect(page.getByRole('button', { name: 'Theorie speichern' })).toBeDisabled();
      }
      if (day === 20) {
        await nav(page, 'Theorie');
        await expect(page.getByRole('heading', { name: 'Anklage erheben' })).toBeVisible();
        for (const box of await page.locator('fieldset input[type=checkbox]').all()) {
          // first option of each proof question
          if (
            (await box.evaluate((el) => el.closest('fieldset')!.querySelector('input') === el)) ===
            true
          )
            await box.check();
        }
        await page.getByRole('button', { name: 'Anklage erheben …' }).click();
        await page.getByRole('button', { name: 'Ja, ich klage an' }).click();
        // the resolution comes at once because the calendar is on day 24
        await expect(page.getByRole('heading', { name: /Die Auflösung/ })).toBeVisible();
      }

      // end the day
      await nav(page, 'Tag');
      await page.getByRole('button', { name: /Gute Nacht/ }).click();
      await page.getByRole('button', { name: 'Ja, Tag beenden' }).click();

      if (day < 24) {
        await expect(page.getByText('Tag beendet')).toBeVisible();
        if (REPORT_DAYS.includes(day)) {
          await nav(page, 'Theorie');
          await expect(
            page.getByRole('heading', { name: 'Zeugnisse vom Inspektor' }),
          ).toBeVisible();
          await expect(page.getByText(new RegExp(`Tag ${day}:`))).toBeVisible();
          await nav(page, 'Tag');
        }
        await page.getByRole('button', { name: 'Zum nächsten Tag' }).click();
      } else {
        await expect(page.getByText('Der Fall ist abgeschlossen')).toBeVisible();
      }
    }

    // the end: resolution stays readable, ranking shows the player, nothing went wrong on the way
    await nav(page, 'Theorie');
    await expect(page.getByRole('heading', { name: /Die Auflösung/ })).toBeVisible();
    await nav(page, 'Rangliste');
    await expect(page.getByText(nameOf(g))).toBeVisible();
    expect(problems).toEqual([]);
  });
}
