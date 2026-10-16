export type ItemType = 'consumable' | 'equipment' | 'quest';

export interface ItemDef {
  id: string;
  name: string;
  type: ItemType;
  maxStack: number;
  description: string;
  heal?: number;
  mana?: number;
  qi?: number;
  weaponAtk?: number;
}

export const ITEMS: Record<string, ItemDef> = {
  'hp-potion': { id: 'hp-potion', name: 'Vitality Draught', type: 'consumable', maxStack: 10, description: 'Restores 40 HP.', heal: 40 },
  'mana-potion': { id: 'mana-potion', name: 'Clarity Draught', type: 'consumable', maxStack: 10, description: 'Restores 30 mana.', mana: 30 },
  'qi-pill': { id: 'qi-pill', name: 'Qi Gathering Pill', type: 'consumable', maxStack: 10, description: 'Adds 60 qi.', qi: 60 },
  'spirit-herb': { id: 'spirit-herb', name: 'Spirit Herb', type: 'quest', maxStack: 20, description: 'A faintly glowing herb the elder needs.' },
  'iron-sword': { id: 'iron-sword', name: 'Iron Sword', type: 'equipment', maxStack: 1, description: '+4 attack.', weaponAtk: 4 },
  'jade-sword': { id: 'jade-sword', name: 'Warden-Jade Blade', type: 'equipment', maxStack: 1, description: '+9 attack.', weaponAtk: 9 },
};

/** Drop tables: chance per kill. */
export const DROPS: Record<string, { item: string; chance: number }[]> = {
  slime: [{ item: 'spirit-herb', chance: 0.5 }, { item: 'hp-potion', chance: 0.15 }],
  wraith: [{ item: 'mana-potion', chance: 0.3 }, { item: 'qi-pill', chance: 0.12 }],
  brute: [{ item: 'hp-potion', chance: 0.4 }, { item: 'qi-pill', chance: 0.25 }],
  warden: [{ item: 'jade-sword', chance: 1 }, { item: 'qi-pill', chance: 1 }],
};
