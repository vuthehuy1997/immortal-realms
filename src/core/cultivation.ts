import { REALMS } from '../data/realms';

export interface Cultivation { realm: number; qi: number }

export const MEDITATE_RATE = 12; // qi per second while meditating
export const BASE_BREAKTHROUGH_CHANCE = 0.6;

export const qiMax = (c: Cultivation): number => REALMS[c.realm]?.qiMax ?? 0;
export const hasNextRealm = (c: Cultivation): boolean => c.realm < REALMS.length - 1;
export const canBreakthrough = (c: Cultivation): boolean => hasNextRealm(c) && c.qi >= qiMax(c);

export function addQi(c: Cultivation, amount: number): void {
  c.qi = Math.min(qiMax(c), Math.max(0, c.qi + amount));
}

export function meditate(c: Cultivation, dtSec: number): void {
  addQi(c, MEDITATE_RATE * dtSec);
}

export type BreakthroughResult =
  | { ok: false; reason: 'not-ready' | 'max-realm' }
  | { ok: true; success: boolean };

/** Success: next realm, qi resets. Failure: backlash — lose half of the qi. `rng` is injected for determinism. */
export function attemptBreakthrough(c: Cultivation, rng: () => number, bonus = 0): BreakthroughResult {
  if (!hasNextRealm(c)) return { ok: false, reason: 'max-realm' };
  if (!canBreakthrough(c)) return { ok: false, reason: 'not-ready' };
  const chance = Math.min(0.95, Math.max(0.05, BASE_BREAKTHROUGH_CHANCE + bonus));
  if (rng() < chance) {
    c.realm++;
    c.qi = 0;
    return { ok: true, success: true };
  }
  c.qi = Math.floor(c.qi / 2);
  return { ok: true, success: false };
}
