import { expect, test } from '@playwright/test';
import { me, newGame, st, waitGame } from './helpers';

for (const [w, h] of [[1280, 720], [1024, 600]] as const) {
  test(`B1: character panel at ${w}x${h} keeps Techniques and Dao Insight clear of the hotbar`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await newGame(page, 'Panel');
    await page.evaluate(() => window.__rpg!.giveXp(100000));
    await waitGame(page, 0.3);
    await page.keyboard.press('c');
    await expect(page.locator('#chr')).toBeVisible();
    await expect(page.locator('#chr .skrow button')).toHaveCount(7);
    await page.screenshot({ path: `qc-artifacts/chr-${w}x${h}.png` });
    const box = await page.evaluate(() => {
      const hot = document.querySelector('#skills')!.getBoundingClientRect();
      const rows = [...document.querySelectorAll('#chr .skrow button')].map((b) => b.getBoundingClientRect());
      const panel = document.querySelector('#chr')!.getBoundingClientRect();
      return { hotTop: hot.top, rowBottoms: rows.map((r) => r.bottom), panelBottom: panel.bottom, panelRight: panel.right, vw: innerWidth };
    });
    expect(box.rowBottoms.length).toBeGreaterThanOrEqual(7); // 4 techniques + 3 insights
    expect(box.panelBottom).toBeLessThanOrEqual(box.hotTop);
    for (const b of box.rowBottoms) expect(b).toBeLessThanOrEqual(box.hotTop);
    expect(box.panelRight).toBeLessThanOrEqual(box.vw);
  });
}

test('B4: Ember Fan at point-blank range damages every enemy in a close group', async ({ page }) => {
  await newGame(page, 'Fan', 'flame', 'heroine');
  await page.evaluate(() => window.__rpg!.giveXp(100000));
  await waitGame(page, 0.3);
  const p = await me(page);
  const ids = await page.evaluate(([x, y]) => [[40, -22], [44, 0], [40, 22]].map(([dx, dy]) => window.__rpg!.spawnUnaware('golem', (x as number) + dx!, (y as number) + dy!)), [p.x, p.y]);
  const before = await st(page);
  await page.evaluate(([x, y]) => window.__rpg!.cast(0, (x as number) + 60, y as number), [p.x, p.y]);
  await waitGame(page, 0.7);
  const after = await st(page);
  const hurt = ids.filter((id) => { const a = before.enemies.find((e) => e.id === id), c = after.enemies.find((e) => e.id === id); return a && (!c || c.hp < a.hp); });
  expect(hurt.length).toBe(3);
});

test('B5: a hero kit carries its own tinted hotbar icons', async ({ page }) => {
  await newGame(page, 'Ink', 'flame', 'fanscholar');
  await expect(page.locator('#slot0 .ic.tinted')).toHaveCount(1);
  const tint = await page.evaluate(() => getComputedStyle(document.querySelector('#slot0 .ic')!).getPropertyValue('--tint').trim());
  expect(tint).toBe('#8a7dff');
  await newGame(page, 'Sw', 'flame', 'swordsman');
  await expect(page.locator('#slot0 .ic.tinted')).toHaveCount(0);
});
