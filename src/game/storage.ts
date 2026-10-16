import { parseSave, serialize, type LoadResult } from '../core/save';
import type { GameState } from '../core/gameState';

const KEY = 'immortal-realms/save-v1';

export function saveGame(gs: GameState): boolean {
  try { localStorage.setItem(KEY, serialize(gs)); return true; } catch { return false; }
}

export function loadGame(): LoadResult {
  try { return parseSave(localStorage.getItem(KEY)); } catch { return { ok: false, error: 'Storage unavailable.' }; }
}

export const hasSaveData = (): boolean => { try { return localStorage.getItem(KEY) !== null; } catch { return false; } };
