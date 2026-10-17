import type { GameState } from './gameState';
import { addItem, countOf, removeItem, type Inventory } from './inventory';

export interface Recipe { id: string; name: string; output: string; herbs: number; stones: number; note: string }

/** Alchemist Yun's furnace: turn gathered spirit herbs into potions and pills. */
export const RECIPES: readonly Recipe[] = [
  { id: 'brew-hp', name: 'Vitality Draught', output: 'hp-potion', herbs: 1, stones: 3, note: 'Restores 40 HP' },
  { id: 'brew-mana', name: 'Clarity Draught', output: 'mana-potion', herbs: 1, stones: 3, note: 'Restores 30 mana' },
  { id: 'brew-foundation', name: 'Foundation Pill', output: 'foundation-pill', herbs: 3, stones: 25, note: 'Needed for every breakthrough' },
  { id: 'brew-qi', name: 'Qi Gathering Pill', output: 'qi-pill', herbs: 2, stones: 8, note: 'Adds 60 qi' },
];

export type CraftResult = { ok: true } | { ok: false; reason: 'unknown' | 'herbs' | 'stones' | 'full' };

export function canCraft(gs: GameState, r: Recipe): boolean {
  return countOf(gs.inventory, 'spirit-herb') >= r.herbs && gs.stones >= r.stones;
}

/** Atomic craft: ingredients are only consumed if the result fits in the bag. */
export function craft(gs: GameState, recipeId: string): CraftResult {
  const r = RECIPES.find((x) => x.id === recipeId);
  if (!r) return { ok: false, reason: 'unknown' };
  if (countOf(gs.inventory, 'spirit-herb') < r.herbs) return { ok: false, reason: 'herbs' };
  if (gs.stones < r.stones) return { ok: false, reason: 'stones' };
  const trial: Inventory = structuredClone(gs.inventory);
  removeItem(trial, 'spirit-herb', r.herbs);
  if (addItem(trial, r.output, 1) > 0) return { ok: false, reason: 'full' };
  gs.inventory = trial; gs.stones -= r.stones;
  return { ok: true };
}
