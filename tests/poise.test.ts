import { describe, expect, it } from 'vitest';
import { addPoise, newBossAI, poiseMax, STAGGER_IMMUNE, STAGGER_TIME, updateBoss } from '../src/core/boss';
import { PERFECT_COOLDOWN, perfectReady } from '../src/core/dodge';
import { createRng } from '../src/core/rng';
import { BOSSES } from '../src/data/boss';
import { MAX_LEVEL } from '../src/core/progression';
import { REALMS } from '../src/data/realms';
import { tryDash, newDash, DASH } from '../src/core/combo';

const W = BOSSES.warden!;
const at = { x: 0, y: 0 }, far = { x: 60, y: 0 };

describe('boss poise', () => {
  it('every boss has a sane poise bar (a few percent of its HP, not trivial, not unreachable)', () => {
    for (const b of Object.values(BOSSES)) { const f = poiseMax(b) / b.maxHp; expect(f).toBeGreaterThan(0.05); expect(f).toBeLessThan(0.3); }
  });
  it('staggers when the bar fills, cancelling a wind-up', () => {
    const ai = newBossAI(), rng = createRng(2);
    ai.force = 'slam'; updateBoss(ai, W, 1, at, { x: 40, y: 0 }, 0.05, 0, rng);
    expect(ai.state).toBe('windup');
    expect(addPoise(ai, W, poiseMax(W) - 1)).toBe(false);
    expect(addPoise(ai, W, 5)).toBe(true);
    expect(ai.state).toBe('stagger'); expect(ai.move).toBeNull();
    const evs = []; for (let t = 0; t < STAGGER_TIME - 0.1; t += 0.05) evs.push(...updateBoss(ai, W, 1, at, { x: 40, y: 0 }, 0.05, 0, rng).events);
    expect(evs.filter((e) => e.type !== 'phase')).toHaveLength(0); // no attacks while staggered
    expect(ai.state).toBe('stagger');
    for (let t = 0; t < 0.5; t += 0.05) updateBoss(ai, W, 1, at, { x: 40, y: 0 }, 0.05, 0, rng);
    expect(ai.state).not.toBe('stagger');
  });
  it('cannot be stun-locked: immune after a stagger, and charges are not interruptible', () => {
    const ai = newBossAI();
    expect(addPoise(ai, W, poiseMax(W))).toBe(true);
    ai.state = 'chase';
    expect(addPoise(ai, W, poiseMax(W) * 2)).toBe(false);
    const rng = createRng(1);
    for (let t = 0; t < STAGGER_IMMUNE + STAGGER_TIME + 0.2; t += 0.05) updateBoss(ai, W, 1, at, far, 0.05, 0, rng);
    ai.state = 'chase'; ai.move = null;
    expect(addPoise(ai, W, poiseMax(W))).toBe(true);
    const c = newBossAI(); c.state = 'charging';
    expect(addPoise(c, W, poiseMax(W) * 3)).toBe(false);
  });
  it('poise drains when you stop attacking', () => {
    const ai = newBossAI(), rng = createRng(1);
    addPoise(ai, W, poiseMax(W) * 0.8);
    for (let t = 0; t < 10; t += 0.05) updateBoss(ai, W, 1, at, { x: 400, y: 0 }, 0.05, 0, rng);
    expect(ai.poise).toBeLessThan(poiseMax(W) * 0.8 * 0.6);
  });
  it('the poise multiplier (boons) speeds it up', () => {
    const a = newBossAI(), b = newBossAI();
    addPoise(a, W, poiseMax(W) * 0.75); addPoise(b, W, poiseMax(W) * 0.75, 1.4);
    expect(a.state).not.toBe('stagger'); expect(b.state).toBe('stagger');
  });
});

describe('perfect dodge + dash', () => {
  it('rewards at most once per cooldown', () => {
    expect(perfectReady(-9, 0)).toBe(true); expect(perfectReady(5, 5.5)).toBe(false); expect(perfectReady(5, 5 + PERFECT_COOLDOWN)).toBe(true);
  });
  it('a dash boon shortens the cooldown but never the invulnerability', () => {
    const d = newDash(); tryDash(d, 0, 0.75);
    expect(d.readyAt).toBeCloseTo(DASH.cooldown * 0.75); expect(d.invulnUntil).toBeCloseTo(DASH.invuln);
  });
});

describe('raised level cap', () => {
  it('is 50, with realms every ~10 levels, each stronger than the last', () => {
    expect(MAX_LEVEL).toBe(50);
    expect(REALMS.map((r) => r.reqLevel)).toEqual([1, 5, 10, 20, 28, 38, 46]);
    for (let i = 1; i < REALMS.length; i++) { expect(REALMS[i]!.statMult).toBeGreaterThan(REALMS[i - 1]!.statMult); expect(REALMS[i]!.qiMax).toBeGreaterThan(REALMS[i - 1]!.qiMax); }
  });
});
