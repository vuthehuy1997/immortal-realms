import { expect, test } from '@playwright/test';
import { goToNpc, newGame, shot, st } from './helpers';

test.describe('economy, alchemy, loot rarity, minimap', () => {
  test('Merchant Qiao: buy with spirit stones, sell items, cannot overspend, Esc closes', async ({ page }) => {
    await newGame(page);
    await goToNpc(page, 'merchant-qiao');
    await page.keyboard.press('e');
    await expect(page.locator('#trade')).toBeVisible();
    await expect(page.locator('#trade .who')).toContainText('Merchant Qiao');
    await expect(page.locator('#purse')).toHaveText('30');
    await shot(page, 'shop');
    await page.click('[data-buy="hp-potion"]');
    await expect(page.locator('#purse')).toHaveText('18');
    expect((await st(page)).items).toContain('hp-potion:3');
    await expect(page.locator('[data-buy="steel-blade"]')).toBeDisabled();
    await page.evaluate(() => window.__rpg!.give('spirit-herb', 2));
    await page.keyboard.press('Escape'); await expect(page.locator('#trade')).toBeHidden();
    await goToNpc(page, 'merchant-qiao'); await page.keyboard.press('e');
    await expect(page.locator('#trade')).toBeVisible();
    const herbSlot = (await st(page)).items.findIndex((i) => i.startsWith('spirit-herb'));
    await page.click(`[data-sell="${herbSlot}"]`);
    await expect(page.locator('#purse')).toHaveText('24'); // 18 + 6
    await page.keyboard.press('Escape');
    await expect(page.locator('#trade')).toBeHidden();
    const t0 = (await st(page)).now;
    await expect.poll(async () => (await st(page)).now).toBeGreaterThan(t0); // the simulation resumed
  });

  test('buying a weapon, equipping it, and rarity colours in the bag', async ({ page }) => {
    await newGame(page);
    await page.evaluate(() => window.__rpg!.give('steel-blade', 1));
    await page.keyboard.press('i');
    const slot = (await st(page)).items.findIndex((i) => i.startsWith('steel-blade'));
    const cell = page.locator(`#invgrid .cell[data-slot="${slot}"]`);
    await expect(cell).toHaveCSS('border-top-color', 'rgb(88, 200, 120)'); // uncommon = green
    await cell.hover();
    await expect(page.locator('#tip')).toContainText('uncommon');
    await cell.click();
    expect((await st(page)).weapon).toBe('steel-blade');
  });

  test('Alchemist Yun brews potions from gathered herbs', async ({ page }) => {
    await newGame(page);
    await goToNpc(page, 'alchemist-yun'); await page.keyboard.press('e');
    await expect(page.locator('#trade .who')).toContainText('Alchemist Yun');
    await expect(page.locator('[data-craft="brew-hp"]')).toBeDisabled(); // no herbs yet
    await page.evaluate(() => window.__rpg!.give('spirit-herb', 3));
    await page.keyboard.press('Escape');
    await goToNpc(page, 'alchemist-yun'); await page.keyboard.press('e');
    await expect(page.locator('[data-craft="brew-qi"]')).toBeEnabled();
    await shot(page, 'alchemy');
    await page.click('[data-craft="brew-qi"]');
    await expect(page.locator('#purse')).toHaveText('22'); // 30 - 8
    expect((await st(page)).items.join(',')).toContain('qi-pill:1');
    expect((await st(page)).items.join(',')).toContain('spirit-herb:1');
    await expect(page.locator('[data-craft="brew-qi"]')).toBeDisabled(); // only 1 herb left, the pill needs 2
    await page.click('[data-craft="brew-hp"]');
    expect((await st(page)).items.join(',')).toContain('hp-potion:3');
  });

  test('minimap shows terrain around the player', async ({ page }) => {
    await newGame(page);
    const m = page.locator('#minimap');
    await expect(m).toBeVisible();
    const box = (await m.boundingBox())!;
    expect(box.width).toBeGreaterThan(100); expect(Math.abs(box.width - box.height)).toBeLessThan(2);
    const painted = await page.evaluate(() => { const c = document.getElementById('minimap') as HTMLCanvasElement; const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]! > 0) n++; return n; });
    expect(painted).toBeGreaterThan(5000);
    await shot(page, 'minimap');
  });
});
