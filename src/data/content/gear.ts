import type { ItemDef } from '../items';
import { emptyContent, type ChapterContent } from './types';

/**
 * The gear ladder for chapters 3-5, fixed centrally so every chapter module (and the balance tests) agree on it.
 * Per chapter: a buyable weapon + armor (the shop tier) and the best weapon, armor and charm (boss / dungeon drops).
 * Names are evocative; icons reuse the pack's blade/relic icons (PLACEHOLDER: no dedicated item art).
 */
const weapon = (id: string, name: string, atk: number, value: number, rarity: ItemDef['rarity'], description: string): ItemDef => ({ id, name, type: 'equipment', slot: 'weapon', maxStack: 1, description: `+${atk} attack. ${description}`, value, rarity, weaponAtk: atk });
const armor = (id: string, name: string, def: number, hp: number, value: number, rarity: ItemDef['rarity'], description: string): ItemDef => ({ id, name, type: 'equipment', slot: 'armor', maxStack: 1, description: `+${def} defence, +${hp} HP. ${description}`, value, rarity, defBonus: def, hpBonus: hp });
const charm = (id: string, name: string, value: number, description: string, extra: Pick<ItemDef, 'atkBonus' | 'critBonus' | 'manaBonus' | 'regenBonus' | 'defBonus'>, text: string): ItemDef => ({ id, name, type: 'equipment', slot: 'charm', maxStack: 1, description: `${text} ${description}`, value, rarity: 'epic', ...extra });

export const GEAR: ChapterContent = {
  ...emptyContent(),
  items: [
    // chapter 3: The Ember Wastes
    weapon('ember-blade', 'Cinderforged Blade', 36, 3000, 'rare', 'Still warm from the dunes.'),
    armor('ember-mail', 'Dune-Wrapped Mail', 32, 160, 2800, 'rare', 'Sand-glass plates over desert silk.'),
    weapon('furnace-saber', 'Saber of the Heavenly Furnace', 46, 6400, 'epic', 'Quenched in the immortals\' forge.'),
    armor('furnace-robe', 'Furnace-Warden Vestments', 40, 230, 6000, 'epic', 'Woven from cooled slag-silk.'),
    charm('furnace-seal', 'Seal of the Furnace', 6200, 'It hums like a kettle.', { atkBonus: 12, critBonus: 0.07 }, '+12 attack, +7% critical chance.'),
    // chapter 4: The Jade Heavens
    weapon('jade-blade', 'Terrace Jade Blade', 52, 5000, 'rare', 'Light as a falling petal.'),
    armor('jade-mail', 'Cloudscale Armor', 46, 220, 4600, 'rare', 'Scales shed by a celestial carp.'),
    weapon('heaven-sword', 'Sword of the Nine Clouds', 62, 10400, 'epic', 'It cuts the wind itself.'),
    armor('heaven-robe', 'Robe of the Celestial Court', 56, 320, 9800, 'epic', 'The hem never touches the ground.'),
    charm('jade-seal', 'Seal of the Jade Magistrate', 10000, 'Cold and exact.', { atkBonus: 18, critBonus: 0.08, manaBonus: 80 }, '+18 attack, +8% critical chance, +80 mana.'),
    // chapter 5: The Crimson Abyss
    weapon('abyss-blade', 'Bloodtempered Blade', 70, 8200, 'rare', 'It remembers every hand that held it.'),
    armor('abyss-mail', 'Ashen Penitent Plate', 64, 330, 7600, 'rare', 'Heavy with other people\'s regret.'),
    weapon('tribulation-sword', 'Blade of the Third Tribulation', 82, 17000, 'epic', 'Lightning sleeps in the edge.'),
    armor('tribulation-robe', 'Robe of Nine Tribulations', 76, 450, 16000, 'epic', 'Scorched, and stronger for it.'),
    charm('abyss-seal', 'Seal of the Dao Demon', 16500, 'It watches back.', { atkBonus: 26, critBonus: 0.1, defBonus: 14 }, '+26 attack, +10% critical chance, +14 defence.'),
  ],
  icons: {
    'ember-blade': { kind: 'icon', key: 'heavy_01_04' }, 'ember-mail': { kind: 'icon', key: 'relic_01_00' }, 'furnace-saber': { kind: 'icon', key: 'heavy_01_05' },
    'furnace-robe': { kind: 'icon', key: 'relic_02_00' }, 'furnace-seal': { kind: 'icon', key: 'relic_01_01' },
    'jade-blade': { kind: 'icon', key: 'ranged_01_03' }, 'jade-mail': { kind: 'icon', key: 'relic_02_01' }, 'heaven-sword': { kind: 'icon', key: 'ranged_01_05' },
    'heaven-robe': { kind: 'icon', key: 'relic_01_02' }, 'jade-seal': { kind: 'icon', key: 'relic_02_02' },
    'abyss-blade': { kind: 'icon', key: 'dark_01_02' }, 'abyss-mail': { kind: 'icon', key: 'relic_01_03' }, 'tribulation-sword': { kind: 'icon', key: 'dark_01_04' },
    'tribulation-robe': { kind: 'icon', key: 'relic_02_04' }, 'abyss-seal': { kind: 'icon', key: 'relic_02_05' },
  },
};

/** What a chapter's balance tests assume the hero carries on arrival and can buy there. */
export const CHAPTER_GEAR = {
  3: { arrive: { weapon: 'sovereign-blade', armor: 'crystal-robe', charm: 'sky-seal' }, shop: { weapon: 'ember-blade', armor: 'ember-mail', charm: 'sky-seal' } },
  4: { arrive: { weapon: 'furnace-saber', armor: 'furnace-robe', charm: 'furnace-seal' }, shop: { weapon: 'jade-blade', armor: 'jade-mail', charm: 'furnace-seal' } },
  5: { arrive: { weapon: 'heaven-sword', armor: 'heaven-robe', charm: 'jade-seal' }, shop: { weapon: 'abyss-blade', armor: 'abyss-mail', charm: 'jade-seal' } },
} as const;
