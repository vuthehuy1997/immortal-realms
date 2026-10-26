import { describe, expect, it } from 'vitest';
import { newBossAI, updateBoss, WINDUP_MIN_FACTOR, type BossEvent } from '../src/core/boss';
import { createRng } from '../src/core/rng';
import { BOSSES, type BossDef, type MoveId } from '../src/data/boss';

interface Logged { t: number; e: BossEvent }
const DAMAGE: BossEvent['type'][] = ['slam', 'sweep', 'rain', 'teleport', 'ring', 'summon', 'charge'];

/** Runs a fight where the player stands `targetDist` away; the boss chases. */
function sim(def: BossDef, hpRatio: number, targetDist: number, secs: number, o: { minions?: number; seed?: number; dt?: number } = {}) {
  const dt = o.dt ?? 0.05, rng = createRng(o.seed ?? 1), ai = newBossAI();
  let x = 0; const log: Logged[] = []; const velDuring: { state: string; move: string | null; vx: number }[] = [];
  const target = { x: targetDist, y: 0 };
  for (let t = 0; t < secs; t += dt) {
    const out = updateBoss(ai, def, hpRatio, { x, y: 0 }, target, dt, o.minions ?? 0, rng);
    velDuring.push({ state: ai.state, move: ai.move, vx: out.vel.x });
    x += out.vel.x * dt; out.events.forEach((e) => log.push({ t, e }));
  }
  return { ai, log, x, velDuring };
}
const telegraphs = (l: Logged[]) => l.filter((x) => x.e.type === 'telegraph').map((x) => ({ t: x.t, e: x.e as Extract<BossEvent, { type: 'telegraph' }> }));
const movesUsed = (l: Logged[]) => new Set(telegraphs(l).map((x) => x.e.move));

for (const def of Object.values(BOSSES)) {
  describe(`${def.name}`, () => {
    it('each phase only uses moves from its own pool', () => {
      const pools: Record<number, number> = { 1: 1, 2: 0.5, 3: 0.2 };
      for (const [phase, ratio] of Object.entries(pools)) {
        const used = movesUsed(sim(def, ratio, 60, 120, { seed: 7 }).log);
        for (const m of used) expect(def.kit[Number(phase) - 1]!, `phase ${phase} used ${m}`).toContain(m);
        expect(used.size, `phase ${phase} variety`).toBeGreaterThanOrEqual(2);
      }
    });
    it('later phases add moves the earlier ones never use', () => {
      expect(def.kit[2]!.some((m) => !def.kit[0]!.includes(m))).toBe(true);
      expect(def.kit[1]!.some((m) => !def.kit[0]!.includes(m))).toBe(true);
    });
    it('every damaging event is preceded by a matching telegraph that gave the player at least the windup time', () => {
      const r = sim(def, 0.2, 55, 150, { seed: 3 }), tele = telegraphs(r.log);
      const minWindup: Record<string, number> = { slam: def.moves.slam?.windup ?? 0, sweep: def.moves.sweep?.windup ?? 0, charge: def.moves.charge?.windup ?? 0, rain: def.moves.rain?.windup ?? 0, teleport: def.moves.teleport?.windup ?? 0, summon: def.moves.summon?.windup ?? 0, ring: def.moves.ring?.windup ?? 0 };
      let seen = 0;
      for (const d of r.log.filter((x) => DAMAGE.includes(x.e.type))) {
        const move = d.e.type as MoveId;
        const prev = [...tele].reverse().find((x) => x.e.move === move && x.t <= d.t);
        expect(prev, `${move} had no telegraph`).toBeDefined();
        expect(d.t - prev!.t, `${move} telegraph lead time`).toBeGreaterThanOrEqual(minWindup[move]! * WINDUP_MIN_FACTOR - 0.06);
        seen++;
      }
      expect(seen).toBeGreaterThan(10);
    });
    it('never repeats the same move twice in a row', () => {
      const seq = telegraphs(sim(def, 0.2, 55, 150, { seed: 11 }).log).map((x) => x.e.move);
      for (let i = 1; i < seq.length; i++) expect(seq[i]).not.toBe(seq[i - 1]);
    });
    it('is stationary during windups and recovery, and respects per-move cooldowns', () => {
      const r = sim(def, 0.2, 55, 150, { seed: 5 });
      r.velDuring.forEach((v, i) => { // (the last tick of a charge already reports 'recover' but still carries the charge velocity)
        if (v.state === 'windup' || (v.state === 'recover' && r.velDuring[i - 1]?.state !== 'charging')) expect(v.vx).toBe(0);
      });
      const byMove = new Map<string, number[]>(); for (const x of telegraphs(r.log)) byMove.set(x.e.move, [...(byMove.get(x.e.move) ?? []), x.t]);
      for (const [m, times] of byMove) {
        const cd = (def.moves[m as MoveId] as { cooldown?: number } | undefined)?.cooldown;
        if (!cd) continue;
        for (let i = 1; i < times.length; i++) expect(times[i]! - times[i - 1]!, `${m} cooldown`).toBeGreaterThanOrEqual(cd * def.enrage.cooldownMult - 0.1);
      }
    });
    it('announces each phase change exactly once and enrages in phase 3', () => {
      const r = sim(def, 0.2, 400, 6);
      expect(r.log.filter((x) => x.e.type === 'phase').map((x) => x.e)).toEqual([{ type: 'phase', phase: 3 }]);
      const chaseSpeed = (ratio: number) => Math.max(...sim(def, ratio, 2000, 3).velDuring.filter((v) => v.state === 'chase').map((v) => v.vx));
      expect(chaseSpeed(0.2)).toBeGreaterThan(chaseSpeed(1) * 1.25);
    });
    it.skipIf(!def.moves.summon)('does not summon past its minion cap', () => {
      const cap = def.moves.summon!.maxMinions;
      expect([...movesUsed(sim(def, 0.5, 60, 150, { minions: cap, seed: 2 }).log)]).not.toContain('summon');
      expect([...movesUsed(sim(def, 0.5, 60, 150, { minions: 0, seed: 2 }).log)]).toContain('summon');
    });
    it('is deterministic for a given seed and varies with the seed', () => {
      const a = JSON.stringify(sim(def, 0.4, 70, 60, { seed: 9 }).log), b = JSON.stringify(sim(def, 0.4, 70, 60, { seed: 9 }).log), c = JSON.stringify(sim(def, 0.4, 70, 60, { seed: 10 }).log);
      expect(a).toBe(b); expect(a).not.toBe(c);
    });
  });
}

describe('move details', () => {
  it('rain targets the player first, then scatters zones nearby, with a long readable delay', () => {
    const def = BOSSES.warden!, r = sim(def, 0.5, 70, 200, { seed: 4 });
    const rain = r.log.find((x) => x.e.type === 'rain')!.e as Extract<BossEvent, { type: 'rain' }>;
    expect(rain.zones).toHaveLength(def.moves.rain!.count);
    expect(rain.zones[0]).toEqual({ x: 70, y: 0 });
    for (const z of rain.zones.slice(1)) expect(Math.hypot(z.x - 70, z.y)).toBeLessThanOrEqual(def.moves.rain!.spread + 20 + 1e-6);
    const tele = telegraphs(r.log).find((x) => x.e.move === 'rain')!;
    expect(tele.e.duration).toBeGreaterThanOrEqual(def.moves.rain!.windup + def.moves.rain!.delay - 1e-6);
  });
  it('teleport lands on the far side of the player, close behind, with a marked arrival', () => {
    const def = BOSSES.warden!, r = sim(def, 0.2, 90, 250, { seed: 6 });
    const tp = r.log.find((x) => x.e.type === 'teleport')!.e as Extract<BossEvent, { type: 'teleport' }>;
    expect(tp.to.x).toBeGreaterThan(90); expect(tp.to.x - 90).toBeLessThanOrEqual(def.moves.teleport!.behind + 1e-6);
    const t = telegraphs(r.log).find((x) => x.e.move === 'teleport')!;
    expect(t.e.at.x).toBeCloseTo(tp.to.x, 3);
  });
  it('charge only starts at medium range, locks its direction and then moves fast along it', () => {
    const def = BOSSES.ninetail!;
    expect([...movesUsed(sim(def, 1, 6, 80, { seed: 8 }).log)]).not.toContain('charge'); // point blank: no room to charge
    expect([...movesUsed(sim(def, 1, 1500, 3, { seed: 8 }).log)]).not.toContain('charge'); // far beyond range
    const r = sim(def, 1, 400, 60, { seed: 8 });
    expect(r.velDuring.some((v) => v.state === 'charging' && Math.abs(v.vx) >= def.moves.charge!.speed - 1)).toBe(true);
    const ch = r.log.find((x) => x.e.type === 'charge')!.e as Extract<BossEvent, { type: 'charge' }>;
    expect(ch.dir.x).toBeGreaterThan(0.9);
  });
  it('sweep is a cone aimed at the player at windup start (the player can step out of it)', () => {
    const def = BOSSES.ninetail!, r = sim(def, 1, 60, 60, { seed: 1 });
    const tele = telegraphs(r.log).find((x) => x.e.move === 'sweep')!.e;
    expect(tele.halfAngle).toBeGreaterThan(0.5); expect(tele.range).toBeGreaterThan(40); expect(Math.hypot(tele.dir.x, tele.dir.y)).toBeCloseTo(1, 5);
  });
  it('the two bosses have different kits', () => {
    expect(JSON.stringify(BOSSES.warden!.kit)).not.toBe(JSON.stringify(BOSSES.ninetail!.kit));
    expect(BOSSES.ninetail!.kit[0]).toContain('charge'); expect(BOSSES.warden!.kit[0]).toContain('slam');
  });
});
