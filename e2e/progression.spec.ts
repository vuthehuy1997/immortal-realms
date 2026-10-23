import { expect, test } from '@playwright/test';
import { acceptFirst, goToNpc, killOne, newGame, shot, st, talk, waitGame } from './helpers';

test.describe('#10 xp/level, #11 cultivation, #13 inventory', () => {
  test('XP grants a level-up with stat gain and a full heal', async ({ page }) => {
    await newGame(page);
    await page.evaluate(() => window.__rpg!.setHp(10));
    const before = await st(page);
    await page.evaluate(() => window.__rpg!.giveXp(25));
    const after = await st(page);
    expect(after.level).toBe(2); expect(after.maxHp).toBeGreaterThan(before.maxHp); expect(after.hp).toBe(after.maxHp);
    await expect(page.locator('#lvl')).toContainText('Lv 2');
  });

  test('a level-up from a real kill shows a toast and a technique unlock notice', async ({ page }) => {
    await newGame(page);
    await page.evaluate(() => { window.__rpg!.setHp(1e5); window.__rpg!.giveXp(19); }); // level 1 needs 20 xp
    await killOne(page, 'wolf');
    await expect(page.locator('.toast', { hasText: 'Level up' })).toBeVisible();
    await expect(page.locator('.toast', { hasText: 'Technique learned: Crescent Moon Slash' })).toBeVisible();
    await expect(page.locator('#slot1')).not.toHaveClass(/locked/);
  });

  test('killing an enemy fills the XP bar', async ({ page }) => {
    await newGame(page);
    await page.evaluate(() => window.__rpg!.setHp(1e5));
    await killOne(page, 'wolf');
    await expect(page.locator('#xptxt')).toContainText('XP 12 / 20');
  });

  test('meditation accrues qi, is cancelled by moving, and shows in the HUD', async ({ page }) => {
    await newGame(page);
    await page.keyboard.press('m');
    await waitGame(page, 1.5);
    const s = await st(page);
    expect(s.meditating).toBe(true); expect(s.qi).toBeGreaterThan(3); // 3 qi/s of game time
    await expect(page.locator('#lvl')).toContainText('meditating');
    await page.keyboard.down('d'); await page.waitForTimeout(150); await page.keyboard.up('d');
    expect((await st(page)).meditating).toBe(false);
  });

  test('meditating on the spirit array gathers qi much faster', async ({ page }) => {
    await newGame(page);
    const a = (await st(page)).arrayPos;
    await page.evaluate(([x, y]) => window.__rpg!.teleport(x as number, y as number), [a.x, a.y]);
    await expect(page.locator('#prompt')).toContainText('Spirit array');
    await page.keyboard.press('m');
    await waitGame(page, 2);
    const near = (await st(page)).qi;
    expect(near).toBeGreaterThan(12); // 3 qi/s * 2.5 * 2s = 15 on the array, vs ~6 elsewhere
    await shot(page, 'meditation-array');
  });

  test('breakthrough needs full qi AND level; failure halves qi and wounds you; success raises the realm and stats', async ({ page }) => {
    await newGame(page);
    await page.keyboard.press('b');
    await expect(page.locator('.toast', { hasText: 'not full enough' })).toBeVisible();
    await page.evaluate(() => window.__rpg!.setQi(120));
    await page.keyboard.press('b');
    await expect(page.locator('.toast', { hasText: 'foundation is too shallow: reach level 5' })).toBeVisible();
    expect((await st(page)).realm).toBe(0);
    await page.evaluate(() => { window.__rpg!.giveXp(400); window.__rpg!.setQi(120); window.__rpg!.setRoll(0.99); });
    await page.keyboard.press('b');
    await expect(page.locator('.toast', { hasText: 'Foundation Pill' })).toBeVisible(); // no pill, no attempt
    await page.evaluate(() => window.__rpg!.give('foundation-pill', 2));
    const before = await st(page);
    await page.keyboard.press('b');
    await expect.poll(async () => (await st(page)).qi).toBe(60);
    const failed = await st(page);
    expect(failed.realm).toBe(0); expect(failed.hp).toBeLessThan(before.maxHp); expect(failed.hp).toBeGreaterThan(0);
    await page.evaluate(() => { window.__rpg!.setQi(120); window.__rpg!.setRoll(0.1); });
    await page.keyboard.press('b');
    await expect.poll(async () => (await st(page)).realm).toBe(1);
    expect((await st(page)).items.some((i) => i.startsWith('foundation-pill'))).toBe(false); // both pills were consumed
    const s = await st(page);
    expect(s.qi).toBe(0); expect(s.maxHp).toBeGreaterThan(before.maxHp);
    await expect(page.locator('#lvl')).toContainText('Qi Condensation II');
    await shot(page, 'breakthrough');
  });

  test('character panel button drives breakthrough', async ({ page }) => {
    await newGame(page);
    await page.evaluate(() => { window.__rpg!.giveXp(400); });
    await page.keyboard.press('c');
    await expect(page.locator('#btn-breakthrough')).toBeDisabled();
    await expect(page.locator('#chrbody')).toContainText('level 5');
    await page.evaluate(() => { window.__rpg!.setQi(120); window.__rpg!.setRoll(0.1); });
    await expect(page.locator('#btn-breakthrough')).toBeDisabled(); // needs a pill as well
    await page.evaluate(() => window.__rpg!.give('foundation-pill', 1));
    await expect(page.locator('#btn-breakthrough')).toBeEnabled();
    await page.click('#btn-breakthrough');
    await expect(page.locator('#chrbody')).toContainText('Qi Condensation II');
  });

  test('potions: F hotkey and inventory click both heal and consume; no waste at full hp', async ({ page }) => {
    await newGame(page);
    await page.evaluate(() => window.__rpg!.setFlask(0)); // the flask is drunk first; this test is about the bag potions
    await page.keyboard.press('f');
    await expect(page.locator('.toast', { hasText: 'already full' })).toBeVisible();
    expect((await st(page)).items).toContain('hp-potion:2');
    await page.evaluate(() => window.__rpg!.setHp(20));
    await page.keyboard.press('f');
    await expect.poll(async () => (await st(page)).hp).toBeGreaterThanOrEqual(60);
    expect((await st(page)).items).toContain('hp-potion:1');
    await expect(page.locator('#cnt-hp')).toHaveText('0+1');
    await page.evaluate(() => window.__rpg!.setHp(20));
    await page.keyboard.press('f');
    await expect(page.locator('.toast', { hasText: 'settling' })).toBeVisible(); // draughts share a short cooldown
    expect((await st(page)).items).toContain('hp-potion:1');
    await waitGame(page, 2.7);
    await page.keyboard.press('i');
    await page.click('#invgrid .cell[data-slot="0"]');
    await expect.poll(async () => (await st(page)).hp).toBeGreaterThanOrEqual(60);
    await expect(page.locator('#invgrid .cell[data-slot="0"] .ico')).toHaveCount(0);
  });

  test('equipment: equip raises attack, unequip returns the sword to the bag', async ({ page }) => {
    await newGame(page);
    await page.evaluate(() => window.__rpg!.give('iron-sword', 1));
    await page.keyboard.press('i'); await page.keyboard.press('c');
    const atk = async () => Number((await page.locator('#chrbody .row', { hasText: 'Attack' }).innerText()).match(/\d+/)![0]);
    const a0 = await atk();
    await page.click('#invgrid .cell[data-slot="1"]');
    await expect.poll(atk).toBe(a0 + 4);
    expect((await st(page)).weapon).toBe('iron-sword');
    await expect(page.locator('#equip')).toContainText('Iron Sword');
    await page.click('#weapon-slot');
    await expect.poll(atk).toBe(a0);
    expect((await st(page)).weapon).toBeNull();
    await shot(page, 'inventory');
  });

  test('drops and spirit stones land in the bag; herbs are gathered from glowing lingzhi', async ({ page }) => {
    await newGame(page);
    await page.evaluate(() => { window.__rpg!.setHp(1e5); window.__rpg!.setRoll(0); });
    await killOne(page, 'wolf');
    const s = await st(page);
    expect(s.items.join(',')).toContain('hp-potion:3'); expect(s.stones).toBeGreaterThan(0);
    const h = s.herbs.find((x) => x.alive)!;
    await page.evaluate(([x, y]) => window.__rpg!.teleport(x as number, (y as number) + 4), [h.x, h.y]);
    await expect(page.locator('#prompt')).toContainText('gather the Spirit Herb');
    await page.keyboard.press('e');
    await expect.poll(async () => (await st(page)).items.join(',')).toContain('spirit-herb:1');
    expect((await st(page)).herbs.filter((x) => x.alive).length).toBe(s.herbs.length - 1);
  });
});

test.describe('#12 NPC dialogue + quests', () => {
  test('full chain: accept -> hunt wolves and gather herbs -> turn in -> reward -> second quest offered', async ({ page }) => {
    await newGame(page, 'Quester');
    await page.evaluate(() => { window.__rpg!.setHp(1e5); window.__rpg!.setRoll(0.5); });
    await goToNpc(page);
    await expect(page.locator('#prompt')).toContainText('talk to Elder Lin');
    await talk(page);
    await expect(page.locator('#dlg')).toContainText('Spirit wolves prowl');
    await expect(page.locator('#dlg .portrait')).toBeVisible();
    await shot(page, 'dialogue-offer');
    await acceptFirst(page);
    await expect(page.locator('#quest')).toContainText('Wolves of the Bamboo');
    await expect(page.locator('#quest')).toContainText('0/4');
    for (let i = 0; i < 4; i++) await killOne(page, 'wolf');
    await expect(page.locator('#quest')).toContainText('4/4');
    const herbs = (await st(page)).herbs;
    for (let i = 0; i < 2; i++) {
      await page.evaluate(([x, y]) => window.__rpg!.teleport(x as number, (y as number) + 4), [herbs[i]!.x, herbs[i]!.y]);
      await page.keyboard.press('e');
      await expect.poll(async () => (await st(page)).herbs.filter((h) => h.alive).length).toBe(herbs.length - i - 1);
    }
    await expect(page.locator('#quest')).toContainText('Gather Spirit Herbs 2/2');
    await goToNpc(page);
    await talk(page);
    await expect(page.locator('#dlg')).toContainText('Claim reward');
    await page.click('#dlg button[data-opt="0"]');
    await expect(page.locator('.toast', { hasText: 'Quest complete' })).toBeVisible();
    const s = await st(page);
    expect(s.quests.pests).toBe('turnedIn');
    expect(s.items.join(',')).toContain('iron-sword:1');
    await expect(page.locator('#dlg')).toContainText('nine-tailed fox'); // chained offer: the fox is next
    await page.keyboard.press('Escape');
    await expect(page.locator('#dlg')).toBeHidden();
  });

  test('second quest is not offered before the first is finished', async ({ page }) => {
    await newGame(page);
    await goToNpc(page); await talk(page);
    await expect(page.locator('#dlg')).not.toContainText('nine-tailed');
    await page.keyboard.press('2');
    await expect(page.locator('#dlg')).toBeHidden();
    expect((await st(page)).quests.pests).toBe('inactive');
  });

  test('cannot talk from far away; simulation is paused during dialogue', async ({ page }) => {
    await newGame(page);
    await page.keyboard.press('e');
    await expect(page.locator('#dlg')).toBeHidden();
    await goToNpc(page); await talk(page);
    const t0 = (await st(page)).now; await page.waitForTimeout(400);
    expect((await st(page)).now).toBe(t0);
  });
});
