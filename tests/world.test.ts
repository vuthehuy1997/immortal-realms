import { describe, expect, it } from 'vitest';
import { generateChapter, isBlockedTile, moveWithCollision, TILE_SIZE, tileToWorld, zoneAt, type WorldMap } from '../src/core/world';
import { step } from '../src/core/movement';
import { createRng } from '../src/core/rng';
import { createNoise, fbm } from '../src/core/noise';
import { ZONES, zonesOfChapter } from '../src/data/zones';

const ZONE_IDS = zonesOfChapter(1);
/** chapter 1's map is fixed (its seed lives in the map def), so the old per-seed variants all build the same world */
const generateWorld = (): WorldMap => generateChapter(1);

const open = (w = 8, h = 8): WorldMap => ({
  chapter: 1, bossHomes: {}, portal: { x: 0, y: 0 }, entrances: {}, width: w, height: h,
  ground: Array(w * h).fill('grass'), zone: Array(w * h).fill('village'), blocked: new Uint8Array(w * h), props: [],
  spawn: { x: 40, y: 40 }, lair: { x: 100, y: 100 }, den: { x: 60, y: 60 }, pool: { x: 70, y: 70 }, anchors: {} as WorldMap['anchors'], npcs: {}, herbs: [], arrayPos: { x: 0, y: 0 },
});
const block = (m: WorldMap, tx: number, ty: number) => { m.blocked[ty * m.width + tx] = 1; };

const reachable = (m: WorldMap, from: { x: number; y: number }) => {
  const seen = new Set<number>(); const q: [number, number][] = [[Math.floor(from.x / TILE_SIZE), Math.floor(from.y / TILE_SIZE)]];
  while (q.length) {
    const [x, y] = q.pop()!; const k = y * m.width + x;
    if (seen.has(k) || isBlockedTile(m, x, y)) continue;
    seen.add(k); q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  return (p: { x: number; y: number }) => seen.has(Math.floor(p.y / TILE_SIZE) * m.width + Math.floor(p.x / TILE_SIZE));
};

describe('rng & noise', () => {
  it('rng is deterministic per seed and differs across seeds', () => {
    const a = createRng(1), b = createRng(1), c = createRng(2);
    const sa = [a(), a(), a()], sb = [b(), b(), b()];
    expect(sa).toEqual(sb); expect(sa).not.toEqual([c(), c(), c()]);
    expect(sa.every((v) => v >= 0 && v < 1)).toBe(true);
  });
  it('noise is deterministic, in range and smooth', () => {
    const n1 = createNoise(5), n2 = createNoise(5);
    expect(n1(3.3, 4.4)).toBe(n2(3.3, 4.4));
    for (let i = 0; i < 100; i++) { const v = fbm(n1, i * 0.37, i * 0.21); expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(1); }
    expect(Math.abs(n1(10, 10) - n1(10.01, 10))).toBeLessThan(0.05);
  });
});

describe('chapter 1 map', () => {
  const SEEDS = [1, 7, 42, 20261016, 99999];
  it('is deterministic', () => { expect(generateWorld()).toEqual(generateWorld()); });
  it('has an impassable border and an open spawn', () => {
    const m = generateWorld();
    expect(isBlockedTile(m, Math.floor(m.spawn.x / TILE_SIZE), Math.floor(m.spawn.y / TILE_SIZE))).toBe(false);
    for (let i = 0; i < m.width; i++) { expect(isBlockedTile(m, i, 0)).toBe(true); expect(isBlockedTile(m, i, m.height - 1)).toBe(true); }
    expect(isBlockedTile(m, -1, 5)).toBe(true);
  });
  it('contains every zone of the chapter and the spawn is in the village', () => {
    const m = generateWorld();
    expect(new Set(m.zone)).toEqual(new Set(ZONE_IDS));
    expect(zoneAt(m, m.spawn)).toBe('village');
    for (const z of ZONE_IDS) expect(zoneAt(m, tileToWorld(ZONES[z]!.anchor))).toBe(z);
  });
  it('everything the player needs is reachable from the spawn (several seeds)', () => {
    for (const seed of SEEDS) {
      const m = generateWorld(); const ok = reachable(m, m.spawn);
      for (const z of ZONE_IDS) expect(ok(m.anchors[z]!), `${seed}: ${z}`).toBe(true);
      for (const [name, p] of Object.entries(m.npcs)) expect(ok(p), `${seed}: npc ${name}`).toBe(true);
      expect(ok(m.arrayPos)).toBe(true);
      expect(ok(m.den), `${seed}: fox den`).toBe(true);
      expect(ok(m.pool), `${seed}: dragon pool`).toBe(true);
      expect(ok(m.lair), `${seed}: boss court`).toBe(true);
      for (const h of m.herbs) expect(ok({ x: h.x, y: h.y - 4 }), `${seed}: herb`).toBe(true);
    }
  });
  it('is varied scenery: many props, herbs in several zones, water in the marsh', () => {
    const m = generateWorld();
    expect(m.props.length).toBeGreaterThan(150);
    expect(new Set(m.props.map((p) => p.kind)).size).toBeGreaterThan(15);
    expect(m.herbs.length).toBeGreaterThanOrEqual(15);
    expect(m.ground.filter((g) => g === 'water').length).toBeGreaterThan(40);
    expect(m.props.some((p) => p.kind === 'palace') && m.props.some((p) => p.kind === 'pagoda7')).toBe(true);
  });
  it('solid props block movement; the boss gate leaves a walkable gap', () => {
    const m = generateWorld();
    const pal = m.props.find((p) => p.kind === 'palace')!;
    expect(isBlockedTile(m, Math.floor(pal.x / TILE_SIZE), Math.floor((pal.y - 6) / TILE_SIZE))).toBe(true);
    const gate = m.props.find((p) => p.kind === 'goldgate')!;
    expect(isBlockedTile(m, Math.floor(gate.x / TILE_SIZE), Math.floor((gate.y - 4) / TILE_SIZE))).toBe(false);
  });
  it('NPCs stand on open ground and roads link the village to every zone', () => {
    const m = generateWorld();
    for (const p of Object.values(m.npcs)) expect(isBlockedTile(m, Math.floor(p.x / TILE_SIZE), Math.floor(p.y / TILE_SIZE))).toBe(false);
    expect(m.ground.filter((g) => g === 'path').length).toBeGreaterThan(200);
  });
});

describe('moveWithCollision', () => {
  it('moves freely in open space', () => { expect(moveWithCollision(open(), { x: 40, y: 40 }, { x: 45, y: 42 }, 5)).toEqual({ x: 45, y: 42 }); });
  it('is stopped by a blocking tile', () => {
    const m = open(); block(m, 4, 2); // x 64..80, y 32..48
    expect(moveWithCollision(m, { x: 56, y: 40 }, { x: 62, y: 40 }, 5).x).toBe(56);
  });
  it('slides along a wall on the free axis', () => {
    const m = open(); block(m, 4, 2);
    expect(moveWithCollision(m, { x: 56, y: 40 }, { x: 62, y: 44 }, 5)).toEqual({ x: 56, y: 44 });
  });
  it('cannot leave the map', () => { expect(moveWithCollision(open(), { x: 8, y: 40 }, { x: -3, y: 40 }, 5).x).toBe(8); });
  it('walking east from the spawn eventually hits something, never leaves the map', () => {
    const m = generateWorld(); let p = { ...m.spawn };
    for (let i = 0; i < 1200; i++) p = moveWithCollision(m, p, step(p, { x: 1, y: 0 }, 70, 1 / 60), 5);
    expect(p.x).toBeGreaterThan(m.spawn.x); expect(p.x).toBeLessThan(m.width * TILE_SIZE);
  });
});
