import { DROPS } from '../data/items';
import { ENEMIES } from '../data/enemies';
import { QUESTS } from '../data/quests';
import type { RootId } from '../data/roots';
import { deriveStats, type CharacterInfo, type DerivedStats } from './character';
import { addQi, type Cultivation } from './cultivation';
import { addItem, countOf, newInventory, removeItem, useConsumable, type Inventory } from './inventory';
import { addXp, type Progress } from './progression';
import { isComplete, newQuestLog, onKill, type QuestLog } from './quest';

export interface GameState {
  character: CharacterInfo;
  progress: Progress;
  cultivation: Cultivation;
  inventory: Inventory;
  quests: QuestLog;
  kills: number;
  bossDefeated: boolean;
  hp: number;
  mana: number;
  pos: { x: number; y: number };
}

export const WARDEN_ID = 'warden';

export function newGameState(name: string, root: RootId, spawn: { x: number; y: number }): GameState {
  const gs: GameState = {
    character: { name, root }, progress: { level: 1, xp: 0 }, cultivation: { realm: 0, qi: 0 },
    inventory: newInventory(), quests: newQuestLog(), kills: 0, bossDefeated: false, hp: 0, mana: 0, pos: { ...spawn },
  };
  addItem(gs.inventory, 'hp-potion', 2);
  const s = statsOf(gs);
  gs.hp = s.maxHp; gs.mana = s.maxMana;
  return gs;
}

export const statsOf = (gs: GameState): DerivedStats =>
  deriveStats(gs.character.root, gs.progress.level, gs.cultivation.realm, gs.inventory.weapon);

/** Re-clamps current hp/mana after max stats change (gear/realm/level). */
export function clampVitals(gs: GameState): void {
  const s = statsOf(gs);
  gs.hp = Math.min(gs.hp, s.maxHp);
  gs.mana = Math.min(gs.mana, s.maxMana);
}

/** Grants XP; a level-up fully restores hp and mana. Returns levels gained. */
export function grantXp(gs: GameState, amount: number): number {
  const gained = addXp(gs.progress, amount);
  if (gained > 0) { const s = statsOf(gs); gs.hp = s.maxHp; gs.mana = s.maxMana; }
  return gained;
}

export interface KillResult { xp: number; levelsGained: number; drops: { id: string; count: number }[]; overflow: string[] }

export function registerKill(gs: GameState, enemyType: string, rng: () => number): KillResult {
  const xp = enemyType === WARDEN_ID ? 120 : ENEMIES[enemyType]?.xp ?? 0;
  gs.kills++;
  if (enemyType === WARDEN_ID) gs.bossDefeated = true;
  onKill(gs.quests, enemyType);
  const drops: { id: string; count: number }[] = [];
  const overflow: string[] = [];
  for (const d of DROPS[enemyType] ?? []) {
    if (rng() < d.chance) {
      if (addItem(gs.inventory, d.item, 1) === 0) drops.push({ id: d.item, count: 1 });
      else overflow.push(d.item);
    }
  }
  return { xp, levelsGained: grantXp(gs, xp), drops, overflow };
}

/** Atomic turn-in: nothing changes unless the quest is complete and rewards fit in the inventory. */
export function turnInQuest(gs: GameState, id: string): { ok: true; levelsGained: number } | { ok: false; reason: 'incomplete' | 'inventory-full' } {
  const def = QUESTS[id], st = gs.quests[id];
  if (!def || !st || !isComplete(def, st, gs.inventory)) return { ok: false, reason: 'incomplete' };
  const trial: Inventory = structuredClone(gs.inventory);
  for (const o of def.objectives) if (o.type === 'collect') removeItem(trial, o.item, o.count);
  for (const r of def.reward.items) if (addItem(trial, r.id, r.count) > 0) return { ok: false, reason: 'inventory-full' };
  gs.inventory = trial;
  st.status = 'turnedIn';
  return { ok: true, levelsGained: grantXp(gs, def.reward.xp) };
}

/** Uses a consumable slot and applies hp/mana/qi (clamped to maxima). Returns false if the slot is empty or not consumable. */
export function useItemSlot(gs: GameState, slot: number): boolean {
  const s = statsOf(gs);
  const stack = gs.inventory.slots[slot];
  if (!stack) return false;
  const eff = useConsumable(gs.inventory, slot);
  if (!eff) return false;
  gs.hp = Math.min(s.maxHp, gs.hp + eff.heal);
  gs.mana = Math.min(s.maxMana, gs.mana + eff.mana);
  addQi(gs.cultivation, eff.qi);
  return true;
}

export const questItemCount = (gs: GameState, id: string): number => countOf(gs.inventory, id);

/** Moves the equipped weapon back into the bag. Fails (no change) if the bag is full. */
export function unequipWeapon(gs: GameState): boolean {
  const w = gs.inventory.weapon;
  if (!w) return false;
  if (addItem(gs.inventory, w, 1) > 0) return false;
  gs.inventory.weapon = null;
  return true;
}
