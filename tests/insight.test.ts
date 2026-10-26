import { describe, expect, it } from 'vitest';
import { freePoints, spentPoints, totalPoints, upgradeInsight } from '../src/core/skills';
import { boonMods, newGameState, statsOf } from '../src/core/gameState';
import { INSIGHT_IDS, INSIGHT_MAX, INSIGHTS, newInsight } from '../src/data/insight';
import { parseSave, serialize, checksum } from '../src/core/save';

const fresh = (level = 10) => { const gs = newGameState('Lin', 'flame', 'swordsman', { x: 1, y: 1 }); gs.progress.level = level; return gs; };

describe('Dao Insight', () => {
  it('spends skill points, raises stats, and respects the rank cap and point pool', () => {
    const gs = fresh(10); const pts = totalPoints(gs);
    const hp0 = statsOf(gs).maxHp;
    expect(upgradeInsight(gs, 'vitality')).toEqual({ ok: true });
    expect(freePoints(gs)).toBe(pts - 1); expect(statsOf(gs).maxHp).toBeGreaterThan(hp0);
    expect(upgradeInsight(gs, 'nope')).toEqual({ ok: false, reason: 'unknown' });
    gs.insight.vitality = INSIGHT_MAX; expect(upgradeInsight(gs, 'vitality')).toEqual({ ok: false, reason: 'max' });
    const broke = fresh(1); expect(upgradeInsight(broke, 'edge')).toEqual({ ok: false, reason: 'points' });
  });
  it('points spent on insight count against the shared pool with technique points', () => {
    const gs = fresh(5); gs.skills = { 'flying-sword': 2 }; gs.insight.edge = 2;
    expect(spentPoints(gs)).toBe(4); expect(freePoints(gs)).toBe(totalPoints(gs) - 4);
  });
  it('each track has a real, bounded effect', () => {
    for (const id of INSIGHT_IDS) { expect(Object.keys(INSIGHTS[id].perRank).length).toBeGreaterThan(0); }
    const gs = fresh(50); gs.insight = { vitality: INSIGHT_MAX, edge: INSIGHT_MAX, spirit: INSIGHT_MAX };
    const m = boonMods(gs); expect(m.maxHpPct).toBeCloseTo(0.03 * INSIGHT_MAX); expect(m.atkPct).toBeCloseTo(0.02 * INSIGHT_MAX); expect(m.maxManaPct).toBeCloseTo(0.04 * INSIGHT_MAX);
  });
  it('saves round-trip; old saves start at zero; overspending is rejected', () => {
    const gs = fresh(10); gs.insight = { vitality: 3, edge: 0, spirit: 1 };
    const r = parseSave(serialize(gs)); expect(r.ok && r.state.insight).toEqual({ vitality: 3, edge: 0, spirit: 1 });
    const env = JSON.parse(serialize(gs)) as { state: Record<string, unknown>; checksum: string };
    delete env.state.insight; env.checksum = checksum(JSON.stringify(env.state));
    const o = parseSave(JSON.stringify(env)); expect(o.ok && o.state.insight).toEqual(newInsight());
    const cheat = fresh(2); cheat.insight = { vitality: 10, edge: 10, spirit: 10 }; expect(parseSave(serialize(cheat)).ok).toBe(false);
    const bad = fresh(10); bad.insight = { vitality: 11, edge: 0, spirit: 0 }; expect(parseSave(serialize(bad)).ok).toBe(false);
  });
});
