import { describe, expect, it } from 'vitest';
import { newBossAI, updateBoss, type BossEvent } from '../src/core/boss';
import { WARDEN as D } from '../src/data/boss';

const run = (hpRatio: number, targetX: number, secs: number, minions = 0, dt = 0.05) => {
  const ai = newBossAI(); const log: { t: number; e: BossEvent }[] = []; let x = 0; const states: string[] = [];
  for (let t = 0; t < secs; t += dt) {
    const o = updateBoss(ai, D, hpRatio, { x, y: 0 }, { x: targetX, y: 0 }, dt, minions);
    x += o.vel.x * dt; o.events.forEach((e) => log.push({ t, e })); states.push(ai.state);
  }
  return { ai, log, x, states };
};
const of = (r: ReturnType<typeof run>, type: BossEvent['type']) => r.log.filter((l) => l.e.type === type);

describe('Stone Warden', () => {
  it('phase 1 chases and slams, with a telegraph before every slam', () => {
    const r = run(1, 60, 8);
    expect(r.x).toBeGreaterThan(20);
    const tele = of(r, 'slam-telegraph'), slam = of(r, 'slam');
    expect(tele.length).toBeGreaterThanOrEqual(1);
    expect(slam.length).toBeGreaterThanOrEqual(1);
    expect(slam[0]!.t - tele[0]!.t).toBeGreaterThanOrEqual(D.slam.windup - 0.06);
    expect(of(r, 'summon')).toHaveLength(0); expect(of(r, 'ring')).toHaveLength(0);
  });
  it('is stationary during windup and recovery', () => {
    const r = run(1, 30, 5);
    const i = r.states.indexOf('slam-windup'); expect(i).toBeGreaterThan(-1);
    const ai = newBossAI(); ai.state = 'slam-windup'; ai.timer = 1;
    expect(updateBoss(ai, D, 1, { x: 0, y: 0 }, { x: 50, y: 0 }, 0.1, 0).vel).toEqual({ x: 0, y: 0 });
  });
  it('slam is centred where the boss stood when it telegraphed (dodgeable)', () => {
    const r = run(1, 60, 8);
    const t = of(r, 'slam-telegraph')[0]!.e, s = of(r, 'slam')[0]!.e;
    if (t.type === 'slam-telegraph' && s.type === 'slam') expect(s.at).toEqual(t.at);
  });
  it('phase 2 announces itself and summons minions', () => {
    const r = run(0.6, 200, 8);
    expect(of(r, 'phase').map((p) => p.e)).toEqual([{ type: 'phase', phase: 2 }]);
    expect(of(r, 'summon').length).toBeGreaterThanOrEqual(1);
    expect(of(r, 'ring')).toHaveLength(0);
  });
  it('does not summon past the minion cap', () => {
    expect(of(run(0.6, 200, 20, D.summon.maxMinions), 'summon')).toHaveLength(0);
  });
  it('phase 3 enrages: faster movement and a telegraphed projectile ring', () => {
    const slow = run(1, 500, 3), fast = run(0.2, 500, 3);
    expect(fast.x).toBeGreaterThan(slow.x * 1.3);
    const r = run(0.2, 500, 8);
    expect(of(r, 'phase').map((p) => p.e)).toEqual([{ type: 'phase', phase: 3 }]);
    expect(of(r, 'ring-telegraph').length).toBeGreaterThanOrEqual(1);
    const ring = of(r, 'ring')[0]!.e;
    expect(ring.type === 'ring' && ring.projectiles).toBe(D.ring.projectiles);
  });
  it('is deterministic', () => {
    expect(run(0.5, 70, 10).log).toEqual(run(0.5, 70, 10).log);
  });
});
