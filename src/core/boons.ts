import { BOON_IDS, BOONS, RARITY_WEIGHT, type BoonMods } from '../data/boons';
import { createRng } from './rng';
import type { DerivedStats } from './character';

export const BOON_LEVEL_STEP = 5;
export const CHOICES = 3;

export const NO_MODS: BoonMods = {
  atkPct: 0, maxHpPct: 0, maxManaPct: 0, defPct: 0, critChance: 0, critMult: 0, manaRegen: 0, manaOnHit: 0, lifesteal: 0,
  dashCdMult: 1, flaskHeal: 0, poiseMult: 0, perfectMana: 0, perfectTime: 0,
};

/** Sums the mods of every owned boon (the dash multiplier multiplies). */
export function aggregate(owned: readonly string[], extra: Partial<BoonMods>[] = []): BoonMods {
  const m: BoonMods = { ...NO_MODS };
  const all = [...extra, ...owned.map((id) => BOONS[id]?.mods)];
  for (const mods of all) {
    if (!mods) continue;
    for (const k of Object.keys(mods) as (keyof BoonMods)[]) {
      if (k === 'dashCdMult') m.dashCdMult *= mods[k] ?? 1;
      else m[k] += mods[k] ?? 0;
    }
  }
  return m;
}

/** Applies boon mods to base stats. */
export function applyBoons(s: DerivedStats, m: BoonMods): DerivedStats {
  return {
    maxHp: Math.round(s.maxHp * (1 + m.maxHpPct)), maxMana: Math.round(s.maxMana * (1 + m.maxManaPct)),
    atk: Math.round(s.atk * (1 + m.atkPct)), def: Math.round(s.def * (1 + m.defPct)),
    critChance: Math.min(0.9, s.critChance + m.critChance), critMult: s.critMult + m.critMult, manaRegen: s.manaRegen + m.manaRegen,
  };
}

/** How many boon picks were earned going from `from` to `to` (a pick at every 5th level). */
export const picksForLevels = (from: number, to: number): number => Math.max(0, Math.floor(to / BOON_LEVEL_STEP) - Math.floor(from / BOON_LEVEL_STEP));

/** Deterministic weighted pick of up to `n` distinct boons the hero does not own yet. */
export function rollChoices(seed: number, owned: readonly string[], n = CHOICES): string[] {
  const rng = createRng(seed);
  const pool = BOON_IDS.filter((id) => !owned.includes(id));
  const out: string[] = [];
  while (out.length < n && pool.length) {
    const total = pool.reduce((a, id) => a + RARITY_WEIGHT[BOONS[id]!.rarity], 0);
    let r = rng() * total, i = 0;
    for (; i < pool.length - 1; i++) { r -= RARITY_WEIGHT[BOONS[pool[i]!]!.rarity]; if (r < 0) break; }
    out.push(pool.splice(i, 1)[0]!);
  }
  return out;
}

export const validBoons = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string' && x in BOONS) && new Set(v).size === v.length;
