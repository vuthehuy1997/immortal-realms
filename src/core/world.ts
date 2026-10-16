import { createRng } from './rng';
import type { Vec2 } from './movement';

export const TILE_SIZE = 16;

export type GroundKind = 'grass' | 'grassFlowerA' | 'grassFlowerB' | 'path';
export type DecoKind = 'none' | 'treeGreen' | 'treeOrange' | 'bush';

export interface WorldMap {
  width: number;
  height: number;
  ground: GroundKind[];
  deco: DecoKind[];
  spawn: Vec2; // pixel coordinates
}

const BLOCKING: ReadonlySet<DecoKind> = new Set(['treeGreen', 'treeOrange', 'bush']);

export const idx = (m: Pick<WorldMap, 'width'>, tx: number, ty: number): number => ty * m.width + tx;

export function isBlockedTile(m: WorldMap, tx: number, ty: number): boolean {
  if (tx < 0 || ty < 0 || tx >= m.width || ty >= m.height) return true;
  return BLOCKING.has(m.deco[idx(m, tx, ty)] ?? 'none');
}

/** Deterministic small overworld: tree border, central crossroads path, scattered trees/bushes. */
export function generateWorld(seed: number, width = 64, height = 64): WorldMap {
  const rng = createRng(seed);
  const ground: GroundKind[] = [];
  const deco: DecoKind[] = [];
  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);
  for (let ty = 0; ty < height; ty++) {
    for (let tx = 0; tx < width; tx++) {
      const onPath = Math.abs(tx - cx) <= 1 || Math.abs(ty - cy) <= 1;
      const r = rng();
      let g: GroundKind = onPath ? 'path' : 'grass';
      if (!onPath) g = r < 0.04 ? 'grassFlowerA' : r < 0.08 ? 'grassFlowerB' : 'grass';
      ground.push(g);

      const border = tx < 2 || ty < 2 || tx >= width - 2 || ty >= height - 2;
      const nearSpawn = Math.hypot(tx - cx, ty - cy) < 5;
      const d = rng();
      let k: DecoKind = 'none';
      if (border) k = d < 0.5 ? 'treeGreen' : 'treeOrange';
      else if (!onPath && !nearSpawn) k = d < 0.08 ? 'treeGreen' : d < 0.12 ? 'treeOrange' : d < 0.17 ? 'bush' : 'none';
      deco.push(k);
    }
  }
  return { width, height, ground, deco, spawn: { x: (cx + 0.5) * TILE_SIZE, y: (cy + 0.5) * TILE_SIZE } };
}

function boxBlocked(m: WorldMap, x: number, y: number, r: number): boolean {
  const x0 = Math.floor((x - r) / TILE_SIZE);
  const x1 = Math.floor((x + r) / TILE_SIZE);
  const y0 = Math.floor((y - r) / TILE_SIZE);
  const y1 = Math.floor((y + r) / TILE_SIZE);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (isBlockedTile(m, tx, ty)) return true;
  return false;
}

/** Axis-separated move so the entity slides along walls. `r` is the half-size of its collision box in px. */
export function moveWithCollision(m: WorldMap, from: Vec2, to: Vec2, r: number): Vec2 {
  let { x, y } = from;
  if (!boxBlocked(m, to.x, y, r)) x = to.x;
  if (!boxBlocked(m, x, to.y, r)) y = to.y;
  return { x, y };
}
