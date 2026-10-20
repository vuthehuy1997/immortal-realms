import { expect, test } from '@playwright/test';
import { me, newGame, st, waitGame } from './helpers';

test.describe('enemy vision', () => {
  test('an enemy facing away does not notice or attack the player, but wakes when struck', async ({ page }) => {
    await newGame(page);
    const p = await me(page);
    const id = await page.evaluate(([x, y]) => window.__rpg!.spawnUnaware('wolf', (x as number) + 70, y as number), [p.x, p.y]);
    await waitGame(page, 3);
    let s = await st(page);
    expect(s.enemies.find((e) => e.id === id)?.ai).toBe('idle');
    expect(s.hp).toBe(s.maxHp);
    await page.evaluate((i) => window.__rpg!.strikeEnemy(i), id);
    await waitGame(page, 0.3);
    s = await st(page);
    expect(['chase', 'attack', 'strike']).toContain(s.enemies.find((e) => e.id === id)?.ai);
  });

  test('an enemy facing the player notices and engages', async ({ page }) => {
    await newGame(page);
    const p = await me(page);
    await page.evaluate(([x, y]) => window.__rpg!.spawn('wolf', (x as number) + 70, y as number), [p.x, p.y]);
    await waitGame(page, 1);
    const s = await st(page);
    expect(s.enemies[0]?.ai).not.toBe('idle');
  });

  test('striking one pack member alerts nearby packmates but not distant ones', async ({ page }) => {
    await newGame(page);
    const p = await me(page);
    const ids = await page.evaluate(([x, y]) => [
      window.__rpg!.spawnUnaware('wolf', (x as number) + 70, y as number),
      window.__rpg!.spawnUnaware('wolf', (x as number) + 70, (y as number) + 40),
      window.__rpg!.spawnUnaware('wolf', (x as number) + 70, (y as number) + 400),
    ], [p.x, p.y]);
    await waitGame(page, 0.5);
    await page.evaluate((i) => window.__rpg!.strikeEnemy(i), ids[0]!);
    await waitGame(page, 0.3);
    const s = await st(page);
    expect(s.enemies.find((e) => e.id === ids[1])?.ai).not.toBe('idle');
    expect(s.enemies.find((e) => e.id === ids[2])?.ai).toBe('idle');
  });
});
