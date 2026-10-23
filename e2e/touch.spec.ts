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

  test('portrait phone layout: nothing important is covered (stick, buttons, skill bar, minimap, sound)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/?touch=1');
    await page.click('#btn-new'); await page.fill('#name', 'Portrait'); await page.click('#btn-start');
    await page.waitForFunction(() => window.__rpg !== undefined && window.__rpg.state().now > 0.2, null, { timeout: 60_000 });
    await page.waitForTimeout(1500);
    await shot(page, 'touch-portrait');
    const ids = ['#tc-stick', '#tc-attack', '#tc-quest', '#tc-menu', '#skills', '#minimap', '#btn-audio'];
    const boxes = new Map<string, { x: number; y: number; width: number; height: number }>();
    for (const id of ids) { const b = await page.locator(id).boundingBox(); expect(b, id).not.toBeNull(); boxes.set(id, b!); }
    const overlap = (a: { x: number; y: number; width: number; height: number }, b: typeof a) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
    const pairs: [string, string][] = [['#tc-stick', '#skills'], ['#tc-attack', '#skills'], ['#tc-quest', '#skills'], ['#tc-menu', '#skills'], ['#tc-quest', '#btn-audio'], ['#minimap', '#btn-audio'], ['#tc-stick', '#tc-attack']];
    for (const [a, b] of pairs) expect(overlap(boxes.get(a)!, boxes.get(b)!), `${a} overlaps ${b}`).toBe(false);
    for (const id of ids) { const b = boxes.get(id)!; expect(b.x, id).toBeGreaterThanOrEqual(-1); expect(b.x + b.width, id).toBeLessThanOrEqual(391); }
  });
});
