import { expect, test } from '@playwright/test';
import { me, newGame, st } from './helpers';

test.describe('sustain: spirit flask and mana from hits (QA report 3)', () => {
  test('F drinks the flask first (percentage heal), the HUD shows charges + potions', async ({ page }) => {
    await newGame(page, 'Flasker');
    await expect(page.locator('#cnt-hp')).toHaveText('3+2');
    await page.evaluate(() => window.__rpg!.setHp(10));
    await page.keyboard.press('KeyF');
    await expect(page.locator('.toast', { hasText: 'Spirit flask' })).toBeVisible();
    await expect(page.locator('#cnt-hp')).toHaveText('2+2'); // flask spent, potions untouched
    const s = await st(page);
    expect(s.hp).toBeGreaterThan(10 + s.maxHp * 0.3);
    expect(s.hp).toBeLessThan(10 + s.maxHp * 0.4);
  });

  test('landing sword hits restores mana', async ({ page }) => {
    await newGame(page, 'Manaman');
    const p = await me(page);
    await page.evaluate(([x, y]) => window.__rpg!.spawn('wolf', (x as number) + 24, y as number), [p.x, p.y]);
    const before = (await st(page)).mana;
    await page.evaluate(() => window.__rpg!.cast(0, 9999, 0)); // spend mana on a technique
    const spent = (await st(page)).mana;
    expect(spent).toBeLessThan(before);
    await page.waitForTimeout(500);
    for (let i = 0; i < 3; i++) { await page.evaluate(([x, y]) => window.__rpg!.attack(x as number + 24, y as number), [p.x, p.y]); await page.waitForTimeout(450); }
    expect((await st(page)).mana).toBeGreaterThan(spent + 2);
  });
});
