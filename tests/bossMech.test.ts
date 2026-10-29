import { describe, expect, it } from 'vitest';
import { deriveStats } from '../src/core/character';
import { COMBO } from '../src/core/combo';
import { forceStagger, newBossAI, updateBoss, type BossEvent } from '../src/core/boss';
import { beamHits, damagePylon, damageWisp, distToRay, filterDamage, newMech, poolDps, shatterDecoy, tickMech, type MechEvent, type MechState } from '../src/core/bossMech';
import { createRng } from '../src/core/rng';
import { BOSSES, type BossDef } from '../src/data/boss';
import { BOSS_IDENTITY } from '../src/data/bossIdentity';
import { CHAPTERS } from '../src/data/chapters';
import { DUNGEONS } from '../src/data/dungeons';
import raw from '../src/data/manifest.generated.json';
const MANIFEST = raw as unknown as { sheets: Record<string, unknown>; fx: Record<string, unknown> };
import { REALMS } from '../src/data/realms';
import { ZONES, zonesOfChapter } from '../src/data/zones';

const HOME = { x: 0, y: 0 };
const run = (def: BossDef, m: MechState, phase: 1 | 2 | 3, secs: number, target = { x: 60, y: 0 }, seed = 5): MechEvent[] => {
  const rng = createRng(seed), out: MechEvent[] = [];
  for (let t = 0; t < secs; t += 0.05) out.push(...tickMech(m, def, { phase, self: HOME, target, home: HOME, dt: 0.05, rng, engaged: true }));
  return out;
};
const mk = (mech: BossDef['mech'], over: Partial<BossDef> = {}): BossDef => ({ ...BOSSES.sovereign!, mech, ...over });

describe('ward', () => {
  const def = mk({ ward: { frac: 0.1, phases: [2, 3], ttl: 10, healFrac: 0.05 } }, { maxHp: 1000 });
  it('rises on entering a listed phase, once per phase, sized by frac of max HP', () => {
    const m = newMech(def);
    expect(run(def, m, 1, 5)).toEqual([]);
    const ev = run(def, m, 2, 1);
    expect(ev).toEqual([{ type: 'wardUp', max: 100 }]);
    expect(run(def, m, 2, 0.5).filter((e) => e.type === 'wardUp')).toHaveLength(0);
    expect(run(def, m, 3, 0.1).filter((e) => e.type === 'wardUp')).toHaveLength(1);
  });
  it('absorbs damage until it breaks, then the rest goes through and a stagger is requested', () => {
    const m = newMech(def); run(def, m, 2, 0.1);
    const a = filterDamage(m, def, 60, false); expect(a.amount).toBe(0); expect(a.staggered).toBe(false);
    const b = filterDamage(m, def, 90, false); expect(b.amount).toBe(50); expect(b.staggered).toBe(true); expect(b.events).toEqual([{ type: 'wardBreak' }]);
    expect(m.ward).toBeNull();
    expect(filterDamage(m, def, 40, false).amount).toBe(40);
  });
  it('expires after its ttl and heals the boss', () => {
    const m = newMech(def); const ev = run(def, m, 2, 11);
    expect(ev.find((e) => e.type === 'wardExpire')).toEqual({ type: 'wardExpire', heal: 50 });
    expect(m.ward).toBeNull();
  });
  it('a hidden (underground) boss takes nothing', () => {
    expect(filterDamage(newMech(def), def, 500, true).amount).toBe(0);
  });
});

describe('illusions', () => {
  const def = mk({ illusions: { count: 3, every: 10, ttl: 6, phases: [2, 3], ring: 80, radius: 30, burstMult: 0.9 } });
  it('raises count decoys plus a real slot on a ring, only in listed phases', () => {
    const m = newMech(def);
    expect(run(def, m, 1, 30)).toEqual([]);
    const ev = run(def, m, 2, 6).find((e) => e.type === 'illusion')!;
    expect(ev.type).toBe('illusion');
    if (ev.type !== 'illusion') return;
    expect(ev.decoys).toHaveLength(3);
    for (const p of [ev.real, ...ev.decoys.map((d) => d.pos)]) expect(Math.hypot(p.x, p.y)).toBeCloseTo(80, 3);
    expect(new Set([ev.real, ...ev.decoys.map((d) => d.pos)].map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)).size).toBe(4);
  });
  it('the real slot is deterministic per seed and varies across seeds', () => {
    const reals = new Set<string>();
    for (let s = 1; s < 12; s++) { const m = newMech(def); const e = run(def, m, 2, 6, { x: 300, y: 0 }, s).find((x) => x.type === 'illusion'); if (e?.type === 'illusion') reals.add(e.real.x.toFixed(2)); }
    expect(reals.size).toBeGreaterThan(2);
    const a = run(def, newMech(def), 2, 6, { x: 300, y: 0 }, 9), b = run(def, newMech(def), 2, 6, { x: 300, y: 0 }, 9);
    expect(a).toEqual(b);
  });
  it('shattering every decoy ends it early; touch also shatters; ttl ends it otherwise', () => {
    const m = newMech(def); const e = run(def, m, 2, 6, { x: 900, y: 0 }).find((x) => x.type === 'illusion')!;
    if (e.type !== 'illusion') throw new Error('no illusion');
    const evs = e.decoys.flatMap((d) => shatterDecoy(m, def, d.id));
    expect(evs.filter((x) => x.type === 'decoyShatter')).toHaveLength(3);
    expect(evs.at(-1)).toEqual({ type: 'illusionEnd', reason: 'cleared' });
    expect(m.illusion).toBeNull();
    const m2 = newMech(def); run(def, m2, 2, 6, { x: 900, y: 0 });
    expect(run(def, m2, 2, 7, { x: 900, y: 0 }).some((x) => x.type === 'illusionEnd' && x.reason === 'expired')).toBe(true);
    const m3 = newMech(def); run(def, m3, 2, 6, { x: 80, y: 0 }); // hero standing on the ring: contact shatters
    expect(run(def, m3, 2, 5, { x: 80, y: 0 }).some((x) => x.type === 'decoyShatter')).toBe(true);
  });
});

describe('pools', () => {
  const def = mk({ pools: { every: 6, count: 3, radius: 20, warn: 1, ttl: 4, dpsMult: 0.4, phases: [1, 2, 3] } });
  it('telegraphs first (no damage), then burns, then ends', () => {
    const m = newMech(def);
    const ev = run(def, m, 1, 4.2); const pools = ev.filter((e) => e.type === 'pool');
    expect(pools).toHaveLength(3);
    const p = m.pools[0]!;
    expect(p.at).toEqual({ x: 60, y: 0 }); // the first lands on the hero
    expect(poolDps(m, def, { x: 60, y: 0 }, 5)).toBe(0.4); // 1.2s after landing: the 1s warning has elapsed
    expect(poolDps(m, def, { x: 300, y: 0 }, 5)).toBe(0);
    const early = newMech(def); run(def, early, 1, 3.3); // 0.3s after landing: still warning
    expect(poolDps(early, def, { x: 60, y: 0 }, 5)).toBe(0);
    expect(run(def, m, 1, 6).some((e) => e.type === 'poolEnd')).toBe(true);
  });
});

describe('beams', () => {
  const def = mk({ beams: { arms: 3, speed: 1, length: 100, width: 6, warn: 1, active: 3, every: 8, damageMult: 1, phases: [2, 3] } });
  it('geometry: an arm cuts only inside its length, never behind the origin', () => {
    expect(distToRay({ x: 0, y: 0 }, 0, 100, { x: 50, y: 4 })).toBeCloseTo(4);
    expect(distToRay({ x: 0, y: 0 }, 0, 100, { x: 150, y: 0 })).toBe(Infinity);
    expect(distToRay({ x: 0, y: 0 }, 0, 100, { x: -10, y: 0 })).toBe(Infinity);
  });
  it('warns for `warn` seconds without hurting, then rotates and ends', () => {
    const m = newMech(def); const ev = run(def, m, 2, 4.01);
    expect(ev.some((e) => e.type === 'beam')).toBe(true);
    const b = m.beam!;
    expect(b.warn).toBeGreaterThan(0);
    const probe = { x: Math.cos(b.angle) * 50, y: Math.sin(b.angle) * 50 };
    expect(beamHits(b, probe, 5)).toBe(false); // still warning
    const a0 = b.angle; run(def, m, 2, 1.5);
    expect(Math.abs(m.beam!.angle - a0)).toBeGreaterThan(0.2);
    expect(run(def, m, 2, 4).some((e) => e.type === 'beamEnd')).toBe(true);
  });
  it('an active arm hits a body on it and misses one in the gap between arms', () => {
    const b = { origin: { x: 0, y: 0 }, angle: 0, dir: 1 as const, warn: 0, left: 3, arms: 3, length: 100, width: 6, speed: 1 };
    expect(beamHits(b, { x: 60, y: 0 }, 5)).toBe(true);
    const gap = (Math.PI * 2) / 6; // exactly between two arms
    expect(beamHits(b, { x: Math.cos(gap) * 60, y: Math.sin(gap) * 60 }, 5)).toBe(false);
    expect(beamHits(b, { x: 150, y: 0 }, 5)).toBe(false);
  });
  it('does not start in a phase it is not listed for', () => { expect(run(def, newMech(def), 1, 30)).toEqual([]); });
});

describe('pylons', () => {
  const def = mk({ pylons: { count: 3, hpFrac: 0.01, reduction: 0.85, phases: [2, 3], ring: 90, defMult: 0.5 } }, { maxHp: 10000 });
  it('rises on a ring when a phase starts; the boss takes only 15% while one stands', () => {
    const m = newMech(def); const ev = run(def, m, 2, 0.1);
    expect(ev).toHaveLength(1); expect(m.pylons).toHaveLength(3);
    for (const p of m.pylons) { expect(Math.hypot(p.at.x, p.at.y)).toBeCloseTo(90, 3); expect(p.maxHp).toBe(100); }
    expect(filterDamage(m, def, 1000, false).amount).toBe(150);
    for (const p of [...m.pylons]) damagePylon(m, p.id, 100);
    expect(m.pylons).toHaveLength(0);
    expect(filterDamage(m, def, 1000, false).amount).toBe(1000);
  });
  it('pylonDown reports how many remain; damaging a gone pylon does nothing', () => {
    const m = newMech(def); run(def, m, 2, 0.1);
    const id = m.pylons[0]!.id;
    expect(damagePylon(m, id, 50)).toEqual([]);
    expect(damagePylon(m, id, 60)[0]).toMatchObject({ type: 'pylonDown', remaining: 2 });
    expect(damagePylon(m, id, 60)).toEqual([]);
  });
});

describe('leech wisps', () => {
  const def = mk({ leech: { every: 10, count: 2, healFrac: 0.02, hpFrac: 0.001, speed: 40, phases: [2, 3], max: 4 } }, { maxHp: 10000 });
  it('spawn, drift to the boss and heal it unless killed', () => {
    const m = newMech(def); const ev = run(def, m, 2, 5.1);
    expect(ev.some((e) => e.type === 'wisps')).toBe(true);
    const heals = run(def, m, 2, 5).filter((e) => e.type === 'wispHeal');
    expect(heals).toHaveLength(2);
    expect(heals[0]).toMatchObject({ heal: 200 });
  });
  it('a killed wisp never heals', () => {
    const m = newMech(def); run(def, m, 2, 5.1);
    for (const w of [...m.wisps]) expect(damageWisp(m, w.id, 1e6)[0]!.type).toBe('wispDown');
    expect(run(def, m, 2, 6).filter((e) => e.type === 'wispHeal')).toHaveLength(0);
  });
  it('never exceeds its cap of wisps alive', () => {
    const m = newMech({ ...def, mech: { leech: { ...def.mech!.leech!, speed: 0.001, every: 1 } } } as BossDef);
    const d2 = { ...def, mech: { leech: { ...def.mech!.leech!, speed: 0.001, every: 1 } } } as BossDef;
    run(d2, m, 2, 30); expect(m.wisps.length).toBeLessThanOrEqual(4);
  });
});

describe('burrow move (core)', () => {
  const def = BOSSES.sandwyrm!;
  const sim = (secs: number, targetOf: (t: number) => { x: number; y: number }) => {
    const ai = newBossAI(), rng = createRng(3), log: { t: number; e: BossEvent; hidden: boolean }[] = [];
    ai.force = 'burrow'; ai.gap = 0;
    for (let t = 0; t < secs; t += 0.05) for (const e of updateBoss(ai, def, 1, { x: 0, y: 0 }, targetOf(t), 0.05, 0, rng).events) log.push({ t, e, hidden: ai.hidden });
    return { ai, log };
  };
  it('telegraphs, goes untargetable, the marker follows the hero, then locks and erupts at the locked spot', () => {
    const { log } = sim(4, (t) => ({ x: 100 + t * 20, y: 0 }));
    const tele = log.find((l) => l.e.type === 'telegraph')!; expect(tele.hidden).toBe(true);
    const tracks = log.filter((l) => l.e.type === 'burrowTrack').map((l) => l.e as Extract<BossEvent, { type: 'burrowTrack' }>);
    expect(tracks.length).toBeGreaterThan(5);
    expect(tracks.some((x) => !x.locked)).toBe(true); expect(tracks.some((x) => x.locked)).toBe(true);
    const lockedXs = new Set(tracks.filter((x) => x.locked).map((x) => x.at.x.toFixed(2)));
    expect(lockedXs.size).toBe(1); // locked: no more following
    const erupt = log.find((l) => l.e.type === 'burrow')!;
    expect(erupt.hidden).toBe(false);
    expect((erupt.e as Extract<BossEvent, { type: 'burrow' }>).to.x.toFixed(2)).toBe([...lockedXs][0]);
    expect(erupt.t - tele.t, 'a readable warning').toBeGreaterThan(def.moves.burrow!.windup * 0.8);
    const lockTime = log.find((l) => l.e.type === 'burrowTrack' && (l.e as { locked: boolean }).locked)!.t;
    expect(erupt.t - lockTime, 'time between lock and eruption leaves room to dash').toBeGreaterThanOrEqual(0.5);
  });
  it('cannot be poise-staggered underground, forceStagger refuses too', () => {
    const { ai } = sim(0.6, () => ({ x: 100, y: 0 }));
    expect(ai.hidden).toBe(true); expect(forceStagger(ai)).toBe(false);
  });
});

/* ---------------- data / identity ---------------- */
const MAINS = Object.keys(BOSS_IDENTITY).filter((id) => BOSSES[id]!.mech || BOSSES[id]!.moves.burrow);
/** the chapter-top hero (same yardstick as bossCurve.test.ts): top of the level bands of the chapter's zones and caves */
const levelOf = (b: BossDef): number => Math.max(...[...zonesOfChapter(b.chapter).map((z) => ZONES[z]!), ...Object.values(DUNGEONS).filter((d) => d.chapter === b.chapter).map((d) => ZONES[d.id]!)].map((z) => Number(/Lv \d+-(\d+)/.exec(z.level)?.[1] ?? 0)));
const realmAt = (level: number): number => REALMS.reduce((best, r, i) => (level >= r.reqLevel ? i : best), 0);
const cycle = COMBO.reduce((a, h) => a + h.recover, 0);

describe('boss identity data', () => {
  it('has at least 8 bosses with a unique mechanic, each with a different (sprite, ramp) identity and a tip', () => {
    expect(MAINS.length).toBeGreaterThanOrEqual(8);
    const keys = new Set<string>();
    for (const id of MAINS) {
      const b = BOSSES[id]!;
      expect(b.mechTip, `${id} tip`).toBeTruthy(); expect(b.look?.ramp, `${id} ramp`).toBeDefined();
      keys.add(`${b.sprite}|${b.look!.ramp!.join()}`);
    }
    expect(keys.size).toBe(MAINS.length);
  });
  it('the 8 main bosses do not share a sprite base with each other unless their mechanic differs and the ramp differs (checked above); and use at least 7 distinct bases', () => {
    expect(new Set(MAINS.map((id) => BOSSES[id]!.sprite)).size).toBeGreaterThanOrEqual(7);
  });
  it.each(Object.keys(BOSS_IDENTITY))('%s: override targets a real boss, sprite exists in the manifest, fx exist, ramp is a valid 3-stop gradient', (id) => {
    const b = BOSSES[id]!; expect(b, 'boss exists').toBeDefined();
    expect(MANIFEST.sheets[`${b.sprite}.idle`], `${b.sprite} idle`).toBeDefined();
    for (const a of ['move', 'attack']) expect(MANIFEST.sheets[`${b.sprite}.${a}`] ?? MANIFEST.sheets[`${b.sprite}.${a}_a`], `${b.sprite} ${a}`).toBeDefined();
    const l = b.look!; expect(l.silhouette.length).toBeGreaterThan(3);
    if (l.ramp) { expect(l.ramp).toHaveLength(3); for (const c of l.ramp) { expect(c).toBeGreaterThanOrEqual(0); expect(c).toBeLessThanOrEqual(0xffffff); }
      const lum = (c: number) => ((c >> 16) & 255) * 0.3 + ((c >> 8) & 255) * 0.59 + (c & 255) * 0.11;
      expect(lum(l.ramp[0]), 'ramp runs dark to light').toBeLessThan(lum(l.ramp[1])); expect(lum(l.ramp[1])).toBeLessThan(lum(l.ramp[2])); }
    for (const f of [l.orbit?.fx, l.sigil?.fx, l.phaseFx?.fx, l.deathFx?.fx]) if (f) expect(MANIFEST.fx[f], `fx ${f}`).toBeDefined();
    if (!l.silhouette.startsWith('PLACEHOLDER')) { expect(l.sigil, 'sigil').toBeDefined(); expect(l.deathFx, 'death fx').toBeDefined(); }
  });
  it.each(MAINS)('%s: mechanic parameters are sane', (id) => {
    const m = BOSSES[id]!.mech ?? {}, b = BOSSES[id]!;
    if (m.ward) { expect(m.ward.frac).toBeGreaterThan(0); expect(m.ward.frac).toBeLessThanOrEqual(0.12); expect(m.ward.ttl).toBeGreaterThanOrEqual(10); }
    if (m.pylons) { expect(m.pylons.reduction).toBeLessThan(1); expect(m.pylons.count).toBeLessThanOrEqual(4); }
    if (m.beams) { expect(m.beams.warn, 'beam warning').toBeGreaterThanOrEqual(1.2); expect(m.beams.arms * m.beams.width).toBeLessThan(60); }
    if (m.pools) expect(m.pools.warn, 'pool warning').toBeGreaterThanOrEqual(0.9);
    if (m.illusions) expect(m.illusions.count).toBeGreaterThanOrEqual(2);
    if (b.moves.burrow) { expect(b.moves.burrow.lockBefore).toBeGreaterThanOrEqual(0.5); for (const k of b.kit) if (k.includes('burrow')) expect(b.moves.burrow.windup).toBeGreaterThan(b.moves.burrow.lockBefore + 0.5); }
    for (const k of b.kit) for (const mv of k) expect(b.moves[mv], `${id} kit move ${mv}`).toBeDefined();
  });
});

describe('boss mechanics stay winnable for a hero of the boss\'s level (formula checks)', () => {
  it.each(MAINS)('%s', (id) => {
    const b = BOSSES[id]!, lvl = levelOf(b), s = deriveStats('flame', lvl, realmAt(lvl), CHAPTERS[b.chapter]!.gear?.shop as never);
    const crit = 1 + s.critChance * (s.critMult - 1);
    const dps = COMBO.reduce((a, h) => a + Math.max(1, s.atk * h.mult - b.def * 0.5) * crit, 0) / cycle;
    const mech = b.mech ?? {};
    const base = b.maxHp / dps;
    // extra damage the mechanics ask for, as seconds of fighting
    let extra = 0;
    if (mech.ward) extra += (mech.ward.phases.length * mech.ward.frac * b.maxHp) / dps;
    if (mech.pylons) extra += (mech.pylons.phases.length * mech.pylons.count * mech.pylons.hpFrac * b.maxHp) / Math.max(1, dps * 0.8) + 4 * mech.pylons.phases.length; // travel between pylons
    expect(extra, `${id} mechanic work ${extra.toFixed(0)}s vs ${base.toFixed(0)}s`).toBeLessThan(base * 0.5);
    expect(base + extra, `${id} total ${(base + extra).toFixed(0)}s`).toBeLessThan(300);
    // healing the boss can claw back is far below what the hero deals
    if (mech.leech) { const heal = (mech.leech.count * mech.leech.healFrac * b.maxHp) / mech.leech.every; expect(heal, `leech ${heal.toFixed(0)}/s vs dps ${dps.toFixed(0)}`).toBeLessThan(dps * 0.35); }
    if (mech.ward) { const heal = mech.ward.healFrac * b.maxHp; expect(heal, 'a lapsed ward heals less than 10 s of the hero\'s damage').toBeLessThan(dps * 10); }
    // no mechanic one-shots, a short mistake does not kill
    const hit = (mult: number) => Math.max(1, b.atk * mult - s.def * 0.5);
    if (mech.beams) expect(hit(mech.beams.damageMult) * 2, 'two beam hits').toBeLessThan(s.maxHp * 0.7);
    if (mech.pools) expect(hit(mech.pools.dpsMult) * 3, '3s standing in a pool').toBeLessThan(s.maxHp * 0.35);
    if (mech.illusions) expect(hit(mech.illusions.burstMult), 'decoy burst').toBeLessThan(s.maxHp * 0.3);
    if (b.moves.burrow) expect(hit(b.moves.burrow.damageMult), 'eruption').toBeLessThan(s.maxHp * 0.5);
    // beam coverage leaves gaps wider than the hero
    if (mech.beams) { const gap = (2 * Math.PI * 60) / mech.beams.arms - 2 * mech.beams.width; expect(gap, 'gap at 60px').toBeGreaterThan(30); }
    // time-limited mechanics are not permanent: duty cycle of beams under 60 percent
    if (mech.beams) expect(mech.beams.active / (mech.beams.active + mech.beams.every)).toBeLessThan(0.6);
  });
});
