import { expect, type Page } from '@playwright/test';

export interface EnemyState { id: number; type: string; hp: number; x: number; y: number; ai: string; minion: boolean; elite: boolean; affix: string | null; burning: boolean; slowed: boolean; shield: number; zone: string; anim: string }
export interface RpgState {
  now: number; hp: number; mana: number; maxHp: number; kills: number; xp: number; level: number; realm: number; qi: number;
  weapon: string | null; meditating: boolean; bossDefeated: boolean; quests: Record<string, string>; hero: string; stones: number; zone: string;
  dead: boolean; comboStep: number; dashing: boolean; invulnerable: boolean; playerAnim: string;
  enemies: EnemyState[];
  tut: number; objective: string; skills: Record<string, number>; freePoints: number; inventoryGear: { weapon: string | null; armor: string | null; charm: string | null };
  bag: (string | null)[]; bolts: number; props: { kind: string; x: number; y: number }[];
  boss: { hp: number; maxHp: number; x: number; y: number; engaged: boolean; phase: number; state: string; slams: number } | null;
  bosses: { id: string; hp: number; maxHp: number; x: number; y: number; engaged: boolean; phase: number; state: string; slams: number }[];
  bossesDefeated: string[]; den: { x: number; y: number }; pool: { x: number; y: number };
  palace?: { x: number; y: number };
  lair: { x: number; y: number }; spawn: { x: number; y: number }; npc: { x: number; y: number }; npcs: Record<string, { x: number; y: number }>;
  arrayPos: { x: number; y: number }; herbs: { x: number; y: number; alive: boolean }[]; anchors: Record<string, { x: number; y: number }>; items: string[];
}
interface Rpg {
  state(): RpgState; cast(i: number, x: number, y: number): void; attack(x: number, y: number): void; dash(): void; teleport(x: number, y: number): void;
  spawn(type: string, x: number, y: number): void; clear(): void; setRoll(v: number | null): void; setQi(v: number): void;
  setBossHpRatio(r: number, id?: string): void; giveXp(n: number): void; give(id: string, n: number): void; setHp(n: number): void;
  killPlayer(): void; respawnNow(): void; useSlot(i: number): void; gather(): void; bossForce(id: string, move: string): void; setStones(n: number): void; spawnElite(type: string, x: number, y: number): void; spawnUnaware(type: string, x: number, y: number): number; strikeEnemy(id: number): void; alertAll(): void; setTut(n: number): void;
}
declare global { interface Window { __rpg?: Rpg; __world?: () => { x: number; y: number } } }

export const SAVE_KEY = 'immortal-realms/save-v1';
type Root = 'flame' | 'tide' | 'verdant';

export async function newGame(page: Page, name = 'Tester', root: Root = 'flame', hero = 'swordsman'): Promise<void> {
  await page.goto('/');
  await page.click('#btn-new');
  await page.fill('#name', name);
  await page.click(`[data-hero=${hero}]`);
  await page.click(`[data-root=${root}]`);
  await page.click('#btn-start');
  await page.waitForFunction(() => window.__rpg !== undefined && window.__rpg.state().now > 0.2, null, { timeout: 60_000 });
  await page.evaluate(() => window.__rpg!.clear());
}

export const st = (page: Page): Promise<RpgState> => page.evaluate(() => window.__rpg!.state());
export const me = (page: Page): Promise<{ x: number; y: number }> => page.evaluate(() => window.__world!());

/** Waits for `sec` seconds of GAME time (sim dt is clamped per frame, so wall-clock waits are unreliable under load). */
export async function waitGame(page: Page, sec: number): Promise<void> {
  const t0 = (await st(page)).now;
  await expect.poll(async () => (await st(page)).now - t0, { timeout: 60_000 }).toBeGreaterThanOrEqual(sec);
}

/** Spawns an enemy near the player and fights it: sword combo up close, flying sword at range (casters kite). */
export async function killOne(page: Page, type: string): Promise<void> {
  const p = await me(page);
  const sx = p.x + 22, sy = p.y;
  await page.evaluate(([t, x, y]) => window.__rpg!.spawn(t as string, x as number, y as number), [type, sx, sy]);
  // other enemies respawn in the background: follow OUR enemy by id
  const target = (await st(page)).enemies.find((e) => e.type === type && Math.hypot(e.x - sx, e.y - sy) < 6);
  expect(target, `spawned ${type}`).toBeDefined();
  for (let i = 0; i < 80; i++) {
    const e = (await st(page)).enemies.find((x) => x.id === target!.id);
    if (!e) return;
    const q = await me(page);
    const dist = Math.hypot(e.x - q.x, e.y - q.y);
    if (dist <= 36) await page.evaluate(([x, y]) => window.__rpg!.attack(x as number, y as number), [e.x, e.y]);
    else await page.evaluate(([x, y]) => window.__rpg!.cast(0, x as number, y as number), [e.x, e.y]);
    await waitGame(page, 0.4);
  }
  expect((await st(page)).enemies.some((x) => x.id === target!.id)).toBe(false);
}

export async function goToNpc(page: Page, who = 'elder-lin'): Promise<void> {
  const s = await st(page);
  const n = s.npcs[who]!;
  await page.evaluate(([x, y]) => window.__rpg!.teleport(x as number, y as number), [n.x - 14, n.y + 6]);
}

/** Press E near the NPC and wait for the dialogue box (key events are handled on the next frame). */
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

/** Quest 1 end-to-end through the real dialogue: accept, hunt 4 wolves, hand in 2 herbs, claim. Leaves Elder Lin's next offer open. */
export async function finishPests(page: Page): Promise<void> {
  await page.evaluate(() => { window.__rpg!.setHp(1e5); window.__rpg!.setRoll(0.5); });
  await goToNpc(page); await talk(page); await acceptFirst(page);
  for (let i = 0; i < 4; i++) await killOne(page, 'wolf');
  await page.evaluate(() => window.__rpg!.give('spirit-herb', 2));
  await goToNpc(page); await talk(page);
  await page.click('#dlg button[data-opt="0"]'); // claim
  await expect(page.locator('.toast', { hasText: 'Quest complete' })).toBeVisible();
}
