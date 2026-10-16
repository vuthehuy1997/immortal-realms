import { expect, test } from '@playwright/test';
import { killOne, me, newGame, shot, st, waitGame } from './helpers';

test.describe('#3 world, #4 movement, #5 combat zone, #6 enemies, #8/#9 skills & vitals', () => {
  test('WebGL renderer runs, no page errors, frames advance', async ({ page }) => {
    const errors: string[] = []; page.on('pageerror', (e) => errors.push(e.message));
    await newGame(page);
    const r = await page.evaluate(() => { const g = (window as unknown as { __game: { renderer: { type: number }; getFrame(): number } }).__game; return { type: g.renderer.type, f: g.getFrame() }; });
    expect(r.type).toBe(2);
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => (window as unknown as { __game: { getFrame(): number } }).__game.getFrame())).toBeGreaterThan(r.f);
    expect(errors).toEqual([]);
  });

  test('player moves with keyboard and is stopped by the map border', async ({ page }) => {
    await newGame(page);
    const start = await me(page);
    await page.keyboard.down('d');
    await expect.poll(async () => (await me(page)).x).toBeGreaterThan(start.x + 10);
    await page.keyboard.up('d');
    const moved = await me(page);
    expect(Math.abs(moved.y - start.y)).toBeLessThan(1);
    await page.evaluate(() => window.__rpg!.teleport(60, 520));
    await page.keyboard.down('a');
    await expect.poll(async () => (await me(page)).x, { timeout: 30_000 }).toBeLessThan(40);
    await waitGame(page, 0.5); // keep pushing into the wall: it must not go further
    await page.keyboard.up('a');
    const edge = await me(page);
    expect(edge.x).toBeGreaterThanOrEqual(36); expect(edge.x).toBeLessThan(40);
  });

  test('map has initial enemies of all three behaviours', async ({ page }) => {
    await page.goto('/'); await page.click('#btn-new'); await page.fill('#name', 'X'); await page.click('#btn-start');
    await page.waitForFunction(() => window.__rpg);
    const types = new Set((await st(page)).enemies.map((e) => e.type));
    expect(types).toEqual(new Set(['slime', 'wraith', 'brute']));
    await shot(page, 'world-start');
  });

  test('slash hits in front, costs no mana, then is on cooldown', async ({ page }) => {
    await newGame(page);
    const p = await me(page); const m0 = (await st(page)).mana;
    await page.evaluate(([x, y]) => { window.__rpg!.spawn('brute', (x as number) + 14, y as number); window.__rpg!.cast(0, (x as number) + 50, y as number); }, [p.x, p.y]);
    const s1 = await st(page); const hp1 = s1.enemies[0]!.hp;
    expect(hp1).toBeLessThan(70); expect(s1.mana).toBeCloseTo(m0, 0);
    await page.evaluate(([x, y]) => window.__rpg!.cast(0, (x as number) + 50, y as number), [p.x, p.y]);
    expect((await st(page)).enemies[0]!.hp).toBe(hp1);
  });

  test('spirit bolt costs mana and damages from range', async ({ page }) => {
    await newGame(page);
    const p = await me(page);
    await page.evaluate(([x, y]) => window.__rpg!.spawn('brute', (x as number) + 60, y as number), [p.x, p.y]); // 70 hp: survives even a crit
    const m0 = (await st(page)).mana;
    await page.evaluate(([x, y]) => window.__rpg!.cast(1, (x as number) + 100, y as number), [p.x, p.y]);
    expect((await st(page)).mana).toBeLessThan(m0 - 5);
    await expect.poll(async () => (await st(page)).enemies[0]?.hp, { timeout: 3000 }).toBeLessThan(70);
  });

  test('burst kills nearby enemies; kill gives xp and count', async ({ page }) => {
    await newGame(page);
    const p = await me(page);
    await page.evaluate(([x, y]) => window.__rpg!.spawn('slime', (x as number) + 20, y as number), [p.x, p.y]);
    await page.evaluate(([x, y]) => window.__rpg!.cast(2, x as number, y as number), [p.x, p.y]);
    await expect.poll(async () => (await st(page)).kills).toBe(1);
    expect((await st(page)).xp).toBe(10);
  });

  test('enemies chase and hurt the player; death shows the respawn prompt; R respawns', async ({ page }) => {
    await newGame(page);
    const p = await me(page);
    await page.evaluate(([x, y]) => window.__rpg!.spawn('slime', (x as number) + 40, y as number), [p.x, p.y]);
    const hp0 = (await st(page)).hp;
    await expect.poll(async () => (await st(page)).hp, { timeout: 40_000 }).toBeLessThan(hp0);
    await page.evaluate(() => window.__rpg!.killPlayer());
    await expect(page.locator('#prompt')).toContainText('press R');
    await page.keyboard.press('r');
    await expect.poll(async () => (await st(page)).hp).toBeGreaterThan(50);
  });

  test('HUD reflects hp/mana and skill cooldown', async ({ page }) => {
    await newGame(page);
    await expect(page.locator('#hptxt')).toContainText('HP 100 / 100');
    await page.evaluate(() => window.__rpg!.cast(1, 9999, 9999));
    await expect(page.locator('#cd1')).not.toHaveCSS('height', '0px');
    await expect(page.locator('#mptxt')).toContainText(/Mana (4\d|5\d)/);
  });

  test('perf smoke: >= 30 fps for 3s with the whole world loaded (software GL)', async ({ page }) => {
    await newGame(page);
    const fps = await page.evaluate(() => new Promise<number>((res) => { const g = (window as unknown as { __game: { getFrame(): number } }).__game; const f0 = g.getFrame(), t0 = performance.now(); setTimeout(() => res((g.getFrame() - f0) / ((performance.now() - t0) / 1000)), 3000); }));
    expect(fps).toBeGreaterThanOrEqual(30);
  });

  test('killOne helper sanity (all three enemy types die to slashes)', async ({ page }) => {
    await newGame(page);
    await page.evaluate(() => window.__rpg!.setHp(1e5));
    for (const t of ['slime', 'wraith', 'brute']) await killOne(page, t);
    expect((await st(page)).kills).toBe(3);
  });
});
