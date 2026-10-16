import { expect, type Page } from '@playwright/test';

export interface RpgState {
  now: number; hp: number; mana: number; maxHp: number; kills: number; xp: number; level: number; realm: number; qi: number;
  weapon: string | null; meditating: boolean; bossDefeated: boolean; quests: Record<string, string>;
  enemies: { id: number; type: string; hp: number; x: number; y: number; ai: string; minion: boolean }[];
  boss: { hp: number; maxHp: number; x: number; y: number; engaged: boolean; phase: number; state: string; slams: number } | null;
  lair: { x: number; y: number }; spawn: { x: number; y: number }; npc: { x: number; y: number }; items: string[];
}
interface Rpg {
  state(): RpgState; cast(i: number, x: number, y: number): void; teleport(x: number, y: number): void;
  spawn(type: string, x: number, y: number): void; clear(): void; setRoll(v: number | null): void; setQi(v: number): void;
  setBossHpRatio(r: number): void; giveXp(n: number): void; give(id: string, n: number): void; setHp(n: number): void;
  killPlayer(): void; respawnNow(): void; useSlot(i: number): void;
}
declare global { interface Window { __rpg?: Rpg; __world?: () => { x: number; y: number } } }

export const SAVE_KEY = 'immortal-realms/save-v1';

export async function newGame(page: Page, name = 'Tester', root: 'flame' | 'tide' | 'verdant' = 'flame'): Promise<void> {
  await page.goto('/');
  await page.click('#btn-new');
  await page.fill('#name', name);
  await page.click(`[data-root=${root}]`);
  await page.click('#btn-start');
  await page.waitForFunction(() => window.__rpg !== undefined);
  await page.evaluate(() => window.__rpg!.clear());
}

export const st = (page: Page): Promise<RpgState> => page.evaluate(() => window.__rpg!.state());
export const me = (page: Page): Promise<{ x: number; y: number }> => page.evaluate(() => window.__world!());

/** Waits for `sec` seconds of GAME time (sim dt is clamped per frame, so wall-clock waits are unreliable under load). */
export async function waitGame(page: Page, sec: number): Promise<void> {
  const t0 = (await st(page)).now;
  await expect.poll(async () => (await st(page)).now - t0, { timeout: 60_000 }).toBeGreaterThanOrEqual(sec);
}

/** Spawns an enemy next to the player and slashes until it is dead. */
export async function killOne(page: Page, type: string): Promise<void> {
  const p = await me(page);
  await page.evaluate(([t, x, y]) => window.__rpg!.spawn(t as string, (x as number) + 14, y as number), [type, p.x, p.y]);
  for (let i = 0; i < 40; i++) {
    const s = await st(page);
    if (s.enemies.length === 0) return;
    const q = await me(page);
    await page.evaluate(([x, y]) => window.__rpg!.cast(0, (x as number) + 30, y as number), [q.x, q.y]);
    await waitGame(page, 0.5); // slash cooldown is 0.45s of game time
  }
  expect((await st(page)).enemies.length).toBe(0);
}

export async function goToNpc(page: Page): Promise<void> {
  const s = await st(page);
  await page.evaluate(([x, y]) => window.__rpg!.teleport(x as number, y as number), [s.npc.x - 12, s.npc.y + 4]);
}

/** Press E near the NPC and wait for the dialogue box (Phaser handles keys on the next frame). */
export async function talk(page: Page): Promise<void> {
  await page.keyboard.press('e');
  await expect(page.locator('#dlg')).toBeVisible();
}

/** Accept the first dialogue option with the number key and wait for the box to close. */
export async function acceptFirst(page: Page): Promise<void> {
  await page.keyboard.press('1');
  await expect(page.locator('#dlg')).toBeHidden();
}

export const shot = (page: Page, name: string) => page.screenshot({ path: `qc-artifacts/${name}.png` });
