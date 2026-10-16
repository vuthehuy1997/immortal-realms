import { expect, test } from '@playwright/test';
import { newGame, shot, st } from './helpers';

test.describe('#1 main menu / #2 character creation', () => {
  test('menu: New Game enabled, Continue disabled without a save, keyboard navigable', async ({ page }) => {
    const errors: string[] = []; page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/');
    await expect(page.locator('#btn-new')).toBeVisible();
    await expect(page.locator('#btn-continue')).toBeDisabled();
    await expect(page.locator('#btn-new')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#name')).toBeVisible();
    await shot(page, 'menu-create');
    expect(errors).toEqual([]);
  });

  test('name validation: empty, too long, invalid characters', async ({ page }) => {
    await page.goto('/'); await page.click('#btn-new');
    await page.click('#btn-start');
    await expect(page.locator('#name-err')).toContainText('required');
    await page.fill('#name', 'A'.repeat(17)); await page.click('#btn-start');
    await expect(page.locator('#name-err')).toContainText('at most 16');
    await page.fill('#name', '<img onerror=x>'); await page.click('#btn-start');
    await expect(page.locator('#name-err')).toContainText('may contain');
    await expect(page.locator('#hudlayer')).toHaveClass(/hidden/);
  });

  test('three roots with different stats; chosen root applies in game', async ({ page }) => {
    const stats: Record<string, string> = {};
    for (const root of ['flame', 'tide', 'verdant'] as const) {
      await newGame(page, 'Root Test', root);
      await page.keyboard.press('c');
      await expect(page.locator('#chrbody .row').first()).toBeVisible();
      stats[root] = await page.locator('#chrbody').innerText();
      await page.evaluate(() => localStorage.clear());
    }
    expect(new Set(Object.values(stats)).size).toBe(3);
    expect(stats.flame).toMatch(/Flame Root/); expect(stats.tide).toMatch(/Tide Root/); expect(stats.verdant).toMatch(/Verdant Root/);
    expect(stats.verdant).toMatch(/HP\s+135/); expect(stats.tide).toMatch(/Mana\s+70/); expect(stats.flame).toMatch(/Attack\s+13/);
  });

  test('starts the game with the chosen name; HUD visible; pause menu stops the simulation', async ({ page }) => {
    await newGame(page, 'Lin Wei', 'tide');
    await expect(page.locator('#lvl')).toContainText('Lin Wei');
    await expect(page.locator('#lvl')).toContainText('Lv 1');
    await page.keyboard.press('Escape');
    await expect(page.locator('#btn-resume')).toBeVisible();
    const t0 = (await st(page)).now; await page.waitForTimeout(500);
    expect((await st(page)).now).toBe(t0);
    await shot(page, 'pause');
    await page.click('#btn-resume');
    await page.waitForTimeout(300);
    expect((await st(page)).now).toBeGreaterThan(t0);
  });
});
