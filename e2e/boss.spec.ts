import { expect, test } from '@playwright/test';
import { finishPests, goToNpc, newGame, shot, st, talk } from './helpers';

const nearBoss = async (page: import('@playwright/test').Page, dx = -100) => {
  const s = await st(page);
  await page.evaluate(([x, y]) => window.__rpg!.teleport(x as number, y as number), [s.lair.x + dx, s.lair.y]);
};

test.describe('#7 boss', () => {
  test('boss waits in its court, engages on approach, shows a bar and telegraphs its moves', async ({ page }) => {
    await newGame(page);
    const s0 = await st(page);
    expect(s0.boss).not.toBeNull(); expect(s0.boss!.engaged).toBe(false);
    await expect(page.locator('#boss')).toBeHidden();
    await page.evaluate(() => window.__rpg!.setHp(1e5));
    await nearBoss(page);
    await expect.poll(async () => (await st(page)).boss?.engaged).toBe(true);
    await expect(page.locator('#boss')).toBeVisible();
    await expect(page.locator('#bossname')).toContainText('Fallen Sword Immortal');
    await expect.poll(async () => (await st(page)).boss?.state, { timeout: 60_000 }).toMatch(/-windup$/);
    await shot(page, 'boss-telegraph');
  });

  const MOVES: [string, string][] = [['warden', 'slam'], ['warden', 'sweep'], ['warden', 'rain'], ['warden', 'teleport'], ['warden', 'summon'], ['warden', 'ring'], ['ninetail', 'sweep'], ['ninetail', 'charge'], ['ninetail', 'rain'], ['ninetail', 'teleport'], ['ninetail', 'summon'], ['ninetail', 'ring']];
  for (const [id, move] of MOVES) {
    test(`${id} move "${move}": telegraphed first, then it really happens`, async ({ page }) => {
      await newGame(page);
      await page.evaluate(() => window.__rpg!.setHp(5000));
      const s0 = await st(page); const home = id === 'warden' ? s0.lair : s0.den;
      await page.evaluate(([x, y]) => window.__rpg!.teleport((x as number) - 40, y as number), [home.x, home.y]);
      await expect.poll(async () => (await st(page)).bosses.find((b) => b.id === id)?.engaged).toBe(true);
      const boss = async () => (await st(page)).bosses.find((b) => b.id === id)!;
      await page.evaluate(([i, m]) => window.__rpg!.bossForce(i as string, m as string), [id, move]);
      await expect.poll(async () => (await boss()).state, { timeout: 40_000 }).toBe(`${move}-windup`); // readable warning first
      const before = await st(page), b0 = await boss();
      if (move === 'slam' || move === 'sweep' || move === 'rain' || move === 'teleport') {
        await expect.poll(async () => (await st(page)).hp, { timeout: 40_000 }).toBeLessThan(before.hp); // standing in the marked area hurts
      } else if (move === 'summon') {
        await expect.poll(async () => (await st(page)).enemies.filter((e) => e.minion).length, { timeout: 40_000 }).toBeGreaterThan(0);
      } else if (move === 'ring') {
        await expect.poll(async () => (await st(page)).bolts, { timeout: 40_000 }).toBeGreaterThan(0);
      } else if (move === 'charge') {
        await expect.poll(async () => { const b = await boss(); return Math.hypot(b.x - b0.x, b.y - b0.y); }, { timeout: 40_000 }).toBeGreaterThan(50);
      }
      if (move === 'teleport') { const b = await boss(); const me = await page.evaluate(() => window.__world!()); expect(Math.hypot(b.x - me.x, b.y - me.y)).toBeLessThan(90); }
      if (move === 'rain') await shot(page, `boss-${id}-rain`);
    });
  }

  test('a dodge works: leaving the marked area before the hit means no damage', async ({ page }) => {
    await newGame(page);
    await page.evaluate(() => window.__rpg!.setHp(5000));
    await nearBoss(page, -45);
    await expect.poll(async () => (await st(page)).boss?.engaged).toBe(true);
    await page.evaluate(() => window.__rpg!.bossForce('warden', 'slam'));
    await expect.poll(async () => (await st(page)).boss?.state, { timeout: 40_000 }).toBe('slam-windup');
    const b = (await st(page)).boss!; const hpBefore = (await st(page)).hp;
    await page.evaluate(([x, y]) => window.__rpg!.teleport((x as number) - 120, y as number), [b.x, b.y]); // step out of the circle
    await expect.poll(async () => (await st(page)).boss?.slams, { timeout: 40_000 }).toBe(b.slams + 1);
    expect((await st(page)).hp).toBeGreaterThanOrEqual(hpBefore - 1);
  });

  test('phase changes announce themselves and unlock the later moves', async ({ page }) => {
    await newGame(page);
    await page.evaluate(() => window.__rpg!.setHp(1e5));
    await nearBoss(page, -110);
    await expect.poll(async () => (await st(page)).boss?.engaged).toBe(true);
    await page.evaluate(() => window.__rpg!.setBossHpRatio(0.6));
    await expect(page.locator('.toast', { hasText: 'grows serious' })).toBeVisible();
    expect((await st(page)).boss!.phase).toBe(2);
    await page.evaluate(() => window.__rpg!.setBossHpRatio(0.2));
    await expect(page.locator('.toast', { hasText: 'enraged' })).toBeVisible();
    expect((await st(page)).boss!.phase).toBe(3);
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
    test.setTimeout(180_000); // long scripted fight; slow under a loaded software-GL runner
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
    await expect.poll(async () => (await st(page)).bossDefeated, { timeout: 90_000 }).toBe(true);
    const s = await st(page);
    expect(s.boss).toBeNull();
    expect(s.items.join(',')).toContain('jade-sword:1');
    await expect(page.locator('#boss')).toBeHidden();
    await expect(page.locator('#quest')).toContainText('1/1');
    await goToNpc(page); await talk(page); await page.click('#dlg button[data-opt="0"]');
    await expect.poll(async () => (await st(page)).quests.warden).toBe('turnedIn');
    await expect(page.locator('#dlg')).toContainText('elite monsters');
    // persistence: after reload + Continue both bosses stay dead
    await page.keyboard.press('Escape');
    await expect(page.locator('#dlg')).toBeHidden();
    await page.keyboard.press('Escape'); await page.click('#btn-save');
    await page.reload(); await page.click('#btn-continue'); await page.waitForFunction(() => window.__rpg);
    const after = await st(page);
    expect(after.bosses.map((b) => b.id).sort()).toEqual(['ninetail', 'warden']); // bosses return so the fight can be repeated
    expect(after.bossesDefeated.sort()).toEqual(['ninetail', 'warden']); // ...but the story progress persists
  });
});
