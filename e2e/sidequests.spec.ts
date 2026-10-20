import { expect, test } from '@playwright/test';
import { finishPests, goToNpc, newGame, st, talk } from './helpers';

test.describe('side quests', () => {
  test('the merchant offers a quest alongside his shop once the first quest is done', async ({ page }) => {
    await newGame(page);
    await goToNpc(page, 'merchant-qiao'); await page.keyboard.press('e'); // no quest yet: straight to the shop
    await expect(page.locator('#trade')).toBeVisible();
    await page.keyboard.press('Escape'); await expect(page.locator('#trade')).toBeHidden();

    await finishPests(page);
    await page.keyboard.press('Escape'); await expect(page.locator('#dlg')).toBeHidden();
    await goToNpc(page, 'merchant-qiao'); await talk(page);
    await expect(page.locator('#dlg')).toContainText('Marsh toads');
    await page.keyboard.press('2'); // Browse wares
    await expect(page.locator('#trade')).toBeVisible();
    await page.keyboard.press('Escape');
    await talk(page); await page.keyboard.press('1');
    await expect(page.locator('.toast', { hasText: 'Quest accepted' })).toBeVisible();
    expect((await st(page)).quests.toads).toBe('active');
  });
});
