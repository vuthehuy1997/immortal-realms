import { expect, test } from '@playwright/test';
import { acceptFirst, goToNpc, newGame, shot, st, talk } from './helpers';

const nearBoss = async (page: import('@playwright/test').Page, dx = -100) => {
  const s = await st(page);
  await page.evaluate(([x, y]) => window.__rpg!.teleport(x as number, y as number), [s.lair.x + dx, s.lair.y]);
};

test.describe('#7 boss', () => {
  test('boss waits in its lair, engages on approach, shows a bar, telegraphs and slams', async ({ page }) => {
    await newGame(page);
    const s0 = await st(page);
    expect(s0.boss).not.toBeNull(); expect(s0.boss!.engaged).toBe(false);
    await expect(page.locator('#boss')).toBeHidden();
    await page.evaluate(() => window.__rpg!.setHp(1e5));
    await nearBoss(page);
    await expect.poll(async () => (await st(page)).boss?.engaged).toBe(true);
    await expect(page.locator('#boss')).toBeVisible();
    await expect(page.locator('#bossname')).toContainText('Stone Warden');
    await expect.poll(async () => (await st(page)).boss?.state, { timeout: 40_000 }).toBe('slam-windup');
    await shot(page, 'boss-telegraph');
    await expect.poll(async () => (await st(page)).boss?.slams, { timeout: 30_000 }).toBeGreaterThanOrEqual(1); // the telegraph is followed by a real slam
  });

  test('slam damages a player standing in it, but not one who dodged away', async ({ page }) => {
    await newGame(page);
    await page.evaluate(() => window.__rpg!.setHp(5000));
    await nearBoss(page, -60);
    await expect.poll(async () => (await st(page)).boss?.state, { timeout: 40_000 }).toBe('slam-windup');
    const b = (await st(page)).boss!; const hpBefore = (await st(page)).hp;
    await page.evaluate(([x, y]) => window.__rpg!.teleport(x as number, y as number), [b.x - 120, b.y]); // dodge out of the circle
    await expect.poll(async () => (await st(page)).boss?.slams, { timeout: 30_000 }).toBe(b.slams + 1);
    expect((await st(page)).hp).toBeGreaterThanOrEqual(hpBefore - 1); // dodged: no slam damage
  });

  test('slam damages a player who stays in the circle', async ({ page }) => {
    await newGame(page);
    await page.evaluate(() => window.__rpg!.setHp(5000));
    await nearBoss(page, -60);
    await expect.poll(async () => (await st(page)).boss?.state, { timeout: 40_000 }).toBe('slam-windup');
    const b = (await st(page)).boss!; const hpBefore = (await st(page)).hp;
    await page.evaluate(([x, y]) => window.__rpg!.teleport(x as number, y as number), [b.x - 10, b.y]); // stand inside the circle
    await expect.poll(async () => (await st(page)).boss?.slams, { timeout: 30_000 }).toBe(b.slams + 1);
    expect((await st(page)).hp).toBeLessThan(hpBefore);
  });

  test('phase 2 summons minions; phase 3 enrages and fires a projectile ring', async ({ page }) => {
    await newGame(page);
    await page.evaluate(() => window.__rpg!.setHp(1e5));
    await nearBoss(page, -110);
    await expect.poll(async () => (await st(page)).boss?.engaged).toBe(true);
    await page.evaluate(() => window.__rpg!.setBossHpRatio(0.6));
    await expect(page.locator('.toast', { hasText: 'calls its brood' })).toBeVisible();
    await expect.poll(async () => (await st(page)).enemies.filter((e) => e.minion).length, { timeout: 40_000 }).toBeGreaterThan(0);
    expect((await st(page)).boss!.phase).toBe(2);
    await page.evaluate(() => window.__rpg!.setBossHpRatio(0.2));
    await expect(page.locator('.toast', { hasText: 'enraged' })).toBeVisible();
    expect((await st(page)).boss!.phase).toBe(3);
    await expect.poll(async () => (await st(page)).boss?.state, { timeout: 40_000 }).toBe('ring-windup');
    await shot(page, 'boss-phase3');
  });

  test('defeating the boss drops its reward, completes the quest chain, and persists', async ({ page }) => {
    await newGame(page, 'Slayer');
    await page.evaluate(() => { window.__rpg!.setHp(1e5); window.__rpg!.setRoll(0.5); });
    // fast-forward quest 1 through the real dialogue so quest 2 can be accepted
    await goToNpc(page); await talk(page); await acceptFirst(page);
    await page.evaluate(() => { window.__rpg!.give('spirit-herb', 2); });
    for (let i = 0; i < 4; i++) {
      const p = await page.evaluate(() => window.__world!());
      await page.evaluate(([x, y]) => window.__rpg!.spawn('slime', (x as number) + 14, y as number), [p.x, p.y]);
      for (let k = 0; k < 20 && (await st(page)).enemies.length; k++) { await page.evaluate(([x, y]) => window.__rpg!.cast(0, (x as number) + 30, y as number), [p.x, p.y]); await page.waitForTimeout(150); }
    }
    await goToNpc(page); await talk(page); await page.click('#dlg button[data-opt="0"]'); // claim
    await expect(page.locator('#dlg')).toContainText('Stone Warden');
    await page.click('#dlg button[data-opt="0"]'); // accept the Warden quest from the chained dialogue
    await expect(page.locator('#quest')).toContainText('The Stone Warden');
    await nearBoss(page, -100);
    await expect.poll(async () => (await st(page)).boss?.engaged).toBe(true);
    await page.evaluate(() => window.__rpg!.setRoll(0));
    await page.evaluate(() => window.__rpg!.setBossHpRatio(0.001));
    const b = (await st(page)).boss!;
    await page.evaluate(([x, y]) => window.__rpg!.teleport((x as number) - 16, y as number), [b.x, b.y]);
    await page.evaluate(([x, y]) => window.__rpg!.cast(2, x as number, y as number), [b.x, b.y]);
    await expect.poll(async () => (await st(page)).bossDefeated).toBe(true);
    const s = await st(page);
    expect(s.boss).toBeNull();
    expect(s.items.join(',')).toContain('jade-sword:1');
    await expect(page.locator('#boss')).toBeHidden();
    await expect(page.locator('#quest')).toContainText('1/1');
    await goToNpc(page); await talk(page); await page.click('#dlg button[data-opt="0"]');
    await expect.poll(async () => (await st(page)).quests.warden).toBe('turnedIn');
    expect((await st(page)).quests.warden).toBe('turnedIn');
    await expect(page.locator('#dlg')).toContainText('quiet');
    // persistence: after reload + Continue the boss stays dead
    await page.keyboard.press('Escape'); // closes the chained dialogue
    await expect(page.locator('#dlg')).toBeHidden();
    await page.keyboard.press('Escape'); await page.click('#btn-save');
    await page.reload(); await page.click('#btn-continue'); await page.waitForFunction(() => window.__rpg);
    expect((await st(page)).boss).toBeNull(); expect((await st(page)).bossDefeated).toBe(true);
  });
});
