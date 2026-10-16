import { expect, test } from '@playwright/test';

interface CombatState { now: number; hp: number; mana: number; kills: number; xp: number; enemies: { id: number; type: string; hp: number; x: number; y: number; ai: string }[] }
interface CombatHook {
  state(): CombatState; cast(i: number, x: number, y: number): void;
  teleport(x: number, y: number): void; spawn(type: string, x: number, y: number): void; clear(): void;
}
declare global { interface Window { __combat?: CombatHook } }

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.__combat !== undefined);
  await page.evaluate(() => { window.__combat!.clear(); });
});

const st = (page: import('@playwright/test').Page) => page.evaluate(() => window.__combat!.state());

test('slash damages an enemy in front, spends no mana, then goes on cooldown', async ({ page }) => {
  const s0 = await st(page);
  const me = await page.evaluate(() => (window as unknown as { __world: () => { x: number; y: number } }).__world());
  await page.evaluate(([x, y]) => { window.__combat!.clear(); window.__combat!.spawn('brute', x! + 14, y!); }, [me.x, me.y]);
  await page.evaluate(([x, y]) => window.__combat!.cast(0, x! + 50, y!), [me.x, me.y]);
  const s1 = await st(page);
  expect(s1.enemies[0]!.hp).toBeLessThan(70);
  expect(s1.mana).toBeCloseTo(s0.mana, 0);
  const hpAfterFirst = s1.enemies[0]!.hp;
  await page.evaluate(([x, y]) => window.__combat!.cast(0, x! + 50, y!), [me.x, me.y]); // immediately again: on cooldown
  expect((await st(page)).enemies[0]!.hp).toBe(hpAfterFirst);
});

test('spirit bolt costs mana and kills a slime; kill grants xp', async ({ page }) => {
  const me = await page.evaluate(() => (window as unknown as { __world: () => { x: number; y: number } }).__world());
  await page.evaluate(([x, y]) => window.__combat!.spawn('slime', x! + 60, y!), [me.x, me.y]);
  const m0 = (await st(page)).mana;
  await page.evaluate(([x, y]) => window.__combat!.cast(1, x! + 100, y!), [me.x, me.y]);
  expect((await st(page)).mana).toBeLessThan(m0 - 5);
  await page.waitForTimeout(700);
  const s = await st(page);
  expect(s.enemies[0]!.hp).toBeLessThan(30);
  // finish it with burst once adjacent
  await page.evaluate(([x, y]) => window.__combat!.teleport(x!, y!), [me.x, me.y]);
  await page.waitForTimeout(1500);
  await page.evaluate(([x, y]) => window.__combat!.cast(2, x!, y!), [me.x, me.y]);
  await expect.poll(async () => (await st(page)).kills).toBe(1);
  expect((await st(page)).xp).toBe(10);
});

test('enemies chase and hurt the player', async ({ page }) => {
  const me = await page.evaluate(() => (window as unknown as { __world: () => { x: number; y: number } }).__world());
  await page.evaluate(([x, y]) => window.__combat!.spawn('slime', x! + 40, y!), [me.x, me.y]);
  const hp0 = (await st(page)).hp;
  await expect.poll(async () => (await st(page)).hp, { timeout: 8000 }).toBeLessThan(hp0);
});
