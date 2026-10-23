/** Sustain systems that keep long fights playable: the spirit flask (refilling healing charges) and mana gained from sword hits. */
export interface Flask { charges: number; kills: number }

export const FLASK_MAX = 3;
export const FLASK_HEAL_PCT = 0.35;
/** Kills needed to earn one charge back while out in the wild. */
export const KILLS_PER_CHARGE = 5;
export const MANA_ON_HIT = 3;
export const MANA_ON_FINISHER = 6;

export const newFlask = (): Flask => ({ charges: FLASK_MAX, kills: 0 });

/** Refills every charge (hubs, respawn, breakthrough). */
export function refillFlask(f: Flask): void { f.charges = FLASK_MAX; f.kills = 0; }

/** Counts a kill toward the next charge. Returns true when a charge was earned. */
export function flaskOnKill(f: Flask): boolean {
  if (f.charges >= FLASK_MAX) { f.kills = 0; return false; }
  f.kills++;
  if (f.kills >= KILLS_PER_CHARGE) { f.kills = 0; f.charges++; return true; }
  return false;
}

/** Spends a charge and returns the hit points restored, or null if empty or already at full health. */
export function useFlask(f: Flask, hp: number, maxHp: number): number | null {
  if (f.charges <= 0 || hp >= maxHp) return null;
  f.charges--;
  return Math.min(maxHp - hp, Math.round(maxHp * FLASK_HEAL_PCT));
}

/** Mana restored by a sword swing that connected. */
export const manaOnSwing = (finisher: boolean): number => (finisher ? MANA_ON_FINISHER : MANA_ON_HIT);

export const validFlask = (v: unknown): v is Flask =>
  typeof v === 'object' && v !== null && Number.isInteger((v as Flask).charges) && (v as Flask).charges >= 0 && (v as Flask).charges <= FLASK_MAX
  && Number.isInteger((v as Flask).kills) && (v as Flask).kills >= 0 && (v as Flask).kills < KILLS_PER_CHARGE;
