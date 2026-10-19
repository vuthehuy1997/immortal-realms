import { describe, expect, it } from 'vitest';
import { newEnemyAI, updateEnemyAI } from '../src/core/enemyAI';
import { ENEMIES, type EnemyDef } from '../src/data/enemies';

const P = (x: number, y = 0) => ({ x, y });
const run = (def: EnemyDef, selfX: number, targetX: number, secs: number, dt = 0.05) => {
  const ai = newEnemyAI(); let x = selfX; const attacks: number[] = []; const states: string[] = [];
  for (let t = 0; t < secs; t += dt) {
    const o = updateEnemyAI(ai, def, P(x), P(targetX), dt);
    x += o.vel.x * dt; if (o.attack) attacks.push(+t.toFixed(2)); states.push(ai.state);
  }
  return { ai, x, attacks, states };
};

describe('rusher (wolf)', () => {
  const d = ENEMIES.wolf!;
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

describe('melee telegraph (rushers are dodgeable)', () => {
  it('every rusher strike is preceded by a stationary strike windup; the hit never lands on the tick the windup starts', () => {
    for (const id of ['wolf', 'toad', 'skeleton']) {
      const d = ENEMIES[id]!, ai = newEnemyAI(); let strikeTicks = 0, attacks = 0, prev = ai.state;
      for (let t = 0; t < 6; t += 0.02) {
        const o = updateEnemyAI(ai, d, P(0), P(d.attackRange - 2), 0.02);
        if (ai.state === 'strike') { strikeTicks++; expect(o.vel).toEqual({ x: 0, y: 0 }); expect(o.attack).toBeUndefined(); }
        if (o.attack) { attacks++; expect(prev, `${id}: attack must follow a strike windup`).toBe('strike'); }
        prev = ai.state === 'strike' ? 'strike' : ai.state;
      }
      expect(attacks).toBeGreaterThanOrEqual(2);
      expect(strikeTicks * 0.02, `${id} windup length`).toBeGreaterThanOrEqual(attacks * (d.strikeWindup ?? 0.3) * 0.8);
    }
  });
  it('windups are readable but not slow: between 0.15 and 0.5 seconds', () => {
    for (const d of Object.values(ENEMIES)) if (d.behavior === 'rusher') { expect(d.strikeWindup ?? 0.3).toBeGreaterThanOrEqual(0.15); expect(d.strikeWindup ?? 0.3).toBeLessThanOrEqual(0.5); }
  });
});

describe('caster (foxfire wisp)', () => {
  it('circles its target while waiting to fire instead of standing still, and flips direction', () => {
    const d = ENEMIES.ghost!, ai = newEnemyAI(); ai.state = 'attack'; ai.attackCd = 5;
    let sx = 0, flips = 0, last = 0;
    for (let t = 0; t < 8; t += 0.05) {
      const o = updateEnemyAI(ai, d, P(0, 0), P(95, 0), 0.05);
      expect(Math.abs(o.vel.y)).toBeGreaterThan(0); // moves sideways relative to a target on the x axis
      expect(Math.abs(o.vel.x)).toBeLessThan(1e-6);
      const sign = Math.sign(o.vel.y); if (last && sign !== last) flips++; last = sign; sx += Math.abs(o.vel.y);
    }
    expect(sx).toBeGreaterThan(0); expect(flips).toBeGreaterThanOrEqual(2);
  });
  it('multi-shot casters fire a volley', () => {
    for (const id of ['thunderbird', 'peachspirit']) {
      const d = ENEMIES[id]!, ai = newEnemyAI(); ai.state = 'attack'; ai.attackCd = 0;
      const o = updateEnemyAI(ai, d, P(0), P(d.attackRange * 0.9), 0.02);
      expect(o.attack).toEqual({ kind: 'projectile', count: d.volley });
      expect(d.volley).toBeGreaterThan(1);
    }
  });
  const d = ENEMIES.foxfire!;
  it('fires projectiles from range and keeps its distance', () => {
    const r = run(d, 0, 95, 5);
    expect(r.attacks.length).toBeGreaterThanOrEqual(2);
    expect(Math.abs(95 - r.x)).toBeGreaterThanOrEqual(d.preferredRange! * 0.75 - 2);
  });
  it('retreats when the player is too close', () => {
    const r = run(d, 0, 10, 2);
    expect(r.states).toContain('retreat'); expect(r.x).toBeLessThan(0);
  });
});

describe('charger (stone golem)', () => {
  const d = ENEMIES.golem!;
  it('telegraphs with a windup before dashing and hitting', () => {
    const r = run(d, 0, 60, 5);
    const w = r.states.indexOf('windup'), da = r.states.indexOf('dash');
    expect(w).toBeGreaterThanOrEqual(0); expect(da).toBeGreaterThan(w);
    expect(r.attacks.length).toBeGreaterThanOrEqual(1);
  });
  it('is stationary during windup', () => {
    const ai = newEnemyAI(); ai.state = 'windup'; ai.timer = 0.6;
    expect(updateEnemyAI(ai, d, P(0), P(60), 0.1).vel).toEqual({ x: 0, y: 0 });
  });
});

describe('enemy roster data', () => {
  it('covers all three behaviours and has sane, unique entries', () => {
    const all = Object.values(ENEMIES);
    expect(new Set(all.map((e) => e.behavior))).toEqual(new Set(['rusher', 'caster', 'charger']));
    expect(all.length).toBeGreaterThanOrEqual(15);
    for (const e of all) {
      expect(e.id in ENEMIES).toBe(true);
      expect(e.sprite).toBe(`mob.${e.id}`);
      expect(e.maxHp).toBeGreaterThan(0); expect(e.speed).toBeGreaterThan(0); expect(e.radius).toBeGreaterThan(0);
      expect(e.stones[1]).toBeGreaterThanOrEqual(e.stones[0]);
      if (e.behavior === 'caster') expect(e.preferredRange).toBeGreaterThan(0);
      if (e.behavior === 'charger') expect(e.windup).toBeGreaterThan(0);
    }
  });
  it('every zone spawn table only references real enemies', async () => {
    const { ZONES } = await import('../src/data/zones');
    for (const z of Object.values(ZONES)) for (const id of Object.keys(z.spawns)) expect(ENEMIES[id], `${z.id}:${id}`).toBeDefined();
  });
});

describe('vision & perception', () => {
  const d = ENEMIES.wolf!;
  it('does not notice a target behind it, but does when it is close or in front', async () => {
    const { inVisionCone, canSee } = await import('../src/core/perception');
    const self = P(0), facing = P(1);
    expect(inVisionCone(self, facing, P(80), 110)).toBe(true);
    expect(inVisionCone(self, facing, P(-80), 110)).toBe(false);
    expect(inVisionCone(self, facing, P(-15), 110)).toBe(true); // sense radius
    expect(inVisionCone(self, facing, P(200), 110)).toBe(false); // too far
    expect(canSee(self, facing, P(80), 110, (x) => x > 40)).toBe(false); // wall in between
  });
  it('stays idle while it cannot see the target', () => {
    const ai = newEnemyAI();
    for (let i = 0; i < 40; i++) updateEnemyAI(ai, d, P(0), P(60), 0.05, false);
    expect(ai.state).toBe('idle');
  });
  it('never attacks without sight, hunts the last seen spot, then gives up', () => {
    const ai = newEnemyAI(); let attacks = 0, x = 0;
    for (let i = 0; i < 20; i++) { const o = updateEnemyAI(ai, d, P(x), P(60), 0.05, true); x += o.vel.x * 0.05; }
    expect(ai.state).not.toBe('idle');
    ai.state = 'attack'; ai.attackCd = 0;
    for (let i = 0; i < 100; i++) { const o = updateEnemyAI(ai, d, P(x), P(x + 5, 300), 0.05, false); x += o.vel.x * 0.05; if (o.attack) attacks++; }
    expect(attacks).toBe(0);
    expect(ai.state).toBe('idle'); // memory expired (3s)
  });
  it('turns at a limited rate', async () => {
    const { turnToward } = await import('../src/core/perception');
    const f = turnToward(P(1), P(-1, 0.0001), 0.5);
    expect(Math.atan2(f.y, f.x)).toBeCloseTo(0.5, 1);
  });
});
