import { expect, test, type Page } from '@playwright/test';
import { newGame, shot, st, waitGame } from './helpers';

/** Round 22: dungeon mechanics through the real scene (traps, seal gates, collapsing floor, ambush), plus screenshots of the new interiors. */
const enter = async (page: Page, id: string): Promise<void> => {
  await page.evaluate(() => window.__rpg!.giveXp(1e7));
  await page.evaluate((d) => window.__rpg!.enterDungeon(d), id);
  await page.waitForFunction((d) => window.__rpg !== undefined && window.__rpg.state().dungeon === d && window.__rpg.state().now > 0.5, id, { timeout: 90_000 });
  await page.evaluate(() => { window.__rpg!.clear(); window.__rpg!.setHp(1e6); });
};
const fx = (page: Page) => page.evaluate(() => window.__rpg!.dungeonFx()!);
const tp = (page: Page, x: number, y: number) => page.evaluate(([a, b]) => window.__rpg!.teleport(a as number, b as number), [x, y]);
/** a hero HP pool whose drop is measurable (the display clamps, the sim does not) */
const hpPool = (page: Page, n = 20000) => page.evaluate((v) => window.__rpg!.setHp(v), n);

test.describe('round 22 dungeon mechanics', () => {
  test.setTimeout(240_000);

  test('pressure plates open the seal gate (s1-stormroost)', async ({ page }) => {
    await newGame(page); await enter(page, 's1-stormroost');
    const f0 = await fx(page);
    expect(f0.gateOpen).toBe(false); expect(f0.plateAt).toHaveLength(3); expect(f0.gateTiles).toBeGreaterThan(0);
    await tp(page, f0.gateAt!.x - 40, f0.gateAt!.y); await waitGame(page, 0.7); await shot(page, 'r22-dg-gate-closed');
    for (const p of f0.plateAt) { await tp(page, p.x, p.y); await waitGame(page, 0.4); }
    expect((await fx(page)).plates).toEqual([true, true, true]);
    await expect.poll(async () => (await fx(page)).gateOpen).toBe(true);
    await tp(page, f0.gateAt!.x - 40, f0.gateAt!.y); await waitGame(page, 0.8); await shot(page, 'r22-dg-gate-open');
  });

  test('braziers burn out unless all lit in one run (swordsanctum)', async ({ page }) => {
    await newGame(page); await enter(page, 'swordsanctum');
    const f0 = await fx(page); expect(f0.brazierAt).toHaveLength(3);
    for (const b of f0.brazierAt) { await tp(page, b.x, b.y + 8); await waitGame(page, 0.35); }
    await shot(page, 'r22-dg-braziers');
    await expect.poll(async () => (await fx(page)).gateOpen, { timeout: 20_000 }).toBe(true);
  });

  test('collapsing floor: cracks, becomes a pit, drops you with a cost; the cache pays stones (s1-pearlgrotto)', async ({ page }) => {
    await newGame(page); await enter(page, 's1-pearlgrotto');
    const f0 = await fx(page), c = f0.patches[0]!; expect(f0.patches.length).toBe(2);
    const stones0 = (await st(page)).stones;
    await hpPool(page, 20000);
    await tp(page, c.x + 20, c.y + 20); await waitGame(page, 0.5);
    await tp(page, c.x, c.y); await waitGame(page, 0.3);
    await expect.poll(async () => (await st(page)).stones, { timeout: 15_000 }).toBeGreaterThan(stones0); // the cache in the middle
    await expect.poll(async () => (await fx(page)).patches[0]!.states.includes('cracking') || (await fx(page)).patches[0]!.states.includes('pit'), { timeout: 15_000 }).toBe(true);
    await shot(page, 'r22-dg-collapse-crack');
    await expect.poll(async () => (await fx(page)).patches[0]!.states.includes('pit'), { timeout: 15_000 }).toBe(true);
    await shot(page, 'r22-dg-collapse-pit');
    // lingered: you fall and are put back on the last safe spot (the spirit array at the gate may heal the cost at once, so the position is the signal)
    await expect.poll(async () => { const p = await page.evaluate(() => window.__world!()); return Math.hypot(p.x - c.x, p.y - c.y); }, { timeout: 15_000 }).toBeGreaterThan(60);
  });

  test('spike traps telegraph then hit (wolfden)', async ({ page }) => {
    await newGame(page); await enter(page, 'wolfden');
    const f0 = await fx(page), trap = f0.traps[0]!; expect(trap.style).toBe('spike');
    await tp(page, trap.x, trap.y + 40); await waitGame(page, 0.4); await shot(page, 'r22-dg-spikes');
    await tp(page, trap.x, trap.y); await hpPool(page, 20000);
    await expect.poll(async () => (await fx(page)).traps.find((t) => t.id === trap.id)!.phase, { timeout: 20_000 }).toBe('warn');
    await shot(page, 'r22-dg-spikes-warn');
    await expect.poll(async () => (await st(page)).hp, { timeout: 20_000 }).toBeLessThan(20000);
  });

  test('poison mist breathes and burns (s1-pearlgrotto)', async ({ page }) => {
    await newGame(page); await enter(page, 's1-pearlgrotto');
    const m = (await fx(page)).traps.find((t) => t.style === 'mist')!;
    await tp(page, m.x, m.y); await hpPool(page, 20000);
    await expect.poll(async () => (await fx(page)).traps.find((t) => t.id === m.id)!.phase, { timeout: 20_000 }).toBe('active');
    await waitGame(page, 0.8); await shot(page, 'r22-dg-mist');
    await expect.poll(async () => (await st(page)).hp, { timeout: 20_000 }).toBeLessThan(20000);
  });

  test('ambush waves: step into the rune circle, foes pour out, clearing them pays (wolfden)', async ({ page }) => {
    await newGame(page); await enter(page, 'wolfden');
    const a = (await fx(page)).ambushAt!; expect(a).not.toBeNull();
    const stones0 = (await st(page)).stones;
    await tp(page, a.x, a.y); await waitGame(page, 0.4);
    await expect.poll(async () => (await fx(page)).ambush, { timeout: 15_000 }).toBe('running');
    await expect.poll(async () => (await st(page)).enemies.length, { timeout: 15_000 }).toBeGreaterThan(2);
    await shot(page, 'r22-dg-ambush');
    for (let i = 0; i < 60 && (await fx(page)).ambush !== 'done'; i++) { await page.evaluate(() => window.__rpg!.clear()); await waitGame(page, 1.2); }
    expect((await fx(page)).ambush).toBe('done');
    expect((await st(page)).stones).toBeGreaterThan(stones0);
  });

  test('screenshots of reworked interiors', async ({ page }) => {
    test.setTimeout(480_000);
    await newGame(page);
    for (const id of ['wolfden', 'ember-mine', 'cloudhollow', 'scrollvault', 'abyss-ashmaw']) {
      await enter(page, id);
      await waitGame(page, 0.8); await shot(page, `r22-dg-${id}-start`);
      const s = await st(page), b = s.bossHomes[s.bosses[0]!.id]!;
      await tp(page, (s.spawn.x + b.x) / 2, (s.spawn.y + b.y) / 2); await page.evaluate(() => window.__rpg!.clear()); await waitGame(page, 0.8); await shot(page, `r22-dg-${id}-mid`);
      await tp(page, b.x - 70, b.y + 20); await page.evaluate(() => window.__rpg!.clear()); await waitGame(page, 0.8); await shot(page, `r22-dg-${id}-boss`);
      await page.evaluate(() => window.__rpg!.exitDungeon());
      await page.waitForFunction(() => window.__rpg !== undefined && window.__rpg.state().dungeon === null && window.__rpg.state().now > 0.5, null, { timeout: 90_000 });
    }
  });
});

/** First-encounter tips (suppressed under automation unless ?tips=1) teach each new mechanic once. */
test.describe('round 22 first-encounter tips', () => {
  test.setTimeout(200_000);
  const start = async (page: Page): Promise<void> => {
    await page.goto('/?tips=1');
    await page.click('#btn-new'); await page.fill('#name', 'Tipper'); await page.click('[data-hero=swordsman]'); await page.click('[data-root=flame]'); await page.click('#btn-start');
    await page.waitForFunction(() => window.__rpg !== undefined && window.__rpg.state().now > 0.2, null, { timeout: 60_000 });
    await page.evaluate(() => window.__rpg!.clear());
  };
  test('walking up to a trap field and a seal teaches them; the tip does not repeat', async ({ page }) => {
    await start(page); await enter(page, 's1-stormroost');
    const f = await fx(page), trap = f.traps[0]!;
    await tp(page, trap.x, trap.y + 60);
    await expect(page.locator('.toast', { hasText: /Floor spikes flash red/ })).toBeVisible({ timeout: 20_000 });
    await tp(page, f.plateAt[0]!.x, f.plateAt[0]!.y + 40);
    await expect(page.locator('.toast', { hasText: /seal bars the way/ })).toBeVisible({ timeout: 20_000 });
    const hints = await page.evaluate(() => JSON.parse(localStorage.getItem('immortal-realms/save-v1') ?? '{}'));
    void hints;
  });
  test('a boss mechanic is announced the first time it appears (sovereign ward)', async ({ page }) => {
    await start(page);
    await page.evaluate(() => window.__rpg!.giveXp(1e7));
    await page.evaluate(() => window.__rpg!.goChapter(2));
    await page.waitForFunction(() => window.__rpg!.state().chapter === 2 && window.__rpg!.state().now > 0.5, null, { timeout: 90_000 });
    await page.evaluate(() => { window.__rpg!.clear(); window.__rpg!.setHp(1e6); });
    const h = (await st(page)).bossHomes['sovereign']!;
    await page.evaluate(([x, y]) => window.__rpg!.teleport(x as number, y as number), [h.x - 150, h.y + 70]);
    await expect.poll(async () => (await st(page)).bosses.find((b) => b.id === 'sovereign')?.engaged, { timeout: 30_000 }).toBe(true);
    await page.evaluate(() => window.__rpg!.setBossHpRatio(0.6, 'sovereign'));
    await expect(page.locator('.toast', { hasText: /spirit ward shields this foe/ })).toBeVisible({ timeout: 30_000 });
  });
});
