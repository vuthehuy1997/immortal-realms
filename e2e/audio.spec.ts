import { expect, test } from '@playwright/test';
import { me, newGame, waitGame } from './helpers';

interface AudioHook { state: string; muted: boolean; stats: { sfx: number; notes: number; last: string } }
declare global { interface Window { __audio?: AudioHook } }
const au = (page: import('@playwright/test').Page) => page.evaluate(() => ({ state: window.__audio!.state, muted: window.__audio!.muted, ...window.__audio!.stats }));

test.describe('audio (procedural WebAudio)', () => {
  test('audio starts with the game, plays music notes and reacts to combat', async ({ page }) => {
    await newGame(page);
    await expect.poll(async () => (await au(page)).state).toBe('running');
    await expect.poll(async () => (await au(page)).notes, { timeout: 30_000 }).toBeGreaterThan(0);
    const before = (await au(page)).sfx;
    const p = await me(page);
    await page.evaluate(([x, y]) => window.__rpg!.attack((x as number) + 40, y as number), [p.x, p.y]);
    await expect.poll(async () => (await au(page)).last).toBe('slash1');
    await page.evaluate(([x, y]) => window.__rpg!.cast(0, (x as number) + 100, y as number), [p.x, p.y]);
    await expect.poll(async () => (await au(page)).sfx).toBeGreaterThan(before + 1);
    await page.evaluate(() => window.__rpg!.dash());
    await expect.poll(async () => (await au(page)).last, { timeout: 10_000 }).toBe('dash');
    await waitGame(page, 0.1);
  });

  test('menu clicks make a sound; N and the speaker button mute / unmute', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#btn-new')).toBeVisible({ timeout: 60_000 });
    await page.click('#btn-new');
    await expect.poll(async () => (await au(page)).last).toBe('click');
    await expect(page.locator('#btn-audio')).toBeVisible();
    await page.click('#btn-audio');
    expect((await au(page)).muted).toBe(true);
    await expect(page.locator('#btn-audio')).toHaveClass(/off/);
    await page.click('#btn-audio');
    expect((await au(page)).muted).toBe(false);
    await newGame(page);
    await page.keyboard.press('n');
    await expect.poll(async () => (await au(page)).muted).toBe(true);
    await expect(page.locator('.toast', { hasText: 'Sound off' })).toBeVisible();
    await page.keyboard.press('n');
    await expect.poll(async () => (await au(page)).muted).toBe(false);
  });
});
