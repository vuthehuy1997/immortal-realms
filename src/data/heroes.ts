export type HeroId = 'swordsman' | 'heroine' | 'fanscholar' | 'monk' | 'saber' | 'twinblade';

export interface HeroDef { id: HeroId; name: string; title: string; description: string; sprite: string; scale: number }

/** Playable cultivator looks (all share the same martial arts; the Spirit Root decides stat bonuses). */
export const HEROES: Record<HeroId, HeroDef> = {
  swordsman: { id: 'swordsman', name: 'Azure Swordsman', title: 'Kiếm Tu', description: 'A wandering sword cultivator in sect blues.', sprite: 'hero.swordsman', scale: 0.34 },
  heroine: { id: 'heroine', name: 'Crimson Swordswoman', title: 'Nữ Kiếm Tiên', description: 'Quick and fierce, a flame in red silk.', sprite: 'hero.heroine', scale: 0.34 },
  fanscholar: { id: 'fanscholar', name: 'Fan Scholar', title: 'Phiến Nho', description: 'A scholar-cultivator who fights with a folding fan.', sprite: 'hero.fanscholar', scale: 0.34 },
  monk: { id: 'monk', name: 'Staff Monk', title: 'Võ Tăng', description: 'A warrior monk with iron discipline.', sprite: 'hero.monk', scale: 0.32 },
  saber: { id: 'saber', name: 'Saber Wanderer', title: 'Đao Khách', description: 'A road-worn saber fighter.', sprite: 'hero.saber', scale: 0.34 },
  twinblade: { id: 'twinblade', name: 'Twin-Blade Adept', title: 'Song Đao', description: 'Moves like a storm with a blade in each hand.', sprite: 'hero.twinblade', scale: 0.34 },
};
export const HERO_IDS = Object.keys(HEROES) as HeroId[];
