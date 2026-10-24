/** Boons: permanent build choices offered at levels 5/10/15/… and on a boss's first defeat (pick 1 of 3). Effects are plain stat mods. */
export type BoonRarity = 'common' | 'rare' | 'epic';

export interface BoonMods {
  /** fractions added (0.1 = +10%) */
  atkPct: number; maxHpPct: number; maxManaPct: number; defPct: number;
  critChance: number; critMult: number; manaRegen: number;
  /** extra mana per connecting sword swing */
  manaOnHit: number;
  /** fraction of damage dealt returned as healing */
  lifesteal: number;
  /** multiplier on the dash cooldown (below 1 = faster) */
  dashCdMult: number;
  /** extra fraction of max HP the spirit flask restores */
  flaskHeal: number;
  /** multiplier on poise damage dealt to bosses */
  poiseMult: number;
  /** extra mana and damage-buff seconds from a perfect dodge */
  perfectMana: number; perfectTime: number;
  /** fraction added to technique (1-4) damage, and fraction off their mana cost */
  skillDmg: number; skillCost: number;
  /** extra damage against foes below 30% HP */
  execute: number;
  /** above 0: a perfect dodge refreshes the dash */
  perfectDash: number;
}

export interface BoonDef { id: string; name: string; desc: string; rarity: BoonRarity; mods: Partial<BoonMods> }

export const BOONS: Record<string, BoonDef> = Object.fromEntries(([
  { id: 'iron-bone', name: 'Iron Bone Scripture', desc: '+12% max HP.', rarity: 'common', mods: { maxHpPct: 0.12 } },
  { id: 'sword-heart', name: 'Sword Heart', desc: '+10% attack.', rarity: 'common', mods: { atkPct: 0.10 } },
  { id: 'deep-lake', name: 'Deep Lake Breath', desc: '+20% max mana.', rarity: 'common', mods: { maxManaPct: 0.20 } },
  { id: 'jade-skin', name: 'Jade Skin', desc: '+15% defence.', rarity: 'common', mods: { defPct: 0.15 } },
  { id: 'keen-eye', name: 'Keen Eye', desc: '+6% critical chance.', rarity: 'common', mods: { critChance: 0.06 } },
  { id: 'flowing-qi', name: 'Flowing Qi', desc: '+2 mana regeneration per second.', rarity: 'common', mods: { manaRegen: 2 } },
  { id: 'qi-harvest', name: 'Qi Harvest', desc: 'Each sword hit restores +2 mana.', rarity: 'rare', mods: { manaOnHit: 2 } },
  { id: 'blood-lotus', name: 'Blood Lotus', desc: 'Heal 3% of the damage you deal.', rarity: 'rare', mods: { lifesteal: 0.03 } },
  { id: 'wind-step', name: 'Wind Walking Step', desc: 'Dash cooldown reduced by 25%.', rarity: 'rare', mods: { dashCdMult: 0.75 } },
  { id: 'elixir-body', name: 'Elixir Body', desc: 'The spirit flask restores 15% more max HP.', rarity: 'rare', mods: { flaskHeal: 0.15 } },
  { id: 'breaking-wave', name: 'Breaking Wave', desc: '+40% poise damage: bosses stagger sooner.', rarity: 'rare', mods: { poiseMult: 0.4 } },
  { id: 'ghost-blade', name: 'Ghost Blade Shadow', desc: 'A perfect dodge grants +10 mana and 2 s longer damage bonus.', rarity: 'rare', mods: { perfectMana: 10, perfectTime: 2 } },
  { id: 'steady-hand', name: 'Steady Hand', desc: 'Techniques deal +8% damage.', rarity: 'common', mods: { skillDmg: 0.08 } },
  { id: 'storm-art', name: 'Storm Technique', desc: 'Techniques deal +18% damage.', rarity: 'rare', mods: { skillDmg: 0.18 } },
  { id: 'lotus-echo', name: 'Lotus Echo', desc: 'Techniques cost 20% less mana.', rarity: 'rare', mods: { skillCost: 0.20 } },
  { id: 'heart-seeker', name: 'Heart Seeker', desc: '+30% damage against foes below 30% HP.', rarity: 'rare', mods: { execute: 0.30 } },
  { id: 'afterimage', name: 'Afterimage Step', desc: 'A perfect dodge refreshes your dash and grants +5 mana.', rarity: 'epic', mods: { perfectDash: 1, perfectMana: 5 } },
  { id: 'dragon-vein', name: 'Dragon Vein Awakening', desc: '+8% attack, +8% max HP and +4% critical chance.', rarity: 'epic', mods: { atkPct: 0.08, maxHpPct: 0.08, critChance: 0.04 } },
  { id: 'void-edge', name: 'Void Edge', desc: 'Critical hits deal +0.5x more damage.', rarity: 'epic', mods: { critMult: 0.5 } },
  { id: 'heaven-sustain', name: 'Heaven-Sustaining Art', desc: 'Heal 2% of damage dealt and +1 mana per sword hit.', rarity: 'epic', mods: { lifesteal: 0.02, manaOnHit: 1 } },
] as BoonDef[]).map((b) => [b.id, b]));

/** Offense / defence / utility, for the picker's accent colour and glyph. */
export function boonTag(mods: Partial<BoonMods>): 'off' | 'def' | 'util' {
  const off = (mods.atkPct ?? 0) + (mods.critChance ?? 0) + (mods.critMult ?? 0) + (mods.skillDmg ?? 0) + (mods.execute ?? 0) + (mods.poiseMult ?? 0);
  const def = (mods.maxHpPct ?? 0) + (mods.defPct ?? 0) + (mods.lifesteal ?? 0) * 3 + (mods.flaskHeal ?? 0);
  const util = (mods.maxManaPct ?? 0) + (mods.manaRegen ?? 0) / 10 + (mods.manaOnHit ?? 0) / 10 + (1 - (mods.dashCdMult ?? 1)) + (mods.skillCost ?? 0) + (mods.perfectMana ?? 0) / 40 + (mods.perfectDash ?? 0);
  return off >= def && off >= util ? 'off' : def >= util ? 'def' : 'util';
}
export const TAG_LABEL = { off: ['⚔', 'Offence'], def: ['✚', 'Defence'], util: ['✦', 'Utility'] } as const;
export const BOON_IDS = Object.keys(BOONS);
export const RARITY_WEIGHT: Record<BoonRarity, number> = { common: 6, rare: 3, epic: 1 };
