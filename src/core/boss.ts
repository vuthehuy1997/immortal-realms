import type { BossDef } from '../data/boss';
import type { Vec2 } from './movement';

export type BossState = 'chase' | 'slam-windup' | 'recover' | 'summon-windup' | 'ring-windup';

export interface BossAI {
  phase: 1 | 2 | 3;
  state: BossState;
  timer: number;
  slamCd: number;
  summonCd: number;
  ringCd: number;
  slamAt: Vec2;
}

export type BossEvent =
  | { type: 'phase'; phase: 2 | 3 }
  | { type: 'slam-telegraph'; at: Vec2; radius: number; duration: number }
  | { type: 'slam'; at: Vec2; radius: number; damageMult: number }
  | { type: 'summon'; count: number; minionType: string }
  | { type: 'ring-telegraph'; duration: number }
  | { type: 'ring'; projectiles: number; damageMult: number };

export interface BossOutput { vel: Vec2; events: BossEvent[] }

export const newBossAI = (): BossAI => ({ phase: 1, state: 'chase', timer: 0, slamCd: 2, summonCd: 3, ringCd: 3, slamAt: { x: 0, y: 0 } });

const ZERO: Vec2 = { x: 0, y: 0 };

/**
 * Deterministic boss tick. Phase 1: chase + telegraphed ground slam.
 * Phase 2 (<=66% hp): adds minion summons. Phase 3 (<=33% hp): enrage (faster, shorter cooldowns) + projectile ring.
 * Every attack is telegraphed (a windup state with an event) before damage is emitted.
 */
export function updateBoss(ai: BossAI, def: BossDef, hpRatio: number, self: Vec2, target: Vec2, dt: number, minionsAlive: number): BossOutput {
  const events: BossEvent[] = [];
  const phase: 1 | 2 | 3 = hpRatio <= def.phase3At ? 3 : hpRatio <= def.phase2At ? 2 : 1;
  if (phase > ai.phase) { ai.phase = phase; events.push({ type: 'phase', phase: phase as 2 | 3 }); }
  const cdMult = ai.phase === 3 ? def.enrage.cooldownMult : 1;
  const speed = def.speed * (ai.phase === 3 ? def.enrage.speedMult : 1);

  ai.slamCd = Math.max(0, ai.slamCd - dt);
  ai.summonCd = Math.max(0, ai.summonCd - dt);
  ai.ringCd = Math.max(0, ai.ringCd - dt);

  switch (ai.state) {
    case 'slam-windup':
      ai.timer -= dt;
      if (ai.timer <= 0) {
        events.push({ type: 'slam', at: { ...ai.slamAt }, radius: def.slam.radius, damageMult: def.slam.damageMult });
        ai.state = 'recover'; ai.timer = def.slam.recover; ai.slamCd = def.slam.cooldown * cdMult;
      }
      return { vel: ZERO, events };
    case 'recover':
      ai.timer -= dt;
      if (ai.timer <= 0) ai.state = 'chase';
      return { vel: ZERO, events };
    case 'summon-windup':
      ai.timer -= dt;
      if (ai.timer <= 0) { events.push({ type: 'summon', count: def.summon.count, minionType: def.summon.minionType }); ai.state = 'chase'; ai.summonCd = def.summon.cooldown * cdMult; }
      return { vel: ZERO, events };
    case 'ring-windup':
      ai.timer -= dt;
      if (ai.timer <= 0) { events.push({ type: 'ring', projectiles: def.ring.projectiles, damageMult: def.ring.damageMult }); ai.state = 'chase'; ai.ringCd = def.ring.cooldown * cdMult; }
      return { vel: ZERO, events };
    case 'chase': {
      const dx = target.x - self.x, dy = target.y - self.y;
      const dist = Math.hypot(dx, dy);
      if (ai.phase >= 3 && ai.ringCd <= 0) {
        ai.state = 'ring-windup'; ai.timer = def.ring.windup;
        events.push({ type: 'ring-telegraph', duration: def.ring.windup });
        return { vel: ZERO, events };
      }
      if (ai.phase >= 2 && ai.summonCd <= 0 && minionsAlive < def.summon.maxMinions) {
        ai.state = 'summon-windup'; ai.timer = def.summon.windup;
        return { vel: ZERO, events };
      }
      if (ai.slamCd <= 0 && dist <= def.slam.triggerRange) {
        ai.state = 'slam-windup'; ai.timer = def.slam.windup; ai.slamAt = { ...self };
        events.push({ type: 'slam-telegraph', at: { ...self }, radius: def.slam.radius, duration: def.slam.windup });
        return { vel: ZERO, events };
      }
      if (dist <= 18) return { vel: ZERO, events };
      return { vel: { x: (dx / dist) * speed, y: (dy / dist) * speed }, events };
    }
  }
}
