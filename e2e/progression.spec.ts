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

  test('a level-up from a real kill shows a toast', async ({ page }) => {
    await newGame(page);
    await page.evaluate(() => { window.__rpg!.setHp(1e5); window.__rpg!.giveXp(19); });
    await killOne(page, 'slime');
    await expect(page.locator('.toast', { hasText: 'Level up' })).toBeVisible();
  });

  test('killing an enemy fills the XP bar', async ({ page }) => {
    await newGame(page);
    await page.evaluate(() => window.__rpg!.setHp(1e5));
    await killOne(page, 'slime');
    await expect(page.locator('#xptxt')).toContainText('XP 10 / 20');
  });

  test('meditation accrues qi, is cancelled by moving, and shows in the HUD', async ({ page }) => {
    await newGame(page);
    await page.keyboard.press('m');
    await waitGame(page, 1.5);
    const s = await st(page);
    expect(s.meditating).toBe(true); expect(s.qi).toBeGreaterThan(10);
    await expect(page.locator('#lvl')).toContainText('meditating');
    await page.keyboard.down('d'); await page.waitForTimeout(150); await page.keyboard.up('d');
    expect((await st(page)).meditating).toBe(false);
  });

  test('breakthrough fails without full qi; failure halves qi; success raises the realm and stats', async ({ page }) => {
    await newGame(page);
    await page.keyboard.press('b');
    await expect(page.locator('.toast', { hasText: 'not full enough' })).toBeVisible();
    await page.evaluate(() => { window.__rpg!.setQi(100); window.__rpg!.setRoll(0.99); });
    const hp0 = (await st(page)).maxHp;
    await page.keyboard.press('b');
    let s = await st(page);
    expect(s.realm).toBe(0); expect(s.qi).toBe(50);
    await page.evaluate(() => { window.__rpg!.setQi(100); window.__rpg!.setRoll(0.1); });
    await page.keyboard.press('b');
    s = await st(page);
    expect(s.realm).toBe(1); expect(s.qi).toBe(0); expect(s.maxHp).toBeGreaterThan(hp0);
    await expect(page.locator('#lvl')).toContainText('Qi Condensation II');
    await shot(page, 'breakthrough');
  });

  test('character panel button drives breakthrough', async ({ page }) => {
    await newGame(page);
    await page.keyboard.press('c');
    await expect(page.locator('#btn-breakthrough')).toBeDisabled();
    await page.evaluate(() => { window.__rpg!.setQi(100); window.__rpg!.setRoll(0.1); });
    await expect(page.locator('#btn-breakthrough')).toBeEnabled();
    await page.click('#btn-breakthrough');
    await expect(page.locator('#chrbody')).toContainText('Qi Condensation II');
  });

  test('potions: Q hotkey and inventory click both heal and consume; no waste at full hp', async ({ page }) => {
    await newGame(page);
    await page.keyboard.press('q');
    await expect(page.locator('.toast', { hasText: 'already full' })).toBeVisible();
    expect((await st(page)).items).toContain('hp-potion:2');
    await page.evaluate(() => window.__rpg!.setHp(20));
    await page.keyboard.press('q');
    await expect.poll(async () => (await st(page)).hp).toBeGreaterThanOrEqual(60);
    expect((await st(page)).items).toContain('hp-potion:1');
    await page.evaluate(() => window.__rpg!.setHp(20));
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
    const idx = (await st(page)).items.length; // sword is the 2nd stack => slot 1
    expect(idx).toBeGreaterThan(1);
    await page.click('#invgrid .cell[data-slot="1"]');
    await expect.poll(atk).toBe(a0 + 4);
    expect((await st(page)).weapon).toBe('iron-sword');
    await expect(page.locator('#equip')).toContainText('Iron Sword');
    await page.click('#weapon-slot');
    await expect.poll(atk).toBe(a0);
    expect((await st(page)).weapon).toBeNull();
    await shot(page, 'inventory');
  });

  test('drops land in the inventory', async ({ page }) => {
    await newGame(page);
    await page.evaluate(() => { window.__rpg!.setHp(1e5); window.__rpg!.setRoll(0); });
    await killOne(page, 'slime');
    const items = (await st(page)).items.join(',');
    expect(items).toContain('spirit-herb:1'); expect(items).toContain('hp-potion:3');
  });
});

test.describe('#12 NPC dialogue + quests', () => {
  test('full chain: accept -> progress -> turn in -> reward -> second quest offered', async ({ page }) => {
    await newGame(page, 'Quester');
    await page.evaluate(() => { window.__rpg!.setHp(1e5); window.__rpg!.setRoll(0); });
    await goToNpc(page);
    await expect(page.locator('#prompt')).toContainText('talk to Elder Lin');
    await talk(page);
    await expect(page.locator('#dlg')).toContainText('slimes are choking');
    await shot(page, 'dialogue-offer');
    await acceptFirst(page); // accept via number key
    await expect(page.locator('#quest')).toContainText('Pests of the Grove');
    await expect(page.locator('#quest')).toContainText('0/4');
    for (let i = 0; i < 4; i++) await killOne(page, 'slime');
    await expect(page.locator('#quest')).toContainText('4/4');
    await expect(page.locator('#quest')).toContainText('Gather Spirit Herbs 2/2');
    await goToNpc(page);
    await talk(page);
    await expect(page.locator('#dlg')).toContainText('Claim reward');
    await page.click('#dlg button[data-opt="0"]');
    await expect(page.locator('.toast', { hasText: 'Quest complete' })).toBeVisible();
    const s = await st(page);
    expect(s.quests.pests).toBe('turnedIn');
    expect(s.items.join(',')).toContain('iron-sword:1');
    await expect(page.locator('#dlg')).toContainText('Stone Warden'); // chained offer
    await page.keyboard.press('Escape');
    await expect(page.locator('#dlg')).toBeHidden();
  });

  test('second quest is not offered before the first is finished', async ({ page }) => {
    await newGame(page);
    await goToNpc(page); await talk(page);
    await expect(page.locator('#dlg')).not.toContainText('Stone Warden');
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
