import { expect, test } from '@playwright/test';

interface TestGame {
  isRunning: boolean;
  renderer: { type: number };
  getFrame(): number;
}
declare global {
  interface Window { __game?: TestGame }
}

test('boots with a WebGL renderer and runs frames', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.waitForFunction(() => window.__game?.isRunning);
  const info = await page.evaluate(() => ({
    type: window.__game!.renderer.type,
    frame: window.__game!.getFrame(),
    canvas: !!document.querySelector('#game canvas'),
  }));
  expect(info.canvas).toBe(true);
  expect(info.type).toBe(2); // Phaser.WEBGL
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => window.__game!.getFrame())).toBeGreaterThan(info.frame);
  expect(errors).toEqual([]);
});
