import type { BoonMods } from './boons';

/** Dao Insight: a second place to spend skill points once the four techniques are maxed. Each rank adds the listed mods. */
export type InsightId = 'vitality' | 'edge' | 'spirit';
export interface InsightDef { id: InsightId; name: string; blurb: string; perRank: Partial<BoonMods> }

export const INSIGHT_MAX = 15;
export const INSIGHTS: Record<InsightId, InsightDef> = {
  vitality: { id: 'vitality', name: 'Body Tempering', blurb: '+3% max HP per rank', perRank: { maxHpPct: 0.03 } },
  edge: { id: 'edge', name: 'Sword Intent', blurb: '+2% attack and +0.4% crit per rank', perRank: { atkPct: 0.02, critChance: 0.004 } },
  spirit: { id: 'spirit', name: 'Spirit Sea', blurb: '+4% max mana and +0.3 mana regen per rank', perRank: { maxManaPct: 0.04, manaRegen: 0.3 } },
};
export const INSIGHT_IDS = Object.keys(INSIGHTS) as InsightId[];
export type InsightRanks = Record<InsightId, number>;
export const newInsight = (): InsightRanks => ({ vitality: 0, edge: 0, spirit: 0 });
