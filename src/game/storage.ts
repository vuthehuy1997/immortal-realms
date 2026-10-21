import type { GameState } from '../core/gameState';
import { activeSlot, continueSlot, hasAnySave, loadSlot, saveToSlot, setActiveSlot, type SlotLoad, type StorageLike } from '../core/slots';

/** localStorage can be missing or throw (private windows); every call is guarded. */
const store: StorageLike = {
  getItem: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  setItem: (k, v) => localStorage.setItem(k, v),
  removeItem: (k) => { try { localStorage.removeItem(k); } catch { /* ignore */ } },
};
export const storage = store;

/** Saves into the slot the player is using. */
export function saveGame(gs: GameState): boolean {
  try { return saveToSlot(store, activeSlot(store), gs); } catch { return false; }
}
export function saveNewGame(gs: GameState, slot: number): boolean {
  try { setActiveSlot(store, slot); return saveToSlot(store, slot, gs); } catch { return false; }
}
export function loadSlotGame(slot: number): SlotLoad {
  try { const r = loadSlot(store, slot); if (r.ok) setActiveSlot(store, slot); return r; } catch { return { ok: false, error: 'Storage unavailable.' }; }
}
/** "Continue": the most recent slot with data. */
export function loadGame(): SlotLoad {
  const s = continueSlot(store);
  return s === null ? { ok: false, error: 'No save found.' } : loadSlotGame(s);
}
export const hasSaveData = (): boolean => { try { return hasAnySave(store); } catch { return false; } };
