import { expect, test, type Page } from '@playwright/test';
import { acceptFirst, goToNpc, newGame, shot, talk } from './helpers';

const VIEWPORTS = [{ w: 1024, h: 600 }, { w: 1280, h: 720 }, { w: 1920, h: 1080 }];

const box = (page: Page, sel: string) => page.locator(sel).first().boundingBox();
const overlap = (a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

test.describe('#15 responsive desktop UI', () => {
  for (const v of VIEWPORTS) {
    test(`${v.w}x${v.h}: menu, creation and every panel fit without overflow or overlap`, async ({ page }) => {
      await page.setViewportSize({ width: v.w, height: v.h });
      await page.goto('/');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await shot(page, `ui-${v.w}-menu`);
      await page.click('#btn-new');
      for (const sel of ['#name', '.root >> nth=0', '.root >> nth=2', '#btn-start', '#btn-back']) {
        const b = (await page.locator(sel).boundingBox())!;
        expect(b.x, sel).toBeGreaterThanOrEqual(0); expect(b.x + b.width, sel).toBeLessThanOrEqual(v.w);
        expect(b.y, sel).toBeGreaterThanOrEqual(0); expect(b.y + b.height, `${sel} bottom`).toBeLessThanOrEqual(v.h);
      }
      await shot(page, `ui-${v.w}-create`);
      await page.click('#btn-back');
      await newGame(page, 'Responsive');
      await page.evaluate(() => window.__rpg!.setHp(30));
      await page.keyboard.press('i'); await page.keyboard.press('c');
      // an active quest + the dialogue open at the same time (worst case)
      await goToNpc(page); await talk(page); await acceptFirst(page);
      await goToNpc(page); await talk(page);
      await page.waitForTimeout(300);
      await shot(page, `ui-${v.w}-game`);
      const ids = ['#inv', '#chr', '#dlg', '#skills', '#bars', '#quest'];
      const boxes: Record<string, { x: number; y: number; width: number; height: number }> = {};
      for (const id of ids) {
        const b = await box(page, id); expect(b, id).not.toBeNull(); boxes[id] = b!;
        expect(b!.x, id).toBeGreaterThanOrEqual(-0.5); expect(b!.y, id).toBeGreaterThanOrEqual(-0.5);
        expect(b!.x + b!.width, id).toBeLessThanOrEqual(v.w + 0.5); expect(b!.y + b!.height, `${id} bottom`).toBeLessThanOrEqual(v.h + 0.5);
      }
      for (const [a, b] of [['#inv', '#chr'], ['#inv', '#dlg'], ['#chr', '#dlg'], ['#dlg', '#skills'], ['#inv', '#quest'], ['#chr', '#bars'], ['#inv', '#skills'], ['#chr', '#skills']] as const) {
        expect(overlap(boxes[a]!, boxes[b]!), `${a} overlaps ${b}`).toBe(false);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    });
  }
});
