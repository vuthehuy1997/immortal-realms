import type { Vec2 } from './movement';
import type { EnemyDef } from '../data/enemies';

export type EnemyAIState = 'idle' | 'chase' | 'attack' | 'retreat' | 'windup' | 'dash';

export interface EnemyAI {
  state: EnemyAIState;
  attackCd: number; // seconds until next attack allowed
  timer: number; // windup/dash remaining
  dir: Vec2; // locked direction while charging
}

export type AttackIntent = { kind: 'melee' | 'projectile' };

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
      if (def.behavior === 'caster' && dist < (def.preferredRange ?? 0) * 0.6) { ai.state = 'retreat'; return { vel: ZERO }; }
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
      if (def.behavior === 'caster' && dist < (def.preferredRange ?? 0) * 0.6) { ai.state = 'retreat'; return { vel: ZERO }; }
      if (ai.attackCd <= 0) {
        ai.attackCd = def.attackCooldown;
        return { vel: ZERO, attack: { kind: def.behavior === 'caster' ? 'projectile' : 'melee' } };
      }
      return { vel: ZERO };
    }
    case 'retreat': {
      if (dist >= (def.preferredRange ?? 0)) { ai.state = 'attack'; return { vel: ZERO }; }
      return { vel: scale(toward(self, target, -1), def.speed) };
    }
  }
  return { vel: ZERO };
}
