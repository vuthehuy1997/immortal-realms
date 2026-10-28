import type { SkillCost } from '../core/combat';
import type { HeroId } from './heroes';

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
  /** projectile/wave: how many bolts leave in a fan (default 1); each bolt deals the full damageMult */
  count?: number;
  /** total fan angle in radians */
  spread?: number;
  /** burst: heal this fraction of max HP when it hits at least one enemy */
  heal?: number;
  /** burst: drag enemies toward the caster instead of knocking them back */
  pull?: boolean;
  /** hero identity: tint of the strip and of the hotbar icon (default: the spirit root colour) */
  tint?: number;
  /** hotbar icon: one frame of an fx strip (a 1-row strip frame, or the first row of a 2-row strip) */
  icon: { fx: string; frame: number };
  /** keep the strip upright instead of rotating it along the cast direction (tornadoes, stars, bells) */
  upright?: boolean;
}

/** Martial techniques, bound to keys 1-4. The sword combo (click/Space) and the dash (Shift) live in core/combo.ts. */
export const SKILLS: readonly SkillDef[] = [
  { id: 'flying-sword', name: 'Flying Sword Art', alt: 'Ngự Kiếm Thuật', shape: 'projectile', manaCost: 8, cooldown: 1.4, damageMult: 2.4, range: 190, speed: 320, pierce: 2, unlockLevel: 1, fx: 'xf_flying_sword', icon: { fx: 'xf_flying_sword', frame: 7 } },
  { id: 'moon-arc', name: 'Crescent Moon Slash', alt: 'Nguyệt Nha Trảm', shape: 'wave', manaCost: 14, cooldown: 3.5, damageMult: 3.0, range: 130, speed: 230, pierce: 99, unlockLevel: 2, fx: 'xf_moon_arc', icon: { fx: 'xf_moon_arc', frame: 4 } },
  { id: 'lotus-burst', name: 'Lotus Burst', alt: 'Liên Hoa Chấn', shape: 'burst', manaCost: 22, cooldown: 7, damageMult: 4.0, range: 60, stun: 1.0, unlockLevel: 4, fx: 'xf_lotus', icon: { fx: 'xf_lotus', frame: 5 } },
  { id: 'sword-rain', name: 'Ten Thousand Swords', alt: 'Vạn Kiếm Quy Tông', shape: 'rain', manaCost: 40, cooldown: 16, damageMult: 2.2, range: 76, ticks: 4, unlockLevel: 7, fx: 'xf_sword_rain', icon: { fx: 'xf_sword_rain', frame: 3 } },
];

type KitTweak = Partial<Omit<SkillDef, 'id' | 'unlockLevel'>>;

/**
 * Per-hero technique kits. Slot ids and unlock levels stay shared (saves, upgrades and the hotbar are keyed by
 * them); each hero re-skins the four slots with its own names and numbers, and adds a twist (fan, pull, heal).
 * The Azure Swordsman keeps the base kit.
 */
const KITS: Partial<Record<HeroId, Record<string, KitTweak>>> = {
  // Crimson Swordswoman: ember red, phoenix feathers
  heroine: {
    'flying-sword': { name: 'Ember Fan', alt: 'Hỏa Vũ Phiến', count: 3, spread: 0.9, damageMult: 1.1, manaCost: 11, range: 170, cooldown: 1.6, fx: 'xf_phoenix', upright: true, tint: 0xff5a2a, icon: { fx: 'xf_phoenix', frame: 1 } },
    'moon-arc': { name: 'Crimson Crescent', alt: 'Huyết Nguyệt Trảm', damageMult: 3.4, speed: 280, cooldown: 3.0, tint: 0xff3a4a, icon: { fx: 'xf_moon_arc', frame: 2 } },
    'lotus-burst': { name: 'Phoenix Burst', alt: 'Phượng Hoàng Chấn', range: 74, damageMult: 4.4, stun: 0.6, cooldown: 6, fx: 'xf_phoenix', upright: true, tint: 0xff7a2a, icon: { fx: 'xf_phoenix', frame: 6 } },
    'sword-rain': { name: 'Scarlet Storm', alt: 'Xích Kiếm Bạo', ticks: 5, damageMult: 2.2, range: 70, tint: 0xff3a3a, icon: { fx: 'xf_sword_rain', frame: 1 } },
  },
  // Fan Scholar: indigo ink, needles, wind
  fanscholar: {
    'flying-sword': { name: 'Ink Needle', alt: 'Mặc Châm', damageMult: 2.0, manaCost: 6, cooldown: 1.0, pierce: 3, fx: 'xf_sword_qi', tint: 0x8a7dff, icon: { fx: 'xf_ink_splash', frame: 4 } },
    'moon-arc': { name: 'Gale Fan', alt: 'Cuồng Phong Phiến', range: 170, damageMult: 2.2, count: 2, spread: 0.35, cooldown: 4, fx: 'xf_gale_vortex', upright: true, tint: 0xa8c4ff, icon: { fx: 'xf_gale_vortex', frame: 2 } },
    'lotus-burst': { name: 'Lotus Whirlpool', alt: 'Liên Hoa Toàn', pull: true, range: 82, damageMult: 3.2, stun: 0.8, heal: 0.06, fx: 'xf_gale_vortex', upright: true, tint: 0x7a8cff, icon: { fx: 'xf_gale_vortex', frame: 4 } },
    'sword-rain': { name: 'Starfall Ink', alt: 'Tinh Lạc Bút', range: 90, ticks: 4, damageMult: 2.4, manaCost: 34, fx: 'xf_star_array', upright: true, tint: 0xb59cff, icon: { fx: 'xf_star_array', frame: 2 } },
  },
  // Staff Monk: gold, palms and the temple bell
  monk: {
    'flying-sword': { name: 'Staff Shockwave', alt: 'Côn Chấn', damageMult: 3.0, speed: 260, range: 120, pierce: 3, manaCost: 10, cooldown: 1.8, fx: 'xf_qi_palm', tint: 0xffd23f, icon: { fx: 'xf_qi_palm', frame: 1 } },
    'moon-arc': { name: 'Vajra Sweep', alt: 'Kim Cang Quét', damageMult: 3.4, range: 110, cooldown: 4.0, tint: 0xffe27a, icon: { fx: 'xf_moon_arc', frame: 3 } },
    'lotus-burst': { name: 'Diamond Palm', alt: 'Kim Cang Chưởng', range: 78, damageMult: 3.6, stun: 1.6, heal: 0.1, cooldown: 8, fx: 'xf_bell_ward', upright: true, tint: 0xffc83d, icon: { fx: 'xf_bell_ward', frame: 1 } },
    'sword-rain': { name: 'Palm Rain', alt: 'Thiên Thủ Vũ', range: 84, ticks: 5, damageMult: 2.0, fx: 'xf_qi_palm', upright: true, tint: 0xffd23f, icon: { fx: 'xf_qi_palm', frame: 2 } },
  },
  // Saber Wanderer: steel and earth
  saber: {
    'flying-sword': { name: 'Blade Qi Cleave', alt: 'Đao Khí Phách', damageMult: 3.2, speed: 380, pierce: 4, manaCost: 11, cooldown: 2.0, range: 210, fx: 'xf_sword_qi', tint: 0xdfe8f2, icon: { fx: 'xf_sword_qi', frame: 1 } },
    'moon-arc': { name: 'Saber Tide', alt: 'Đao Triều', damageMult: 3.8, range: 160, cooldown: 4.5, tint: 0xcfe0f0, icon: { fx: 'xf_moon_arc', frame: 1 } },
    'lotus-burst': { name: 'Earthsplitter', alt: 'Liệt Địa Đao', range: 66, damageMult: 5.0, stun: 0.8, cooldown: 8, fx: 'xf_stone_spike', upright: true, tint: 0xd9b070, icon: { fx: 'xf_stone_spike', frame: 3 } },
    'sword-rain': { name: 'Falling Blades', alt: 'Đao Vũ', ticks: 6, damageMult: 1.9, range: 64, tint: 0xe8c890, icon: { fx: 'xf_sword_rain', frame: 5 } },
  },
  // Twin-Blade Adept: teal storm, shards
  twinblade: {
    'flying-sword': { name: 'Twin Daggers', alt: 'Song Phi Đao', count: 2, spread: 0.16, damageMult: 1.6, manaCost: 6, cooldown: 1.3, fx: 'xf_frost_shard', upright: true, tint: 0x40f0c8, icon: { fx: 'xf_frost_shard', frame: 1 } },
    'moon-arc': { name: 'Cross Crescent', alt: 'Thập Tự Nguyệt', count: 2, spread: 0.7, damageMult: 1.6, cooldown: 3.6, tint: 0x40f0c8, icon: { fx: 'xf_moon_arc', frame: 5 } },
    'lotus-burst': { name: 'Whirling Cut', alt: 'Toàn Phong Trảm', range: 70, damageMult: 3.6, stun: 0.5, cooldown: 5, fx: 'xf_frost_shard', upright: true, tint: 0x60ffe0, icon: { fx: 'xf_frost_shard', frame: 3 } },
    'sword-rain': { name: 'Storm of Blades', alt: 'Phong Bạo Đao', ticks: 5, damageMult: 2.0, range: 72, cooldown: 14, tint: 0x40f0c8, icon: { fx: 'xf_sword_rain', frame: 2 } },
  },
};

export const kitFor = (hero: HeroId): readonly SkillDef[] => SKILLS.map((b) => ({ ...b, ...(KITS[hero]?.[b.id] ?? {}) }));

/** The current hero's four techniques (same array object, refilled by setKit so UI and scene always read the live kit). */
export const activeKit: SkillDef[] = [...SKILLS];
export function setKit(hero: HeroId): void { activeKit.splice(0, activeKit.length, ...kitFor(hero)); }
