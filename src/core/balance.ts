import type { EnemyDef } from '../data/enemies';
import { ZONES, type ZoneId } from '../data/zones';

/** Base enemy health is multiplied by this before the zone tier, so a fight lasts several seconds instead of one combo. */
export const HP_BASE = 4;
export const ELITE = { hp: 2.8, atk: 1.4, xp: 3 } as const;

export interface ScaledEnemy { maxHp: number; atk: number; def: number; xp: number; stones: [number, number] }

/** Final stats of an enemy of `def` spawning in `zone` (optionally as an elite). Single source of truth for combat and rewards. */
export function scaledEnemy(def: EnemyDef, zone: ZoneId, elite = false): ScaledEnemy {
  const t = ZONES[zone]!.tier;
  const xpMul = t.xp * (elite ? ELITE.xp : 1);
  return {
    maxHp: Math.round(def.maxHp * HP_BASE * t.hp * (elite ? ELITE.hp : 1)),
    atk: Math.round(def.atk * t.atk * (elite ? ELITE.atk : 1)),
    def: Math.round(def.def * (1 + (t.hp - 1) * 0.5)),
    xp: Math.round(def.xp * xpMul),
    stones: [Math.max(1, Math.round(def.stones[0] * xpMul)), Math.max(1, Math.round(def.stones[1] * xpMul))],
  };
}
