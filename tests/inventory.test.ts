import { describe, expect, it } from 'vitest';
import { addItem, countOf, equipFromSlot, newInventory, removeItem, SLOT_COUNT, useConsumable } from '../src/core/inventory';

describe('inventory', () => {
  it('stacks up to maxStack then spills to a new slot', () => {
    const inv = newInventory();
    expect(addItem(inv, 'hp-potion', 12)).toBe(0);
    expect(inv.slots[0]).toEqual({ id: 'hp-potion', count: 10 });
    expect(inv.slots[1]).toEqual({ id: 'hp-potion', count: 2 });
    expect(countOf(inv, 'hp-potion')).toBe(12);
  });
  it('returns overflow when full and rejects unknown items', () => {
    const inv = newInventory();
    for (let i = 0; i < SLOT_COUNT; i++) addItem(inv, 'iron-sword', 1);
    expect(addItem(inv, 'iron-sword', 1)).toBe(1);
    expect(addItem(inv, 'nope', 3)).toBe(3);
  });
  it('removeItem is atomic', () => {
    const inv = newInventory(); addItem(inv, 'spirit-herb', 3);
    expect(removeItem(inv, 'spirit-herb', 5)).toBe(false);
    expect(countOf(inv, 'spirit-herb')).toBe(3);
    expect(removeItem(inv, 'spirit-herb', 3)).toBe(true);
    expect(inv.slots[0]).toBeNull();
  });
  it('uses consumables only', () => {
    const inv = newInventory(); addItem(inv, 'hp-potion', 1); addItem(inv, 'spirit-herb', 1); addItem(inv, 'iron-sword', 1);
    expect(useConsumable(inv, 1)).toBeNull(); expect(useConsumable(inv, 2)).toBeNull(); expect(useConsumable(inv, 5)).toBeNull();
    expect(useConsumable(inv, 0)).toEqual({ heal: 40, mana: 0, qi: 0 });
    expect(inv.slots[0]).toBeNull();
  });
  it('equip swaps the previous weapon back into the slot', () => {
    const inv = newInventory(); addItem(inv, 'iron-sword', 1); addItem(inv, 'jade-sword', 1);
    expect(equipFromSlot(inv, 0)).toBe(true);
    expect(inv.weapon).toBe('iron-sword'); expect(inv.slots[0]).toBeNull();
    expect(equipFromSlot(inv, 1)).toBe(true);
    expect(inv.weapon).toBe('jade-sword'); expect(inv.slots[1]).toEqual({ id: 'iron-sword', count: 1 });
    expect(equipFromSlot(inv, 3)).toBe(false);
  });
});
