import { execSync } from 'node:child_process';
import { expect, test } from '@playwright/test';
import postgres from 'postgres';
import { connInfo, readEnv } from '../tools/lib/db';

// Examining really works for a player who starts the game (Berghotel on staging, both profiles):
// the button is there, the counter in the bar drops by one, the find lands in the dossier.
// Rooms where an examination still brings something new on that day: day 2 Christstollen in the
// kitchen, day 6 Heizkessel in the cellar. Day 1 has no examination find by design (the prolog
// starts with talking); on day 3 there is one only in the hall, which the family does not have.
test.use({ actionTimeout: 10_000 });
const env = readEnv();
const TAG = Date.now().toString(36);
const ALL = [
  { slug: 'freunde', day: 2, room: 'kueche' },
  { slug: 'freunde', day: 6, room: 'keller' },
  { slug: 'familie', day: 2, room: 'kueche' },
  { slug: 'familie', day: 6, room: 'keller' },
];
// ONLY=freunde-6 runs a single case while debugging
const CASES = ALL.filter((c) => !process.env.ONLY || process.env.ONLY === `${c.slug}-${c.day}`);
const nameOf = (c: (typeof CASES)[number]) => `E2E-${c.slug}-${c.day}-${TAG}`;

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
  test.setTimeout(300_000);
  const sql = postgres({ ...connInfo('staging'), ssl: 'require', max: 1 });
  for (const c of CASES) {
    const [g] = await sql`select id from games where slug = ${'e2e-' + c.slug}`;
    await admin({ op: 'create', game_id: g?.id, player: { name: nameOf(c), avatar: '\u{1F9EA}' } });
    execSync(`npx tsx tools/fast-forward/index.ts e2e-${c.slug} ${nameOf(c)} ${c.day}`, {
      stdio: 'ignore',
    });
    await sql`update players set state = jsonb_set(state, '{room}', to_jsonb(${c.room}::text)) where name = ${nameOf(c)}`;
  }
  await sql.end();
});

test.afterAll(async () => {
  const sql = postgres({ ...connInfo('staging'), ssl: 'require', max: 1 });
  await sql`delete from players where name like ${`E2E-%-${TAG}`}`;
  await sql.end();
});

for (const c of CASES) {
  test(`${c.slug}, day ${c.day}: examining costs one action and fills the dossier`, async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const now = encodeURIComponent(`2026-12-0${c.day}T12:00:00+01:00`);
    await page.goto(`/?now=${now}#/e2e-${c.slug}`);
    await page.getByRole('button', { name: new RegExp(nameOf(c)) }).click();
    await page.getByRole('button', { name: 'Weiter' }).click();
    const bar = page.locator('.bar .actions');
    await expect(bar).toContainText('Aktionen übrig');
    const [, left, budget] = /\((\d+)\/(\d+)\)/.exec((await bar.textContent()) ?? '') ?? [];
    expect(Number(left)).toBe(Number(budget));
    // the budget of the profile: friends 4, family 3 from day 6 on; the prolog days have less
    if (c.day === 6) expect(Number(budget)).toBe(c.slug === 'freunde' ? 4 : 3);
    if (c.day === 2) expect(Number(budget)).toBe(2);

    await page.getByRole('navigation').getByRole('button', { name: /Akte/ }).click();
    await page.waitForTimeout(500);
    await page.getByRole('tab', { name: 'Verlauf' }).click();
    const before = await page.locator('.sheetfile .find').count();

    await page.getByRole('navigation').getByRole('button', { name: 'Tag', exact: true }).click();
    // try every tappable thing: a try without a find says why and costs nothing
    await page.locator('.scene').waitFor();
    const spots = page.locator('.scene button.spot.object');
    const n = await spots.count();
    let found = false;
    for (let i = 0; i < n && !found; i++) {
      await spots.nth(i).click();
      const go = page.getByRole('button', { name: /Genauer untersuchen \(kostet 1 Aktion\)/ });
      if (await go.isEnabled().catch(() => false)) {
        await go.click();
        found = await page
          .getByRole('heading', { name: 'Neu entdeckt' })
          .waitFor({ timeout: 4000 })
          .then(() => true)
          .catch(() => false);
        if (!found)
          await expect(page.getByRole('dialog').locator('p.small[role="status"]')).not.toBeEmpty();
      }
      await page.keyboard.press('Escape');
    }
    expect(found, 'some thing in the start room brings a find').toBe(true);
    await expect(bar).toContainText(`(${Number(budget) - 1}/${budget})`);

    await page.getByRole('navigation').getByRole('button', { name: /Akte/ }).click();
    await page.waitForTimeout(500);
    await page.getByRole('tab', { name: 'Verlauf' }).click();
    expect(await page.locator('.sheetfile .find').count()).toBeGreaterThan(before);
  });
}
