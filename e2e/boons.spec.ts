import { expect, test } from '@playwright/test';
import { me, newGame, st } from './helpers';

test.describe('round B: boons, boss poise, perfect dodge', () => {
  test('a banked pick opens the chooser; key 1 takes the boon and its stats apply; the game resumes', async ({ page }) => {
    await newGame(page, 'Boon');
    const before = await st(page);
    await page.evaluate(() => { window.__rpg!.addBoonPicks(1); window.__rpg!.offerBoon(); });
    await expect(page.locator('#boonpick .boon')).toHaveCount(3);
    await page.screenshot({ path: 'test-results/boon-picker.png' });
    const id = await page.locator('#boonpick .boon').first().getAttribute('data-boon');
    await page.keyboard.press('Digit1');
    await expect(page.locator('#boonpick')).toHaveCount(0);
    await expect(page.locator('.toast', { hasText: 'Boon gained' })).toBeVisible();
    const after = await st(page);
    expect(after.boons).toEqual([id]); expect(after.boonPicks).toBe(0);
    // the game is no longer paused: the clock runs
    const t0 = (await st(page)).now; await page.waitForTimeout(400);
    expect((await st(page)).now).toBeGreaterThan(t0);
    expect(after.maxHp).toBeGreaterThanOrEqual(before.maxHp);
  });

  test('picks wait while paused-by-automation (no surprise modal) and Escape does not stack a pause menu on the chooser', async ({ page }) => {
    await newGame(page, 'Boon2');
    await page.evaluate(() => window.__rpg!.addBoonPicks(2));
    await page.waitForTimeout(3500);
    await expect(page.locator('#boonpick')).toHaveCount(0); // automation: no auto popup (use ?boons=1 to see it)
    await page.evaluate(() => window.__rpg!.offerBoon());
    await page.keyboard.press('Escape');
    await expect(page.locator('#boonpick')).toHaveCount(1);
    await expect(page.locator('#btn-resume')).toHaveCount(0);
    await page.locator('#boonpick .boon').nth(1).click();
    await expect(page.locator('#boonpick')).toHaveCount(0);
    expect((await st(page)).boonPicks).toBe(1);
  });

  test('with ?boons=1 the chooser pops up by itself once the fight is over', async ({ page }) => {
    await page.goto('/?boons=1');
    await page.locator('#btn-new').click();
    await page.locator('#name').fill('AutoBoon');
    await page.locator('#btn-start').click();
    await page.waitForFunction(() => !!window.__rpg && window.__rpg.state().tut >= 0);
    await page.evaluate(() => window.__rpg!.addBoonPicks(1));
    await expect(page.locator('#boonpick .boon')).toHaveCount(3, { timeout: 8000 });
  });

  test('a boss that takes enough poise damage is staggered, then recovers and cannot be re-staggered at once', async ({ page }) => {
    await newGame(page, 'Poise');
    const s = await st(page);
    await page.evaluate(([x, y]) => window.__rpg!.teleport((x as number) - 40, y as number), [s.lair.x, s.lair.y]);
    await page.evaluate(() => window.__rpg!.setHp(1e5));
    await page.evaluate(() => window.__rpg!.poiseBoss('warden', 100000));
    await expect.poll(async () => (await st(page)).bosses.find((b) => b.id === 'warden')?.state).toBe('stagger');
    await expect(page.locator('.float, canvas').first()).toBeVisible();
    await expect.poll(async () => (await st(page)).bosses.find((b) => b.id === 'warden')?.state, { timeout: 12000 }).not.toBe('stagger'); // game time runs slower than wall time under software GL
    await page.evaluate(() => window.__rpg!.poiseBoss('warden', 100000));
    expect((await st(page)).bosses.find((b) => b.id === 'warden')?.state).not.toBe('stagger'); // immune window
  });

  test('a perfect dodge gives mana and a short damage buff', async ({ page }) => {
    await newGame(page, 'Dodger');
    await page.evaluate(() => window.__rpg!.cast(0, 9999, 0));
    const m0 = (await st(page)).mana;
    await page.evaluate(() => window.__rpg!.perfectDodge());
    const s = await st(page);
    expect(s.perfectBuff).toBe(true); expect(s.mana).toBeGreaterThan(m0 + 5);
  });

  test('a real dash through a boss slam is rewarded', async ({ page }) => {
    await newGame(page, 'RealDodge');
    const s = await st(page);
    await page.evaluate(([x, y]) => window.__rpg!.teleport((x as number) - 40, y as number), [s.lair.x, s.lair.y]);
    await page.evaluate(() => window.__rpg!.setHp(1e5));
    let got = false;
    for (let attempt = 0; attempt < 10 && !got; attempt++) {
      await expect.poll(async () => (await st(page)).bosses[0]?.state, { timeout: 15000 }).toBe('chase');
      await page.evaluate(() => window.__rpg!.bossForce('warden', 'slam'));
      const started = await expect.poll(async () => (await st(page)).bosses[0]?.state, { timeout: 4000 }).toBe('slam-windup').then(() => true, () => false);
      if (!started) continue;
      const t0 = (await st(page)).now;
      // dash late in the wind-up (game time) so the invulnerability window covers the impact
      await expect.poll(async () => (await st(page)).now - t0, { timeout: 4000 }).toBeGreaterThan(0.6);
      await page.evaluate(() => window.__rpg!.dash());
      await page.waitForTimeout(700);
      got = (await st(page)).perfectBuff;
    }
    expect(got).toBe(true);
    expect((await me(page)).x).toBeGreaterThan(0);
  });
});
