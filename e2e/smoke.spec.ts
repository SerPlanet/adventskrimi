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
  const [g] = await sql`select id from games where name = 'Testspiel' limit 1`;
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

test('name tile, newspaper, action, dossier, end of day, next day', async ({ page }) => {
  await page.goto(`/?now=${NOW}#/test`);

  // name tiles -> newspaper
  await page.getByRole('button', { name: new RegExp(NAME) }).click();
  // the day opens with a short narrative (02c §2), then the newspaper
  await expect(page.getByRole('heading', { name: 'Tag 1' })).toBeVisible();
  await expect(page.locator('.intro .story')).toContainText('Testhaus');
  await page.getByRole('button', { name: 'Weiter' }).click();
  await expect(page.getByRole('heading', { name: 'Der Bergbote' })).toBeVisible();
  await expect(page.getByText('Ausgabe Nr. 1')).toBeVisible();
  await expect(page.getByLabel('Tagesstatus')).toContainText('Tag 1');

  // question of the day
  await page.getByRole('button', { name: 'Schnee' }).click();
  await expect(page.getByText('Richtig! Gut gelesen.')).toBeVisible();

  // puzzle of the day (day 1 = number field): tip, then skip; both are free
  await expect(page.getByRole('heading', { name: /Rätsel des Tages: Zahlenfeld/ })).toBeVisible();
  await page.getByRole('button', { name: 'Tipp 1' }).click();
  await expect(page.getByText(/Tipp 1:/)).toBeVisible();
  await page.getByRole('button', { name: 'Überspringen' }).click();
  await expect(page.getByText('Das Rätsel ist beendet. Morgen gibt es ein neues.')).toBeVisible();

  // hotel: an empty topic costs nothing is covered by unit tests; here a real action
  await page.getByRole('navigation').getByRole('button', { name: 'Tag', exact: true }).click();
  // floor plan: every room of the test case, you are in one, a tap only previews (no move)
  await expect(page.locator('.hotelplan .rm')).toHaveCount(2);
  await expect(page.locator('.hotelplan .rm.here')).toHaveCount(1);
  await page
    .getByRole('button', { name: /^Keller/ })
    .first()
    .click();
  await expect(page.getByText('Wähle den Raum bei „Gute Nacht“.')).toBeVisible();
  await expect(page.locator('.hotelplan .rm.here')).toHaveCount(1);
  // room scene: props at their spots, the list of things is folded but reachable
  await expect(page.locator('.scene .spot').first()).toBeVisible();
  await expect(page.locator('details.help')).not.toHaveAttribute('open', '');
  await page.locator('details.help summary').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('details.help')).toHaveAttribute('open', '');
  // Anna's find already came with the newspaper, so only Cora's statement is new
  await page.getByRole('button', { name: /Cora/ }).last().click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /Die Nacht/ })
    .click();
  await expect(page.getByRole('heading', { name: 'Neu in deiner Akte' })).toBeVisible();
  // dialog popup: speech bubbles, closed with the button
  await expect(page.locator('.bubble')).toHaveCount(2);
  await page.getByRole('button', { name: 'Schließen' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  // exploring is free: progress counts finds, no action budget any more
  // talking is free: the budget of day 1 is untouched
  await expect(page.locator('.bar .actions')).toContainText('(1/1)');
  await expect(page.getByText('!', { exact: true })).toHaveCount(0);

  await page.keyboard.press('Escape');

  // dossier shows the find, tagged as fact
  await page.getByRole('navigation').getByRole('button', { name: /Akte/ }).click();
  // the filters are folded away so that the cards start high; the button opens them
  await expect(page.getByLabel('Suche')).toBeHidden();
  await page.getByRole('button', { name: /Filter/ }).click();
  await expect(page.getByLabel('Suche')).toBeVisible();
  await page.getByRole('button', { name: /Filter/ }).click();
  // folder with index cards: open a person, read the fact and the statement from the talks
  await page.getByRole('button', { name: /^Cora/ }).click();
  await expect(page.getByText('Ich war die ganze Nacht in der Halle.')).toBeVisible();
  await expect(page.getByText('Das kann falsch sein.')).toBeVisible();
  // Anna's find came with the newspaper: it sits under the places, in "Allgemein"
  await page.getByRole('tab', { name: 'Orte' }).click();
  await expect(page.getByRole('tab', { name: 'Orte', selected: true })).toBeVisible();
  await page.getByRole('button', { name: /^Allgemein/ }).click();
  await expect(page.getByText('Ben ist als Dieb ausgeschlossen.')).toBeVisible();
  await expect(page.getByText('Das stimmt.').first()).toBeVisible();
  await page.getByRole('tab', { name: 'Dokumente' }).click();
  await expect(page.getByRole('heading', { name: 'Dokumente' })).toBeVisible();

  // end the day with a confirmation
  await page.getByRole('navigation').getByRole('button', { name: 'Tag', exact: true }).click();
  await page.getByRole('button', { name: /Gute Nacht/ }).click();
  await expect(page.getByText('Danach kannst du diesen Tag nicht mehr ändern.')).toBeVisible();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /^Keller/ })
    .click();
  await page.getByRole('button', { name: 'Ja, Tag beenden' }).click();
  await expect(page.getByText(/^Tag 2 ·/)).toBeVisible();
  // the page stays: a red chip says the day is over, no jump to the next day
  await expect(page.getByText('Tag beendet')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Gute Nacht' })).toBeVisible();

  // next day: newspaper of day 2, now in the cellar
  await page.getByRole('button', { name: 'Zeitung' }).click();
  await expect(page.getByText('Ausgabe Nr. 2')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Der Keller ist kalt' })).toBeVisible();
  // day 2 puzzle = letter salad; the test knows the word list
  await expect(page.getByRole('heading', { name: /Buchstabensalat/ })).toBeVisible();
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

  // a latecomer goes on to the next day by button: narrative of day 2, then the day
  await page.getByRole('navigation').getByRole('button', { name: 'Tag', exact: true }).click();
  await page.getByRole('button', { name: 'Nächsten Tag spielen' }).click();
  await expect(page.getByRole('heading', { name: 'Tag 2' })).toBeVisible();
  await expect(page.locator('.intro .story')).toContainText('Keller');
  await page.getByRole('button', { name: 'Weiter' }).click();
  await page.getByRole('navigation').getByRole('button', { name: 'Tag', exact: true }).click();
  await page.getByText('Erzählung noch einmal lesen').click();
  await expect(page.getByText('Im Keller riecht es nach Stein')).toBeVisible();
  await page.getByRole('navigation').getByRole('button', { name: 'Tag', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Keller', exact: true })).toBeVisible();
  // "Umsehen" makes everything tappable glint
  await page.getByRole('button', { name: /Umsehen/ }).click();
  await expect(page.locator('.scene .spot.glint').first()).toBeVisible();
  await expect(page.locator('.bar .actions')).toContainText('(2/2)');
  await page.getByRole('button', { name: /Kiste/ }).last().click();
  await expect(page.getByText('Du siehst es dir an. Das kostet nichts.')).toBeVisible();
  await page.getByRole('button', { name: /Genauer untersuchen \(kostet 1 Aktion\)/ }).click();
  await expect(page.getByText(/verschlossen/).first()).toBeVisible();
  // a locked chest brought nothing: no action spent
  await expect(page.locator('.bar .actions')).toContainText('(2/2)');
  await page.keyboard.press('Escape');
  // (the lock itself comes back as a thing in the scene with WP18: open it for now)
  const sql2 = postgres({ ...connInfo('staging'), ssl: 'require', max: 1 });
  await sql2`update players set state = jsonb_set(state, '{puzzles}', '{"p_code":{"solved":true,"hints":0,"attempts":1}}'::jsonb) where name = ${NAME}`;
  await sql2.end();
  await page.reload();
  await page.getByRole('button', { name: /Kiste/ }).last().click();
  await page.getByRole('button', { name: /Genauer untersuchen/ }).click();
  await expect(page.getByRole('heading', { name: 'Neu in deiner Akte' })).toBeVisible();
  // note popup: the little paper with sender and receiver
  await expect(page.locator('.zettel').getByText('Von Ben an Cora')).toBeVisible();
  // WP06d: pocket the document, read it again from the inventory
  await page.getByRole('button', { name: /Einstecken/ }).click();
  await expect(page.getByText(/Eingesteckt/).first()).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: /Zettel aus der Kiste/ }).click();
  await expect(page.locator('.zettel').getByText('Von Ben an Cora')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  // the finding cost one action (the bar says so too)
  await expect(page.locator('.bar .actions')).toContainText('(1/2)');
  // the dossier lists the document; opening it reads it
  await page.getByRole('navigation').getByRole('button', { name: /Akte/ }).click();
  await page.getByRole('tab', { name: 'Dokumente' }).click();
  await page.getByRole('button', { name: /Zettel aus der Kiste/ }).click();
  await expect(page.locator('.zettel').getByText('Von Ben an Cora')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('navigation').getByRole('button', { name: 'Tag', exact: true }).click();
  // WP06d: the chest is drawn as a prop and now shows its open state
  await expect(page.locator('.scene svg[data-prop="truhe"][data-state="auf"]')).toBeVisible();

  // no horizontal scrolling at 360 px, also with the biggest font
  const overflow = () =>
    page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(await overflow()).toBe(false);
  await page.getByRole('button', { name: /Einstellungen/ }).click();
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

test('timeline: place two cards, the contradiction shows; theory is saved', async ({ page }) => {
  const sql = postgres({ ...connInfo('staging'), ssl: 'require', max: 1 });
  await sql`update players set settings = '{}'::jsonb, state = jsonb_set(jsonb_set(jsonb_set(state, '{found}', '["f_cora_keller","s_cora_halle"]'::jsonb), '{discoveries}', '[{"sourceId":"src_lampe","itemIds":["f_cora_keller"],"day":1},{"sourceId":"src_cora","itemIds":["s_cora_halle"],"day":1}]'::jsonb), '{timeline}', '[]'::jsonb) where name = ${NAME}`;
  await sql.end();

  await page.goto(`/?now=${NOW}#/test`);
  await page.getByRole('button', { name: new RegExp(NAME) }).click();
  await page.getByRole('navigation').getByRole('button', { name: /Akte/ }).click();
  // a link sits on the card of the person it is about; booking it is once only
  await page.getByRole('button', { name: /^Cora/ }).click();
  await expect(page.getByText('Das erinnert dich an Coras Weg durch das Haus.')).toBeVisible();
  await page.getByRole('button', { name: /Verknüpfen/ }).click();
  await expect(page.getByText('✓ verknüpft')).toBeVisible();
  await page.getByRole('tab', { name: 'Zeit' }).click();

  for (const card of [/Fakt: In Keller/, /Aussage: In Halle/]) {
    await page.getByRole('button', { name: card }).click();
    await page.getByRole('button', { name: /Hierhin legen/ }).click();
    await expect(page.getByRole('button', { name: card })).toHaveCount(0);
  }
  await expect(page.getByRole('alert').getByText(/Passt nicht: Cora/)).toBeVisible();

  await page
    .getByRole('navigation')
    .getByRole('button', { name: /Theorie/ })
    .click();
  await page.getByLabel('Wer war der Dieb?').selectOption({ label: 'Anna' });
  await page.getByRole('button', { name: 'Theorie speichern' }).click();
  await expect(page.getByRole('button', { name: 'Theorie speichern' })).toBeDisabled();
});
