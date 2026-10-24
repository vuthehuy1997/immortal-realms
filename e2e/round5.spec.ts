import { expect, test } from '@playwright/test';
import { goToNpc, newGame, st, talk } from './helpers';

test.describe('round E: QA report 5 fixes', () => {
  test('repeated identical toasts merge into one with a count and the stack stays small', async ({ page }) => {
    await newGame(page, 'Spammer');
    await page.evaluate(() => window.__rpg!.setHp(1e5));
    for (let i = 0; i < 12; i++) await page.keyboard.press('KeyG'); // no mana potion: same message every time
    await page.waitForTimeout(300);
    expect(await page.locator('.toast').count()).toBeLessThanOrEqual(4);
    const merged = await page.locator('.toast', { hasText: '×' }).count();
    expect(merged).toBeGreaterThanOrEqual(1);
  });

  test('E confirms the first dialogue option and Q opens the quest log', async ({ page }) => {
    await newGame(page, 'Keys');
    await page.evaluate(() => window.__rpg!.clear());
    await goToNpc(page, 'elder-lin'); await talk(page);
    await page.keyboard.press('e'); // accept the first quest offer
    await expect(page.locator('#dlg')).toBeHidden();
    await expect.poll(async () => Object.values((await st(page)).quests).includes('active')).toBe(true);
    await page.keyboard.press('q');
    await expect(page.locator('#qlog')).toBeVisible();
    await page.keyboard.press('q');
    await expect(page.locator('#qlog')).toBeHidden();
  });

  test('with ?tips=1 a first-time tip appears once and is remembered', async ({ page }) => {
    await page.goto('/?tips=1');
    await page.locator('#btn-new').click();
    await page.locator('#name').fill('Tipper');
    await page.locator('#btn-start').click();
    await page.waitForFunction(() => !!window.__rpg && window.__rpg.state().now > 0.3);
    await page.evaluate(() => window.__rpg!.tip('qlog', 'Press J or Q to open your quest log.'));
    await expect(page.locator('.toast.tip')).toHaveCount(1);
    await page.evaluate(() => window.__rpg!.tip('qlog', 'Press J or Q to open your quest log.'));
    await expect(page.locator('.toast.tip')).toHaveCount(1); // not shown twice
  });

  test('boon cards carry a category tag, and the Rift keeper states the rules', async ({ page }) => {
    await newGame(page, 'Cards');
    await page.evaluate(() => { window.__rpg!.addBoonPicks(1); window.__rpg!.offerBoon(); });
    await expect(page.locator('#boonpick .boon .tag').first()).toBeVisible();
    await page.screenshot({ path: 'test-results/boon-cards-v2.png' });
    await page.keyboard.press('Digit1');
    await page.evaluate(() => window.__rpg!.clear());
    await goToNpc(page, 'keeper-ming'); await talk(page);
    await expect(page.locator('#dlg')).toContainText('Rules');
  });
});
