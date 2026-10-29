import { describe, expect, it } from 'vitest';
import { ambushLiveCap, emptyLayout, tickFeatures, exportSeal, isStranded, newRuntime, restoreSeal, validSealSave } from '../src/core/dungeonFeatures';
import { newGameState } from '../src/core/gameState';
import { checksum, parseSave, serialize } from '../src/core/save';
import { generateChapter, generateDungeonMap, standsOnLand, TILE_SIZE } from '../src/core/world';
import { PROPS } from '../src/data/props';
import { DUNGEON_IDS, DUNGEONS } from '../src/data/dungeons';

const gated = DUNGEON_IDS.filter((id) => generateDungeonMap(id).features?.gate);
const grid = (w: ReturnType<typeof generateDungeonMap>) => ({ w: w.width, h: w.height, blocked: w.blocked });

describe('R23 F1: seal state survives save + reload and never strands the hero', () => {
  it('there are gated dungeons to test', () => { expect(gated.length).toBeGreaterThan(5); });
  it.each(gated)('%s: the hero is only stranded behind a CLOSED gate, never once it is open', (id) => {
    const w = generateDungeonMap(id), l = w.features!;
    expect(isStranded(grid(w), w.spawn, w.spawn)).toBe(false);
    const boss = Object.values(w.bossHomes)[0]!;
    expect(isStranded(grid(w), w.spawn, boss), 'boss arena is behind the closed seal').toBe(true);
    for (const i of l.gate!.tiles) w.blocked[i] = 0;
    expect(isStranded(grid(w), w.spawn, boss), 'open gate: reachable').toBe(false);
  });
  it.each(gated)('%s: restoring a saved solved seal reopens the gate state and the plates', (id) => {
    const w = generateDungeonMap(id), l = w.features!, rt = newRuntime(l);
    rt.gateOpen = true; rt.platesOn.fill(true); rt.cacheTaken.fill(true);
    const seal = exportSeal(id, rt), fresh = newRuntime(l);
    expect(restoreSeal(fresh, l, JSON.parse(JSON.stringify(seal)))).toBe(true);
    expect(fresh.gateOpen).toBe(true);
    if (l.gate!.by === 'plates') expect(fresh.platesOn.every(Boolean)).toBe(true); else expect(fresh.brazierLeft.every((x) => x > 0)).toBe(true);
    expect(fresh.cacheTaken).toEqual(l.patches.map(() => true));
  });
  it('a seal that does not fit the layout is refused and changes nothing', () => {
    const id = gated[0]!, l = generateDungeonMap(id).features!, rt = newRuntime(l);
    expect(restoreSeal(rt, l, { id, gate: true, plates: [true, true, true, true, true, true, true, true, true], cache: [], ambushDone: false })).toBe(false);
    expect(rt.gateOpen).toBe(false);
  });
  it('save roundtrip keeps the seal; old saves without one load as null; tampered seals are rejected', () => {
    const id = gated[0]!, d = DUNGEONS[id]!, l = generateDungeonMap(id).features!;
    const gs = newGameState('Tester', 'tide', 'monk', { x: 100, y: 120 });
    gs.chapter = d.chapter; gs.dungeon = id;
    const rt = newRuntime(l); rt.gateOpen = true; rt.platesOn.fill(true);
    gs.seal = exportSeal(id, rt);
    const back = parseSave(serialize(gs)); expect(back.ok).toBe(true);
    if (back.ok) expect(back.state.seal).toEqual(gs.seal);
    const env = JSON.parse(serialize(gs)) as { checksum: string; state: Record<string, unknown> };
    delete env.state.seal; env.checksum = checksum(JSON.stringify(env.state));
    const old = parseSave(JSON.stringify(env)); expect(old.ok).toBe(true);
    if (old.ok) expect(old.state.seal ?? null).toBeNull(); // absent = no seal state: the stranding guard covers old saves
    for (const bad of [{ ...gs.seal, id: 'other' }, { ...gs.seal, gate: 'yes' }, { ...gs.seal, plates: Array(99).fill(true) }, { ...gs.seal, cache: [1] }, 7]) {
      const e2 = JSON.parse(serialize(gs)) as { checksum: string; state: Record<string, unknown> };
      e2.state.seal = bad; e2.checksum = checksum(JSON.stringify(e2.state));
      expect(parseSave(JSON.stringify(e2)).ok, JSON.stringify(bad)).toBe(false);
    }
    expect(validSealSave(gs.seal, null), 'a seal on the open map is invalid').toBe(false);
    void TILE_SIZE;
  });
});

describe('R23 F6: no scenery on void, water or lava, in any chapter or dungeon', () => {
  const maps = [1, 2, 3, 4, 5].map((c) => [`chapter ${c}`, () => generateChapter(c)] as const).concat(DUNGEON_IDS.map((id) => [id, () => generateDungeonMap(id)] as const));
  it.each(maps)('%s', (_n, make) => {
    const m = make(), bad = m.props.filter((p) => !standsOnLand(m, p));
    expect(bad.slice(0, 5)).toEqual([]);
    for (const p of m.props) {
      if (PROPS[p.kind].float || p.kind === 'lotuspond') continue;
      const tx = Math.floor(p.x / TILE_SIZE), ty = Math.floor((p.y - 1) / TILE_SIZE);
      expect(['water', 'lava', 'void']).not.toContain(m.ground[ty * m.width + tx]);
    }
    expect(m.herbs.every((h) => !['water', 'lava', 'void'].includes(m.ground[Math.floor((h.y - 1) / TILE_SIZE) * m.width + Math.floor(h.x / TILE_SIZE)]!))).toBe(true);
  });
});

describe('R23 F9: ambush waves cannot stack without bound', () => {
  const l = { ...emptyLayout(), ambush: { at: { x: 0, y: 0 }, radius: 48, runes: [{ x: 10, y: 0 }], waves: 5, per: 6, gap: 8, xp: 0, stones: 0 } };
  it('with every foe still alive the timer never starts a second wave; live foes stay within one wave', () => {
    const rt = newRuntime(l); let spawned = 0, alive = 0, peak = 0;
    for (let t = 0; t < 120; t += 0.05) for (const e of tickFeatures(rt, l, { x: 0, y: 0 }, 0.05, alive)) if (e.type === 'ambushWave') { spawned += e.count; alive += e.count; peak = Math.max(peak, alive); }
    expect(rt.ambush.wave).toBe(1); expect(peak).toBe(6); expect(rt.ambush.state).toBe('running');
  });
  it('a hero who keeps killing gets the waves on the timer; the live count never exceeds the cap plus one wave', () => {
    const rt = newRuntime(l); let alive = 0, peak = 0, cleared = 0;
    for (let t = 0; t < 200; t += 0.05) {
      for (const e of tickFeatures(rt, l, { x: 0, y: 0 }, 0.05, alive)) if (e.type === 'ambushWave') { alive += e.count; peak = Math.max(peak, alive); }
      if (Math.floor(t * 20) % 40 === 0 && alive > 0) { alive--; cleared++; } // one kill every 2 s
    }
    expect(peak).toBeLessThanOrEqual(ambushLiveCap(6) + 6);
    expect(rt.ambush.wave).toBe(5); expect(cleared).toBeGreaterThan(0);
  });
});

describe('R23 F8: no NPC stands in a boss arena', () => {
  // quest guides placed beside the optional mini-boss their quest is about (kept deliberately): outside its 8-10 tile arena ring, never in it
  const NEAR_BY_DESIGN = new Set(['scholar-mei', 'scholar-eun', 'seer-lian']);
  it.each([1, 2, 3, 4, 5])('chapter %i: every NPC is at least 20 tiles from every boss home', (c) => {
    const m = generateChapter(c);
    for (const [npc, p] of Object.entries(m.npcs)) for (const [boss, h] of Object.entries(m.bossHomes)) {
      expect(Math.hypot(p.x - h.x, p.y - h.y) / TILE_SIZE, `${npc} vs ${boss}`).toBeGreaterThanOrEqual(NEAR_BY_DESIGN.has(npc) ? 11 : 20);
    }
  });
});
