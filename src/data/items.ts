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
};
