import { expect, test } from '@playwright/test';
import { readEnv } from '../tools/lib/db';

// Admin page: no access without the token; with it, counts only (never a theory or the solution).
const env = readEnv();

test('admin: wrong token refused, right token shows the overview without spoilers', async ({
  page,
}) => {
  await page.goto('/#/admin');
  await page.getByLabel('Admin-Token').fill('falsches-token-1234567890');
  await page.getByRole('button', { name: 'Anmelden' }).click();
  await expect(page.getByRole('alert')).toContainText('Das Token passt nicht');
  await expect(page.getByRole('heading', { name: 'Spieler anlegen' })).toHaveCount(0);

  await page.getByLabel('Admin-Token').fill(env.ADMIN_TOKEN_STAGING as string);
  await page.getByRole('button', { name: 'Anmelden' }).click();
  await expect(page.getByText(/Heute ist Tag/)).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Punkte' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Zeitraffer (nur Staging)' })).toBeVisible();
  const text = await page.locator('main').innerText();
  expect(text).not.toMatch(/Theorie|Lösung|Auflösung/);
});
