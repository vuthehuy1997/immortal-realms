import { ITEMS } from '../data/items';
import { REALMS } from '../data/realms';
import type { HeroId } from '../data/heroes';
import { ROOTS, type RootId } from '../data/roots';

export interface CharacterInfo { name: string; root: RootId; hero: HeroId }

export interface DerivedStats {
  maxHp: number; maxMana: number; atk: number; def: number;
  critChance: number; critMult: number; manaRegen: number;
}

export const NAME_MAX = 16;

export function validateName(raw: string): { ok: true; name: string } | { ok: false; error: string } {
  const name = raw.trim().replace(/\s+/g, ' ');
  if (name.length < 1) return { ok: false, error: 'Name is required.' };
  if (name.length > NAME_MAX) return { ok: false, error: `Name must be at most ${NAME_MAX} characters.` };
  if (!/^[\p{L}\p{N} '_-]+$/u.test(name)) return { ok: false, error: 'Name may contain letters, numbers, spaces, apostrophes, - and _.' };
  return { ok: true, name };
}

/** All stats are derived (never stored) so levels, realm and gear stay consistent. */
export function deriveStats(root: RootId, level: number, realmIndex: number, weaponId: string | null): DerivedStats {
  const b = ROOTS[root].bonus;
  const realmMult = REALMS[Math.min(realmIndex, REALMS.length - 1)]?.statMult ?? 1;
  const weapon = weaponId ? ITEMS[weaponId]?.weaponAtk ?? 0 : 0;
  const L = level - 1;
  return {
    maxHp: Math.round((100 + 12 * L + b.maxHp) * realmMult),
    maxMana: Math.round((50 + 4 * L + b.maxMana) * realmMult),
    atk: Math.round((10 + 2 * L + b.atk) * realmMult) + weapon,
    def: Math.round((2 + L + b.def) * realmMult),
    critChance: 0.1 + b.critChance,
    critMult: 1.75,
    manaRegen: 3 + b.manaRegen,
  };
}
