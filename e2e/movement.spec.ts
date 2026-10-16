import { expect, test } from '@playwright/test';

declare global {
  interface Window { __world?: () => { x: number; y: number } }
}

test('player moves with keyboard and stays inside the map', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.waitForFunction(() => window.__world !== undefined);
  const start = await page.evaluate(() => window.__world!());
  await page.keyboard.down('d');
  await page.waitForTimeout(600);
  await page.keyboard.up('d');
  const moved = await page.evaluate(() => window.__world!());
  expect(moved.x).toBeGreaterThan(start.x + 10);
  expect(Math.abs(moved.y - start.y)).toBeLessThan(1);
  // hold left until the border: must stop at the tree wall
  await page.keyboard.down('a');
  await page.waitForTimeout(8500);
  await page.keyboard.up('a');
  const edge = await page.evaluate(() => window.__world!());
  // border trees occupy tiles 0-1 (x<32); box half-size 5 => stops at x=37
  expect(edge.x).toBeGreaterThanOrEqual(36);
  expect(edge.x).toBeLessThan(40);
  expect(errors).toEqual([]);
});
