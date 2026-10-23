import { expect, test } from '@playwright/test';
import { me, newGame } from './helpers';

declare global { interface Window { __padState?: { axes: number[]; pressed: number[] } } }

test.describe('controller support', () => {
  test.beforeEach(async ({ page }) => {
    // Fake a standard-mapping pad that the test drives through window.__padState.
    await page.addInitScript(() => {
      window.__padState = { axes: [0, 0], pressed: [] };
      navigator.getGamepads = () => [{
        connected: true, id: 'test pad', index: 0, mapping: 'standard', timestamp: 0,
        axes: window.__padState!.axes,
        buttons: Array.from({ length: 17 }, (_, i) => ({ pressed: window.__padState!.pressed.includes(i), touched: false, value: 0 })),
      } as unknown as Gamepad];
    });
  });

  test('left stick walks the hero, buttons open the pause menu', async ({ page }) => {
    await newGame(page, 'Padder');
    const a = await me(page);
    await page.evaluate(() => { window.__padState!.axes = [1, 0]; });
    await page.waitForTimeout(700);
    await page.evaluate(() => { window.__padState!.axes = [0, 0]; });
    const b = await me(page);
    expect(b.x - a.x).toBeGreaterThan(8);
    await page.waitForTimeout(150);
    const still = await me(page);
    await page.waitForTimeout(300);
    const still2 = await me(page);
    expect(Math.abs(still2.x - still.x)).toBeLessThan(2); // released stick stops the hero
    await page.evaluate(() => { window.__padState!.pressed = [9]; }); // Start
    await expect(page.locator('#btn-resume')).toBeVisible();
    await page.evaluate(() => { window.__padState!.pressed = []; });
  });

  test('A button attacks (combo advances), holding it does not auto-repeat', async ({ page }) => {
    await newGame(page, 'Padder2');
    await page.evaluate(() => { window.__padState!.pressed = [0]; });
    await expect.poll(async () => (await page.evaluate(() => window.__rpg!.state())).comboStep).toBeGreaterThanOrEqual(0); // starts at -1
    await page.waitForTimeout(600); // still held: no second press edge, so the combo does not advance
    expect((await page.evaluate(() => window.__rpg!.state())).comboStep).toBe(0);
    await page.evaluate(() => { window.__padState!.pressed = []; });
  });
});
