export type RootId = 'flame' | 'tide' | 'verdant';

export interface RootDef {
  id: RootId; name: string; description: string;
  bonus: { maxHp: number; maxMana: number; atk: number; def: number; critChance: number; manaRegen: number };
}

export const ROOTS: Record<RootId, RootDef> = {
  flame: { id: 'flame', name: 'Flame Root', description: 'Fierce and fast to strike: higher attack and crit.', bonus: { maxHp: 0, maxMana: 0, atk: 3, def: 0, critChance: 0.07, manaRegen: 0 } },
  tide: { id: 'tide', name: 'Tide Root', description: 'Deep wells of qi: more mana and faster regeneration.', bonus: { maxHp: 0, maxMana: 20, atk: 0, def: 0, critChance: 0, manaRegen: 2 } },
  verdant: { id: 'verdant', name: 'Verdant Root', description: 'Enduring body: more health and defence.', bonus: { maxHp: 35, maxMana: 0, atk: 0, def: 2, critChance: 0, manaRegen: 0 } },
};
