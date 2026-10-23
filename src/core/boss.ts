import type { BossDef, MoveId } from '../data/boss';
import type { Vec2 } from './movement';

export type BossState = 'chase' | 'windup' | 'charging' | 'recover' | 'stagger';

export interface BossAI {
  phase: 1 | 2 | 3;
  state: BossState;
  /** move being wound up / executed / recovered from */
  move: MoveId | null;
  timer: number;
  /** seconds until the boss may start another move */
  gap: number;
  cd: Partial<Record<MoveId, number>>;
  last: MoveId | null;
  /** locked at windup start so the player can read and dodge it */
  lockAt: Vec2;
  lockDir: Vec2;
  zones: Vec2[];
  /** test/debug hook: start this move next, ignoring cooldowns and range */
  force: MoveId | null;
  /** accumulated poise damage, seconds since the last poise hit, and stagger immunity left */
  poise: number; poiseIdle: number; poiseImmune: number;
}

export type BossEvent =
  | { type: 'phase'; phase: 2 | 3 }
  | { type: 'telegraph'; move: MoveId; duration: number; at: Vec2; dir: Vec2; radius?: number; range?: number; halfAngle?: number; width?: number; zones?: Vec2[] }
  | { type: 'slam'; at: Vec2; radius: number; damageMult: number }
  | { type: 'sweep'; origin: Vec2; dir: Vec2; range: number; halfAngle: number; damageMult: number }
  | { type: 'charge'; dir: Vec2; speed: number; duration: number; width: number; damageMult: number }
  | { type: 'rain'; zones: Vec2[]; radius: number; delay: number; damageMult: number }
  | { type: 'teleport'; to: Vec2; radius: number; damageMult: number }
  | { type: 'summon'; count: number; minionType: string }
  | { type: 'ring'; projectiles: number; damageMult: number };

export interface BossOutput { vel: Vec2; events: BossEvent[] }

export const newBossAI = (): BossAI => ({ phase: 1, state: 'chase', move: null, timer: 0, gap: 1.6, cd: {}, last: null, lockAt: { x: 0, y: 0 }, lockDir: { x: 1, y: 0 }, zones: [], force: null, poise: 0, poiseIdle: 0, poiseImmune: 0 });

const ZERO: Vec2 = { x: 0, y: 0 };
const norm = (v: Vec2): Vec2 => { const l = Math.hypot(v.x, v.y) || 1; return { x: v.x / l, y: v.y / l }; };

export const STAGGER_TIME = 2.2;
export const STAGGER_DAMAGE = 1.5;
/** Seconds after a stagger during which the boss cannot be staggered again (no stun-lock). */
export const STAGGER_IMMUNE = 9;
export const POISE_DEFAULT = 0.12;
export const poiseMax = (def: BossDef): number => def.maxHp * (def.poise ?? POISE_DEFAULT);

/** Adds poise damage. A boss in a wind-up or recover staggers when the bar fills; charges and an active stagger are not interruptible. Returns true if it staggered now. */
export function addPoise(ai: BossAI, def: BossDef, dmg: number, mult = 1): boolean {
  if (ai.poiseImmune > 0 || ai.state === 'stagger' || ai.state === 'charging') return false;
  ai.poiseIdle = 0;
  ai.poise += dmg * mult;
  if (ai.poise < poiseMax(def)) return false;
  ai.poise = 0; ai.poiseImmune = STAGGER_IMMUNE + STAGGER_TIME;
  ai.state = 'stagger'; ai.timer = STAGGER_TIME; ai.move = null;
  return true;
}

/** A telegraph never gets shorter than this fraction of its nominal windup (fairness floor). */
export const WINDUP_MIN_FACTOR = 0.85;

function windupOf(def: BossDef, m: MoveId): number {
  const mv = def.moves;
  return m === 'slam' ? mv.slam!.windup : m === 'sweep' ? mv.sweep!.windup : m === 'charge' ? mv.charge!.windup : m === 'rain' ? mv.rain!.windup
    : m === 'teleport' ? mv.teleport!.windup : m === 'summon' ? mv.summon!.windup : mv.ring!.windup;
}
function recoverOf(def: BossDef, m: MoveId): number {
  const mv = def.moves;
  return m === 'slam' ? mv.slam!.recover : m === 'sweep' ? mv.sweep!.recover : m === 'charge' ? mv.charge!.recover : m === 'rain' ? mv.rain!.recover
    : m === 'teleport' ? mv.teleport!.recover : 0.35;
}
function cooldownOf(def: BossDef, m: MoveId): number {
  const mv = def.moves;
  return m === 'slam' ? mv.slam!.cooldown : m === 'sweep' ? mv.sweep!.cooldown : m === 'charge' ? mv.charge!.cooldown : m === 'rain' ? mv.rain!.cooldown
    : m === 'teleport' ? mv.teleport!.cooldown : m === 'summon' ? mv.summon!.cooldown : mv.ring!.cooldown;
}

/** Is `m` a legal choice right now (cooldown, range, minion cap)? */
function usable(def: BossDef, ai: BossAI, m: MoveId, dist: number, minions: number): boolean {
  if ((ai.cd[m] ?? 0) > 0 || !def.moves[m]) return false;
  const mv = def.moves;
  if (m === 'slam') return dist <= mv.slam!.triggerRange;
  if (m === 'sweep') return dist <= mv.sweep!.triggerRange;
  if (m === 'charge') return dist >= mv.charge!.minRange && dist <= mv.charge!.maxRange;
  if (m === 'summon') return minions < mv.summon!.maxMinions;
  return true;
}

/**
 * Deterministic boss tick (rng injected). Every move is telegraphed (an event with the exact area, then a windup, then the damaging event).
 * Phase 1/2/3 each pick from their own pool of moves; phase 3 enrages (faster, shorter cooldowns). No move repeats back to back.
 */
export function updateBoss(ai: BossAI, def: BossDef, hpRatio: number, self: Vec2, target: Vec2, dt: number, minionsAlive: number, rng: () => number = Math.random): BossOutput {
  const events: BossEvent[] = [];
  const phase: 1 | 2 | 3 = hpRatio <= def.phase3At ? 3 : hpRatio <= def.phase2At ? 2 : 1;
  if (phase > ai.phase) { ai.phase = phase; events.push({ type: 'phase', phase: phase as 2 | 3 }); ai.gap = Math.max(ai.gap, 0.9); }
  const cdMult = ai.phase === 3 ? def.enrage.cooldownMult : 1;
  const speed = def.speed * (ai.phase === 3 ? def.enrage.speedMult : 1);
  for (const k of Object.keys(ai.cd) as MoveId[]) ai.cd[k] = Math.max(0, (ai.cd[k] ?? 0) - dt);
  ai.gap = Math.max(0, ai.gap - dt);
  ai.poiseImmune = Math.max(0, ai.poiseImmune - dt);
  ai.poiseIdle += dt;
  if (ai.poiseIdle > 3) ai.poise = Math.max(0, ai.poise - poiseMax(def) * 0.25 * dt); // poise recovers when you stop pressing
  const dx = target.x - self.x, dy = target.y - self.y, dist = Math.hypot(dx, dy);

  if (ai.state === 'windup' && ai.move) {
    ai.timer -= dt;
    if (ai.timer > 0) return { vel: ZERO, events };
    const m = ai.move, mv = def.moves;
    ai.cd[m] = cooldownOf(def, m) * cdMult;
    if (m === 'slam') events.push({ type: 'slam', at: { ...ai.lockAt }, radius: mv.slam!.radius, damageMult: mv.slam!.damageMult });
    else if (m === 'sweep') events.push({ type: 'sweep', origin: { ...self }, dir: { ...ai.lockDir }, range: mv.sweep!.range, halfAngle: mv.sweep!.halfAngle, damageMult: mv.sweep!.damageMult });
    else if (m === 'rain') events.push({ type: 'rain', zones: ai.zones.map((z) => ({ ...z })), radius: mv.rain!.radius, delay: mv.rain!.delay, damageMult: mv.rain!.damageMult });
    else if (m === 'teleport') events.push({ type: 'teleport', to: { ...ai.lockAt }, radius: mv.teleport!.radius, damageMult: mv.teleport!.damageMult });
    else if (m === 'summon') events.push({ type: 'summon', count: mv.summon!.count, minionType: mv.summon!.minionType });
    else if (m === 'ring') events.push({ type: 'ring', projectiles: mv.ring!.projectiles, damageMult: mv.ring!.damageMult });
    if (m === 'charge') {
      events.push({ type: 'charge', dir: { ...ai.lockDir }, speed: mv.charge!.speed, duration: mv.charge!.duration, width: mv.charge!.width, damageMult: mv.charge!.damageMult });
      ai.state = 'charging'; ai.timer = mv.charge!.duration;
    } else { ai.state = 'recover'; ai.timer = recoverOf(def, m); }
    return { vel: ZERO, events };
  }
  if (ai.state === 'charging') {
    ai.timer -= dt;
    const vel = { x: ai.lockDir.x * def.moves.charge!.speed, y: ai.lockDir.y * def.moves.charge!.speed };
    if (ai.timer <= 0) { ai.state = 'recover'; ai.timer = recoverOf(def, 'charge'); }
    return { vel, events };
  }
  if (ai.state === 'stagger') {
    ai.timer -= dt;
    if (ai.timer <= 0) { ai.state = 'recover'; ai.timer = 0.3; ai.gap = 0.8; }
    return { vel: ZERO, events };
  }
  if (ai.state === 'recover') {
    ai.timer -= dt;
    if (ai.timer <= 0) { ai.state = 'chase'; ai.move = null; ai.gap = (ai.phase === 3 ? 0.35 : ai.phase === 2 ? 0.6 : 0.9) * (0.7 + rng() * 0.7); }
    return { vel: ZERO, events };
  }

  // chase: maybe start a move
  if (ai.gap <= 0 || ai.force) {
    const pool = ai.force && def.moves[ai.force] ? [ai.force] : def.kit[ai.phase - 1]!.filter((m) => m !== ai.last && usable(def, ai, m, dist, minionsAlive));
    ai.force = null;
    if (pool.length) {
      const m = pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))]!;
      const dir = norm({ x: dx, y: dy }), mv = def.moves, w = windupOf(def, m) * (WINDUP_MIN_FACTOR + rng() * 0.45); // variable tempo: the cue can't be metronome-timed
      ai.state = 'windup'; ai.move = m; ai.timer = w; ai.last = m; ai.lockDir = dir; ai.lockAt = { ...self };
      if (m === 'slam') events.push({ type: 'telegraph', move: m, duration: w, at: { ...self }, dir, radius: mv.slam!.radius });
      else if (m === 'sweep') events.push({ type: 'telegraph', move: m, duration: w, at: { ...self }, dir, range: mv.sweep!.range, halfAngle: mv.sweep!.halfAngle });
      else if (m === 'charge') events.push({ type: 'telegraph', move: m, duration: w, at: { ...self }, dir, range: mv.charge!.speed * mv.charge!.duration, width: mv.charge!.width });
      else if (m === 'teleport') {
        const to = { x: target.x + dir.x * mv.teleport!.behind, y: target.y + dir.y * mv.teleport!.behind };
        ai.lockAt = to;
        events.push({ type: 'telegraph', move: m, duration: w, at: to, dir, radius: mv.teleport!.radius });
      } else if (m === 'rain') {
        const r = mv.rain!, zones: Vec2[] = [{ x: target.x, y: target.y }];
        for (let i = 1; i < r.count; i++) { const a = rng() * Math.PI * 2, d = 20 + rng() * r.spread; zones.push({ x: target.x + Math.cos(a) * d, y: target.y + Math.sin(a) * d }); }
        ai.zones = zones;
        events.push({ type: 'telegraph', move: m, duration: w + r.delay, at: { ...target }, dir, radius: r.radius, zones: zones.map((z) => ({ ...z })) });
      } else events.push({ type: 'telegraph', move: m, duration: w, at: { ...self }, dir });
      return { vel: ZERO, events };
    }
  }
  if (dist <= 18) return { vel: ZERO, events };
  return { vel: { x: (dx / dist) * speed, y: (dy / dist) * speed }, events };
}
