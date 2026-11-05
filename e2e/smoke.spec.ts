import { expect, test } from '@playwright/test';
import postgres from 'postgres';
import { WORDS } from '../packages/engine/src/puzzles/word';
import { connInfo, readEnv } from '../tools/lib/db';

// Day 2 is "today" in the fake clock, so a fresh player (still on day 1) can play day 1 and then day 2.
const NOW = encodeURIComponent('2026-12-02T12:00:00+01:00');
test.use({ actionTimeout: 10_000 });
const env = readEnv();
const NAME = `E2E-${Date.now().toString(36)}`;
let gameId = '';

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
  const [g] = await sql`select id from games where slug = 'e2e-test'`;
  await sql.end();
  gameId = g?.id as string;
  await admin({ op: 'create', game_id: gameId, player: { name: NAME, avatar: '\u{1F9EA}' } });
});

test.afterAll(async () => {
  const sql = postgres({ ...connInfo('staging'), ssl: 'require', max: 1 });
  await sql`delete from players where name = ${NAME}`;
  await sql.end();
});

test('wrong or missing link shows a friendly note', async ({ page }) => {
  await page.goto('/#/gibt-es-nicht');
  await expect(page.getByText('Bitte öffne den Link, den du bekommen hast.')).toBeVisible();
  await page.goto('/#/');
  await expect(page.getByText('Bitte öffne den Link, den du bekommen hast.')).toBeVisible();
});

test('role, newspaper, talk, first action, good night, next day', async ({ page }) => {
  await page.goto(`/?now=${NOW}#/e2e-test`);

  // name tile -> who are you? (the role only changes the address, D78)
  await page.getByRole('button', { name: new RegExp(NAME) }).click();
  await expect(page.getByRole('heading', { name: 'Wer bist du?' })).toBeVisible();
  await page.getByLabel('Journalist').check();
  await page.getByRole('button', { name: 'Weiter' }).click();
  // the day opens with a short narrative (02c §2), told with the role; then the newspaper
  await expect(page.getByRole('heading', { name: 'Tag 1' })).toBeVisible();
  await expect(page.locator('.intro .story')).toContainText('Testhaus');
  await expect(page.locator('.intro .story')).toContainText('Man begrüßt dich als Journalist.');
  await expect(page.locator('.intro .story')).toContainText('Du reist als Journalist an.');
  await page.getByRole('button', { name: 'Weiter' }).click();
  await expect(page.getByRole('heading', { name: 'Der Bergbote' })).toBeVisible();
  // nothing lands in the dossier by itself; the player files an article (02c §3)
  await page.locator('.lead .filebtn').click();
  await expect(page.locator('.lead .filebtn')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Ausgabe Nr. 1')).toBeVisible();
  await expect(page.getByLabel('Tagesstatus')).toContainText('Tag 1');

  // question of the day
  await page.getByRole('button', { name: 'Schnee' }).click();
  await expect(page.getByText('Richtig! Gut gelesen.')).toBeVisible();

  // puzzle of day 1 on calendar day 2: solvable later, it says what it counts, no penalty tone
  await expect(page.getByRole('heading', { name: /Rätsel von Tag 1: Zahlenfeld/ })).toBeVisible();
  await expect(page.getByText(/zählt 75 % der Punkte/)).toBeVisible();
  await page.getByRole('button', { name: 'Tipp 1' }).click();
  await expect(page.getByText(/Tipp 1:/)).toBeVisible();
  await page.getByRole('button', { name: 'Überspringen' }).click();
  await expect(page.getByText('Das Rätsel ist beendet.')).toBeVisible();

  // day 1 is guided: the plan shows the own way only, no other room, nothing to choose
  await page.getByRole('navigation').getByRole('button', { name: 'Tag', exact: true }).click();
  await expect(page.locator('.hotelplan .rm')).toHaveCount(1);
  await expect(page.getByRole('button', { name: /^Keller/ })).toHaveCount(0);
  await expect(page.getByText('!', { exact: true })).toHaveCount(0);
  // a tap on a person starts the conversation at once; every question has an answer
  await page.getByRole('button', { name: /Anna/ }).last().click();
  await expect(page.getByRole('dialog', { name: /Gespräch mit Anna/ })).toBeVisible();
  await page.getByRole('button', { name: 'Das Wetter' }).click();
  await expect(page.getByText('Dazu weiß ich nichts.')).toBeVisible();
  // dialog: speech bubbles; every answer can be put into the dossier on its own
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /Die Nacht/ })
    .click();
  await expect(page.locator('.bubble')).toHaveCount(2);
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /In die Akte legen/ })
    .click();
  await expect(page.getByRole('dialog').getByRole('button', { name: /In der Akte/ })).toBeVisible();
  await page.getByRole('button', { name: 'Schließen' }).click();
  // the question about the night is not offered to Cora before the free phase
  await page.getByRole('button', { name: /Cora/ }).last().click();
  await expect(page.getByRole('dialog', { name: /Gespräch mit Cora/ })).toBeVisible();
  await expect(page.getByRole('dialog').getByRole('button', { name: /Die Nacht/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Schließen' }).click();

  // talking is free; the one action of day 1 is the examination of the lamp
  await expect(page.locator('.bar .actions')).toContainText('(1/1)');
  await page.locator('details.help summary').click();
  await page
    .locator('details.help')
    .getByRole('button', { name: /Alte Lampe/ })
    .click();
  await expect(page.getByText('Du siehst es dir an. Das kostet nichts.')).toBeVisible();
  await page.getByRole('button', { name: /Genauer untersuchen \(kostet 1 Aktion\)/ }).click();
  await expect(page.getByRole('heading', { name: 'Neu entdeckt' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.bar .actions')).toContainText('(0/1)');

  // the dossier holds what was filed and the history lists everything
  await page.getByRole('navigation').getByRole('button', { name: /Akte/ }).click();
  await page.getByRole('tab', { name: 'Verlauf' }).click();
  await expect(page.getByText('Ben ist als Dieb ausgeschlossen.')).toBeVisible();

  // end the day: the way to tomorrow's room is told, nothing is chosen
  await page.getByRole('navigation').getByRole('button', { name: 'Tag', exact: true }).click();
  await page.getByRole('button', { name: /Gute Nacht/ }).click();
  await expect(page.getByText('Danach kannst du diesen Tag nicht mehr ändern.')).toBeVisible();
  await expect(page.getByText(/Dein Weg führt dich morgen hierhin/)).toBeVisible();
  await expect(page.getByRole('dialog').getByRole('button', { name: /^Keller/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Ja, Tag beenden' }).click();
  await expect(page.getByText(/^Tag 2 ·/)).toBeVisible();
  // the page stays: the evening, what the day brought, the red chip, the way on
  await expect(page.getByRole('heading', { name: 'Gute Nacht' })).toBeFocused();
  await expect(page.getByText('Tag beendet')).toBeVisible();
  await expect(page.locator('.dayover .story')).toContainText('Halle');
  await expect(page.getByText(/Heute: 1 Gespräch, 3 Funde./)).toBeVisible();
  // a latecomer (calendar day 2) goes on at once: narrative first, then the newspaper
  await page.getByRole('button', { name: 'Zum nächsten Tag' }).click();
  await expect(page.getByRole('heading', { name: 'Tag 2' })).toBeVisible();
  await expect(page.locator('.intro .story')).toContainText('Halle');
  await page.getByRole('button', { name: 'Weiter' }).click();
  await expect(page.getByText('Ausgabe Nr. 2')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Der Keller ist kalt' })).toBeVisible();
  // day 2 puzzle = letter salad, on time; the test knows the word list
  await expect(
    page.getByRole('heading', { name: /Rätsel des Tages: Buchstabensalat/ }),
  ).toBeVisible();
  await expect(page.getByText(/zählt/)).toHaveCount(0);
  const label = (await page.locator('.letters').getAttribute('aria-label')) ?? '';
  const letters = label.replace('Buchstaben: ', '').split(' ').sort().join('');
  const word = Object.values(WORDS)
    .flat()
    .find((w) => [...w].sort().join('') === letters) as string;
  await page.getByLabel('Deine Antwort').fill('definitiv falsch');
  await page.getByRole('button', { name: 'Prüfen' }).click();
  await expect(page.getByText(/Das stimmt noch nicht/)).toBeVisible();
  await page.getByLabel('Deine Antwort').fill(word.toLowerCase());
  await page.getByRole('button', { name: 'Prüfen' }).click();
  await expect(page.getByText('Richtig! Das hast du gut gelöst.')).toBeVisible();

  // day 2: three things of the own corridor for two actions; nothing of the other corridor
  await page.getByRole('navigation').getByRole('button', { name: 'Tag', exact: true }).click();
  await expect(page.locator('.bar .actions')).toContainText('(2/2)');
  const mine = await page.getByRole('button', { name: /^(Schrank|Kommode)/ }).count();
  const theirs = await page.getByRole('button', { name: /^(Vitrine|Sideboard)/ }).count();
  expect(mine + theirs).toBe(2);
  expect(mine === 0 || theirs === 0).toBe(true);
  await expect(page.getByRole('button', { name: /Alte Lampe/ }).last()).toBeVisible();

  // no horizontal scrolling at 360 px, also with the biggest font
  const overflow = () =>
    page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(await overflow()).toBe(false);
  await page.getByRole('button', { name: /Einstellungen/ }).click();
  // the role cannot be changed after day 1
  await expect(page.getByLabel(/^Rolle/)).toBeDisabled();
  await page.getByLabel('Schriftgröße').selectOption('xl');
  await expect(page.locator('html')).toHaveCSS('font-size', '26px');
  for (const tab of ['Zeitung', 'Tag', 'Akte', 'Rangliste']) {
    await page.getByRole('button', { name: tab }).click();
    await page.waitForTimeout(400);
    expect(await overflow(), `overflow on ${tab}`).toBe(false);
  }

  // ranking shows me
  await expect(page.getByText(/\(du\)/)).toBeVisible();
});

test('timeline table: several people per cell, nothing checked; theory is saved', async ({
  page,
}) => {
  const sql = postgres({ ...connInfo('staging'), ssl: 'require', max: 1 });
  await sql`update players set settings = '{}'::jsonb, state = jsonb_set(jsonb_set(state, '{found}', '["f_cora_keller","s_cora_halle"]'::jsonb), '{discoveries}', '[{"sourceId":"src_lampe","itemIds":["f_cora_keller"],"day":1},{"sourceId":"src_cora","itemIds":["s_cora_halle"],"day":1}]'::jsonb) where name = ${NAME}`;
  await sql.end();

  await page.goto(`/?now=${NOW}#/e2e-test`);
  await page.getByRole('button', { name: new RegExp(NAME) }).click();
  await page.getByRole('navigation').getByRole('button', { name: /Akte/ }).click();
  await page.getByRole('tab', { name: 'Zeit' }).click();
  const cell = page.getByRole('button', { name: /^Halle, Erste Nachthälfte/ });
  await expect(cell).toHaveText('＋');
  await cell.click();
  await page.getByRole('checkbox', { name: 'Cora' }).click();
  await expect(page.getByRole('checkbox', { name: 'Cora' })).toBeChecked();
  await page.getByRole('checkbox', { name: 'Anna' }).click();
  await expect(page.getByRole('checkbox', { name: 'Anna' })).toBeChecked();
  await page.getByRole('button', { name: 'Fertig' }).click();
  // exactly what was entered, no check, no marking
  await expect(cell).toHaveText('Cora, Anna');
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByText(/Passt nicht/)).toHaveCount(0);

  await page
    .getByRole('navigation')
    .getByRole('button', { name: /Theorie/ })
    .click();
  await page.getByLabel('Wer war der Dieb?').selectOption({ label: 'Anna' });
  await page.getByRole('button', { name: 'Theorie speichern' }).click();
  await expect(page.getByRole('button', { name: 'Theorie speichern' })).toBeDisabled();
});
