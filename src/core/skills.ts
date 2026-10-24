import { SKILLS, type SkillDef } from '../data/skills';
import { INSIGHT_MAX, INSIGHTS, type InsightId } from '../data/insight';
import type { GameState } from './gameState';

export const SKILL_MAX = 5;
/** Each skill level adds this much damage... */
export const DMG_PER_LEVEL = 0.18;
/** ...and shaves this fraction off the cooldown. */
export const CD_PER_LEVEL = 0.06;

export const skillLevel = (gs: Pick<GameState, 'skills'>, id: string): number => 1 + (gs.skills[id] ?? 0);
export const insightSpent = (insight: Partial<Record<string, number>> | undefined): number => Object.values(insight ?? {}).reduce<number>((a, b) => a + (b ?? 0), 0);
export const spentPoints = (gs: Pick<GameState, 'skills'> & { insight?: Partial<Record<string, number>> }): number => Object.values(gs.skills).reduce((a, b) => a + b, 0) + insightSpent(gs.insight);
/** One point per character level after the first, plus two per realm breakthrough. */
export const totalPoints = (gs: Pick<GameState, 'progress' | 'cultivation'>): number => gs.progress.level - 1 + gs.cultivation.realm * 2;
export const freePoints = (gs: Pick<GameState, 'skills' | 'progress' | 'cultivation' | 'insight'>): number => totalPoints(gs) - spentPoints(gs);

export type UpgradeResult = { ok: true } | { ok: false; reason: 'unknown' | 'locked' | 'max' | 'points' };

export function upgradeSkill(gs: GameState, id: string): UpgradeResult {
  const def = SKILLS.find((s) => s.id === id);
  if (!def) return { ok: false, reason: 'unknown' };
  if (gs.progress.level < def.unlockLevel) return { ok: false, reason: 'locked' };
  if (skillLevel(gs, id) >= SKILL_MAX) return { ok: false, reason: 'max' };
  if (freePoints(gs) <= 0) return { ok: false, reason: 'points' };
  gs.skills[id] = (gs.skills[id] ?? 0) + 1;
  return { ok: true };
}

export type InsightResult = { ok: true } | { ok: false; reason: 'unknown' | 'max' | 'points' };
export function upgradeInsight(gs: GameState, id: string): InsightResult {
  if (!(id in INSIGHTS)) return { ok: false, reason: 'unknown' };
  const k = id as InsightId;
  if (gs.insight[k] >= INSIGHT_MAX) return { ok: false, reason: 'max' };
  if (freePoints(gs) <= 0) return { ok: false, reason: 'points' };
  gs.insight[k]++;
  return { ok: true };
}

export interface ScaledSkill { damageMult: number; cooldown: number; stun: number }
export function scaledSkill(def: SkillDef, level: number): ScaledSkill {
  const l = level - 1;
  return { damageMult: def.damageMult * (1 + DMG_PER_LEVEL * l), cooldown: def.cooldown * (1 - CD_PER_LEVEL * l), stun: (def.stun ?? 0) + (def.stun ? 0.12 * l : 0) };
}
