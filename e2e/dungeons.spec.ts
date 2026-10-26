import { expect, test } from '@playwright/test';
import { newGame, shot, st, waitGame } from './helpers';

test.describe('caves and secret realms', () => {
  test('a cave: the gate shows its prompt, you walk in, fight the guardian, claim the first-clear reward and walk out', async ({ page }) => {
    test.setTimeout(150_000);
    await newGame(page, 'Delver');
    const s0 = await st(page);
    const g = s0.entrances.wolfden!;
    expect(g, 'the cave gate is on the chapter map').toBeDefined();

    // too weak: the gate refuses, and says why
    await page.evaluate(([x, y]) => window.__rpg!.teleport(x as number, (y as number) + 20), [g.x, g.y]);
    await expect(page.locator('#prompt')).toContainText('level 3');
    await page.keyboard.press('KeyE');
    await expect(page.locator('.toast', { hasText: 'too dangerous' })).toBeVisible();
    expect((await st(page)).dungeon).toBeNull();
    await shot(page, 'dungeon-gate-wolfden');

    // strong enough: step in
    await page.evaluate(() => window.__rpg!.giveXp(400));
    await expect(page.locator('#prompt')).toContainText('Moonfang Den');
    await page.keyboard.press('KeyE');
    await page.waitForFunction(() => window.__rpg !== undefined && window.__rpg.state().dungeon === 'wolfden' && window.__rpg.state().now > 0.4, null, { timeout: 60_000 });
    const inside = await st(page);
    expect(inside.chapter).toBe(1);
    expect(inside.zone).toBe('wolfden');
    expect(inside.bosses.map((b) => b.id)).toEqual(['alphawolf']);
    expect(inside.enemies.filter((e) => !e.minion).length).toBeGreaterThan(15);
    expect(inside.objective).toContain('Moonfang Alpha');
    await page.waitForTimeout(1500);
    await shot(page, 'dungeon-wolfden-entry');

    // the guardian waits at the far end; fight it with the real combat (cheat only its health and our own)
    await page.evaluate(() => { const r = window.__rpg!; r.clear(); r.setHp(1e5); r.setRoll(0.5); });
    const home = inside.bossHomes.alphawolf!;
    await page.evaluate(([x, y]) => window.__rpg!.teleport(x as number, (y as number) + 60), [home.x, home.y]);
    await page.waitForTimeout(800);
    await shot(page, 'dungeon-wolfden-boss');
    const before = await st(page);
    await page.evaluate(() => window.__rpg!.setBossHpRatio(0.01, 'alphawolf'));
    for (let i = 0; i < 60 && (await st(page)).bosses.length; i++) {
      const b = (await st(page)).bosses[0]!;
      await page.evaluate(([x, y]) => { window.__rpg!.teleport((x as number) - 20, y as number); window.__rpg!.attack(x as number, y as number); }, [b.x, b.y]);
      await page.waitForTimeout(250);
    }
    const after = await st(page);
    expect(after.bosses).toHaveLength(0);
    expect(after.bossesDefeated).toContain('alphawolf');
    expect(after.stones).toBeGreaterThan(before.stones + 100);
    await expect(page.locator('.toast', { hasText: 'cleared' })).toBeVisible();
    expect(after.objective).toContain('cleared');

    // walk out through the gate: back on the chapter map, in front of the cave
    const exit = after.portal;
    await page.evaluate(([x, y]) => window.__rpg!.teleport(x as number, (y as number) + 8), [exit.x, exit.y]);
    await expect(page.locator('#prompt')).toContainText('leave Moonfang Den');
    await page.keyboard.press('KeyE');
    await page.waitForFunction(() => window.__rpg !== undefined && window.__rpg.state().dungeon === null && window.__rpg.state().now > 0.4, null, { timeout: 60_000 });
    const out = await st(page);
    expect(out.zone).toBe('bamboo');
    expect(Math.hypot(out.spawn.x - g.x, out.spawn.y - g.y)).toBeGreaterThan(300); // not the hub
    expect(out.bossesDefeated).toContain('alphawolf');
  });

  test('a secret realm: chambers of foes, and dying inside wakes you outside its gate', async ({ page }) => {
    test.setTimeout(120_000);
    await newGame(page, 'Seeker');
    await page.evaluate(() => { window.__rpg!.giveXp(3000); window.__rpg!.setStones(500); });
    await page.evaluate(() => window.__rpg!.enterDungeon('swordsanctum'));
    await page.waitForFunction(() => window.__rpg !== undefined && window.__rpg.state().dungeon === 'swordsanctum' && window.__rpg.state().now > 0.4, null, { timeout: 60_000 });
    await page.waitForTimeout(1200);
    await shot(page, 'dungeon-sanctum-entry');
    const inside = await st(page);
    expect(inside.zone).toBe('swordsanctum');
    await page.evaluate(() => window.__rpg!.killPlayer());
    await expect(page.locator('#btn-respawn, button:has-text("Respawn")').first()).toBeVisible();
    await page.keyboard.press('KeyR');
    await page.waitForFunction(() => window.__rpg !== undefined && window.__rpg.state().dungeon === null && window.__rpg.state().now > 0.4 && !window.__rpg.state().dead, null, { timeout: 60_000 });
    const out = await st(page);
    expect(out.zone).toBe('ruins');
    expect(out.stones).toBeLessThan(500); // the usual death toll
    await waitGame(page, 0.2);
  });

  test('a hero saved inside a cave is loaded back inside it', async ({ page }) => {
    test.setTimeout(120_000);
    await newGame(page, 'Resume');
    await page.evaluate(() => { window.__rpg!.giveXp(400); window.__rpg!.enterDungeon('wolfden'); });
    await page.waitForFunction(() => window.__rpg !== undefined && window.__rpg.state().dungeon === 'wolfden' && window.__rpg.state().now > 0.4, null, { timeout: 60_000 });
    await page.reload();
    await page.click('#btn-continue');
    await page.waitForFunction(() => window.__rpg !== undefined && window.__rpg.state().now > 0.3, null, { timeout: 60_000 });
    expect((await st(page)).dungeon).toBe('wolfden');
  });
});
