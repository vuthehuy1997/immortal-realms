import { ITEMS } from '../data/items';

export interface Stack { id: string; count: number }
export interface Inventory { slots: (Stack | null)[]; weapon: string | null; armor: string | null; charm: string | null }

export const SLOT_COUNT = 20;

export const newInventory = (): Inventory => ({ slots: Array<Stack | null>(SLOT_COUNT).fill(null), weapon: null, armor: null, charm: null });

export const countOf = (inv: Inventory, id: string): number =>
  inv.slots.reduce((n, s) => n + (s?.id === id ? s.count : 0), 0);

/** Adds items, topping up existing stacks first. Returns the count that did not fit. */
export function addItem(inv: Inventory, id: string, count = 1): number {
  const def = ITEMS[id];
  if (!def || count <= 0) return count > 0 ? count : 0;
  let left = count;
  for (const s of inv.slots) {
    if (left === 0) break;
    if (s && s.id === id && s.count < def.maxStack) {
      const add = Math.min(left, def.maxStack - s.count);
      s.count += add; left -= add;
    }
  }
  for (let i = 0; i < inv.slots.length && left > 0; i++) {
    if (inv.slots[i] === null) {
      const add = Math.min(left, def.maxStack);
      inv.slots[i] = { id, count: add }; left -= add;
    }
  }
  return left;
}

/** Removes `count` of an item across stacks. Returns false (and changes nothing) if not enough. */
export function removeItem(inv: Inventory, id: string, count = 1): boolean {
  if (countOf(inv, id) < count) return false;
  let left = count;
  for (let i = inv.slots.length - 1; i >= 0 && left > 0; i--) {
    const s = inv.slots[i];
    if (s && s.id === id) {
      const take = Math.min(left, s.count);
      s.count -= take; left -= take;
      if (s.count === 0) inv.slots[i] = null;
    }
  }
  return true;
}

export interface UseEffect { heal: number; mana: number; qi: number }

/** Consumes one consumable from a slot and returns its effect; null if not usable. */
export function useConsumable(inv: Inventory, slot: number): UseEffect | null {
  const s = inv.slots[slot];
  const def = s ? ITEMS[s.id] : undefined;
  if (!s || !def || def.type !== 'consumable') return null;
  s.count--;
  if (s.count === 0) inv.slots[slot] = null;
  return { heal: def.heal ?? 0, mana: def.mana ?? 0, qi: def.qi ?? 0 };
}

export type EquipKey = 'weapon' | 'armor' | 'charm';

/** Equips an item from a bag slot into its equipment slot; the previously equipped item goes into that bag slot. */
export function equipFromSlot(inv: Inventory, slot: number): boolean {
  const s = inv.slots[slot];
  const def = s ? ITEMS[s.id] : undefined;
  if (!s || !def || def.type !== 'equipment') return false;
  const key: EquipKey = def.slot ?? 'weapon';
  const prev = inv[key];
  inv[key] = s.id;
  inv.slots[slot] = prev ? { id: prev, count: 1 } : null;
  return true;
}

/** Returns an equipped item to the bag. Fails (no change) if the bag is full. */
export function unequip(inv: Inventory, key: EquipKey): boolean {
  const id = inv[key];
  if (!id) return false;
  if (addItem(inv, id, 1) > 0) return false;
  inv[key] = null;
  return true;
}
