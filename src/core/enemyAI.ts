import type { Vec2 } from './movement';
import type { EnemyDef } from '../data/enemies';

export type EnemyAIState = 'idle' | 'chase' | 'attack' | 'retreat' | 'windup' | 'dash' | 'strike';

export interface EnemyAI {
  state: EnemyAIState;
  attackCd: number; // seconds until next attack allowed
  timer: number; // windup/dash remaining
  dir: Vec2; // locked direction while charging
}

export type AttackIntent = { kind: 'melee' | 'projectile'; /** projectiles to fan out (casters) */ count?: number };

export interface AIOutput { vel: Vec2; attack?: AttackIntent }

export const newEnemyAI = (): EnemyAI => ({ state: 'idle', attackCd: 0, timer: 0, dir: { x: 0, y: 0 } });

const toward = (from: Vec2, to: Vec2, sign = 1): Vec2 => {
  const dx = to.x - from.x, dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: (dx / len) * sign, y: (dy / len) * sign };
};
const scale = (v: Vec2, s: number): Vec2 => ({ x: v.x * s, y: v.y * s });
const ZERO: Vec2 = { x: 0, y: 0 };

/** Deterministic FSM tick. Caller integrates `vel` (with collision) and applies `attack`. */
export function updateEnemyAI(ai: EnemyAI, def: EnemyDef, self: Vec2, target: Vec2, dt: number): AIOutput {
  ai.attackCd = Math.max(0, ai.attackCd - dt);
  const dist = Math.hypot(target.x - self.x, target.y - self.y);

  if (ai.state === 'windup') {
    ai.timer -= dt;
    if (ai.timer <= 0) { ai.state = 'dash'; ai.timer = def.dashTime ?? 0.4; }
    return { vel: ZERO };
  }
  if (ai.state === 'strike') { // rusher melee telegraph: stand still, then strike (the hit only lands if the target is still in reach)
    ai.timer -= dt;
    if (ai.timer > 0) return { vel: ZERO };
    ai.state = 'attack'; ai.attackCd = def.attackCooldown;
    return { vel: ZERO, attack: { kind: 'melee' } };
  }
  if (ai.state === 'dash') {
    ai.timer -= dt;
    const out: AIOutput = { vel: scale(ai.dir, def.speed * (def.dashSpeedMult ?? 4)) };
    if (dist <= def.attackRange * 0.3 && ai.attackCd <= 0) { out.attack = { kind: 'melee' }; ai.attackCd = def.attackCooldown; }
    if (ai.timer <= 0) { ai.state = 'chase'; if (ai.attackCd <= 0) ai.attackCd = def.attackCooldown * 0.5; }
    return out;
  }

  switch (ai.state) {
    case 'idle':
      if (dist <= def.aggroRange) ai.state = 'chase';
      return { vel: ZERO };
    case 'chase': {
      if (dist > def.aggroRange * 1.5) { ai.state = 'idle'; return { vel: ZERO }; }
      if (def.behavior === 'caster' && dist < (def.preferredRange ?? 0) * 0.75) { ai.state = 'retreat'; return { vel: ZERO }; }
      if (def.behavior === 'charger') {
        if (dist <= def.attackRange && ai.attackCd <= 0) {
          ai.state = 'windup'; ai.timer = def.windup ?? 0.6; ai.dir = toward(self, target);
          return { vel: ZERO };
        }
      } else if (dist <= def.attackRange) { ai.state = 'attack'; return { vel: ZERO }; }
      const stop = def.behavior === 'caster' ? def.preferredRange ?? def.attackRange : 0;
      return { vel: dist > stop ? scale(toward(self, target), def.speed) : ZERO };
    }
    case 'attack': {
      if (dist > def.attackRange * 1.2) { ai.state = 'chase'; return { vel: ZERO }; }
      if (def.behavior === 'caster' && dist < (def.preferredRange ?? 0) * 0.75) { ai.state = 'retreat'; return { vel: ZERO }; }
      // casters circle the target (flip direction every ~1.3s) instead of standing still like turrets
      let vel = ZERO;
      if (def.behavior === 'caster') {
        ai.timer -= dt;
        if (ai.timer <= 0) { ai.timer = 1.1 + (Math.abs(Math.sin(self.x * 0.37 + self.y * 0.11)) * 0.5); ai.dir = { x: ai.dir.x >= 0 ? -1 : 1, y: 0 }; }
        const dx = target.x - self.x, dy = target.y - self.y, d = dist || 1;
        vel = scale({ x: (-dy / d) * ai.dir.x, y: (dx / d) * ai.dir.x }, def.speed * 0.55);
      }
      if (ai.attackCd <= 0) {
        if (def.behavior === 'caster') { ai.attackCd = def.attackCooldown; return { vel, attack: { kind: 'projectile', count: def.volley ?? 1 } }; }
        ai.state = 'strike'; ai.timer = def.strikeWindup ?? 0.3;
        return { vel: ZERO };
      }
      return { vel };
    }
    case 'retreat': {
      if (dist >= (def.preferredRange ?? 0)) { ai.state = 'attack'; return { vel: ZERO }; }
      return { vel: scale(toward(self, target, -1), def.speed) };
    }
  }
  return { vel: ZERO };
}
