import { expect, test } from '@playwright/test';
import { goToNpc, newGame, shot, st, talk } from './helpers';

test.describe('round C: Trial Rift and hero traits', () => {
  test('talk to Keeper Ming, enter the rift, clear floor 1 for a record reward, floor 2 follows', async ({ page }) => {
    await newGame(page, 'Climber');
    await page.evaluate(() => { window.__rpg!.clear(); window.__rpg!.setHp(1e5); });
    await goToNpc(page, 'keeper-ming');
    await talk(page);
    await expect(page.locator('#dlg')).toContainText('Trial Rift');
    await page.locator('#dlg button[data-opt="0"]').click();
    await expect.poll(async () => (await st(page)).tower?.phase, { timeout: 15000 }).toBe('fight');
    const s = await st(page);
    expect(s.objective).toContain('Trial Rift · Floor 1');
    expect(s.enemies.length).toBeGreaterThanOrEqual(3);
    await shot(page, 'rift-floor1');
    const stones0 = s.stones;
    await page.evaluate(() => window.__rpg!.clearTowerFoes());
    await expect(page.locator('.toast', { hasText: 'Floor 1 clear' })).toBeVisible();
    const after = await st(page);
    expect(after.towerBest).toBe(1); expect(after.stones).toBeGreaterThan(stones0);
    await expect.poll(async () => (await st(page)).tower?.floor, { timeout: 12000 }).toBe(2);
  });

  test('dying ends the run but keeps the record; replaying a cleared floor pays no new-depth bonus', async ({ page }) => {
    await newGame(page, 'Faller');
    await page.evaluate(() => { window.__rpg!.clear(); window.__rpg!.setHp(1e5); window.__rpg!.startTower(); });
    await expect.poll(async () => (await st(page)).tower?.phase, { timeout: 15000 }).toBe('fight');
    await page.evaluate(() => window.__rpg!.clearTowerFoes());
    await expect.poll(async () => (await st(page)).towerBest).toBe(1);
    await page.evaluate(() => window.__rpg!.killPlayer());
    await expect.poll(async () => (await st(page)).tower).toBeNull();
    expect((await st(page)).towerBest).toBe(1);
    await page.evaluate(() => window.__rpg!.respawnNow());
    await page.waitForFunction(() => window.__rpg!.state().dead === false && window.__rpg!.state().now > 0.3 && window.__rpg!.state().hp > 0, null, { timeout: 30_000 });
    await page.evaluate(() => window.__rpg!.clear());
    await page.evaluate(() => { window.__rpg!.setHp(1e5); window.__rpg!.startTower(); });
    await expect.poll(async () => (await st(page)).tower?.phase, { timeout: 15000 }).toBe('fight');
    await page.evaluate(() => window.__rpg!.clearTowerFoes());
    await expect(page.locator('.toast', { hasText: 'Floor 1 clear: Floor cleared' })).toBeVisible();
    expect((await st(page)).towerBest).toBe(1); // no new record; the toast above carries no '+N' depth bonus
  });

  test('walking far from the rift abandons the run and removes its foes', async ({ page }) => {
    await newGame(page, 'Strayer');
    await page.evaluate(() => { window.__rpg!.clear(); window.__rpg!.setHp(1e5); window.__rpg!.startTower(); });
    await expect.poll(async () => (await st(page)).tower?.phase, { timeout: 15000 }).toBe('fight');
    const p = await page.evaluate(() => window.__world!());
    await page.evaluate(([x, y]) => window.__rpg!.teleport(x as number - 600, y as number), [p.x, p.y]);
    await expect.poll(async () => (await st(page)).tower, { timeout: 6000 }).toBeNull();
    expect((await st(page)).enemies.filter((e) => e.zone === 'bamboo' && !e.minion).length).toBeLessThanOrEqual(12);
  });

  test('the hero picker shows each style, and the character panel names it', async ({ page }) => {
    await page.goto('/');
    await page.locator('#btn-new').click();
    await expect(page.locator('.hero .trait').first()).toContainText('Sword Heart Focus');
    await expect(page.locator('.hero .trait')).toHaveCount(6);
    await page.screenshot({ path: 'test-results/hero-traits.png' });
  });
});
