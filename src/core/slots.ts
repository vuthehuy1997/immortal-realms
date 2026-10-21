import type { GameState } from './gameState';
import { parseSave, serialize, type LoadResult } from './save';

/** Three save slots. Slot 1 keeps the original key so saves from older builds still load. Each save keeps the previous good one as a backup. */
export const SLOT_COUNT = 3;
export const slotKey = (slot: number): string => (slot === 1 ? 'immortal-realms/save-v1' : `immortal-realms/save-v1-s${slot}`);
export const backupKey = (slot: number): string => `${slotKey(slot)}.bak`;
export const ACTIVE_KEY = 'immortal-realms/active-slot';

export interface StorageLike { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem(k: string): void }
export type SlotInfo =
  | { slot: number; status: 'empty' }
  | { slot: number; status: 'corrupt'; error: string; hasBackup: boolean }
  | { slot: number; status: 'ok'; name: string; level: number; realm: number; kills: number; bosses: number; savedAt: number; recovered: boolean };
export type SlotLoad = LoadResult & { recovered?: boolean };

const validSlot = (n: number): boolean => Number.isInteger(n) && n >= 1 && n <= SLOT_COUNT;

export function activeSlot(st: StorageLike): number {
  const n = Number(st.getItem(ACTIVE_KEY));
  return validSlot(n) ? n : 1;
}
export function setActiveSlot(st: StorageLike, slot: number): void { if (validSlot(slot)) st.setItem(ACTIVE_KEY, String(slot)); }

/** Writes a save; the previous text is kept as the backup only if it was itself a valid save. */
export function saveToSlot(st: StorageLike, slot: number, gs: GameState, now = Date.now()): boolean {
  if (!validSlot(slot)) return false;
  const prev = st.getItem(slotKey(slot));
  if (prev && parseSave(prev).ok) st.setItem(backupKey(slot), prev);
  st.setItem(slotKey(slot), serialize(gs, now));
  return true;
}

/** Loads a slot; if the main file is corrupt but the backup is good, the backup is used (and `recovered` is set). */
export function loadSlot(st: StorageLike, slot: number): SlotLoad {
  if (!validSlot(slot)) return { ok: false, error: 'No such slot.' };
  const main = parseSave(st.getItem(slotKey(slot)));
  if (main.ok) return main;
  const bak = st.getItem(backupKey(slot));
  if (bak && st.getItem(slotKey(slot)) !== null) { const r = parseSave(bak); if (r.ok) return { ...r, recovered: true }; }
  return main;
}

export function slotInfo(st: StorageLike, slot: number): SlotInfo {
  if (st.getItem(slotKey(slot)) === null) return { slot, status: 'empty' };
  const r = loadSlot(st, slot);
  if (!r.ok) return { slot, status: 'corrupt', error: r.error, hasBackup: st.getItem(backupKey(slot)) !== null };
  const s = r.state;
  return { slot, status: 'ok', name: s.character.name, level: s.progress.level, realm: s.cultivation.realm, kills: s.kills, bosses: s.bosses.length, savedAt: r.savedAt, recovered: !!r.recovered };
}

export const allSlots = (st: StorageLike): SlotInfo[] => Array.from({ length: SLOT_COUNT }, (_, i) => slotInfo(st, i + 1));
export const hasAnySave = (st: StorageLike): boolean => allSlots(st).some((s) => s.status !== 'empty');
export const firstEmptySlot = (st: StorageLike): number | null => allSlots(st).find((s) => s.status === 'empty')?.slot ?? null;
export function deleteSlot(st: StorageLike, slot: number): void { if (validSlot(slot)) { st.removeItem(slotKey(slot)); st.removeItem(backupKey(slot)); } }

/** Slot that "Continue" opens: the active one if it holds data, else the first that does. */
export function continueSlot(st: StorageLike): number | null {
  const a = activeSlot(st);
  if (st.getItem(slotKey(a)) !== null) return a;
  return allSlots(st).find((s) => s.status !== 'empty')?.slot ?? null;
}

/** Text of a slot for download; null if empty. Import validates through parseSave before it writes anything. */
export const exportSlot = (st: StorageLike, slot: number): string | null => st.getItem(slotKey(slot));
export function importToSlot(st: StorageLike, slot: number, text: string): { ok: true } | { ok: false; error: string } {
  if (!validSlot(slot)) return { ok: false, error: 'No such slot.' };
  const r = parseSave(text);
  if (!r.ok) return { ok: false, error: r.error };
  const prev = st.getItem(slotKey(slot));
  if (prev && parseSave(prev).ok) st.setItem(backupKey(slot), prev);
  st.setItem(slotKey(slot), text);
  return { ok: true };
}
