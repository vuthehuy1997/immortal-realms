import { describe, expect, it } from 'vitest';
import { aggregate, LIFESTEAL_CAP, SKILL_COST_CAP } from '../src/core/boons';
import { BOON_IDS, BOONS } from '../src/data/boons';
import { boonChoices, newGameState, registerKill, LEFTOVER_PICK_STONES, REROLL_COST } from '../src/core/gameState';
import { planFloor, TOWER_XP } from '../src/core/tower';
import { createRng } from '../src/core/rng';
import { HEROES, HERO_IDS } from '../src/data/heroes';

const fresh = () => newGameState('Lin', 'flame', 'swordsman', { x: 1, y: 1 });

describe('stacking caps', () => {
  it('lifesteal and technique cost reduction are capped however many sources stack', () => {
    const all = aggregate(BOON_IDS, HERO_IDS.map((h) => HEROES[h].trait.mods));
    expect(all.lifesteal).toBeLessThanOrEqual(LIFESTEAL_CAP);
    const heavy = aggregate(['blood-lotus', 'heaven-sustain'], [HEROES.saber.trait.mods]);
    expect(heavy.lifesteal).toBe(LIFESTEAL_CAP); // 3% + 2% + 2% = 7% raw
    expect(aggregate(['lotus-echo']).skillCost).toBeCloseTo(0.2); expect(SKILL_COST_CAP).toBeLessThanOrEqual(0.5);
  });
});

describe('behaviour boons and a bigger pool', () => {
  it('the pool has 20 boons including technique, execute and dash-refresh behaviours', () => {
    expect(BOON_IDS.length).toBeGreaterThanOrEqual(20);
    expect(BOONS['storm-art']!.mods.skillDmg).toBeGreaterThan(0); expect(BOONS['heart-seeker']!.mods.execute).toBeGreaterThan(0);
    expect(BOONS['afterimage']!.mods.perfectDash).toBeGreaterThan(0); expect(BOONS['lotus-echo']!.mods.skillCost).toBeGreaterThan(0);
  });
  it('a reroll gives a different set of choices and the cost is a modest, fixed sum', () => {
    const gs = fresh(); gs.boonPicks = 1;
    const a = boonChoices(gs, 0), b = boonChoices(gs, 1), c = boonChoices(gs, 2);
    expect(a).not.toEqual(b); expect(b).not.toEqual(c);
    expect(boonChoices(gs, 1)).toEqual(b); // deterministic per reroll count
    expect(REROLL_COST).toBeGreaterThan(0); expect(LEFTOVER_PICK_STONES).toBeGreaterThan(REROLL_COST);
  });
});

describe('hero traits have combat value', () => {
  it('Fan Scholar boosts techniques and Twin-Blade refreshes the dash on a perfect dodge', () => {
    expect(HEROES.fanscholar.trait.mods.skillDmg).toBeGreaterThan(0);
    expect(HEROES.twinblade.trait.mods.perfectDash).toBeGreaterThan(0);
  });
});

describe('trial rift pacing', () => {
  it('guardian floors are never smaller than their neighbours and total pressure never dips', () => {
    const rng = createRng(4);
    for (let f = 4; f <= 60; f++) {
      const p = planFloor(f, rng), prev = planFloor(f - 1, rng);
      expect(p.enemies.length).toBeGreaterThanOrEqual(prev.enemies.length);
    }
  });
  it('rift kills pay a reduced share of XP but the same stones', () => {
    const a = fresh(), b = fresh();
    const full = registerKill(a, 'wolf', () => 0.5, { zone: 'bamboo' });
    const part = registerKill(b, 'wolf', () => 0.5, { zone: 'bamboo', xpMult: TOWER_XP });
    expect(part.xp).toBe(Math.round(full.xp * TOWER_XP)); expect(part.stones).toBe(full.stones); expect(TOWER_XP).toBeLessThan(0.5);
  });
});
