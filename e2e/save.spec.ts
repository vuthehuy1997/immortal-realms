import { expect, test } from '@playwright/test';
import { acceptFirst, goToNpc, killOne, me, newGame, SAVE_KEY, st, talk } from './helpers';

test.describe('#14 save / load', () => {
  test('Save & Quit -> Continue restores level, position, quest, inventory, realm', async ({ page }) => {
    await newGame(page, 'Saver', 'verdant');
    await page.evaluate(() => { window.__rpg!.giveXp(100); window.__rpg!.setQi(40); window.__rpg!.give('iron-sword', 1); });
    await goToNpc(page); await talk(page); await acceptFirst(page);
    await page.evaluate(() => window.__rpg!.teleport(500, 560));
    await page.waitForTimeout(200);
    const before = await st(page); const pos = await me(page);
    await page.keyboard.press('Escape'); await page.click('#btn-quit');
    await expect(page.locator('#btn-continue')).toBeEnabled();
    await expect(page.locator('#hudlayer')).toHaveClass(/hidden/);
    await page.click('#btn-continue'); await page.waitForFunction(() => window.__rpg);
    const after = await st(page); const pos2 = await me(page);
    expect(after.level).toBe(before.level); expect(after.level).toBeGreaterThan(1);
    expect(after.quests.pests).toBe('active'); expect(after.qi).toBeGreaterThanOrEqual(40); expect(after.items).toEqual(before.items);
    expect(Math.hypot(pos2.x - pos.x, pos2.y - pos.y)).toBeLessThan(4);
    await expect(page.locator('#lvl')).toContainText('Saver');
  });

  test('survives a full page reload (data really is in storage)', async ({ page }) => {
    await newGame(page, 'Reload');
    await page.evaluate(() => window.__rpg!.giveXp(60));
    const lvl = (await st(page)).level;
    await page.keyboard.press('Escape'); await page.click('#btn-save');
    await expect(page.locator('.toast', { hasText: 'Game saved' })).toBeVisible();
    await page.reload();
    await expect(page.locator('#btn-continue')).toBeEnabled();
    await page.click('#btn-continue'); await page.waitForFunction(() => window.__rpg);
    expect((await st(page)).level).toBe(lvl);
  });

  test('autosaves when a kill causes a level-up', async ({ page }) => {
    await newGame(page, 'Auto');
    await page.evaluate(() => { window.__rpg!.setHp(1e5); window.__rpg!.giveXp(19); }); // level 1 needs 20 xp
    expect(await page.evaluate((k) => localStorage.getItem(k), SAVE_KEY)).toBeNull(); // direct grants do not save
    await killOne(page, 'slime'); // +10 xp => level 2 => autosave
    await expect.poll(() => page.evaluate((k) => localStorage.getItem(k) !== null, SAVE_KEY)).toBe(true);
    const saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!) as { state: { progress: { level: number } } }, SAVE_KEY);
    expect(saved.state.progress.level).toBe(2);
  });

  test('corrupted / tampered saves are rejected with a message, never crash', async ({ page }) => {
    const errors: string[] = []; page.on('pageerror', (e) => errors.push(e.message));
    await newGame(page, 'Victim');
    await page.keyboard.press('Escape'); await page.click('#btn-save');
    const good = await page.evaluate((k) => localStorage.getItem(k)!, SAVE_KEY);
    const cases: [string, string][] = [
      ['garbage', 'not json at all {{{'],
      ['edited hp', good.replace(/"hp":\d+/, '"hp":99999')],
      ['wrong version', good.replace('"version":1', '"version":99')],
    ];
    for (const [name, bad] of cases) {
      await page.evaluate(([k, v]) => localStorage.setItem(k as string, v as string), [SAVE_KEY, bad]);
      await page.reload();
      await page.click('#btn-continue');
      await expect(page.locator('#menu-error'), name).toContainText('Could not load save');
      await expect(page.locator('#btn-new')).toBeVisible();
    }
    expect(errors).toEqual([]);
    // the menu is still usable afterwards
    await page.click('#btn-new'); await expect(page.locator('#name')).toBeVisible();
  });
});
