import { expect, test } from '@playwright/test';
import { me, newGame, st, waitGame } from './helpers';

test.describe('per-hero technique kits', () => {
  test('the HUD hotbar shows the chosen hero\'s technique names', async ({ page }) => {
    await newGame(page, 'Kit', 'flame', 'twinblade');
    await expect(page.locator('#slot0 .nm')).toHaveText('Twin Daggers');
    await expect(page.locator('#slot3 .nm')).toHaveText('Storm of Blades');
  });

  test('casting a hero technique spends that hero\'s mana cost and shows the fan', async ({ page }) => {
    await newGame(page, 'Fan', 'flame', 'heroine');
    await expect(page.locator('#slot0 .nm')).toHaveText('Ember Fan');
    const p = await me(page);
    await page.evaluate(() => window.__rpg!.giveXp(100000));
    await waitGame(page, 0.2);
    const before = (await st(page)).mana;
    await page.evaluate(([x, y]) => { window.__rpg!.spawn('moss-slime', x as number + 90, y as number); window.__rpg!.cast(0, x as number + 100, y as number); }, [p.x, p.y]);
    await waitGame(page, 0.25);
    expect(before - (await st(page)).mana).toBeGreaterThan(8); // Ember Fan costs 11 (base 8), minus a little regen
    await page.screenshot({ path: 'qc-artifacts/hero-kit-fan.png' });
  });

  test('switching hero between games swaps the kit (no stale names)', async ({ page }) => {
    await newGame(page, 'A', 'flame', 'monk');
    await expect(page.locator('#slot2 .nm')).toHaveText('Diamond Palm');
    await newGame(page, 'B', 'flame', 'saber');
    await expect(page.locator('#slot2 .nm')).toHaveText('Earthsplitter');
  });
});
