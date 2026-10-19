import { expect, test } from '@playwright/test';
import { newGame, st, waitGame } from './helpers';

test.describe('round 3', () => {
  test('health recovers slowly out of combat', async ({ page }) => {
    await newGame(page);
    await page.evaluate(() => window.__rpg!.setHp(20));
    const before = (await st(page)).hp;
    await waitGame(page, 8);
    expect((await st(page)).hp).toBeGreaterThan(before);
  });

  test('death costs the larger of 15 stones or 10% (never more than carried)', async ({ page }) => {
    await newGame(page);
    await page.evaluate(() => { window.__rpg!.setStones(100); window.__rpg!.killPlayer(); });
    await waitGame(page, 0.3);
    expect((await st(page)).stones).toBe(85);
  });
});
