import { expect, test } from '@playwright/test';
import { finishPests, goToNpc, newGame, shot, st, talk } from './helpers';

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
    await expect(page.locator('#bossname')).toContainText('Fallen Sword Immortal');
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
    await expect(page.locator('.toast', { hasText: 'calls its minions' })).toBeVisible();
    await expect.poll(async () => (await st(page)).enemies.filter((e) => e.minion).length, { timeout: 40_000 }).toBeGreaterThan(0);
    expect((await st(page)).boss!.phase).toBe(2);
    await page.evaluate(() => window.__rpg!.setBossHpRatio(0.2));
    await expect(page.locator('.toast', { hasText: 'enraged' })).toBeVisible();
    expect((await st(page)).boss!.phase).toBe(3);
    await expect.poll(async () => (await st(page)).boss?.state, { timeout: 40_000 }).toBe('ring-windup');
    await shot(page, 'boss-phase3');
  });

  test('the quest chain runs pests -> fox -> immortal; the fox boss drops its saber', async ({ page }) => {
    await newGame(page, 'Fox Hunter');
    await finishPests(page);
    await expect(page.locator('#dlg')).toContainText('nine-tailed fox');
    await page.click('#dlg button[data-opt="0"]'); // accept the fox quest
    await expect(page.locator('#quest')).toContainText('The Fox of the Peach Grove');
    const s0 = await st(page);
    expect(s0.bosses.map((b) => b.id).sort()).toEqual(['ninetail', 'warden']);
    await page.evaluate(([x, y]) => window.__rpg!.teleport((x as number) - 110, y as number), [s0.den.x, s0.den.y]);
    await expect.poll(async () => (await st(page)).bosses.find((b) => b.id === 'ninetail')?.engaged).toBe(true);
    await expect(page.locator('#bossname')).toContainText('Nine-Tailed Fox');
    await shot(page, 'boss-fox');
    await page.evaluate(() => { window.__rpg!.setRoll(0); window.__rpg!.setBossHpRatio(0.001, 'ninetail'); });
    const b = (await st(page)).bosses.find((x) => x.id === 'ninetail')!;
    await page.evaluate(([x, y]) => window.__rpg!.teleport((x as number) - 26, y as number), [b.x, b.y]);
    await page.evaluate(([x, y]) => window.__rpg!.attack(x as number, y as number), [b.x, b.y]);
    await expect.poll(async () => (await st(page)).bossesDefeated, { timeout: 30_000 }).toContain('ninetail');
    expect((await st(page)).items.join(',')).toContain('spirit-saber:1');
    await expect(page.locator('#quest')).toContainText('1/1');
    await goToNpc(page); await talk(page); await page.click('#dlg button[data-opt="0"]');
    await expect.poll(async () => (await st(page)).quests.fox).toBe('turnedIn');
    await expect(page.locator('#dlg')).toContainText('Fallen Sword Immortal'); // the final quest is now offered
  });

  test('defeating the Fallen Sword Immortal drops his blade, completes the chain, and persists', async ({ page }) => {
    await newGame(page, 'Slayer');
    await finishPests(page);
    await page.click('#dlg button[data-opt="0"]'); // accept fox
    await page.evaluate(() => { window.__rpg!.setRoll(0); window.__rpg!.setBossHpRatio(0.001, 'ninetail'); });
    const den = (await st(page)).den;
    await page.evaluate(([x, y]) => window.__rpg!.teleport((x as number) - 90, y as number), [den.x, den.y]);
    await expect.poll(async () => (await st(page)).bosses.find((b) => b.id === 'ninetail')?.engaged).toBe(true);
    const fox = (await st(page)).bosses.find((x) => x.id === 'ninetail')!;
    await page.evaluate(([x, y]) => window.__rpg!.teleport((x as number) - 26, y as number), [fox.x, fox.y]);
    await page.evaluate(([x, y]) => window.__rpg!.attack(x as number, y as number), [fox.x, fox.y]);
    await expect.poll(async () => (await st(page)).bossesDefeated, { timeout: 30_000 }).toContain('ninetail');
    await goToNpc(page); await talk(page); await page.click('#dlg button[data-opt="0"]'); // claim fox
    await expect(page.locator('#dlg')).toContainText('Fallen Sword Immortal');
    await page.click('#dlg button[data-opt="0"]'); // accept the final quest
    await expect(page.locator('#quest')).toContainText('The Fallen Sword Immortal');
    await nearBoss(page, -100);
    await expect.poll(async () => (await st(page)).boss?.engaged).toBe(true);
    await page.evaluate(() => { window.__rpg!.setRoll(0); window.__rpg!.setBossHpRatio(0.001); });
    const b = (await st(page)).boss!;
    await page.evaluate(([x, y]) => window.__rpg!.teleport((x as number) - 24, y as number), [b.x, b.y]);
    await page.evaluate(([x, y]) => window.__rpg!.attack(x as number, y as number), [b.x, b.y]);
    await expect.poll(async () => (await st(page)).bossDefeated, { timeout: 30_000 }).toBe(true);
    const s = await st(page);
    expect(s.boss).toBeNull();
    expect(s.items.join(',')).toContain('jade-sword:1');
    await expect(page.locator('#boss')).toBeHidden();
    await expect(page.locator('#quest')).toContainText('1/1');
    await goToNpc(page); await talk(page); await page.click('#dlg button[data-opt="0"]');
    await expect.poll(async () => (await st(page)).quests.warden).toBe('turnedIn');
    await expect(page.locator('#dlg')).toContainText('quiet');
    // persistence: after reload + Continue both bosses stay dead
    await page.keyboard.press('Escape');
    await expect(page.locator('#dlg')).toBeHidden();
    await page.keyboard.press('Escape'); await page.click('#btn-save');
    await page.reload(); await page.click('#btn-continue'); await page.waitForFunction(() => window.__rpg);
    const after = await st(page);
    expect(after.bosses).toEqual([]); expect(after.bossesDefeated.sort()).toEqual(['ninetail', 'warden']);
  });
});
