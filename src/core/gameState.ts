import { BOSSES } from '../data/boss';
import { scaledEnemy } from './balance';
import type { ZoneId } from '../data/zones';
import { DROPS, ELITE_LOOT } from '../data/items';
import { ENEMIES } from '../data/enemies';
import { QUESTS } from '../data/quests';
import type { HeroId } from '../data/heroes';
import type { RootId } from '../data/roots';
import { deriveStats, type CharacterInfo, type DerivedStats } from './character';
import { addQi, type Cultivation } from './cultivation';
import { addItem, countOf, newInventory, removeItem, unequip, useConsumable, type EquipKey, type Inventory } from './inventory';
import { addXp, type Progress } from './progression';
import { attemptBreakthrough, canBreakthrough, nextRealmLevel, type BreakthroughResult } from './cultivation';
import { isComplete, newQuestLog, onKill, type QuestLog } from './quest';

export interface GameState {
  character: CharacterInfo;
  progress: Progress;
  cultivation: Cultivation;
  inventory: Inventory;
  quests: QuestLog;
  kills: number;
  stones: number;
  /** ids of bosses defeated */
  bosses: string[];
  /** extra levels bought per technique id (level = 1 + this) */
  skills: Record<string, number>;
  /** tutorial progress bitmask: 1 moved, 2 attacked, 4 dashed, 8 talked (15 = finished) */
  tut: number;
  hp: number;
  mana: number;
  pos: { x: number; y: number };
}

export const WARDEN_ID = 'warden';
export const isBossDefeated = (gs: GameState, id: string): boolean => gs.bosses.includes(id);

export function newGameState(name: string, root: RootId, hero: HeroId, spawn: { x: number; y: number }): GameState {
  const gs: GameState = {
    character: { name, root, hero }, progress: { level: 1, xp: 0 }, cultivation: { realm: 0, qi: 0 },
    inventory: newInventory(), quests: newQuestLog(), kills: 0, stones: 30, bosses: [], skills: {}, tut: 0, hp: 0, mana: 0, pos: { ...spawn },
  };
  addItem(gs.inventory, 'hp-potion', 2);
  const s = statsOf(gs);
  gs.hp = s.maxHp; gs.mana = s.maxMana;
  return gs;
}

export const statsOf = (gs: GameState): DerivedStats =>
  deriveStats(gs.character.root, gs.progress.level, gs.cultivation.realm, gs.inventory);

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

export interface KillResult { xp: number; stones: number; levelsGained: number; drops: { id: string; count: number }[]; overflow: string[] }

export function registerKill(gs: GameState, enemyType: string, rng: () => number, opts: { elite?: boolean; zone?: string } = {}): KillResult {
  const boss = BOSSES[enemyType], edef = ENEMIES[enemyType];
  const sc = edef ? scaledEnemy(edef, (opts.zone as ZoneId | undefined) ?? 'bamboo', !!opts.elite) : undefined;
  const firstBossKill = !!boss && !gs.bosses.includes(enemyType);
  const xp = boss ? (firstBossKill ? boss.xp : Math.round(boss.xp * 0.3)) : sc?.xp ?? 0;
  const range = boss ? boss.stones : sc?.stones ?? [0, 0];
  const base = range[0]! + Math.floor(rng() * (range[1]! - range[0]! + 1));
  const stones = boss && !firstBossKill ? Math.round(base * 0.3) : base; // repeat boss kills pay 30%
  addQi(gs.cultivation, Math.round(xp * 0.12)); // fighting also feeds cultivation
  gs.stones += stones;
  gs.kills++;
  if (boss && !gs.bosses.includes(enemyType)) gs.bosses.push(enemyType);
  onKill(gs.quests, enemyType);
  const drops: { id: string; count: number }[] = [];
  const overflow: string[] = [];
  for (const d of boss && !firstBossKill ? [{ item: 'qi-pill', chance: 0.5 }] : DROPS[enemyType] ?? []) {
    if (rng() < Math.min(1, d.chance * (opts.elite ? 2 : 1))) {
      if (addItem(gs.inventory, d.item, 1) === 0) drops.push({ id: d.item, count: 1 });
      else overflow.push(d.item);
    }
  }
  const pool = opts.elite && opts.zone ? ELITE_LOOT[opts.zone] : undefined;
  const wpn = pool?.length ? pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))] : undefined;
  if (wpn && rng() < 0.4) { if (addItem(gs.inventory, wpn, 1) === 0) drops.push({ id: wpn, count: 1 }); else overflow.push(wpn); }
  return { xp, stones, levelsGained: grantXp(gs, xp), drops, overflow };
}

/** Atomic turn-in: nothing changes unless the quest is complete and rewards fit in the inventory. */
export function turnInQuest(gs: GameState, id: string): { ok: true; levelsGained: number } | { ok: false; reason: 'incomplete' | 'inventory-full' } {
  const def = QUESTS[id], st = gs.quests[id];
  if (!def || !st || !isComplete(def, st, gs.inventory, gs.bosses)) return { ok: false, reason: 'incomplete' };
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

/** Moves an equipped item back into the bag. Fails (no change) if the bag is full. */
export function unequipSlot(gs: GameState, key: EquipKey = 'weapon'): boolean { return unequip(gs.inventory, key); }
/** @deprecated kept for older call sites */
export const unequipWeapon = (gs: GameState): boolean => unequipSlot(gs, 'weapon');

/** Picks a spirit herb from a gathering node. Fails (no change) if the bag is full. */
export function gatherHerb(gs: GameState): boolean {
  return addItem(gs.inventory, 'spirit-herb', 1) === 0;
}


export type BreakthroughOutcome = BreakthroughResult | { ok: false; reason: 'no-pill' };

/** A breakthrough needs full qi, the level for the next realm AND one Foundation Pill (consumed by the attempt, success or not). */
export function tryBreakthrough(gs: GameState, rng: () => number): BreakthroughOutcome {
  const c = gs.cultivation;
  if (!canBreakthrough(c, gs.progress.level)) return attemptBreakthrough(c, rng, 0, gs.progress.level); // reports why (qi / level / max realm)
  if (countOf(gs.inventory, 'foundation-pill') < 1) return { ok: false, reason: 'no-pill' };
  removeItem(gs.inventory, 'foundation-pill', 1);
  return attemptBreakthrough(c, rng, 0, gs.progress.level);
}
export { nextRealmLevel };
