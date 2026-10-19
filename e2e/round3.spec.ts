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

  test('death costs the larger of 5 stones or 10% (never more than carried)', async ({ page }) => {
    await newGame(page);
    await page.evaluate(() => { window.__rpg!.setStones(100); window.__rpg!.killPlayer(); });
    await waitGame(page, 0.3);
    expect((await st(page)).stones).toBe(90);
  });
});

test('health still regenerates after dying and respawning (QA R3-1)', async ({ page }) => {
  await newGame(page);
  await page.evaluate(() => window.__rpg!.killPlayer());
  await waitGame(page, 0.3);
  await page.evaluate(() => window.__rpg!.respawnNow());
  await page.waitForFunction(() => window.__rpg!.state().now > 0.2);
  await page.evaluate(() => window.__rpg!.setHp(20));
  const before = (await st(page)).hp;
  await waitGame(page, 9);
  expect((await st(page)).hp).toBeGreaterThan(before);
});

test('an enemy struck from beyond its normal leash keeps chasing (QA R3-2)', async ({ page }) => {
  await newGame(page);
  const p = await page.evaluate(() => window.__world!());
  const id = await page.evaluate(([x, y]) => window.__rpg!.spawnUnaware('wolf', (x as number) + 175, y as number), [p.x, p.y]);
  await page.evaluate((i) => window.__rpg!.strikeEnemy(i), id);
  await waitGame(page, 0.5);
  expect((await st(page)).enemies.find((e) => e.id === id)?.ai).not.toBe('idle');
});
