export type ItemType = 'consumable' | 'equipment' | 'quest';
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
}

export const ITEMS: Record<string, ItemDef> = {
  'hp-potion': { id: 'hp-potion', name: 'Vitality Draught', type: 'consumable', maxStack: 10, description: 'Restores 40 HP.', value: 12, rarity: 'common', heal: 40 },
  'mana-potion': { id: 'mana-potion', name: 'Clarity Draught', type: 'consumable', maxStack: 10, description: 'Restores 30 mana.', value: 12, rarity: 'common', mana: 30 },
  'qi-pill': { id: 'qi-pill', name: 'Qi Gathering Pill', type: 'consumable', maxStack: 10, description: 'Adds 60 qi.', value: 30, rarity: 'uncommon', qi: 60 },
  'spirit-herb': { id: 'spirit-herb', name: 'Spirit Herb', type: 'quest', maxStack: 20, description: 'A faintly glowing lingzhi. Used in alchemy and by the elder.', value: 15, rarity: 'common' },
  'bronze-blade': { id: 'bronze-blade', name: 'Bronze Blade', type: 'equipment', maxStack: 1, description: '+3 attack.', value: 60, rarity: 'common', weaponAtk: 3 },
  'iron-sword': { id: 'iron-sword', name: 'Iron Sword', type: 'equipment', maxStack: 1, description: '+4 attack.', value: 80, rarity: 'common', weaponAtk: 4 },
  'steel-blade': { id: 'steel-blade', name: 'Cold-Forged Steel Blade', type: 'equipment', maxStack: 1, description: '+7 attack.', value: 180, rarity: 'uncommon', weaponAtk: 7 },
  'spirit-saber': { id: 'spirit-saber', name: 'Foxfire Spirit Saber', type: 'equipment', maxStack: 1, description: '+11 attack. Warm to the touch.', value: 600, rarity: 'rare', weaponAtk: 11 },
  'jade-sword': { id: 'jade-sword', name: "Fallen Immortal's Jade Blade", type: 'equipment', maxStack: 1, description: '+15 attack.', value: 1200, rarity: 'epic', weaponAtk: 15 },
};

export const RARITY_COLOR: Record<Rarity, string> = { common: '#9aa0b0', uncommon: '#58c878', rare: '#4aa8ff', epic: '#c77dff' };

/** Elites in each zone may drop a better weapon. */
export const ELITE_WEAPON: Record<string, string> = { bamboo: 'bronze-blade', marsh: 'steel-blade', grove: 'steel-blade', ruins: 'steel-blade' };

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
  warden: [{ item: 'jade-sword', chance: 1 }, { item: 'qi-pill', chance: 1 }],
  ninetail: [{ item: 'spirit-saber', chance: 1 }, { item: 'qi-pill', chance: 1 }],
};
