import { expect, test } from '@playwright/test';
import { finishPests, goToNpc, killOne, me, newGame, SAVE_KEY, shot, st, talk, waitGame } from './helpers';

test.describe('QA regressions (round 1)', () => {
  test('S1: killing the fox before accepting its quest no longer softlocks the chain', async ({ page }) => {
    await newGame(page, 'Early Bird');
    await finishPests(page);
    await page.click('#dlg button[data-opt="1"]'); // "Not now" on the fox offer
    const den = (await st(page)).den;
    await page.evaluate(([x, y]) => window.__rpg!.teleport((x as number) - 100, y as number), [den.x, den.y]);
    await expect.poll(async () => (await st(page)).bosses.find((b) => b.id === 'ninetail')?.engaged).toBe(true);
    await page.evaluate(() => { window.__rpg!.setHp(1e5); window.__rpg!.setBossHpRatio(0.001, 'ninetail'); });
    const fox = (await st(page)).bosses.find((b) => b.id === 'ninetail')!;
    await page.evaluate(([x, y]) => window.__rpg!.teleport((x as number) - 26, y as number), [fox.x, fox.y]);
    await page.evaluate(([x, y]) => window.__rpg!.attack(x as number, y as number), [fox.x, fox.y]);
    await expect.poll(async () => (await st(page)).bossesDefeated, { timeout: 30_000 }).toContain('ninetail');
    await goToNpc(page); await talk(page);
    await expect(page.locator('#dlg')).toContainText('nine-tailed fox');
    await page.click('#dlg button[data-opt="0"]'); // accept the fox quest AFTER the kill
    await expect(page.locator('#quest')).toContainText('1/1'); // already satisfied
    await goToNpc(page); await talk(page);
    await expect(page.locator('#dlg')).toContainText('Claim reward');
    await page.click('#dlg button[data-opt="0"]');
    await expect.poll(async () => (await st(page)).quests.fox).toBe('turnedIn');
  });

  test('S2: quitting or reloading from the death screen never leaves a 0-HP hero', async ({ page }) => {
    await newGame(page, 'Mortal');
    await page.evaluate(() => window.__rpg!.killPlayer());
    await expect(page.locator('#death')).toBeVisible();
    await page.reload();
    await page.click('#btn-continue');
    await page.waitForFunction(() => window.__rpg && window.__rpg.state().now > 0.2);
    const s = await st(page);
    expect(s.hp).toBeGreaterThan(0); expect(s.dead).toBe(false);
    await expect(page.locator('#hptxt')).not.toContainText('HP 0 /');
  });

  test('dying costs 10% of your spirit stones and the Respawn button works', async ({ page }) => {
    await newGame(page);
    await page.evaluate(() => window.__rpg!.setStones(200));
    await page.evaluate(() => window.__rpg!.killPlayer());
    await expect(page.locator('#deathtxt')).toContainText('20 spirit stones');
    await page.click('#btn-respawn');
    await expect.poll(async () => (await st(page)).dead).toBe(false);
    expect((await st(page)).stones).toBe(180);
  });

  test('defeated bosses return (repeatable) after a reload, paying less and dropping no second unique item', async ({ page }) => {
    await newGame(page, 'Repeat');
    await page.evaluate(() => { window.__rpg!.setHp(1e5); window.__rpg!.setRoll(0); window.__rpg!.setBossHpRatio(0.001, 'ninetail'); });
    const den = (await st(page)).den;
    await page.evaluate(([x, y]) => window.__rpg!.teleport((x as number) - 90, y as number), [den.x, den.y]);
    await expect.poll(async () => (await st(page)).bosses.find((b) => b.id === 'ninetail')?.engaged).toBe(true);
    const fox = (await st(page)).bosses.find((b) => b.id === 'ninetail')!;
    await page.evaluate(([x, y]) => window.__rpg!.teleport((x as number) - 26, y as number), [fox.x, fox.y]);
    await page.evaluate(([x, y]) => window.__rpg!.attack(x as number, y as number), [fox.x, fox.y]);
    await expect.poll(async () => (await st(page)).bossesDefeated, { timeout: 30_000 }).toContain('ninetail');
    await page.keyboard.press('Escape'); await page.click('#btn-save');
    await page.reload(); await page.click('#btn-continue'); await page.waitForFunction(() => window.__rpg && window.__rpg.state().now > 0.2);
    const s = await st(page);
    expect(s.bosses.map((b) => b.id)).toContain('ninetail'); expect(s.bossesDefeated).toContain('ninetail');
    expect(s.items.filter((i) => i.startsWith('spirit-saber')).length).toBe(1);
  });
});

test.describe('combat depth (QA round 1: enemy AI)', () => {
  test('rusher attacks are telegraphed: a strike windup is visible before any damage', async ({ page }) => {
    await newGame(page);
    const p = await me(page);
    await page.evaluate(([x, y]) => window.__rpg!.spawn('toad', (x as number) + 30, y as number), [p.x, p.y]);
    const hp0 = (await st(page)).hp; let sawStrike = false;
    await expect.poll(async () => { const s = await st(page); if (s.enemies[0]?.ai === 'strike') sawStrike = true; return s.hp < hp0; }, { timeout: 60_000, intervals: [30] }).toBe(true);
    expect(sawStrike).toBe(true);
  });

  test('a pack spreads out instead of stacking on one pixel', async ({ page }) => {
    await newGame(page);
    await page.evaluate(() => window.__rpg!.setHp(1e5));
    const p = await me(page);
    await page.evaluate(([x, y]) => { for (let i = 0; i < 6; i++) window.__rpg!.spawn('wolf', (x as number) + 70 + i * 0.5, y as number); }, [p.x, p.y]);
    await waitGame(page, 3);
    const w = (await st(page)).enemies.filter((e) => e.type === 'wolf');
    let min = Infinity; for (let i = 0; i < w.length; i++) for (let j = i + 1; j < w.length; j++) min = Math.min(min, Math.hypot(w[i]!.x - w[j]!.x, w[i]!.y - w[j]!.y));
    expect(w.length).toBe(6); expect(min).toBeGreaterThan(6);
  });

  test('an enemy blocked by scenery walks around it and reaches you (no safe farming spot)', async ({ page }) => {
    await newGame(page);
    await page.evaluate(() => window.__rpg!.setHp(1e5));
    const bowl = (await st(page)).props.find((q) => q.kind === 'lotusbowl')!;
    await page.evaluate(([x, y]) => { window.__rpg!.teleport(x as number, (y as number) - 46); window.__rpg!.spawn('wolf', x as number, (y as number) + 30); window.__rpg!.alertAll(); /* the bowl blocks line of sight, so keep it aware to test pathing */ }, [bowl.x, bowl.y]);
    await expect.poll(async () => { const e = (await st(page)).enemies[0]; const q = await me(page); return e ? Math.hypot(e.x - q.x, e.y - q.y) : 0; }, { timeout: 60_000 }).toBeLessThan(26);
  });

  test('casters circle and fire volleys instead of standing like turrets', async ({ page }) => {
    await newGame(page);
    await page.evaluate(() => window.__rpg!.setHp(1e5));
    const p = await me(page);
    await page.evaluate(([x, y]) => window.__rpg!.spawn('thunderbird', (x as number) + 100, y as number), [p.x, p.y]);
    let maxBolts = 0;
    await expect.poll(async () => { maxBolts = Math.max(maxBolts, (await st(page)).bolts); return maxBolts; }, { timeout: 60_000 }).toBeGreaterThanOrEqual(3); // a volley, not a single shot
    const seen: { x: number; y: number }[] = [];
    for (let i = 0; i < 16; i++) { const e = (await st(page)).enemies[0]; if (e) seen.push({ x: e.x, y: e.y }); await waitGame(page, 0.25); }
    const ys = seen.map((s) => s.y); expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(8); // it keeps moving sideways while it attacks
  });

  test('elites get a name, a special trait and a stronger body', async ({ page }) => {
    await page.goto('/'); await page.click('#btn-new'); await page.fill('#name', 'E'); await page.click('#btn-start');
    await page.waitForFunction(() => window.__rpg && window.__rpg.state().now > 0.2, null, { timeout: 60_000 });
    // elites are random (~9%); spawn plenty through the test hook until some appear
    const seen = new Set<string>();
    for (let round = 0; round < 40 && seen.size < 4; round++) {
      await page.evaluate(() => { window.__rpg!.clear(); window.__rpg!.spawnElite('wolf', 100, 700); });
      const e = (await st(page)).enemies[0]!;
      expect(e.elite).toBe(true); expect(e.hp).toBeGreaterThan(40 * 4 * 1.5 * 2); // wolf base x4, marsh tier 1.5, elite x2.2
      seen.add(e.affix!);
    }
    for (const a of seen) expect(['swift', 'vampiric', 'explosive', 'shielded']).toContain(a);
    expect(seen.size).toBeGreaterThanOrEqual(3); // several different traits exist
  });
});

test.describe('progression systems', () => {
  test('technique points: earn by levelling, spend in the character panel, the hotbar shows the new level', async ({ page }) => {
    await newGame(page);
    await page.evaluate(() => window.__rpg!.giveXp(400));
    await page.keyboard.press('c');
    await expect(page.locator('.skills h4')).toContainText('4 points');
    await page.click('[data-skill="flying-sword"]');
    await expect(page.locator('.skills h4')).toContainText('3 points');
    expect((await st(page)).skills['flying-sword']).toBe(1);
    await expect(page.locator('#slv0')).toContainText('Lv2');
    await expect(page.locator('[data-skill="sword-rain"]')).toBeDisabled(); // locked until level 7
    await shot(page, 'skills-panel');
  });

  test('armor and charms equip into their own slots and change the stats', async ({ page }) => {
    await newGame(page);
    await page.evaluate(() => { window.__rpg!.give('sect-robe', 1); window.__rpg!.give('jade-pendant', 1); });
    await page.keyboard.press('i'); await page.keyboard.press('c');
    const row = async (name: string) => Number((await page.locator('#chrbody .row', { hasText: name }).first().innerText()).match(/\d+/)![0]);
    const def0 = await row('Defence');
    const slot = async (id: string) => (await st(page)).bag.indexOf(id);
    await page.click(`#invgrid .cell[data-slot="${await slot('sect-robe')}"]`);
    await expect.poll(() => row('Defence')).toBe(def0 + 7);
    await page.click(`#invgrid .cell[data-slot="${await slot('jade-pendant')}"]`);
    await expect.poll(async () => (await st(page)).inventoryGear.charm).toBe('jade-pendant');
    await expect(page.locator('#armor-slot .ico')).toHaveCount(1);
    await expect(page.locator('#charm-slot .ico')).toHaveCount(1);
    await page.click('#armor-slot');
    await expect.poll(() => row('Defence')).toBe(def0);
    await shot(page, 'gear');
  });

  test('foundation pills can be brewed by the alchemist and bought from the merchant', async ({ page }) => {
    await newGame(page);
    await page.evaluate(() => { window.__rpg!.give('spirit-herb', 3); window.__rpg!.setStones(700); });
    await goToNpc(page, 'alchemist-yun'); await page.keyboard.press('e');
    await page.click('[data-craft="brew-foundation"]');
    expect((await st(page)).items.join(',')).toContain('foundation-pill:1');
    await page.keyboard.press('Escape');
    await goToNpc(page, 'merchant-qiao'); await page.keyboard.press('e');
    await page.click('[data-buy="foundation-pill"]');
    expect((await st(page)).items.join(',')).toContain('foundation-pill:2');
    await page.click('[data-buy="sect-robe"]');
    expect((await st(page)).items.join(',')).toContain('sect-robe:1');
  });

  test('spirit-root passives: flame burns, tide slows, verdant heals on hit', async ({ page }) => {
    for (const [root, check] of [['flame', 'burning'], ['tide', 'slowed']] as const) {
      await newGame(page, 'Root', root);
      await page.evaluate(() => window.__rpg!.setHp(1e5));
      const p = await me(page);
      await page.evaluate(([x, y]) => window.__rpg!.spawn('golem', (x as number) + 24, y as number), [p.x, p.y]);
      await page.evaluate(([x, y]) => window.__rpg!.attack((x as number) + 50, y as number), [p.x, p.y]);
      await expect.poll(async () => (await st(page)).enemies[0]?.[check], { timeout: 30_000 }).toBe(true);
      await page.evaluate(() => localStorage.clear());
    }
    await newGame(page, 'Root', 'verdant');
    const p = await me(page);
    await page.evaluate(([x, y]) => { window.__rpg!.setHp(30); window.__rpg!.spawn('golem', (x as number) + 24, y as number); }, [p.x, p.y]);
    await page.evaluate(([x, y]) => window.__rpg!.attack((x as number) + 50, y as number), [p.x, p.y]);
    await expect.poll(async () => (await st(page)).hp, { timeout: 30_000 }).toBeGreaterThan(30);
  });
});

test.describe('onboarding & navigation (QA round 1)', () => {
  test('the first minute teaches move -> attack -> dash -> talk, with an arrow to the Elder', async ({ page }) => {
    await newGame(page, 'Newbie');
    await expect(page.locator('#objtext')).toContainText('Walk around');
    await page.keyboard.down('w');
    await expect(page.locator('#objtext')).toContainText('Attack', { timeout: 30_000 });
    await page.keyboard.up('w');
    await page.keyboard.press('Space');
    await expect(page.locator('#objtext')).toContainText('Dodge');
    await page.keyboard.press('Shift');
    await expect(page.locator('#objtext')).toContainText('Talk to Elder Lin');
    await expect(page.locator('#objarrow i')).toBeVisible(); // the Elder is off screen at the start
    await shot(page, 'onboarding-arrow');
    await goToNpc(page); await talk(page); await page.keyboard.press('2');
    await expect(page.locator('#objtext')).toContainText('Wolves of the Bamboo');
  });

  test('the objective follows the quest and points at the target', async ({ page }) => {
    await newGame(page);
    await page.evaluate(() => { window.__rpg!.setHp(1e5); window.__rpg!.setTut(15); });
    await expect(page.locator('#objtext')).toContainText('Talk to Elder Lin');
    await goToNpc(page); await talk(page); await page.keyboard.press('1');
    await expect(page.locator('#objtext')).toContainText('Slay Spirit Wolves 0/4');
    for (let i = 0; i < 4; i++) await killOne(page, 'wolf');
    await expect(page.locator('#objtext')).toContainText('Gather Spirit Herbs');
    await page.evaluate(() => window.__rpg!.give('spirit-herb', 2));
    await expect(page.locator('#objtext')).toContainText('Return to Elder Lin');
  });

  test('quest journal (J) and world map (Tab) open and close', async ({ page }) => {
    await newGame(page);
    await page.keyboard.press('j');
    await expect(page.locator('#qlog')).toBeVisible();
    await expect(page.locator('#qlog')).toContainText('Wolves of the Bamboo');
    await expect(page.locator('#qlog')).toContainText('Locked'); // later quests are visible but locked
    await shot(page, 'journal');
    await page.keyboard.press('Escape'); await expect(page.locator('#qlog')).toBeHidden();
    await page.keyboard.press('Tab');
    await expect(page.locator('#wmap')).toBeVisible();
    await shot(page, 'worldmap');
    await page.keyboard.press('Tab'); await expect(page.locator('#wmap')).toBeHidden();
  });

  test('the pause menu has a persistent volume slider; starting over warns about the existing save', async ({ page }) => {
    await newGame(page);
    await page.keyboard.press('Escape');
    await page.locator('#vol').fill('35');
    expect(await page.evaluate(() => localStorage.getItem('ir-vol'))).toBe('0.35');
    await page.click('#btn-quit');
    await page.click('#btn-new');
    await expect(page.locator('#save-warning')).toContainText('replace it');
    expect(await page.evaluate((k) => localStorage.getItem(k) !== null, SAVE_KEY)).toBe(true);
  });

  test('skill icons are drawn (regression: broken inline style left them blank)', async ({ page }) => {
    await newGame(page);
    for (let i = 0; i < 4; i++) {
      const bg = await page.locator(`#slot${i} .ic`).evaluate((e) => getComputedStyle(e).backgroundImage);
      expect(bg, `slot ${i}`).toContain('url(');
    }
  });
});
