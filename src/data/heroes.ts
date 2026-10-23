export type HeroId = 'swordsman' | 'heroine' | 'fanscholar' | 'monk' | 'saber' | 'twinblade';

import type { BoonMods } from './boons';

export interface HeroDef { id: HeroId; name: string; title: string; description: string; sprite: string; scale: number; /** signature passive: a named bonus that shapes the playstyle */ trait: { name: string; desc: string; mods: Partial<BoonMods> } }

/** Playable cultivator looks (all share the same martial arts; the Spirit Root decides stat bonuses). */
export const HEROES: Record<HeroId, HeroDef> = {
  swordsman: { id: 'swordsman', name: 'Azure Swordsman', title: 'Kiếm Tu', description: 'A wandering sword cultivator in sect blues.', sprite: 'hero.swordsman', scale: 0.34, trait: { name: 'Sword Heart Focus', desc: '+8% critical chance, +1 mana per sword hit.', mods: { critChance: 0.08, manaOnHit: 1 } } },
  heroine: { id: 'heroine', name: 'Crimson Swordswoman', title: 'Nữ Kiếm Tiên', description: 'Quick and fierce, a flame in red silk.', sprite: 'hero.heroine', scale: 0.34, trait: { name: 'Crimson Gale', desc: 'Dash cooldown -15%, +6% attack.', mods: { dashCdMult: 0.85, atkPct: 0.06 } } },
  fanscholar: { id: 'fanscholar', name: 'Fan Scholar', title: 'Phiến Nho', description: 'A scholar-cultivator who fights with a folding fan.', sprite: 'hero.fanscholar', scale: 0.34, trait: { name: 'Scholar Reserve', desc: '+25% max mana, +1.5 mana regeneration.', mods: { maxManaPct: 0.25, manaRegen: 1.5 } } },
  monk: { id: 'monk', name: 'Staff Monk', title: 'Võ Tăng', description: 'A warrior monk with iron discipline.', sprite: 'hero.monk', scale: 0.32, trait: { name: 'Iron Discipline', desc: '+15% max HP, +12% defence, +25% poise damage.', mods: { maxHpPct: 0.15, defPct: 0.12, poiseMult: 0.25 } } },
  saber: { id: 'saber', name: 'Saber Wanderer', title: 'Đao Khách', description: 'A road-worn saber fighter.', sprite: 'hero.saber', scale: 0.34, trait: { name: 'Road-Worn Edge', desc: '+10% attack, heal 2% of damage dealt.', mods: { atkPct: 0.10, lifesteal: 0.02 } } },
  twinblade: { id: 'twinblade', name: 'Twin-Blade Adept', title: 'Song Đao', description: 'Moves like a storm with a blade in each hand.', sprite: 'hero.twinblade', scale: 0.34, trait: { name: 'Storm Steps', desc: '+2 mana per sword hit, perfect dodges last 1.5 s longer.', mods: { manaOnHit: 2, perfectTime: 1.5 } } },
};
export const HERO_IDS = Object.keys(HEROES) as HeroId[];
