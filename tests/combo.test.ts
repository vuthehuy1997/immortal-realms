import { describe, expect, it } from 'vitest';
import { COMBO, COMBO_WINDOW, commit, DASH, isDashing, isInvulnerable, newCombo, newDash, nextStep, tryDash } from '../src/core/combo';
import { impulse, stepKnockback } from '../src/core/knockback';

describe('sword combo', () => {
  it('starts at hit 1, chains within the window, finishes with the heavy third hit, then resets', () => {
    const c = newCombo(); let t = 0;
    expect(nextStep(c, t)).toBe(0); commit(c, 0, t);
    t += COMBO[0]!.recover + 0.01;
    expect(nextStep(c, t)).toBe(1); commit(c, 1, t);
    t += COMBO[1]!.recover + 0.01;
    expect(nextStep(c, t)).toBe(2); commit(c, 2, t);
    expect(COMBO[2]!.mult).toBeGreaterThan(COMBO[0]!.mult * 1.5);
    t += COMBO[2]!.recover + 0.01;
    expect(nextStep(c, t)).toBe(0); // finisher done: chain restarts
  });
  it('ignores input while recovering from a swing', () => {
    const c = newCombo(); commit(c, 0, 1);
    expect(nextStep(c, 1.05)).toBe(-1);
    expect(nextStep(c, 1 + COMBO[0]!.recover + 0.001)).toBe(1);
  });
  it('drops back to hit 1 when the player waits too long', () => {
    const c = newCombo(); commit(c, 0, 0);
    expect(nextStep(c, COMBO_WINDOW + 0.5)).toBe(0);
  });
  it('hits are ordered by weight (finisher has the longest windup and strongest knockback)', () => {
    expect(COMBO[2]!.windup).toBeGreaterThan(COMBO[0]!.windup);
    expect(COMBO[2]!.knockback).toBeGreaterThan(COMBO[1]!.knockback);
  });
});

describe('dash (khinh cong)', () => {
  it('grants brief invulnerability, then a cooldown', () => {
    const d = newDash();
    expect(tryDash(d, 0)).toBe(true);
    expect(isDashing(d, 0.05)).toBe(true); expect(isDashing(d, DASH.duration + 0.01)).toBe(false);
    expect(isInvulnerable(d, 0.2)).toBe(true); expect(isInvulnerable(d, DASH.invuln + 0.01)).toBe(false);
    expect(tryDash(d, 0.5)).toBe(false);
    expect(tryDash(d, DASH.cooldown + 0.01)).toBe(true);
  });
  it('i-frames outlast the movement so the dodge covers the recovery', () => { expect(DASH.invuln).toBeGreaterThan(DASH.duration); });
});

describe('knockback', () => {
  it('pushes away along the direction and decays to rest', () => {
    let v = impulse({ x: 1, y: 0 }, 100); let total = 0;
    expect(v.x).toBeGreaterThan(0); expect(v.y).toBe(0);
    for (let i = 0; i < 120; i++) { const s = stepKnockback(v, 1 / 60); total += s.move.x; v = s.vel; }
    expect(total).toBeGreaterThan(30); expect(v).toEqual({ x: 0, y: 0 });
  });
  it('zero direction is safe', () => { expect(Number.isFinite(impulse({ x: 0, y: 0 }, 50).x)).toBe(true); });
});
