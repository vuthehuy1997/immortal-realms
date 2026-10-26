import { DUNGEONS, type DungeonDef } from '../data/dungeons';
import { ITEMS } from '../data/items';
import { grantXp, type GameState } from './gameState';
import { addItem } from './inventory';

export type EnterCheck = { ok: true } | { ok: false; reason: string };

/** Can a hero of this level step into the dungeon? (The only hard gate: caves and realms are otherwise open from the start.) */
export function canEnterDungeon(d: DungeonDef, level: number): EnterCheck {
  if (level < d.minLevel) return { ok: false, reason: `${d.name} is too dangerous for you yet: reach level ${d.minLevel}.` };
  return { ok: true };
}

/** True once the dungeon's boss has fallen (first clear). */
export const isDungeonCleared = (gs: GameState, id: string): boolean => { const d = DUNGEONS[id]; return !!d && gs.bosses.includes(d.boss); };

export interface DungeonReward { xp: number; stones: number; items: { id: string; count: number }[]; overflow: string[]; levelsGained: number }

/** Pays the one-time first-clear reward (call when the boss dies and it was not yet in `gs.bosses`). Items that do not fit are reported, not lost silently. */
export function claimDungeonReward(gs: GameState, d: DungeonDef): DungeonReward {
  const items: { id: string; count: number }[] = [], overflow: string[] = [];
  for (const r of d.reward.items) {
    if (!ITEMS[r.id]) continue;
    if (addItem(gs.inventory, r.id, r.count) === 0) items.push(r); else overflow.push(r.id);
  }
  gs.stones += d.reward.stones;
  return { xp: d.reward.xp, stones: d.reward.stones, items, overflow, levelsGained: grantXp(gs, d.reward.xp) };
}
