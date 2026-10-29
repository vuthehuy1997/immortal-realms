import type { BossDef } from '../data/boss';
import type { Vec2 } from './movement';

/**
 * Boss mechanics (round 22): the one rule per boss that changes how it is fought. Pure and deterministic (rng injected); the scene only
 * draws the state and routes damage through `filterDamage`. Mechanics: ward shell, mirror illusions, lingering pools, rotating beams,
 * seal pylons, leech wisps. (The burrow dive lives in `boss.ts` because it is a move.)
 */
export interface Pool { id: number; at: Vec2; radius: number; warn: number; ttl: number }
export interface Beam { origin: Vec2; angle: number; dir: 1 | -1; warn: number; left: number; arms: number; length: number; width: number; speed: number }
export interface Pylon { id: number; at: Vec2; hp: number; maxHp: number }
export interface Wisp { id: number; pos: Vec2; hp: number; maxHp: number }
export interface Decoy { id: number; pos: Vec2 }

export interface MechState {
  ward: { hp: number; max: number; ttl: number } | null;
  /** phases a ward / pylons were already raised for */
  wardDone: number[]; pylonDone: number[];
  illusion: { decoys: Decoy[]; real: Vec2; ttl: number } | null; illCd: number;
  pools: Pool[]; poolCd: number;
  beam: Beam | null; beamCd: number; beamHitCd: number;
  pylons: Pylon[];
  wisps: Wisp[]; leechCd: number;
  nextId: number;
}

export type MechEvent =
  | { type: 'wardUp'; max: number }
  | { type: 'wardBreak' }
  | { type: 'wardExpire'; heal: number }
  | { type: 'illusion'; real: Vec2; decoys: Decoy[] }
  | { type: 'illusionEnd'; reason: 'expired' | 'cleared' }
  | { type: 'decoyShatter'; id: number; at: Vec2; radius: number; burstMult: number }
  | { type: 'pool'; pool: Pool }
  | { type: 'poolEnd'; id: number }
  | { type: 'beam'; beam: Beam }
  | { type: 'beamEnd' }
  | { type: 'pylons'; pylons: Pylon[] }
  | { type: 'pylonDown'; id: number; at: Vec2; remaining: number }
  | { type: 'wisps'; wisps: Wisp[] }
  | { type: 'wispHeal'; id: number; at: Vec2; heal: number }
  | { type: 'wispDown'; id: number; at: Vec2 };

export const newMech = (def?: BossDef): MechState => ({
  ward: null, wardDone: [], pylonDone: [],
  illusion: null, illCd: (def?.mech?.illusions?.every ?? 0) * 0.5,
  pools: [], poolCd: (def?.mech?.pools?.every ?? 0) * 0.5,
  beam: null, beamCd: (def?.mech?.beams?.every ?? 0) * 0.5, beamHitCd: 0,
  pylons: [],
  wisps: [], leechCd: (def?.mech?.leech?.every ?? 0) * 0.5,
  nextId: 1,
});

export interface MechCtx { phase: 1 | 2 | 3; self: Vec2; target: Vec2; home: Vec2; dt: number; rng: () => number; engaged: boolean }

const TAU = Math.PI * 2;
/** Is the mechanic currently suppressing damage / needing attention? Used by the HUD hint and tests. */
export const wardUp = (m: MechState): boolean => !!m.ward && m.ward.hp > 0;
export const pylonsUp = (m: MechState): number => m.pylons.length;

/** Damage the boss's HP actually takes after the mechanics soak it. Returns the amount that goes through. */
export function filterDamage(m: MechState, def: BossDef, amount: number, hidden: boolean): { amount: number; events: MechEvent[]; staggered: boolean } {
  const events: MechEvent[] = [];
  if (hidden) return { amount: 0, events, staggered: false };
  let a = amount, staggered = false;
  if (m.pylons.length && def.mech?.pylons) a *= 1 - def.mech.pylons.reduction;
  if (m.ward && m.ward.hp > 0) {
    const ab = Math.min(m.ward.hp, a);
    m.ward.hp -= ab; a -= ab;
    if (m.ward.hp <= 0) { m.ward = null; events.push({ type: 'wardBreak' }); staggered = true; }
  }
  return { amount: Math.max(0, Math.round(a)), events, staggered };
}

/** A hit on a decoy shatters it. */
export function shatterDecoy(m: MechState, def: BossDef, id: number): MechEvent[] {
  const ill = m.illusion, cfg = def.mech?.illusions;
  if (!ill || !cfg) return [];
  const d = ill.decoys.find((x) => x.id === id);
  if (!d) return [];
  ill.decoys = ill.decoys.filter((x) => x.id !== id);
  const ev: MechEvent[] = [{ type: 'decoyShatter', id, at: { ...d.pos }, radius: cfg.radius, burstMult: cfg.burstMult }];
  if (!ill.decoys.length) { m.illusion = null; m.illCd = cfg.every; ev.push({ type: 'illusionEnd', reason: 'cleared' }); }
  return ev;
}

/** Damage to a pylon (already mitigated by the scene's damage formula). */
export function damagePylon(m: MechState, id: number, amount: number): MechEvent[] {
  const p = m.pylons.find((x) => x.id === id);
  if (!p) return [];
  p.hp -= amount;
  if (p.hp > 0) return [];
  m.pylons = m.pylons.filter((x) => x !== p);
  return [{ type: 'pylonDown', id, at: { ...p.at }, remaining: m.pylons.length }];
}

export function damageWisp(m: MechState, id: number, amount: number): MechEvent[] {
  const w = m.wisps.find((x) => x.id === id);
  if (!w) return [];
  w.hp -= amount;
  if (w.hp > 0) return [];
  m.wisps = m.wisps.filter((x) => x !== w);
  return [{ type: 'wispDown', id, at: { ...w.pos } }];
}

/** Damage multiplier per second a body at `p` takes from the active (past their warning) pools. */
export function poolDps(m: MechState, def: BossDef, p: Vec2, bodyRadius: number): number {
  const cfg = def.mech?.pools;
  if (!cfg) return 0;
  let dps = 0;
  for (const q of m.pools) if (q.warn <= 0 && Math.hypot(p.x - q.at.x, p.y - q.at.y) <= q.radius + bodyRadius * 0.5) dps = Math.max(dps, cfg.dpsMult);
  return dps;
}

/** Distance from `p` to the ray (origin, angle) limited to `length`; Infinity behind the origin. */
export function distToRay(origin: Vec2, angle: number, length: number, p: Vec2): number {
  const dx = Math.cos(angle), dy = Math.sin(angle), rx = p.x - origin.x, ry = p.y - origin.y;
  const t = rx * dx + ry * dy;
  if (t < 0 || t > length) return Infinity;
  return Math.abs(rx * dy - ry * dx);
}

/** Is a body at `p` cut by an active (past warning) beam arm? */
export function beamHits(b: Beam | null, p: Vec2, bodyRadius: number): boolean {
  if (!b || b.warn > 0) return false;
  for (let k = 0; k < b.arms; k++) if (distToRay(b.origin, b.angle + (k * TAU) / b.arms, b.length, p) <= b.width + bodyRadius * 0.6) return true;
  return false;
}

const inPhase = (list: (1 | 2 | 3)[] | undefined, ph: number): boolean => !!list && (list as number[]).includes(ph);
const ringPoint = (c: Vec2, r: number, a: number): Vec2 => ({ x: c.x + Math.cos(a) * r, y: c.y + Math.sin(a) * r });

/** Advances every mechanic of `def` by dt. Returns events for the scene to dress. */
export function tickMech(m: MechState, def: BossDef, c: MechCtx): MechEvent[] {
  const cfg = def.mech, ev: MechEvent[] = [];
  if (!cfg || !c.engaged) return ev;
  const { dt, rng, phase } = c;
  if (cfg.ward) {
    if (inPhase(cfg.ward.phases, phase) && !m.wardDone.includes(phase)) {
      m.wardDone.push(phase);
      const max = Math.round(def.maxHp * cfg.ward.frac);
      m.ward = { hp: max, max, ttl: cfg.ward.ttl };
      ev.push({ type: 'wardUp', max });
    }
    if (m.ward) { m.ward.ttl -= dt; if (m.ward.ttl <= 0) { m.ward = null; ev.push({ type: 'wardExpire', heal: Math.round(def.maxHp * cfg.ward.healFrac) }); } }
  }
  if (cfg.pylons && inPhase(cfg.pylons.phases, phase) && !m.pylonDone.includes(phase)) {
    m.pylonDone.push(phase);
    const n = cfg.pylons.count, a0 = rng() * TAU, maxHp = Math.max(1, Math.round(def.maxHp * cfg.pylons.hpFrac));
    m.pylons = Array.from({ length: n }, (_, i) => ({ id: m.nextId++, at: ringPoint(c.home, cfg.pylons!.ring, a0 + (i * TAU) / n), hp: maxHp, maxHp }));
    ev.push({ type: 'pylons', pylons: m.pylons.map((p) => ({ ...p, at: { ...p.at } })) });
  }
  if (cfg.illusions) {
    const il = cfg.illusions;
    if (m.illusion) {
      m.illusion.ttl -= dt;
      for (const d of [...m.illusion.decoys]) { // decoys drift at the hero and burst on contact
        const dx = c.target.x - d.pos.x, dy = c.target.y - d.pos.y, dist = Math.hypot(dx, dy) || 1;
        if (dist <= 12) ev.push(...shatterDecoy(m, def, d.id));
        else { d.pos.x += (dx / dist) * def.speed * 0.5 * dt; d.pos.y += (dy / dist) * def.speed * 0.5 * dt; }
      }
      if (m.illusion && m.illusion.ttl <= 0) { m.illusion = null; m.illCd = il.every; ev.push({ type: 'illusionEnd', reason: 'expired' }); }
    } else {
      m.illCd = Math.max(0, m.illCd - dt);
      if (m.illCd <= 0 && inPhase(il.phases, phase)) {
        const slots = il.count + 1, a0 = rng() * TAU, real = Math.min(slots - 1, Math.floor(rng() * slots));
        const pts = Array.from({ length: slots }, (_, i) => ringPoint(c.home, il.ring, a0 + (i * TAU) / slots));
        const decoys = pts.filter((_, i) => i !== real).map((pos) => ({ id: m.nextId++, pos }));
        m.illusion = { decoys, real: pts[real]!, ttl: il.ttl };
        ev.push({ type: 'illusion', real: { ...pts[real]! }, decoys: decoys.map((d) => ({ ...d, pos: { ...d.pos } })) });
      }
    }
  }
  if (cfg.pools) {
    const pl = cfg.pools;
    m.poolCd = Math.max(0, m.poolCd - dt);
    if (m.poolCd <= 0 && inPhase(pl.phases, phase)) {
      m.poolCd = pl.every * (phase === 3 ? 0.7 : 1);
      for (let i = 0; i < pl.count; i++) {
        const a = rng() * TAU, d = i === 0 ? 0 : 24 + rng() * 60;
        const pool: Pool = { id: m.nextId++, at: ringPoint(c.target, d, a), radius: pl.radius, warn: pl.warn, ttl: pl.ttl };
        m.pools.push(pool); ev.push({ type: 'pool', pool: { ...pool, at: { ...pool.at } } });
      }
    }
    for (const q of [...m.pools]) {
      if (q.warn > 0) q.warn -= dt; else q.ttl -= dt;
      if (q.ttl <= 0) { m.pools = m.pools.filter((x) => x !== q); ev.push({ type: 'poolEnd', id: q.id }); }
    }
  }
  if (cfg.beams) {
    const bm = cfg.beams;
    m.beamHitCd = Math.max(0, m.beamHitCd - dt);
    if (m.beam) {
      if (m.beam.warn > 0) m.beam.warn -= dt;
      else { m.beam.angle += m.beam.dir * m.beam.speed * dt; m.beam.left -= dt; }
      if (m.beam.left <= 0) { m.beam = null; m.beamCd = bm.every; ev.push({ type: 'beamEnd' }); }
    } else {
      m.beamCd = Math.max(0, m.beamCd - dt);
      if (m.beamCd <= 0 && inPhase(bm.phases, phase)) {
        m.beam = { origin: { ...c.self }, angle: Math.atan2(c.target.y - c.self.y, c.target.x - c.self.x) + (rng() - 0.5) * 0.6, dir: rng() < 0.5 ? 1 : -1, warn: bm.warn, left: bm.active, arms: bm.arms, length: bm.length, width: bm.width, speed: bm.speed };
        ev.push({ type: 'beam', beam: { ...m.beam, origin: { ...m.beam.origin } } });
      }
    }
  }
  if (cfg.leech) {
    const lc = cfg.leech;
    m.leechCd = Math.max(0, m.leechCd - dt);
    if (m.leechCd <= 0 && inPhase(lc.phases, phase) && m.wisps.length + lc.count <= lc.max) {
      m.leechCd = lc.every;
      const maxHp = Math.max(1, Math.round(def.maxHp * lc.hpFrac)), a0 = rng() * TAU;
      const fresh: Wisp[] = Array.from({ length: lc.count }, (_, i) => ({ id: m.nextId++, pos: ringPoint(c.self, 120, a0 + (i * TAU) / lc.count), hp: maxHp, maxHp }));
      m.wisps.push(...fresh);
      ev.push({ type: 'wisps', wisps: fresh.map((w) => ({ ...w, pos: { ...w.pos } })) });
    }
    for (const w of [...m.wisps]) {
      const dx = c.self.x - w.pos.x, dy = c.self.y - w.pos.y, dist = Math.hypot(dx, dy) || 1;
      if (dist <= 12) { m.wisps = m.wisps.filter((x) => x !== w); ev.push({ type: 'wispHeal', id: w.id, at: { ...w.pos }, heal: Math.round(def.maxHp * lc.healFrac) }); }
      else { w.pos.x += (dx / dist) * lc.speed * dt; w.pos.y += (dy / dist) * lc.speed * dt; }
    }
  }
  return ev;
}
