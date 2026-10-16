import { describe, expect, it } from 'vitest';
import { craft, canCraft, RECIPES } from '../src/core/alchemy';
import { newGameState } from '../src/core/gameState';
import { addItem, countOf, SLOT_COUNT } from '../src/core/inventory';
import { buy, sell, sellValue, SHOP_STOCK } from '../src/core/shop';
import { ITEMS } from '../src/data/items';

const mk = () => newGameState('Trader', 'tide', 'monk', { x: 0, y: 0 });

describe('shop', () => {
  it('stock only contains real items priced from their value', () => {
    for (const e of SHOP_STOCK) { expect(ITEMS[e.id]).toBeDefined(); expect(e.price).toBe(ITEMS[e.id]!.value); }
    expect(SHOP_STOCK.length).toBeGreaterThanOrEqual(5);
  });
  it('buying spends stones and adds the goods', () => {
    const gs = mk(); const before = gs.stones;
    expect(buy(gs, 'hp-potion', 2)).toEqual({ ok: true });
    expect(gs.stones).toBe(before - 24); expect(countOf(gs.inventory, 'hp-potion')).toBe(4);
  });
  it('is atomic: not enough stones or no room changes nothing', () => {
    const gs = mk(); const snap = JSON.stringify(gs);
    expect(buy(gs, 'steel-blade')).toEqual({ ok: false, reason: 'stones' });
    expect(buy(gs, 'nope')).toEqual({ ok: false, reason: 'unknown' });
    expect(JSON.stringify(gs)).toBe(snap);
    gs.stones = 1000; gs.inventory.slots.fill({ id: 'iron-sword', count: 1 });
    const snap2 = JSON.stringify(gs);
    expect(buy(gs, 'bronze-blade')).toEqual({ ok: false, reason: 'full' });
    expect(JSON.stringify(gs)).toBe(snap2);
  });
  it('selling pays 40% of value, clamps to the stack and empties the slot', () => {
    const gs = mk(); addItem(gs.inventory, 'spirit-herb', 3); const slot = gs.inventory.slots.findIndex((s) => s?.id === 'spirit-herb');
    const before = gs.stones;
    expect(sell(gs, slot, 99)).toEqual({ ok: true });
    expect(gs.stones).toBe(before + sellValue('spirit-herb') * 3); expect(gs.inventory.slots[slot]).toBeNull();
    expect(sell(gs, slot, 1)).toEqual({ ok: false, reason: 'empty' });
    expect(sellValue('spirit-herb')).toBe(6);
  });
  it('you cannot profit by buying and selling back', () => {
    const gs = mk(); gs.stones = 500; const start = gs.stones;
    for (const e of SHOP_STOCK) { buy(gs, e.id, 1); const slot = gs.inventory.slots.findIndex((s) => s?.id === e.id); sell(gs, slot, 1); }
    expect(gs.stones).toBeLessThan(start);
  });
});

describe('alchemy', () => {
  it('recipes reference real items and cost herbs + stones', () => {
    for (const r of RECIPES) { expect(ITEMS[r.output]).toBeDefined(); expect(r.herbs).toBeGreaterThan(0); expect(r.stones).toBeGreaterThan(0); }
  });
  it('crafting consumes herbs and stones and yields the item', () => {
    const gs = mk(); addItem(gs.inventory, 'spirit-herb', 2); const before = gs.stones;
    const r = RECIPES.find((x) => x.id === 'brew-qi')!;
    expect(canCraft(gs, r)).toBe(true);
    expect(craft(gs, 'brew-qi')).toEqual({ ok: true });
    expect(countOf(gs.inventory, 'spirit-herb')).toBe(0); expect(countOf(gs.inventory, 'qi-pill')).toBe(1); expect(gs.stones).toBe(before - r.stones);
  });
  it('fails without ingredients and changes nothing; fails atomically when the bag is full', () => {
    const gs = mk(); const snap = JSON.stringify(gs);
    expect(craft(gs, 'brew-hp')).toEqual({ ok: false, reason: 'herbs' });
    expect(craft(gs, 'nope')).toEqual({ ok: false, reason: 'unknown' });
    expect(JSON.stringify(gs)).toBe(snap);
    addItem(gs.inventory, 'spirit-herb', 1); gs.stones = 0;
    expect(craft(gs, 'brew-hp')).toEqual({ ok: false, reason: 'stones' });
    gs.stones = 50; gs.inventory.slots.fill({ id: 'iron-sword', count: 1 }); gs.inventory.slots[SLOT_COUNT - 1] = { id: 'spirit-herb', count: 1 };
    // removing the herb frees one slot, so the potion fits
    expect(craft(gs, 'brew-hp')).toEqual({ ok: true });
    gs.inventory.slots.fill({ id: 'iron-sword', count: 1 }); gs.inventory.slots[0] = { id: 'spirit-herb', count: 1 };
    gs.inventory.slots[1] = { id: 'hp-potion', count: 10 }; // full potion stack, herb slot is the only one freed
    expect(craft(gs, 'brew-mana')).toEqual({ ok: true });
  });
  it('brewing is cheaper than buying (herbs are worth gathering)', () => {
    const hp = RECIPES.find((r) => r.output === 'hp-potion')!;
    expect(hp.stones + hp.herbs * sellValue('spirit-herb')).toBeLessThan(ITEMS['hp-potion']!.value);
  });
});
