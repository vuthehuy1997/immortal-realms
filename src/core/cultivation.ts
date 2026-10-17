import { REALMS } from '../data/realms';

export interface Cultivation { realm: number; qi: number }

export const MEDITATE_RATE = 3; // qi per second while meditating (x2.5 on a spirit array); kills also give qi
export const BASE_BREAKTHROUGH_CHANCE = 0.6;

export const qiMax = (c: Cultivation): number => REALMS[c.realm]?.qiMax ?? 0;
export const hasNextRealm = (c: Cultivation): boolean => c.realm < REALMS.length - 1;
export const nextRealmLevel = (c: Cultivation): number => REALMS[c.realm + 1]?.reqLevel ?? Infinity;
export const canBreakthrough = (c: Cultivation, level = 99): boolean => hasNextRealm(c) && c.qi >= qiMax(c) && level >= nextRealmLevel(c);
/** Failed breakthroughs cause qi backlash: this fraction of max HP (never lethal). */
export const BACKLASH = 0.25;

export function addQi(c: Cultivation, amount: number): void {
  c.qi = Math.min(qiMax(c), Math.max(0, c.qi + amount));
}

export function meditate(c: Cultivation, dtSec: number): void {
  addQi(c, MEDITATE_RATE * dtSec);
}

export type BreakthroughResult =
  | { ok: false; reason: 'not-ready' | 'max-realm' | 'level' }
  | { ok: true; success: boolean };

/** Success: next realm, qi resets. Failure: backlash — lose half of the qi. `rng` is injected for determinism. */
export function attemptBreakthrough(c: Cultivation, rng: () => number, bonus = 0, level = 99): BreakthroughResult {
  if (!hasNextRealm(c)) return { ok: false, reason: 'max-realm' };
  if (c.qi < qiMax(c)) return { ok: false, reason: 'not-ready' };
  if (level < nextRealmLevel(c)) return { ok: false, reason: 'level' };
  const chance = Math.min(0.95, Math.max(0.05, BASE_BREAKTHROUGH_CHANCE + bonus));
  if (rng() < chance) {
    c.realm++;
    c.qi = 0;
    return { ok: true, success: true };
  }
  c.qi = Math.floor(c.qi / 2);
  return { ok: true, success: false };
}
