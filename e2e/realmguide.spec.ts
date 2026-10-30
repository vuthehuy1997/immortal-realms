import { expect, test } from '@playwright/test';
import { newGame, st, waitGame } from './helpers';

test.describe('realm breakthrough guidance', () => {
  test('the HUD walks the player from level-up to a finished breakthrough', async ({ page }) => {
    await newGame(page, 'Guide');
    const hint = page.locator('#realmhint');
    await expect(hint).toBeHidden(); // on pace at level 1: nothing is owed
    await page.evaluate(() => window.__rpg!.giveXp(400)); // enough for level 5+ (Qi Condensation II needs level 5)
    await waitGame(page, 0.3);
    expect((await st(page)).level).toBeGreaterThanOrEqual(5);
    await expect(hint).toBeVisible();
    await expect(page.locator('#realmtxt')).toContainText('fill your qi');

    await page.evaluate(() => window.__rpg!.setQi(100000));
    await waitGame(page, 0.3);
    await expect(page.locator('#realmtxt')).toContainText('Foundation Pill');

    await page.evaluate(() => window.__rpg!.give('foundation-pill', 1));
    await waitGame(page, 0.3);
    await expect(page.locator('#realmtxt')).toContainText('press B');
    await expect(hint).toHaveClass(/go/);
    await expect(page.locator('.xbar.qi')).toHaveClass(/ready/);
    await page.screenshot({ path: 'qc-artifacts/realm-guide-ready.png' });

    await page.evaluate(() => window.__rpg!.setRoll(0));
    await page.keyboard.press('KeyB');
    await expect.poll(async () => (await st(page)).realm).toBe(1);
    await waitGame(page, 0.3);
    await expect(hint).toBeHidden();
  });

  test('a hero far behind the realm they should have gets the loud warning and a death-screen reminder', async ({ page }) => {
    await newGame(page, 'Lag');
    await page.evaluate(() => window.__rpg!.giveXp(60000));
    await waitGame(page, 0.3);
    await expect(page.locator('#realmhint')).toHaveClass(/warn/);
    await page.screenshot({ path: 'qc-artifacts/realm-guide-warn.png' });
    await page.evaluate(() => window.__rpg!.killPlayer());
    await expect(page.locator('#deathtxt')).toContainText('Tip: Break through');
  });
});
