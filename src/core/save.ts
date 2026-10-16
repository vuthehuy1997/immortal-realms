import { ITEMS } from '../data/items';
import { QUESTS } from '../data/quests';
import { REALMS } from '../data/realms';
import { HEROES } from '../data/heroes';
import { ROOTS } from '../data/roots';
import { MAX_LEVEL } from './progression';
import { NAME_MAX } from './character';
import { SLOT_COUNT } from './inventory';
import type { GameState } from './gameState';

export const SAVE_VERSION = 2;

interface Envelope { version: number; savedAt: number; checksum: string; state: GameState }

/** FNV-1a 32-bit over the serialised state: detects accidental corruption/hand edits (NOT cryptographic security; saves are client-side and always editable). */
export function checksum(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export function serialize(state: GameState, now = Date.now()): string {
  const body = JSON.stringify(state);
  const env: Envelope = { version: SAVE_VERSION, savedAt: now, checksum: checksum(body), state };
  return JSON.stringify(env);
}

export type LoadResult = { ok: true; state: GameState; savedAt: number } | { ok: false; error: string };

const num = (v: unknown, min: number, max: number): v is number => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Strictly validates every field; never trusts the stored data. */
function validate(s: unknown): string | null {
  if (!isObj(s)) return 'state missing';
  const c = s.character, p = s.progress, cu = s.cultivation, inv = s.inventory, q = s.quests, pos = s.pos;
  if (!isObj(c) || typeof c.name !== 'string' || c.name.length < 1 || c.name.length > NAME_MAX) return 'bad character name';
  if (typeof c.root !== 'string' || !(c.root in ROOTS)) return 'bad root';
  if (typeof c.hero !== 'string' || !(c.hero in HEROES)) return 'bad hero';
  if (!isObj(p) || !num(p.level, 1, MAX_LEVEL) || !Number.isInteger(p.level) || !num(p.xp, 0, 1e9)) return 'bad progress';
  if (!isObj(cu) || !num(cu.realm, 0, REALMS.length - 1) || !Number.isInteger(cu.realm) || !num(cu.qi, 0, REALMS[cu.realm]!.qiMax)) return 'bad cultivation';
  if (!isObj(inv) || !Array.isArray(inv.slots) || inv.slots.length !== SLOT_COUNT) return 'bad inventory';
  for (const sl of inv.slots) {
    if (sl === null) continue;
    if (!isObj(sl) || typeof sl.id !== 'string' || !(sl.id in ITEMS)) return 'unknown item';
    if (!num(sl.count, 1, ITEMS[sl.id]!.maxStack) || !Number.isInteger(sl.count)) return 'bad item count';
  }
  if (inv.weapon !== null && (typeof inv.weapon !== 'string' || ITEMS[inv.weapon]?.type !== 'equipment')) return 'bad weapon';
  if (!isObj(q)) return 'bad quests';
  for (const id of Object.keys(QUESTS)) {
    const st = q[id];
    if (!isObj(st) || !['inactive', 'active', 'turnedIn'].includes(st.status as string) || !isObj(st.kills)) return 'bad quest state';
    for (const v of Object.values(st.kills)) if (!num(v, 0, 1000)) return 'bad quest progress';
  }
  if (!num(s.kills, 0, 1e9) || !num(s.stones, 0, 1e9) || typeof s.bossDefeated !== 'boolean') return 'bad counters';
  if (!num(s.hp, 0, 1e5) || !num(s.mana, 0, 1e5)) return 'bad vitals';
  if (!isObj(pos) || !num(pos.x, 0, 1e5) || !num(pos.y, 0, 1e5)) return 'bad position';
  return null;
}

export function parseSave(text: string | null): LoadResult {
  if (!text) return { ok: false, error: 'No save found.' };
  let env: unknown;
  try { env = JSON.parse(text); } catch { return { ok: false, error: 'Save is not valid JSON.' }; }
  if (!isObj(env)) return { ok: false, error: 'Save has wrong shape.' };
  if (env.version !== SAVE_VERSION) return { ok: false, error: `Unsupported save version ${String(env.version)}.` };
  if (checksum(JSON.stringify(env.state)) !== env.checksum) return { ok: false, error: 'Save checksum mismatch (corrupted or edited).' };
  const bad = validate(env.state);
  if (bad) return { ok: false, error: `Invalid save: ${bad}.` };
  const state = env.state as GameState;
  return { ok: true, state, savedAt: Number(env.savedAt) || 0 };
}
