import { expect, test } from '@playwright/test';
import { newGame, st } from './helpers';

test('NPC nameplates never draw behind the minimap (round 4 open item)', async ({ page }) => {
  await newGame(page);
  const elder = (await st(page)).npcs['elder-lin']!;
  await page.evaluate(([x, y]) => window.__rpg!.teleport(x as number, y as number), [elder.x - 14, elder.y + 6]);
  await expect.poll(async () => (await st(page)).npcPlates['elder-lin']).toBe(true); // next to the player: shown
  // walk the camera so the elder slides under the top-right minimap; at some offset the plate must hide, and it must come back afterwards
  let hid = false;
  for (let dx = 120; dx <= 330 && !hid; dx += 30) for (let dy = 60; dy <= 240 && !hid; dy += 30) {
    await page.evaluate(([x, y]) => window.__rpg!.teleport(x as number, y as number), [elder.x - dx, elder.y + dy]);
    await page.waitForTimeout(120);
    hid = !(await st(page)).npcPlates['elder-lin'];
  }
  expect(hid).toBe(true);
  await page.evaluate(([x, y]) => window.__rpg!.teleport(x as number, y as number), [elder.x - 14, elder.y + 6]);
  await expect.poll(async () => (await st(page)).npcPlates['elder-lin']).toBe(true);
});
