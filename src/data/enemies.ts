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
  /** melee telegraph before the hit lands (s); rushers only */
  strikeWindup?: number;
  /** projectiles per cast (casters), fanned out */
  volley?: number;
  xp: number;
  /** sprite prefix in the manifest, e.g. 'mob.wolf' */
  sprite: string;
  /** display scale of the source art (80px tall frames) */
  scale: number;
  /** collision/hit radius in world units */
  radius: number;
  /** stronger recoloured sprites that spawn as elites */
  eliteSprites?: string[];
  /** spirit stones dropped (min,max) */
  stones: [number, number];
}

export const ENEMIES: Record<string, EnemyDef> = {
  wolf: { id: 'wolf', name: 'Spirit Wolf', behavior: 'rusher', maxHp: 40, atk: 8, def: 1, speed: 58, aggroRange: 110, attackRange: 18, attackCooldown: 1.0, strikeWindup: 0.3, xp: 12, sprite: 'mob.wolf', scale: 0.36, radius: 8, stones: [1, 3] },
  snake: { id: 'snake', name: 'Jade Serpent', behavior: 'rusher', maxHp: 28, atk: 7, def: 0, speed: 44, aggroRange: 90, attackRange: 16, attackCooldown: 0.9, strikeWindup: 0.28, xp: 9, sprite: 'mob.snake', scale: 0.34, radius: 7, stones: [1, 2] },
  foxfire: { id: 'foxfire', name: 'Foxfire Wisp', behavior: 'caster', maxHp: 22, atk: 10, def: 0, speed: 40, aggroRange: 130, attackRange: 110, attackCooldown: 1.7, preferredRange: 80, xp: 16, sprite: 'mob.foxfire', scale: 0.36, radius: 7, stones: [2, 4], eliteSprites: ['mob.foxfire_v_red', 'mob.foxfire_v_green'] },
  treant: { id: 'treant', name: 'Elder Treant', behavior: 'charger', maxHp: 110, atk: 13, def: 5, speed: 26, aggroRange: 100, attackRange: 70, attackCooldown: 3.0, windup: 0.7, dashTime: 0.45, dashSpeedMult: 4, xp: 35, sprite: 'mob.treant', scale: 0.42, radius: 10, stones: [4, 8] },
  toad: { id: 'toad', name: 'Marsh Toad', behavior: 'rusher', maxHp: 64, atk: 9, def: 3, speed: 30, aggroRange: 90, attackRange: 18, attackCooldown: 1.4, strikeWindup: 0.42, xp: 18, sprite: 'mob.toad', scale: 0.36, radius: 9, stones: [2, 4] },
  waterghost: { id: 'waterghost', name: 'Drowned Ghost', behavior: 'rusher', maxHp: 34, atk: 9, def: 0, speed: 36, aggroRange: 120, attackRange: 16, attackCooldown: 1.2, strikeWindup: 0.3, xp: 17, sprite: 'mob.waterghost', scale: 0.36, radius: 7, stones: [2, 4] },
  ghost: { id: 'ghost', name: 'Lantern Ghost', behavior: 'caster', maxHp: 26, atk: 11, def: 0, speed: 38, aggroRange: 130, attackRange: 110, attackCooldown: 1.8, preferredRange: 85, xp: 20, sprite: 'mob.ghost', scale: 0.36, radius: 7, stones: [2, 5], eliteSprites: ['mob.ghost_v_violet', 'mob.ghost_v_gold', 'mob.ghost_v_crimson'] },
  peachspirit: { id: 'peachspirit', name: 'Peach Spirit', behavior: 'caster', maxHp: 30, atk: 10, def: 0, speed: 36, aggroRange: 130, attackRange: 100, attackCooldown: 1.6, volley: 2, preferredRange: 70, xp: 20, sprite: 'mob.peachspirit', scale: 0.34, radius: 7, stones: [2, 5] },
  bat: { id: 'bat', name: 'Cave Bat', behavior: 'rusher', maxHp: 26, atk: 6, def: 0, speed: 78, aggroRange: 130, attackRange: 14, attackCooldown: 0.7, strikeWindup: 0.24, xp: 8, sprite: 'mob.bat', scale: 0.3, radius: 6, stones: [1, 2] },
  paperdoll: { id: 'paperdoll', name: 'Paper Doll', behavior: 'rusher', maxHp: 26, atk: 8, def: 0, speed: 52, aggroRange: 100, attackRange: 16, attackCooldown: 1.0, strikeWindup: 0.3, xp: 11, sprite: 'mob.paperdoll', scale: 0.34, radius: 7, stones: [1, 2] },
  swordspirit: { id: 'swordspirit', name: 'Sword Spirit', behavior: 'charger', maxHp: 34, atk: 12, def: 1, speed: 40, aggroRange: 130, attackRange: 90, attackCooldown: 2.0, windup: 0.45, dashTime: 0.35, dashSpeedMult: 6, xp: 24, sprite: 'mob.swordspirit', scale: 0.38, radius: 8, stones: [3, 6], eliteSprites: ['mob.swordspirit_v_gold', 'mob.swordspirit_v_blood'] },
  thunderbird: { id: 'thunderbird', name: 'Thunder Bird', behavior: 'caster', maxHp: 40, atk: 13, def: 1, speed: 44, aggroRange: 150, attackRange: 130, attackCooldown: 1.5, volley: 3, preferredRange: 95, xp: 34, sprite: 'mob.thunderbird', scale: 0.4, radius: 8, stones: [4, 8] },
  skeleton: { id: 'skeleton', name: 'Bone Soldier', behavior: 'rusher', maxHp: 46, atk: 10, def: 2, speed: 42, aggroRange: 110, attackRange: 20, attackCooldown: 1.1, strikeWindup: 0.3, xp: 20, sprite: 'mob.skeleton', scale: 0.36, radius: 8, stones: [2, 5] },
  jiangshi: { id: 'jiangshi', name: 'Jiangshi', behavior: 'charger', maxHp: 62, atk: 13, def: 3, speed: 34, aggroRange: 110, attackRange: 80, attackCooldown: 2.6, windup: 0.6, dashTime: 0.4, dashSpeedMult: 4.5, xp: 30, sprite: 'mob.jiangshi', scale: 0.38, radius: 8, stones: [3, 7], eliteSprites: ['mob.jiangshi_v_red', 'mob.jiangshi_v_purple'] },
  soldier: { id: 'soldier', name: 'Fallen Guard', behavior: 'rusher', maxHp: 56, atk: 11, def: 4, speed: 40, aggroRange: 110, attackRange: 22, attackCooldown: 1.2, strikeWindup: 0.36, xp: 24, sprite: 'mob.soldier', scale: 0.36, radius: 8, stones: [3, 6] },
  golem: { id: 'golem', name: 'Stone Golem', behavior: 'charger', maxHp: 110, atk: 16, def: 8, speed: 24, aggroRange: 100, attackRange: 70, attackCooldown: 3.0, windup: 0.8, dashTime: 0.5, dashSpeedMult: 4, xp: 48, sprite: 'mob.golem', scale: 0.42, radius: 11, stones: [6, 12] },
};
