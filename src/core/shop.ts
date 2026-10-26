import { ITEMS } from '../data/items';
import { CONTENT } from '../data/content';
import type { GameState } from './gameState';
import { addItem, countOf, type Inventory } from './inventory';

export interface ShopEntry { id: string; price: number }

/** Merchant Qiao's stock (spirit stones). Prices come from item values so the economy stays consistent. */
export const SHOP_STOCK: readonly ShopEntry[] = ['hp-potion', 'mana-potion', 'qi-pill', 'foundation-pill', 'bronze-blade', 'steel-blade', 'cloth-robe', 'sect-robe', 'jade-pendant', 'spirit-ring'].map((id) => ({ id, price: ITEMS[id]!.value }));

/** Quartermaster Gu's stock at the Skyfall Outpost (chapter 2 gear; stronger and pricier). */
export const OUTPOST_STOCK: readonly ShopEntry[] = ['greater-hp-potion', 'greater-mana-potion', 'qi-pill', 'foundation-pill', 'froststeel-blade', 'frost-mail'].map((id) => ({ id, price: ITEMS[id]!.value }));
export type StockId = string;
export const STOCKS: Record<StockId, readonly ShopEntry[]> = { sect: SHOP_STOCK, outpost: OUTPOST_STOCK };
for (const c of CONTENT) for (const [id, items] of Object.entries(c.stocks)) STOCKS[id] = items.map((i) => ({ id: i, price: ITEMS[i]!.value }));

export const SELL_RATE = 0.4;
export const sellValue = (id: string): number => Math.max(1, Math.floor((ITEMS[id]?.value ?? 0) * SELL_RATE));

export type TradeResult = { ok: true } | { ok: false; reason: 'unknown' | 'stones' | 'full' | 'empty' | 'count' };

/** Atomic purchase: nothing changes unless the player can pay and the goods fit in the bag. */
export function buy(gs: GameState, id: string, count = 1, stock: StockId = 'sect'): TradeResult {
  const entry = STOCKS[stock]?.find((e) => e.id === id);
  if (!entry || count < 1) return { ok: false, reason: 'unknown' };
  const cost = entry.price * count;
  if (gs.stones < cost) return { ok: false, reason: 'stones' };
  const trial: Inventory = structuredClone(gs.inventory);
  if (addItem(trial, id, count) > 0) return { ok: false, reason: 'full' };
  gs.inventory = trial; gs.stones -= cost;
  return { ok: true };
}

/** Sells `count` items from a bag slot (clamped to the stack). */
export function sell(gs: GameState, slot: number, count = 1): TradeResult {
  const s = gs.inventory.slots[slot];
  if (!s) return { ok: false, reason: 'empty' };
  if (count < 1) return { ok: false, reason: 'count' };
  const n = Math.min(count, s.count), id = s.id;
  s.count -= n; if (s.count === 0) gs.inventory.slots[slot] = null;
  gs.stones += sellValue(id) * n;
  return { ok: true };
}

export const canAfford = (gs: GameState, id: string): boolean => gs.stones >= (SHOP_STOCK.find((e) => e.id === id)?.price ?? Infinity);
export const owned = (gs: GameState, id: string): number => countOf(gs.inventory, id);
