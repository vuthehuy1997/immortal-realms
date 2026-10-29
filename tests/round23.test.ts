import { describe, expect, it } from 'vitest';
import { exportSeal, isStranded, newRuntime, restoreSeal, validSealSave } from '../src/core/dungeonFeatures';
import { newGameState } from '../src/core/gameState';
import { checksum, parseSave, serialize } from '../src/core/save';
import { generateDungeonMap, TILE_SIZE } from '../src/core/world';
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
