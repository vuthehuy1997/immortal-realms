import { expect, test } from '@playwright/test';
import { newGame, shot, st } from './helpers';

/**
 * Walks the whole game's geography: every chapter loads, every zone of it renders, every cave and secret realm can be entered and left.
 * Screenshots land in qc-artifacts/tour-*.png so a human (or an agent) can look at each place; the assertions only catch crashes and dead ends.
 */
test('world tour: every chapter, zone, cave and realm loads and renders without errors', async ({ page }) => {
  test.setTimeout(1_500_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await newGame(page, 'Tourist');
  const calm = () => page.evaluate(() => { const r = window.__rpg!; r.clear(); r.setHp(1e5); });
  await page.evaluate(() => window.__rpg!.giveXp(1e7));
  const only = process.env.TOUR_CHAPTERS?.split(',').map(Number); // e.g. TOUR_CHAPTERS=3,4 while authoring a chapter
  const ids = (await page.evaluate(() => window.__rpg!.chapterIds())).filter((n) => !only || only.includes(n));
  expect(ids.length).toBeGreaterThanOrEqual(1);
  if (ids[0] !== 1) { await page.evaluate((c) => window.__rpg!.goChapter(c), ids[0]!); await page.waitForFunction((c) => window.__rpg!.state().chapter === c && window.__rpg!.state().now > 0.5, ids[0]!, { timeout: 90_000 }); }
  for (const n of ids) {
    if (n !== ids[0]) {
      await page.evaluate((c) => window.__rpg!.goChapter(c), n);
      await page.waitForFunction((c) => window.__rpg !== undefined && window.__rpg.state().chapter === c && window.__rpg.state().now > 0.5, n, { timeout: 90_000 });
    }
    await calm();
    const s = await st(page);
    for (const [zone, a] of Object.entries(s.anchors)) {
      await page.evaluate(([x, y]) => window.__rpg!.teleport(x as number, y as number), [a.x, a.y + 30]);
      await calm();
      const t0 = (await st(page)).now;
      await page.waitForFunction((t) => window.__rpg!.state().now > t + 0.8, t0, { timeout: 60_000 });
      await shot(page, `tour-ch${n}-${zone}`);
    }
    for (const id of Object.keys(s.entrances)) {
      await page.evaluate(() => window.__rpg!.giveXp(1)); // level is already far above any gate
      await page.evaluate((d) => window.__rpg!.enterDungeon(d), id);
      await page.waitForFunction((d) => window.__rpg !== undefined && window.__rpg.state().dungeon === d && window.__rpg.state().now > 0.5, id, { timeout: 90_000 });
      const inside = await st(page);
      expect(inside.bosses.length, `${id} has its guardian`).toBe(1);
      expect(inside.enemies.length, `${id} is populated`).toBeGreaterThan(0);
      await calm();
      await page.waitForTimeout(600);
      await shot(page, `tour-ch${n}-${id}`);
      const b = inside.bossHomes[inside.bosses[0]!.id]!;
      await page.evaluate(([x, y]) => window.__rpg!.teleport(x as number, (y as number) + 70), [b.x, b.y]);
      await calm();
      await page.waitForTimeout(500);
      await shot(page, `tour-ch${n}-${id}-boss`);
      await page.evaluate(() => window.__rpg!.exitDungeon());
      await page.waitForFunction((c) => window.__rpg !== undefined && window.__rpg.state().dungeon === null && window.__rpg.state().chapter === c && window.__rpg.state().now > 0.5, n, { timeout: 90_000 });
    }
  }
  expect(errors, 'no console or page errors during the tour').toEqual([]);
});
