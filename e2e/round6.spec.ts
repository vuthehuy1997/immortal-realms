import { expect, test } from '@playwright/test';
import { newGame, st } from './helpers';

test.describe('round F: QA report 5 leftovers', () => {
  test('the character panel lets spare points go into Dao Insight', async ({ page }) => {
    await newGame(page, 'Insight');
    await page.evaluate(() => window.__rpg!.giveXp(2000));
    await page.keyboard.press('KeyC');
    const btn = page.locator('button[data-insight="vitality"]');
    await expect(btn).toBeEnabled();
    const before = (await st(page)).maxHp;
    await btn.click();
    await expect(page.locator('.toast', { hasText: 'Insight deepened' })).toBeVisible();
    await expect.poll(async () => (await st(page)).maxHp).toBeGreaterThan(before);
    await expect(page.locator('#chrbody')).toContainText('Rank 1/15');
  });

  test('the boon picker works without a mouse: arrows move focus, E (or a pad A press) takes the card', async ({ page }) => {
    await newGame(page, 'Padder');
    await page.evaluate(() => { window.__rpg!.addBoonPicks(1); window.__rpg!.offerBoon(); });
    await expect(page.locator('#boonpick .boon')).toHaveCount(3);
    const ids = await page.locator('#boonpick .boon').evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.boon));
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('e');
    await expect(page.locator('#boonpick')).toHaveCount(0);
    expect((await st(page)).boons).toEqual([ids[1]]);
  });

  test('test hooks are absent for a normal browser (no webdriver flag, no ?debug=1)', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.addInitScript(() => Object.defineProperty(navigator, 'webdriver', { get: () => false }));
    await page.goto('/');
    await page.locator('#btn-new').click();
    await page.locator('#name').fill('Honest');
    await page.locator('#btn-start').click();
    await expect(page.locator('#skills')).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(1500);
    expect(await page.evaluate(() => ({ rpg: typeof (window as unknown as { __rpg?: unknown }).__rpg, game: typeof (window as unknown as { __game?: unknown }).__game }))).toEqual({ rpg: 'undefined', game: 'undefined' });
    await ctx.close();
  });

  test('on a 360x640 phone screen the minimap no longer covers the vitals or the objective', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await newGame(page, 'Tiny');
    const box = async (sel: string) => (await page.locator(sel).boundingBox())!;
    const mm = await box('#minimap'), obj = await box('#objective');
    expect(mm.width).toBeLessThan(120);
    const overlap = !(mm.x + mm.width < obj.x || obj.x + obj.width < mm.x || mm.y + mm.height < obj.y || obj.y + obj.height < mm.y);
    expect(overlap).toBe(false);
    const sk = await box('#skills');
    expect(sk.x).toBeGreaterThanOrEqual(0); expect(sk.x + sk.width).toBeLessThanOrEqual(361);
    await page.screenshot({ path: 'test-results/small-portrait-fixed.png' });
  });
});
