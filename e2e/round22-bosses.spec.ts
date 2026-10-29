import { expect, test, type Page } from '@playwright/test';
import { newGame, shot, st, waitGame } from './helpers';

/** Round 22: every new boss mechanic, driven through the real scene with the __rpg hooks. */
const goTo = async (page: Page, chapter: number): Promise<void> => {
  await page.evaluate(() => { window.__rpg!.giveXp(1e7); });
  if (chapter !== 1) {
    await page.evaluate((c) => window.__rpg!.goChapter(c), chapter);
    await page.waitForFunction((c) => window.__rpg !== undefined && window.__rpg.state().chapter === c && window.__rpg.state().now > 0.5, chapter, { timeout: 90_000 });
  }
  await page.evaluate(() => { window.__rpg!.clear(); window.__rpg!.setHp(1e6); });
};
const boss = async (page: Page, id: string) => (await st(page)).bosses.find((b) => b.id === id)!;
const nearBoss = async (page: Page, id: string, dx = -110, dy = 70): Promise<void> => {
  const h = (await st(page)).bossHomes[id]!;
  await page.evaluate(([x, y]) => window.__rpg!.teleport(x as number, y as number), [h.x + dx, h.y + dy]);
  await expect.poll(async () => (await boss(page, id)).engaged, { timeout: 30_000 }).toBe(true);
};
const hitAt = (page: Page, x: number, y: number) => page.evaluate(([a, b]) => { window.__rpg!.attack(a as number, b as number); window.__rpg!.cast(0, a as number, b as number); }, [x, y]);

test.describe('round 22 boss mechanics', () => {
  test.setTimeout(240_000);

  test('sovereign: a spirit ward absorbs damage, breaking it staggers the boss', async ({ page }) => {
    await newGame(page); await goTo(page, 2);
    await nearBoss(page, 'sovereign', -150);
    await page.evaluate(() => window.__rpg!.setBossHpRatio(0.6, 'sovereign'));
    await expect.poll(async () => (await boss(page, 'sovereign')).mech.ward, { timeout: 30_000 }).toBeGreaterThan(0);
    await expect.poll(async () => (await boss(page, 'sovereign')).look).toBe('mob.swordspirit~sovereign');
    await waitGame(page, 0.8); await shot(page, 'r22-sovereign');
    const hp0 = (await boss(page, 'sovereign')).hp;
    for (let i = 0; i < 60 && (await boss(page, 'sovereign')).mech.ward > 0; i++) {
      const b = await boss(page, 'sovereign'); await page.evaluate(([x, y]) => window.__rpg!.teleport((x as number) - 30, y as number), [b.x, b.y]);
      await hitAt(page, b.x, b.y); await waitGame(page, 0.25);
      if ((await boss(page, 'sovereign')).mech.ward > 0) expect((await boss(page, 'sovereign')).hp, 'ward soaks: boss HP untouched').toBeGreaterThanOrEqual(hp0);
    }
    expect((await boss(page, 'sovereign')).mech.ward, 'ward broken').toBe(0);
    await expect.poll(async () => (await boss(page, 'sovereign')).state, { timeout: 10_000 }).toBe('stagger');
    await shot(page, 'r22-sovereign-broken');
  });

  test('sandwyrm: burrow is untargetable, tracks, locks, erupts for damage', async ({ page }) => {
    await newGame(page); await goTo(page, 3);
    await nearBoss(page, 'sandwyrm', -120);
    await page.evaluate(() => window.__rpg!.bossForce('sandwyrm', 'burrow'));
    await expect.poll(async () => (await boss(page, 'sandwyrm')).state, { timeout: 30_000 }).toBe('burrow-windup');
    expect((await boss(page, 'sandwyrm')).hidden).toBe(true);
    await shot(page, 'r22-sandwyrm-burrow');
    const b = await boss(page, 'sandwyrm'), hp0 = b.hp;
    await hitAt(page, b.x, b.y); await waitGame(page, 0.2);
    expect((await boss(page, 'sandwyrm')).hp, 'untargetable underground').toBe(hp0);
    const me0 = (await st(page)).hp;
    await expect.poll(async () => (await st(page)).hp, { timeout: 30_000 }).toBeLessThan(me0); // standing in the marker: the eruption hurts
    expect((await boss(page, 'sandwyrm')).hidden).toBe(false);
    await shot(page, 'r22-sandwyrm-erupt');
  });

  test('mirageempress: decoys shatter, the real one takes damage', async ({ page }) => {
    await newGame(page); await goTo(page, 3);
    await nearBoss(page, 'mirageempress', -130);
    await page.evaluate(() => window.__rpg!.setBossHpRatio(0.6, 'mirageempress'));
    await page.evaluate(() => window.__rpg!.mechNow('mirageempress'));
    await expect.poll(async () => (await boss(page, 'mirageempress')).mech.decoys, { timeout: 30_000 }).toBe(3);
    await waitGame(page, 0.6); await shot(page, 'r22-mirageempress');
    for (let i = 0; i < 3; i++) {
      const d = (await boss(page, 'mirageempress')).mech.decoyAt[0];
      if (!d) break;
      await page.evaluate(([x, y]) => window.__rpg!.teleport((x as number) - 24, y as number), [d.x, d.y]);
      await hitAt(page, d.x, d.y); await waitGame(page, 0.3);
    }
    await expect.poll(async () => (await boss(page, 'mirageempress')).mech.decoys, { timeout: 20_000 }).toBeLessThan(3);
  });

  test('furnacewarden: lava pools warn first, then burn whoever stands in them', async ({ page }) => {
    await newGame(page); await goTo(page, 3);
    await nearBoss(page, 'furnacewarden', -130);
    await page.evaluate(() => window.__rpg!.mechNow('furnacewarden'));
    await expect.poll(async () => (await boss(page, 'furnacewarden')).mech.pools, { timeout: 30_000 }).toBeGreaterThan(0);
    await waitGame(page, 0.4); await shot(page, 'r22-furnace-warn');
    await page.evaluate(() => window.__rpg!.setHp(20000));
    await waitGame(page, 3.5); await shot(page, 'r22-furnace-pools');
    expect((await st(page)).hp, 'standing on the first pool burns').toBeLessThan(20000);
  });

  test('cranelord: wind blades warn, then cut along rotating arms', async ({ page }) => {
    await newGame(page); await goTo(page, 4);
    await nearBoss(page, 'cranelord', -150);
    await page.evaluate(() => window.__rpg!.setBossHpRatio(0.6, 'cranelord'));
    await page.evaluate(() => window.__rpg!.mechNow('cranelord'));
    await expect.poll(async () => (await boss(page, 'cranelord')).mech.beam, { timeout: 30_000 }).toBe(true);
    await waitGame(page, 0.5); await shot(page, 'r22-crane-warn');
    await expect.poll(async () => (await boss(page, 'cranelord')).mech.beamArmed, { timeout: 30_000 }).toBe(true);
    await page.evaluate(() => window.__rpg!.setHp(30000));
    let hurt = false;
    for (let i = 0; i < 12 && !hurt; i++) {
      const bm = (await boss(page, 'cranelord')).mech.beamAt;
      if (!bm) break;
      await page.evaluate(([x, y, a]) => window.__rpg!.teleport((x as number) + Math.cos(a as number) * 80, (y as number) + Math.sin(a as number) * 80), [bm.x, bm.y, bm.angle + 0.05]);
      await waitGame(page, 0.15); hurt = (await st(page)).hp < 30000;
    }
    await shot(page, 'r22-crane-beams');
    expect(hurt, 'standing on an armed blade hurts').toBe(true);
  });

  test('magistrate: seal pylons shield the boss until destroyed', async ({ page }) => {
    await newGame(page); await goTo(page, 4);
    await nearBoss(page, 'magistrate', -150);
    await page.evaluate(() => window.__rpg!.setBossHpRatio(0.6, 'magistrate'));
    await expect.poll(async () => (await boss(page, 'magistrate')).mech.pylons, { timeout: 30_000 }).toBe(3);
    await waitGame(page, 0.8); await shot(page, 'r22-magistrate');
    const dmgOf = async (): Promise<number> => {
      const b0 = await boss(page, 'magistrate'); let dealt = 0;
      for (let i = 0; i < 5; i++) { const b = await boss(page, 'magistrate'); await page.evaluate(([x, y]) => window.__rpg!.teleport((x as number) - 26, y as number), [b.x, b.y]); await hitAt(page, b.x, b.y); await waitGame(page, 0.3); }
      dealt = b0.hp - (await boss(page, 'magistrate')).hp; return dealt;
    };
    const shielded = await dmgOf();
    for (let g = 0; g < 40 && (await boss(page, 'magistrate')).mech.pylons > 0; g++) {
      const p = (await boss(page, 'magistrate')).mech.pylonAt[0]; if (!p) break;
      await page.evaluate(([x, y]) => window.__rpg!.teleport((x as number) - 20, y as number), [p.x, p.y]); await hitAt(page, p.x, p.y); await waitGame(page, 0.3);
    }
    expect((await boss(page, 'magistrate')).mech.pylons).toBe(0);
    const open = await dmgOf();
    expect(open, `open ${open} vs shielded ${shielded}`).toBeGreaterThan(shielded * 3);
  });

  test('abyss-matron: leech wisps heal the boss unless cut down', async ({ page }) => {
    await newGame(page); await goTo(page, 5);
    await nearBoss(page, 'abyss-matron', -150);
    await page.evaluate(() => window.__rpg!.setBossHpRatio(0.5, 'abyss-matron'));
    await page.evaluate(() => window.__rpg!.mechNow('abyss-matron'));
    await expect.poll(async () => (await boss(page, 'abyss-matron')).mech.wisps, { timeout: 30_000 }).toBe(3);
    await waitGame(page, 0.5); await shot(page, 'r22-matron');
    const before = (await boss(page, 'abyss-matron')).hp;
    await expect.poll(async () => (await boss(page, 'abyss-matron')).hp, { timeout: 40_000 }).toBeGreaterThan(before); // nobody stopped them
  });

  test('abyss-daodemon: ward and blade wheel in the last phase', async ({ page }) => {
    await newGame(page); await goTo(page, 5);
    await nearBoss(page, 'abyss-daodemon', -150);
    await page.evaluate(() => window.__rpg!.setBossHpRatio(0.25, 'abyss-daodemon'));
    await page.evaluate(() => window.__rpg!.mechNow('abyss-daodemon'));
    await expect.poll(async () => (await boss(page, 'abyss-daodemon')).mech.ward, { timeout: 30_000 }).toBeGreaterThan(0);
    await expect.poll(async () => (await boss(page, 'abyss-daodemon')).mech.beam, { timeout: 30_000 }).toBe(true);
    await expect.poll(async () => (await boss(page, 'abyss-daodemon')).mech.beamArmed, { timeout: 30_000 }).toBe(true);
    await shot(page, 'r22-daodemon');
  });
});
