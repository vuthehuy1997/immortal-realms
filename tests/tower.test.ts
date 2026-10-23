import { describe, expect, it } from 'vitest';
import { BANDS, BREAK_SECONDS, floorReward, GUARDIAN_EVERY, isGuardian, newRun, planFloor, START_SECONDS, updateTower, validTowerBest, zoneOfFloor, floorHp } from '../src/core/tower';
import { createRng } from '../src/core/rng';
import { ENEMIES } from '../src/data/enemies';
import { ZONES } from '../src/data/zones';
import { HEROES, HERO_IDS } from '../src/data/heroes';
import { getDialogue } from '../src/core/dialogue';
import { newGameState, statsOf, boonMods } from '../src/core/gameState';
import { newInventory } from '../src/core/inventory';
import { newQuestLog } from '../src/core/quest';
import { NPCS } from '../src/data/quests';
import { parseSave, serialize, checksum } from '../src/core/save';

describe('trial rift floors', () => {
  it('every floor plan uses real enemies of its band, within count limits', () => {
    const rng = createRng(5);
    for (let f = 1; f <= 60; f++) {
      const p = planFloor(f, rng);
      expect(p.enemies.length).toBeGreaterThanOrEqual(3); expect(p.enemies.length).toBeLessThanOrEqual(10);
      for (const e of p.enemies) expect(ENEMIES[e.type]).toBeDefined();
      expect(ZONES[p.zone]).toBeDefined();
      expect(p.guardian).toBe(f % GUARDIAN_EVERY === 0);
    }
  });
  it('guardian floors lead with an elite and are tougher; difficulty climbs with depth', () => {
    const rng = createRng(1);
    const g = planFloor(10, rng); expect(g.enemies[0]!.elite).toBe(true); expect(g.hpMult).toBeGreaterThan(planFloor(9, rng).hpMult);
    expect(floorHp(30)).toBeGreaterThan(floorHp(10));
    expect(zoneOfFloor(1)).toBe('bamboo'); expect(zoneOfFloor(BANDS.at(-1)!.from + 50)).toBe(BANDS.at(-1)!.zone);
    expect(isGuardian(5)).toBe(true); expect(isGuardian(6)).toBe(false);
  });
  it('plans are deterministic for a seed', () => { expect(planFloor(12, createRng(9))).toEqual(planFloor(12, createRng(9))); });
});

describe('rewards pay only for new depth', () => {
  it('a floor beyond the record pays stones; replays pay nothing', () => {
    expect(floorReward(3, 2).stones).toBeGreaterThan(0); expect(floorReward(3, 2).record).toBe(true);
    expect(floorReward(3, 3)).toEqual({ stones: 0, items: [], boonPick: false, record: false });
    expect(floorReward(2, 9).stones).toBe(0);
  });
  it('milestones: guardians pay extra, floor 10 gives a Foundation Pill and a boon pick', () => {
    expect(floorReward(5, 4).stones).toBeGreaterThan(floorReward(4, 3).stones + 50);
    const r = floorReward(10, 9); expect(r.items.map((i) => i.id)).toContain('foundation-pill'); expect(r.boonPick).toBe(true);
    expect(floorReward(7, 6).boonPick).toBe(false);
  });
});

describe('run state machine', () => {
  it('breaks, spawns, waits for the floor to be cleared, then rewards and descends', () => {
    const run = newRun(), rng = createRng(3);
    expect(updateTower(run, 0, 0, START_SECONDS - 0.1, rng)).toEqual([]);
    const ev = updateTower(run, 0, 0, 0.2, rng);
    expect(ev).toHaveLength(1); expect(ev[0]!.type).toBe('spawn'); expect(run.phase).toBe('fight');
    expect(updateTower(run, 0, 3, 1, rng)).toEqual([]); // foes alive: nothing happens
    const clear = updateTower(run, 0, 0, 0.05, rng);
    expect(clear[0]).toMatchObject({ type: 'clear', floor: 1 }); expect(run.floor).toBe(2); expect(run.phase).toBe('break');
    expect(updateTower(run, 1, 0, BREAK_SECONDS - 0.1, rng)).toEqual([]);
    expect(updateTower(run, 1, 0, 0.2, rng)[0]!.type).toBe('spawn');
  });
  it('validates the saved record', () => { expect(validTowerBest(0)).toBe(true); expect(validTowerBest(-1)).toBe(false); expect(validTowerBest(1.5)).toBe(false); expect(validTowerBest('3')).toBe(false); });
});

describe('keepers and dialogue', () => {
  it('both keepers offer to enter or leave the rift', () => {
    for (const id of ['keeper-ming', 'keeper-ren']) {
      expect(NPCS[id]!.trade).toBe('tower');
      const a = getDialogue(id, newQuestLog(), newInventory(), [], { best: 7, active: false });
      expect(a.text).toContain('7'); expect(a.options[0]!.action).toEqual({ type: 'tower', start: true });
      expect(getDialogue(id, newQuestLog(), newInventory(), [], { best: 7, active: true }).options[0]!.action).toEqual({ type: 'tower', start: false });
    }
  });
});

describe('save', () => {
  it('stores the record and migrates old saves to 0', () => {
    const gs = newGameState('Lin', 'flame', 'swordsman', { x: 1, y: 1 }); gs.towerBest = 12;
    const r = parseSave(serialize(gs)); expect(r.ok && r.state.towerBest).toBe(12);
    const env = JSON.parse(serialize(gs)) as { state: Record<string, unknown>; checksum: string };
    delete env.state.towerBest; env.checksum = checksum(JSON.stringify(env.state));
    const o = parseSave(JSON.stringify(env)); expect(o.ok && o.state.towerBest).toBe(0);
    gs.towerBest = -3; expect(parseSave(serialize(gs)).ok).toBe(false);
  });
});

describe('hero signature traits', () => {
  it('every hero has a named trait with at least one effect, and heroes play differently', () => {
    const sigs = new Set<string>();
    for (const id of HERO_IDS) { const t = HEROES[id].trait; expect(t.name.length).toBeGreaterThan(3); expect(Object.keys(t.mods).length).toBeGreaterThan(0); sigs.add(JSON.stringify(t.mods)); }
    expect(sigs.size).toBe(HERO_IDS.length);
  });
  it('traits change the derived stats and boon mods of that hero only', () => {
    const mk = (h: 'monk' | 'saber') => newGameState('A', 'flame', h, { x: 1, y: 1 });
    const monk = mk('monk'), saber = mk('saber');
    expect(statsOf(monk).maxHp).toBeGreaterThan(statsOf(saber).maxHp);
    expect(statsOf(saber).atk).toBeGreaterThan(statsOf(monk).atk);
    expect(boonMods(saber).lifesteal).toBeGreaterThan(0); expect(boonMods(monk).lifesteal).toBe(0);
  });
});
