/** Out-of-combat recovery and the death penalty (pure, unit-tested). */
export const REGEN_DELAY = 6; // seconds without taking/dealing damage before natural healing starts
export const REGEN_RATE = 0.012; // fraction of max HP per second
export const ARRAY_REGEN_RATE = 0.05; // standing in the spirit array
export const DEATH_TAX_MIN = 15;
export const DEATH_TAX_FRACTION = 0.1;

export function hpRegenPerSec(maxHp: number, quietSeconds: number, nearArray: boolean): number {
  if (nearArray && quietSeconds >= 2) return maxHp * ARRAY_REGEN_RATE;
  return quietSeconds >= REGEN_DELAY ? maxHp * REGEN_RATE : 0;
}

/** Stones lost on death: 10% or at least 15, never more than you carry. */
export const deathTax = (stones: number): number => Math.min(stones, Math.max(DEATH_TAX_MIN, Math.floor(stones * DEATH_TAX_FRACTION)));
