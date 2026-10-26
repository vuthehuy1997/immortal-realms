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

  test('player walks with the keyboard, animates, and cannot walk through the palace', async ({ page }) => {
    await newGame(page);
    const start = await me(page);
    await page.keyboard.down('d');
    await expect.poll(async () => (await me(page)).x).toBeGreaterThan(start.x + 10);
    expect((await st(page)).playerAnim).toBe('walk');
    await page.keyboard.up('d');
    await expect.poll(async () => (await st(page)).playerAnim).toBe('idle');
    const pal = (await st(page)).palace!;
    await page.evaluate(([x, y]) => window.__rpg!.teleport(x as number, y as number), [pal.x, pal.y + 70]);
    await page.keyboard.down('w');
    let last = -1;
    await expect.poll(async () => { const y = (await me(page)).y; const same = Math.abs(y - last) < 0.01; last = y; return same; }, { timeout: 30_000 }).toBe(true);
    await page.keyboard.up('w');
    const stop = await me(page);
    expect(stop.y).toBeGreaterThan(pal.y); // stopped at the palace footprint, did not pass through
    expect(stop.y).toBeLessThan(pal.y + 14);
    expect(Math.abs(stop.x - pal.x)).toBeLessThan(2);
  });

  test('the whole world is populated: all enemy behaviours, many types, elites possible, herbs to gather', async ({ page }) => {
    await page.goto('/'); await page.click('#btn-new'); await page.fill('#name', 'X'); await page.click('#btn-start');
    await page.waitForFunction(() => window.__rpg && window.__rpg.state().now > 0.2, null, { timeout: 60_000 });
    const s = await st(page);
    const types = new Set(s.enemies.map((e) => e.type));
    for (const t of ['wolf', 'foxfire', 'golem', 'toad', 'ghost', 'jiangshi', 'bat']) expect(types, t).toContain(t);
    expect(s.enemies.length).toBeGreaterThan(30);
    expect([...new Set(s.enemies.map((e) => e.zone))]).toEqual(expect.arrayContaining(['bamboo', 'marsh', 'grove', 'ruins'])); // plus the lake and cliffs since chapter 1 grew
    expect(s.herbs.length).toBeGreaterThanOrEqual(15);
    for (const e of s.enemies) expect(Math.hypot(e.x - s.spawn.x, e.y - s.spawn.y), `${e.type} too close to the village gate`).toBeGreaterThan(120);
    await shot(page, 'world-start');
  });

  test('entering a zone shows its name banner', async ({ page }) => {
    await newGame(page);
    const a = (await st(page)).anchors.marsh!;
    await page.evaluate(([x, y]) => window.__rpg!.teleport(x as number, y as number), [a.x, a.y]);
    await expect(page.locator('#zonebanner .zn')).toContainText('Mistveil Marsh');
    await expect.poll(async () => (await st(page)).zone).toBe('marsh');
  });

  test('sword combo chains three hits and the finisher hits hardest', async ({ page }) => {
    await newGame(page, 'Tester', 'verdant'); // verdant: no burn ticks to confuse the per-hit damage readings
    const p = await me(page);
    await page.evaluate(([x, y]) => { window.__rpg!.spawn('golem', (x as number) + 24, y as number); window.__rpg!.alertAll(); /* aware, so the ambush bonus can't skew the comparison */ }, [p.x, p.y]);
    const hp = async () => (await st(page)).enemies[0]!.hp;
    const hits: number[] = [];
    for (let i = 0; i < 3; i++) {
      const before = await hp();
      const t0 = (await st(page)).now;
      await page.evaluate(([x, y]) => window.__rpg!.attack((x as number) + 50, y as number), [p.x, p.y]);
      await expect.poll(async () => (await st(page)).comboStep, { timeout: 30_000 }).toBe(i);
      await expect.poll(hp, { timeout: 30_000 }).toBeLessThan(before);
      hits.push(before - (await hp()));
      // re-attack as soon as the swing has recovered (0.3s of game time), well inside the chain window
      await expect.poll(async () => (await st(page)).now - t0, { timeout: 30_000 }).toBeGreaterThanOrEqual(0.34);
    }
    expect((await st(page)).comboStep).toBe(2);
    expect(hits.every((h) => h > 0)).toBe(true);
    expect(hits[2]!).toBeGreaterThan(hits[0]!); // finisher multiplier 1.7 vs 0.9
  });

  test('flying sword costs mana and damages from range; locked techniques tell you when they unlock', async ({ page }) => {
    await newGame(page);
    const p = await me(page);
    await page.evaluate(([x, y]) => window.__rpg!.spawn('golem', (x as number) + 90, y as number), [p.x, p.y]);
    const m0 = (await st(page)).mana, hp0 = (await st(page)).enemies[0]!.hp;
    await page.evaluate(([x, y]) => window.__rpg!.cast(0, (x as number) + 150, y as number), [p.x, p.y]);
    await expect.poll(async () => (await st(page)).mana, { timeout: 20_000 }).toBeLessThan(m0 - 5);
    await expect.poll(async () => (await st(page)).enemies[0]?.hp, { timeout: 30_000 }).toBeLessThan(hp0);
    await page.keyboard.press('3');
    await expect(page.locator('.toast', { hasText: 'unlocks at level 4' })).toBeVisible();
    await expect(page.locator('#slot2')).toHaveClass(/locked/);
    await page.evaluate(() => window.__rpg!.giveXp(1000));
    await expect(page.locator('#slot2')).not.toHaveClass(/locked/);
  });

  test('lotus burst kills and stuns nearby enemies; kill gives xp and stones', async ({ page }) => {
    await newGame(page);
    await page.evaluate(() => { window.__rpg!.giveXp(2500); window.__rpg!.setHp(1e5); }); // high enough level that one burst kills the snakes
    const p = await me(page);
    await page.evaluate(([x, y]) => { window.__rpg!.spawn('snake', (x as number) + 24, y as number); window.__rpg!.spawn('snake', (x as number) - 24, y as number); }, [p.x, p.y]);
    await page.evaluate(([x, y]) => window.__rpg!.cast(2, x as number, y as number), [p.x, p.y]);
    await expect.poll(async () => (await st(page)).kills, { timeout: 30_000 }).toBe(2);
    const s = await st(page);
    expect(s.stones).toBeGreaterThan(0); expect(s.xp).toBeGreaterThan(0);
  });

  test('dash is a short burst with invulnerability, then goes on cooldown', async ({ page }) => {
    await newGame(page);
    const p0 = await me(page);
    await page.keyboard.down('d'); await page.keyboard.press('Shift');
    await expect.poll(async () => (await st(page)).dashing || (await st(page)).invulnerable).toBe(true);
    expect((await st(page)).invulnerable).toBe(true);
    await waitGame(page, 0.25); await page.keyboard.up('d');
    const p1 = await me(page);
    expect(p1.x - p0.x).toBeGreaterThan(45); // a dash covers far more than walking for 0.25s (~20)
    await page.keyboard.press('Shift');
    await waitGame(page, 0.1);
    expect((await st(page)).dashing).toBe(false); // still on cooldown
    await expect.poll(async () => (await st(page)).invulnerable, { timeout: 20_000 }).toBe(false);
  });

  test('enemies chase and hurt the player; death shows the respawn prompt; R respawns', async ({ page }) => {
    await newGame(page);
    const p = await me(page);
    await page.evaluate(([x, y]) => window.__rpg!.spawn('wolf', (x as number) + 50, y as number), [p.x, p.y]);
    const hp0 = (await st(page)).hp;
    await expect.poll(async () => (await st(page)).hp, { timeout: 40_000 }).toBeLessThan(hp0);
    await page.evaluate(() => window.__rpg!.killPlayer());
    await expect(page.locator('#death')).toBeVisible();
    await expect(page.locator('#death h2')).toHaveText('Defeated');
    expect((await st(page)).dead).toBe(true);
    await page.keyboard.press('r');
    await expect(page.locator('#death')).toBeHidden();
    await expect.poll(async () => (await st(page)).dead, { timeout: 30_000 }).toBe(false);
    expect((await st(page)).hp).toBeGreaterThan(50);
  });

  test('HUD reflects hp/mana and technique cooldown', async ({ page }) => {
    await newGame(page);
    await expect(page.locator('#hptxt')).toContainText('HP 100 / 100');
    await page.evaluate(() => window.__rpg!.cast(0, 9999, 9999));
    await expect(page.locator('#cd0')).not.toHaveCSS('height', '0px');
    await expect(page.locator('#mptxt')).toContainText(/Mana (4\d|5\d)/);
  });

  test('perf smoke: >= 30 fps for 3s with the whole world loaded (software GL)', async ({ page }) => {
    await newGame(page);
    const fps = await page.evaluate(() => new Promise<number>((res) => { const g = (window as unknown as { __game: { getFrame(): number } }).__game; const f0 = g.getFrame(), t0 = performance.now(); setTimeout(() => res((g.getFrame() - f0) / ((performance.now() - t0) / 1000)), 3000); }));
    expect(fps).toBeGreaterThanOrEqual(30);
  });

  test('every enemy behaviour can be defeated with the sword combo', async ({ page }) => {
    await newGame(page);
    await page.evaluate(() => { window.__rpg!.giveXp(500); window.__rpg!.setHp(1e5); });
    for (const t of ['wolf', 'foxfire', 'golem']) await killOne(page, t);
    expect((await st(page)).kills).toBe(3);
  });
});
