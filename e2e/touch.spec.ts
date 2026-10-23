import { expect, test } from '@playwright/test';
import { me, newGame, shot, st } from './helpers';

async function touchGame(page: import('@playwright/test').Page): Promise<void> {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/?touch=1');
  await page.click('#btn-new'); await page.fill('#name', 'Tapper'); await page.click('#btn-start');
  await page.waitForFunction(() => window.__rpg !== undefined && window.__rpg.state().now > 0.2, null, { timeout: 60_000 });
  await page.evaluate(() => window.__rpg!.clear());
}
const centre = async (page: import('@playwright/test').Page, sel: string) => { const b = (await page.locator(sel).boundingBox())!; return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; };

test.describe('touch controls', () => {
  test('hidden on a normal desktop session', async ({ page }) => {
    await newGame(page, 'Desk');
    await expect(page.locator('#touchctl')).toHaveCount(0);
  });

  test('joystick walks, buttons attack / cast / open the menu', async ({ page }) => {
    await touchGame(page);
    await expect(page.locator('#touchctl')).toBeVisible();
    await shot(page, 'touch-controls');
    // joystick: press on the stick centre, drag right
    const c = await centre(page, '#tc-stick'); const a = await me(page);
    await page.mouse.move(c.x, c.y); await page.mouse.down(); await page.mouse.move(c.x + 60, c.y, { steps: 4 });
    await page.waitForTimeout(700);
    await page.mouse.up();
    const b = await me(page);
    expect(b.x - a.x).toBeGreaterThan(8);
    await page.waitForTimeout(400);
    const rest = await me(page); await page.waitForTimeout(300);
    expect(Math.abs((await me(page)).x - rest.x)).toBeLessThan(2);
    // attack button
    await page.click('#tc-attack');
    await expect.poll(async () => (await st(page)).comboStep).toBeGreaterThanOrEqual(0);
    // technique slot tap spends mana (level-1 slot 1 is unlocked)
    await page.waitForTimeout(900); const m0 = (await st(page)).mana;
    await page.click('#slot0');
    await expect.poll(async () => (await st(page)).mana).toBeLessThan(m0);
    // menu button
    await page.click('#tc-menu');
    await expect(page.locator('#btn-resume')).toBeVisible();
    await shot(page, 'touch-pause');
  });
});
