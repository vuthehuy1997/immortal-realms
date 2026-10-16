import { describe, expect, it } from 'vitest';
import { generateWorld, isBlockedTile, moveWithCollision, TILE_SIZE, type WorldMap } from '../src/core/world';
import { step } from '../src/core/movement';
import { createRng } from '../src/core/rng';

const open = (w = 8, h = 8): WorldMap => ({
  width: w, height: h,
  ground: Array(w * h).fill('grass'),
  deco: Array(w * h).fill('none'),
  spawn: { x: 40, y: 40 },
  lair: { x: 100, y: 100 },
});

describe('rng', () => {
  it('is deterministic per seed and differs across seeds', () => {
    const a = createRng(1), b = createRng(1), c = createRng(2);
    const sa = [a(), a(), a()], sb = [b(), b(), b()];
    expect(sa).toEqual(sb);
    expect(sa).not.toEqual([c(), c(), c()]);
    expect(sa.every((v) => v >= 0 && v < 1)).toBe(true);
  });
});

describe('generateWorld', () => {
  it('is deterministic', () => {
    expect(generateWorld(42)).toEqual(generateWorld(42));
  });
  it('spawn is not blocked and border is blocked', () => {
    const m = generateWorld(7);
    expect(isBlockedTile(m, Math.floor(m.spawn.x / TILE_SIZE), Math.floor(m.spawn.y / TILE_SIZE))).toBe(false);
    for (let i = 0; i < m.width; i++) expect(isBlockedTile(m, i, 0)).toBe(true);
    expect(isBlockedTile(m, -1, 5)).toBe(true);
  });
  it('spawn can reach the open area around it (no enclosed spawn)', () => {
    const m = generateWorld(7);
    let p = { ...m.spawn };
    for (let i = 0; i < 60; i++) p = moveWithCollision(m, p, step(p, { x: 1, y: 0 }, 60, 1 / 60), 5);
    expect(p.x).toBeGreaterThan(m.spawn.x + 20);
  });
});

describe('lair', () => {
  const reachable = (m: WorldMap, from: { x: number; y: number }) => {
    const seen = new Set<number>(); const q: [number, number][] = [[Math.floor(from.x / TILE_SIZE), Math.floor(from.y / TILE_SIZE)]];
    while (q.length) {
      const [x, y] = q.pop()!; const k = y * m.width + x;
      if (seen.has(k) || isBlockedTile(m, x, y)) continue;
      seen.add(k); q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    return seen;
  };
  it('arena centre is open and walkable from the spawn (several seeds)', () => {
    for (const seed of [1, 7, 42, 20261016, 99999]) {
      const m = generateWorld(seed);
      const seen = reachable(m, m.spawn);
      expect(seen.has(Math.floor(m.lair.y / TILE_SIZE) * m.width + Math.floor(m.lair.x / TILE_SIZE))).toBe(true);
    }
  });
  it('is cleared of obstacles', () => {
    const m = generateWorld(7);
    for (let a = 0; a < 12; a++) {
      const x = m.lair.x + Math.cos(a) * 5 * TILE_SIZE, y = m.lair.y + Math.sin(a) * 5 * TILE_SIZE;
      expect(isBlockedTile(m, Math.floor(x / TILE_SIZE), Math.floor(y / TILE_SIZE))).toBe(false);
    }
  });
});

describe('moveWithCollision', () => {
  it('moves freely in open space', () => {
    expect(moveWithCollision(open(), { x: 40, y: 40 }, { x: 45, y: 42 }, 5)).toEqual({ x: 45, y: 42 });
  });
  it('is stopped by a blocking tile', () => {
    const m = open();
    m.deco[2 * m.width + 4] = 'treeGreen'; // tile (4,2) => x 64..80, y 32..48
    const p = moveWithCollision(m, { x: 56, y: 40 }, { x: 62, y: 40 }, 5);
    expect(p.x).toBe(56);
  });
  it('slides along a wall on the free axis', () => {
    const m = open();
    m.deco[2 * m.width + 4] = 'bush';
    const p = moveWithCollision(m, { x: 56, y: 40 }, { x: 62, y: 44 }, 5);
    expect(p).toEqual({ x: 56, y: 44 });
  });
  it('cannot leave the map', () => {
    const p = moveWithCollision(open(), { x: 8, y: 40 }, { x: -3, y: 40 }, 5);
    expect(p.x).toBe(8);
  });
});
