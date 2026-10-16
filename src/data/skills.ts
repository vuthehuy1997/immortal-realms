import type { SkillCost } from '../core/combat';

export type SkillShape = 'arc' | 'projectile' | 'burst';

export interface SkillDef extends SkillCost {
  name: string;
  shape: SkillShape;
  damageMult: number;
  range: number; // px: arc reach / projectile max distance / burst radius
  speed?: number; // projectile px/s
}

/** Slice skills. Names are working titles; numbers are tunable. */
export const SKILLS: readonly SkillDef[] = [
  { id: 'qi-slash', name: 'Qi Slash', shape: 'arc', manaCost: 0, cooldown: 0.45, damageMult: 1.0, range: 26 },
  { id: 'spirit-bolt', name: 'Spirit Bolt', shape: 'projectile', manaCost: 8, cooldown: 1.2, damageMult: 1.6, range: 140, speed: 220 },
  { id: 'jade-burst', name: 'Jade Burst', shape: 'burst', manaCost: 20, cooldown: 6, damageMult: 2.4, range: 44 },
];
