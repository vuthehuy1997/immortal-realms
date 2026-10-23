import { expect, test, type Page } from '@playwright/test';
import { goToNpc, me, newGame, SAVE_KEY, shot, st, talk } from './helpers';

const CH2_BOSSES = ['corpseking', 'crystalcolossus', 'sovereign'];

async function throughGate(page: Page, clear = true): Promise<void> {
  await page.evaluate(() => { const r = window.__rpg!; for (const b of ['warden', 'ninetail', 'jiaolong']) r.defeatBoss(b); r.giveXp(200000); });
  const portal = (await st(page)).portal;
  await page.evaluate(([x, y]) => window.__rpg!.teleport(x as number, (y as number) + 6), [portal.x, portal.y]);
  await expect(page.locator('#prompt')).toContainText('Sky Gate');
  await page.keyboard.press('KeyE');
  await page.waitForFunction(() => window.__rpg !== undefined && window.__rpg.state().chapter === 2 && window.__rpg.state().now > 0.3, null, { timeout: 60_000 });
  if (clear) await page.evaluate(() => window.__rpg!.clear());
}

test.describe('chapters: multi-map progression and story', () => {
  test('the Sky Gate refuses a character who has not beaten the guardians, and says why', async ({ page }) => {
    await newGame(page, 'Early');
    const portal = (await st(page)).portal;
    await page.evaluate(([x, y]) => window.__rpg!.teleport(x as number, (y as number) + 6), [portal.x, portal.y]);
    await page.keyboard.press('KeyE');
    await expect(page.locator('.toast', { hasText: 'guardians' })).toBeVisible();
    expect((await st(page)).chapter).toBe(1);
  });

  test('beating the guardians opens chapter 2: a different map, NPCs, zones, bosses and enemies', async ({ page }) => {
    test.setTimeout(150_000);
    await newGame(page, 'Climber');
    await throughGate(page, false);
    await page.waitForTimeout(2500);
    const s = await st(page);
    expect(s.chapter).toBe(2);
    expect(s.zone).toBe('outpost');
    expect(Object.keys(s.npcs).sort()).toEqual(['commander-shen', 'herbalist-mo', 'hermit-wen', 'quartermaster-gu']);
    expect(s.bosses.map((b) => b.id).sort()).toEqual([...CH2_BOSSES].sort());
    expect(Object.keys(s.bossHomes).sort()).toEqual([...CH2_BOSSES].sort());
    expect(s.bossesDefeated).toEqual(expect.arrayContaining(['warden', 'ninetail', 'jiaolong'])); // progress carries over
    await page.evaluate(() => window.__rpg!.alertAll()); // let the roster show
    const types = new Set(s.enemies.map((e) => e.type));
    for (const t of types) expect(['frostwolf', 'icesnake', 'frostwisp', 'rimebat', 'snowtreant', 'crystalgolem', 'prismghost', 'shardbird', 'ashskeleton', 'bloodjiangshi', 'ashguard']).toContain(t);
    expect(types.size).toBeGreaterThanOrEqual(5);
    await shot(page, 'chapter2-outpost');
    await expect(page.locator('#lvl')).toContainText('Lv');
  });

  test('chapter 2 persists: Save & Quit then Continue returns to the outpost, and the return gate leads home', async ({ page }) => {
    test.setTimeout(150_000);
    await newGame(page, 'Wanderer');
    await throughGate(page);
    await page.keyboard.press('Escape'); await page.click('#btn-quit');
    const saved = JSON.parse((await page.evaluate((k) => localStorage.getItem(k), SAVE_KEY))!) as { state: { chapter: number; story: number[] } };
    expect(saved.state.chapter).toBe(2);
    await page.click('#btn-continue');
    await page.waitForFunction(() => window.__rpg !== undefined && window.__rpg.state().now > 0.3);
    expect((await st(page)).chapter).toBe(2);
    const portal = (await st(page)).portal;
    await page.evaluate(([x, y]) => window.__rpg!.teleport(x as number, (y as number) + 6), [portal.x, portal.y]);
    await expect(page.locator('#prompt')).toContainText('return');
    await page.keyboard.press('KeyE');
    await page.waitForFunction(() => window.__rpg!.state().chapter === 1 && window.__rpg!.state().now > 0.3, null, { timeout: 30_000 });
    expect((await st(page)).bosses.map((b) => b.id).sort()).toEqual(['jiaolong', 'ninetail', 'warden']);
  });

  test('chapter 2 NPCs: Commander Shen offers the chain, the Quartermaster sells frontier gear', async ({ page }) => {
    test.setTimeout(150_000);
    await newGame(page, 'Buyer');
    await throughGate(page);
    await goToNpc(page, 'commander-shen'); await talk(page);
    await expect(page.locator('#dlg')).toContainText('Frost Wolves');
    await shot(page, 'chapter2-commander');
    await page.keyboard.press('Escape');
    await page.evaluate(() => window.__rpg!.setStones(50000));
    await goToNpc(page, 'quartermaster-gu'); await page.keyboard.press('e'); // a pure shop opens the trade window directly
    await expect(page.locator('#trade')).toContainText('Outpost Frost Mail');
    await expect(page.locator('#trade')).toContainText('Quartermaster Gu');
    await page.click('[data-buy="frost-mail"]');
    expect((await st(page)).items.join(',')).toContain('frost-mail:1');
    await shot(page, 'chapter2-shop');
  });

  test('Corpse King: found in the Ashen Barrow, can be slain once for the Barrow-King Ward (reused-sprite boss animates)', async ({ page }) => {
    test.setTimeout(180_000);
    await newGame(page, 'Slayer');
    await throughGate(page);
    await page.evaluate(() => { window.__rpg!.setHp(1e5); window.__rpg!.setRoll(0); window.__rpg!.setBossHpRatio(0.001, 'corpseking'); });
    const home = (await st(page)).bossHomes.corpseking!;
    await page.evaluate(([x, y]) => window.__rpg!.teleport(x as number, (y as number) + 110), [home.x, home.y]);
    await expect.poll(async () => (await st(page)).bosses.find((b) => b.id === 'corpseking')?.engaged).toBe(true);
    await expect(page.locator('#bossname')).toContainText('Corpse King');
    await page.waitForTimeout(2500);
    await shot(page, 'boss-corpseking');
    await expect.poll(async () => {
      const d = (await st(page)).bosses.find((b) => b.id === 'corpseking');
      if (!d) return (await st(page)).bossesDefeated;
      await page.evaluate(([x, y]) => { window.__rpg!.teleport(x as number, (y as number) + 26); window.__rpg!.attack(x as number, y as number); }, [d.x, d.y]);
      return (await st(page)).bossesDefeated;
    }, { timeout: 60_000 }).toContain('corpseking');
    expect((await st(page)).items.join(',')).toContain('barrow-ward:1');
  });

  test('the prologue and the chapter 2 intro are shown once, as pages you can advance or skip', async ({ page }) => {
    test.setTimeout(150_000);
    await page.goto('/?story=1');
    await page.click('#btn-new'); await page.fill('#name', 'Reader'); await page.click('#btn-start');
    await expect(page.locator('#story')).toBeVisible();
    await expect(page.locator('#story h2')).toContainText('The Broken Seals');
    const first = await page.locator('#story-text').textContent();
    await page.click('#story-next');
    expect(await page.locator('#story-text').textContent()).not.toBe(first);
    await shot(page, 'story-prologue');
    await page.keyboard.press('Escape'); // skip
    await expect(page.locator('#story')).toHaveCount(0);
    await page.waitForFunction(() => window.__rpg !== undefined && window.__rpg.state().now > 0.3);
    expect((await st(page)).story).toEqual([1]);
    const p0 = await me(page);
    await page.keyboard.down('KeyD'); await page.waitForTimeout(500); await page.keyboard.up('KeyD');
    expect((await me(page)).x).toBeGreaterThan(p0.x); // the game is playable once the pages close
    await throughGate(page).catch(() => undefined);
  });
});
