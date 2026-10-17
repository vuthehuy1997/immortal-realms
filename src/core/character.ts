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
export interface Gear { weapon?: string | null; armor?: string | null; charm?: string | null }

/** `gear` may be just a weapon id (older call sites) or a full Gear record. */
export function deriveStats(root: RootId, level: number, realmIndex: number, gearIn: string | null | Gear): DerivedStats {
  const gear: Gear = typeof gearIn === 'string' || gearIn === null ? { weapon: gearIn } : gearIn;
  const armor = gear.armor ? ITEMS[gear.armor] : undefined, charm = gear.charm ? ITEMS[gear.charm] : undefined;
  const b = ROOTS[root].bonus;
  const realmMult = REALMS[Math.min(realmIndex, REALMS.length - 1)]?.statMult ?? 1;
  const weapon = gear.weapon ? ITEMS[gear.weapon]?.weaponAtk ?? 0 : 0;
  const L = level - 1;
  return {
    maxHp: Math.round((100 + 12 * L + b.maxHp) * realmMult) + (armor?.hpBonus ?? 0),
    maxMana: Math.round((50 + 4 * L + b.maxMana) * realmMult) + (charm?.manaBonus ?? 0),
    atk: Math.round((10 + 2 * L + b.atk) * realmMult) + weapon + (charm?.atkBonus ?? 0),
    def: Math.round((2 + L + b.def) * realmMult) + (armor?.defBonus ?? 0),
    critChance: 0.1 + b.critChance + (charm?.critBonus ?? 0),
    critMult: 1.75,
    manaRegen: 3 + b.manaRegen + (charm?.regenBonus ?? 0),
  };
}
