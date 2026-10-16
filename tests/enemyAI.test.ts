import { describe, expect, it } from 'vitest';
import { newEnemyAI, updateEnemyAI } from '../src/core/enemyAI';
import { ENEMIES } from '../src/data/enemies';

const P = (x: number, y = 0) => ({ x, y });
const run = (def: typeof ENEMIES[string], selfX: number, targetX: number, secs: number, dt = 0.05) => {
  const ai = newEnemyAI(); let x = selfX; const attacks: number[] = []; const states: string[] = [];
  for (let t = 0; t < secs; t += dt) {
    const o = updateEnemyAI(ai, def, P(x), P(targetX), dt);
    x += o.vel.x * dt; if (o.attack) attacks.push(+t.toFixed(2)); states.push(ai.state);
  }
  return { ai, x, attacks, states };
};

describe('rusher (slime)', () => {
  const d = ENEMIES.slime!;
  it('stays idle outside aggro range', () => {
    const r = run(d, 0, d.aggroRange + 50, 2);
    expect(r.ai.state).toBe('idle'); expect(r.x).toBe(0);
  });
  it('chases then melee-attacks on cooldown', () => {
    const r = run(d, 0, 60, 6);
    expect(r.x).toBeGreaterThan(40);
    expect(r.attacks.length).toBeGreaterThanOrEqual(3);
    for (let i = 1; i < r.attacks.length; i++) expect(r.attacks[i]! - r.attacks[i - 1]!).toBeGreaterThanOrEqual(d.attackCooldown - 0.06);
  });
  it('loses interest beyond leash range', () => {
    const ai = newEnemyAI(); ai.state = 'chase';
    updateEnemyAI(ai, d, P(0), P(d.aggroRange * 2), 0.05);
    expect(ai.state).toBe('idle');
  });
});

describe('caster (wraith)', () => {
  const d = ENEMIES.wraith!;
  it('fires projectiles from range and keeps its distance', () => {
    const r = run(d, 0, 95, 5);
    expect(r.attacks.length).toBeGreaterThanOrEqual(2);
    expect(Math.abs(95 - r.x)).toBeGreaterThanOrEqual(d.preferredRange! * 0.6 - 2);
  });
  it('retreats when the player is too close', () => {
    const r = run(d, 0, 10, 2);
    expect(r.states).toContain('retreat');
    expect(r.x).toBeLessThan(0);
  });
});

describe('charger (brute)', () => {
  const d = ENEMIES.brute!;
  it('telegraphs with a windup before dashing and hitting', () => {
    const r = run(d, 0, 60, 4);
    const w = r.states.indexOf('windup'), da = r.states.indexOf('dash');
    expect(w).toBeGreaterThanOrEqual(0); expect(da).toBeGreaterThan(w);
    expect(r.attacks.length).toBeGreaterThanOrEqual(1);
  });
  it('is stationary during windup', () => {
    const ai = newEnemyAI(); ai.state = 'windup'; ai.timer = 0.6;
    expect(updateEnemyAI(ai, d, P(0), P(60), 0.1).vel).toEqual({ x: 0, y: 0 });
  });
});

describe('enemy data', () => {
  it('covers three behaviours', () => {
    expect(new Set(Object.values(ENEMIES).map((e) => e.behavior))).toEqual(new Set(['rusher', 'caster', 'charger']));
  });
});
