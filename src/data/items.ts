export type ItemType = 'consumable' | 'equipment' | 'quest' | 'material';
export type EquipSlot = 'weapon' | 'armor' | 'charm';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic';

export interface ItemDef {
  id: string;
  name: string;
  type: ItemType;
  maxStack: number;
  description: string;
  /** base trade value in spirit stones (selling pays 40%) */
  value: number;
  rarity: Rarity;
  heal?: number;
  mana?: number;
  qi?: number;
  weaponAtk?: number;
  slot?: EquipSlot;
  defBonus?: number;
  hpBonus?: number;
  critBonus?: number;
  manaBonus?: number;
  regenBonus?: number;
  atkBonus?: number;
}

export const ITEMS: Record<string, ItemDef> = {
  'hp-potion': { id: 'hp-potion', name: 'Vitality Draught', type: 'consumable', maxStack: 10, description: 'Restores 40 HP.', value: 12, rarity: 'common', heal: 40 },
  'mana-potion': { id: 'mana-potion', name: 'Clarity Draught', type: 'consumable', maxStack: 10, description: 'Restores 30 mana.', value: 12, rarity: 'common', mana: 30 },
  'qi-pill': { id: 'qi-pill', name: 'Qi Gathering Pill', type: 'consumable', maxStack: 10, description: 'Adds 60 qi.', value: 30, rarity: 'uncommon', qi: 60 },
  'spirit-herb': { id: 'spirit-herb', name: 'Spirit Herb', type: 'quest', maxStack: 20, description: 'A faintly glowing lingzhi. Used in alchemy and by the elder.', value: 15, rarity: 'common' },
  'foundation-pill': { id: 'foundation-pill', name: 'Foundation Pill', type: 'material', maxStack: 5, description: 'Required to attempt a breakthrough (B). Brew it with Alchemist Yun.', value: 150, rarity: 'rare' },
  'cloth-robe': { id: 'cloth-robe', name: 'Disciple Cloth Robe', type: 'equipment', slot: 'armor', maxStack: 1, description: '+3 defence, +12 HP.', value: 50, rarity: 'common', defBonus: 3, hpBonus: 12 },
  'sect-robe': { id: 'sect-robe', name: 'Azure Cloud Sect Robe', type: 'equipment', slot: 'armor', maxStack: 1, description: '+7 defence, +30 HP.', value: 170, rarity: 'uncommon', defBonus: 7, hpBonus: 30 },
  'spirit-silk': { id: 'spirit-silk', name: 'Spirit-Silk Vestments', type: 'equipment', slot: 'armor', maxStack: 1, description: '+12 defence, +55 HP.', value: 520, rarity: 'rare', defBonus: 12, hpBonus: 55 },
  'immortal-mantle': { id: 'immortal-mantle', name: "Immortal's Mantle", type: 'equipment', slot: 'armor', maxStack: 1, description: '+18 defence, +95 HP.', value: 1100, rarity: 'epic', defBonus: 18, hpBonus: 95 },
  'jade-pendant': { id: 'jade-pendant', name: 'Jade Pendant', type: 'equipment', slot: 'charm', maxStack: 1, description: '+6% critical chance.', value: 140, rarity: 'uncommon', critBonus: 0.06 },
  'spirit-ring': { id: 'spirit-ring', name: 'Spirit Ring', type: 'equipment', slot: 'charm', maxStack: 1, description: '+25 mana, +1.5 mana regeneration.', value: 150, rarity: 'uncommon', manaBonus: 25, regenBonus: 1.5 },
  'tiger-fang': { id: 'tiger-fang', name: 'Tiger-Fang Charm', type: 'equipment', slot: 'charm', maxStack: 1, description: '+5 attack, +4% critical chance.', value: 420, rarity: 'rare', atkBonus: 5, critBonus: 0.04 },
  'dragon-pearl': { id: 'dragon-pearl', name: 'Jiao Dragon Pearl', type: 'equipment', slot: 'charm', maxStack: 1, description: '+40 mana, +2.5 mana regeneration, +6 defence.', value: 800, rarity: 'epic', manaBonus: 40, regenBonus: 2.5, defBonus: 6 },
  'dragon-scale-robe': { id: 'dragon-scale-robe', name: 'Dragon-Scale Robe', type: 'equipment', slot: 'armor', maxStack: 1, description: '+14 defence, +70 HP.', value: 700, rarity: 'rare', defBonus: 14, hpBonus: 70 },
  'bronze-blade': { id: 'bronze-blade', slot: 'weapon', name: 'Bronze Blade', type: 'equipment', maxStack: 1, description: '+3 attack.', value: 60, rarity: 'common', weaponAtk: 3 },
  'iron-sword': { id: 'iron-sword', slot: 'weapon', name: 'Iron Sword', type: 'equipment', maxStack: 1, description: '+4 attack.', value: 80, rarity: 'common', weaponAtk: 4 },
  'steel-blade': { id: 'steel-blade', slot: 'weapon', name: 'Cold-Forged Steel Blade', type: 'equipment', maxStack: 1, description: '+7 attack.', value: 180, rarity: 'uncommon', weaponAtk: 7 },
  'spirit-saber': { id: 'spirit-saber', slot: 'weapon', name: 'Foxfire Spirit Saber', type: 'equipment', maxStack: 1, description: '+11 attack. Warm to the touch.', value: 600, rarity: 'rare', weaponAtk: 11 },
  'jade-sword': { id: 'jade-sword', slot: 'weapon', name: "Fallen Immortal's Jade Blade", type: 'equipment', maxStack: 1, description: '+15 attack.', value: 1200, rarity: 'epic', weaponAtk: 15 },
  // Chapter 2 gear (icons are reused pack icons)
  'greater-hp-potion': { id: 'greater-hp-potion', name: 'Greater Vitality Draught', type: 'consumable', maxStack: 10, description: 'Restores 120 HP.', value: 40, rarity: 'uncommon', heal: 120 },
  'greater-mana-potion': { id: 'greater-mana-potion', name: 'Greater Clarity Draught', type: 'consumable', maxStack: 10, description: 'Restores 80 mana.', value: 40, rarity: 'uncommon', mana: 80 },
  'froststeel-blade': { id: 'froststeel-blade', slot: 'weapon', name: 'Froststeel Blade', type: 'equipment', maxStack: 1, description: '+19 attack. Cold enough to numb the hand.', value: 1500, rarity: 'rare', weaponAtk: 19 },
  'crystal-saber': { id: 'crystal-saber', slot: 'weapon', name: 'Heart-of-the-Hollow Saber', type: 'equipment', maxStack: 1, description: '+24 attack.', value: 2400, rarity: 'epic', weaponAtk: 24 },
  'sovereign-blade': { id: 'sovereign-blade', slot: 'weapon', name: 'Blade of the Sundered Sky', type: 'equipment', maxStack: 1, description: '+30 attack.', value: 4000, rarity: 'epic', weaponAtk: 30 },
  'frost-mail': { id: 'frost-mail', name: 'Outpost Frost Mail', type: 'equipment', slot: 'armor', maxStack: 1, description: '+22 defence, +120 HP.', value: 1400, rarity: 'rare', defBonus: 22, hpBonus: 120 },
  'crystal-robe': { id: 'crystal-robe', name: 'Crystalweave Robe', type: 'equipment', slot: 'armor', maxStack: 1, description: '+28 defence, +165 HP.', value: 2600, rarity: 'epic', defBonus: 28, hpBonus: 165 },
  'barrow-ward': { id: 'barrow-ward', name: 'Barrow-King Ward', type: 'equipment', slot: 'charm', maxStack: 1, description: '+8 attack, +6% critical chance.', value: 1800, rarity: 'rare', atkBonus: 8, critBonus: 0.06 },
  'sky-seal': { id: 'sky-seal', name: 'Seal of the Sundered Sky', type: 'equipment', slot: 'charm', maxStack: 1, description: '+60 mana, +4 mana regeneration, +10 defence.', value: 3600, rarity: 'epic', manaBonus: 60, regenBonus: 4, defBonus: 10 },
};

export const RARITY_COLOR: Record<Rarity, string> = { common: '#9aa0b0', uncommon: '#58c878', rare: '#4aa8ff', epic: '#c77dff' };

/** Elites in each zone may drop one of these (picked at random). */
export const ELITE_LOOT: Record<string, string[]> = {
  bamboo: ['bronze-blade', 'cloth-robe'],
  marsh: ['steel-blade', 'sect-robe', 'jade-pendant'],
  grove: ['sect-robe', 'spirit-ring', 'jade-pendant'],
  ruins: ['spirit-silk', 'tiger-fang', 'steel-blade'],
  frostpass: ['froststeel-blade', 'frost-mail', 'greater-hp-potion'],
  crystal: ['froststeel-blade', 'frost-mail', 'barrow-ward'],
  barrow: ['frost-mail', 'barrow-ward', 'froststeel-blade'],
};

/** Drop tables: chance per kill. */
export const DROPS: Record<string, { item: string; chance: number }[]> = {
  wolf: [{ item: 'hp-potion', chance: 0.12 }],
  snake: [{ item: 'hp-potion', chance: 0.1 }],
  foxfire: [{ item: 'mana-potion', chance: 0.25 }],
  treant: [{ item: 'qi-pill', chance: 0.3 }, { item: 'hp-potion', chance: 0.4 }],
  toad: [{ item: 'hp-potion', chance: 0.2 }],
  waterghost: [{ item: 'mana-potion', chance: 0.25 }],
  ghost: [{ item: 'mana-potion', chance: 0.3 }, { item: 'qi-pill', chance: 0.1 }],
  peachspirit: [{ item: 'mana-potion', chance: 0.3 }, { item: 'qi-pill', chance: 0.12 }],
  bat: [],
  paperdoll: [{ item: 'hp-potion', chance: 0.1 }],
  swordspirit: [{ item: 'qi-pill', chance: 0.2 }],
  thunderbird: [{ item: 'qi-pill', chance: 0.3 }, { item: 'mana-potion', chance: 0.3 }],
  skeleton: [{ item: 'hp-potion', chance: 0.2 }],
  jiangshi: [{ item: 'qi-pill', chance: 0.25 }],
  soldier: [{ item: 'hp-potion', chance: 0.25 }],
  golem: [{ item: 'qi-pill', chance: 0.35 }, { item: 'hp-potion', chance: 0.4 }],
  frostwolf: [{ item: 'greater-hp-potion', chance: 0.08 }, { item: 'hp-potion', chance: 0.15 }],
  icesnake: [{ item: 'hp-potion', chance: 0.12 }],
  frostwisp: [{ item: 'greater-mana-potion', chance: 0.1 }, { item: 'mana-potion', chance: 0.25 }],
  rimebat: [],
  snowtreant: [{ item: 'qi-pill', chance: 0.35 }, { item: 'greater-hp-potion', chance: 0.2 }],
  crystalgolem: [{ item: 'qi-pill', chance: 0.4 }, { item: 'greater-mana-potion', chance: 0.2 }],
  prismghost: [{ item: 'greater-mana-potion', chance: 0.12 }, { item: 'qi-pill', chance: 0.15 }],
  shardbird: [{ item: 'qi-pill', chance: 0.3 }, { item: 'greater-mana-potion', chance: 0.15 }],
  ashskeleton: [{ item: 'greater-hp-potion', chance: 0.1 }, { item: 'hp-potion', chance: 0.2 }],
  bloodjiangshi: [{ item: 'qi-pill', chance: 0.3 }, { item: 'greater-hp-potion', chance: 0.15 }],
  ashguard: [{ item: 'greater-hp-potion', chance: 0.12 }, { item: 'hp-potion', chance: 0.25 }],
  warden: [{ item: 'jade-sword', chance: 1 }, { item: 'immortal-mantle', chance: 1 }, { item: 'qi-pill', chance: 1 }],
  jiaolong: [{ item: 'dragon-pearl', chance: 1 }, { item: 'dragon-scale-robe', chance: 0.6 }, { item: 'qi-pill', chance: 1 }],
  corpseking: [{ item: 'barrow-ward', chance: 1 }, { item: 'greater-hp-potion', chance: 1 }, { item: 'qi-pill', chance: 1 }],
  crystalcolossus: [{ item: 'crystal-saber', chance: 1 }, { item: 'crystal-robe', chance: 0.7 }, { item: 'greater-mana-potion', chance: 1 }],
  sovereign: [{ item: 'sovereign-blade', chance: 1 }, { item: 'sky-seal', chance: 1 }, { item: 'qi-pill', chance: 1 }],
  ninetail: [{ item: 'spirit-saber', chance: 1 }, { item: 'qi-pill', chance: 1 }, { item: 'spirit-ring', chance: 0.5 }],
};
