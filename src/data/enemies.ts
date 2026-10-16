export type EnemyBehavior = 'rusher' | 'caster' | 'charger';

export interface EnemyDef {
  id: string;
  name: string;
  behavior: EnemyBehavior;
  maxHp: number;
  atk: number;
  def: number;
  speed: number;
  aggroRange: number;
  attackRange: number;
  attackCooldown: number;
  preferredRange?: number; // caster keeps this distance
  windup?: number; // charger telegraph (s)
  dashTime?: number;
  dashSpeedMult?: number;
  xp: number;
}

export const ENEMIES: Record<string, EnemyDef> = {
  slime: { id: 'slime', name: 'Moss Slime', behavior: 'rusher', maxHp: 30, atk: 6, def: 1, speed: 38, aggroRange: 90, attackRange: 12, attackCooldown: 1.0, xp: 10 },
  wraith: { id: 'wraith', name: 'Wisp Wraith', behavior: 'caster', maxHp: 22, atk: 8, def: 0, speed: 34, aggroRange: 120, attackRange: 100, attackCooldown: 1.8, preferredRange: 70, xp: 16 },
  brute: { id: 'brute', name: 'Stone Brute', behavior: 'charger', maxHp: 70, atk: 12, def: 4, speed: 28, aggroRange: 100, attackRange: 70, attackCooldown: 2.5, windup: 0.6, dashTime: 0.4, dashSpeedMult: 4.5, xp: 30 },
};
