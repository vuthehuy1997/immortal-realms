import type { SkillCost } from '../core/combat';

export type SkillShape = 'projectile' | 'wave' | 'burst' | 'rain';

export interface SkillDef extends SkillCost {
  name: string;
  /** Han-Viet flavour name shown under the English one */
  alt: string;
  shape: SkillShape;
  damageMult: number;
  /** projectile/wave travel distance; burst/rain: radius */
  range: number;
  speed?: number;
  /** how many enemies a projectile passes through (waves pierce everything) */
  pierce?: number;
  stun?: number;
  /** damage ticks for ground-targeted skills */
  ticks?: number;
  unlockLevel: number;
  /** fx strip key in the manifest */
  fx: string;
}

/** Martial techniques, bound to keys 1-4. The sword combo (click/Space) and the dash (Shift) live in core/combo.ts. */
export const SKILLS: readonly SkillDef[] = [
  { id: 'flying-sword', name: 'Flying Sword Art', alt: 'Ngự Kiếm Thuật', shape: 'projectile', manaCost: 8, cooldown: 1.4, damageMult: 1.5, range: 190, speed: 320, pierce: 2, unlockLevel: 1, fx: 'xf_flying_sword' },
  { id: 'moon-arc', name: 'Crescent Moon Slash', alt: 'Nguyệt Nha Trảm', shape: 'wave', manaCost: 14, cooldown: 3.5, damageMult: 2.0, range: 130, speed: 230, pierce: 99, unlockLevel: 2, fx: 'xf_moon_arc' },
  { id: 'lotus-burst', name: 'Lotus Burst', alt: 'Liên Hoa Chấn', shape: 'burst', manaCost: 22, cooldown: 7, damageMult: 2.6, range: 60, stun: 1.0, unlockLevel: 4, fx: 'xf_lotus' },
  { id: 'sword-rain', name: 'Ten Thousand Swords', alt: 'Vạn Kiếm Quy Tông', shape: 'rain', manaCost: 40, cooldown: 16, damageMult: 1.3, range: 76, ticks: 4, unlockLevel: 7, fx: 'xf_sword_rain' },
];
