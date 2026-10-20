import { PROPS, type PropKind } from '../data/props';
import { ZONES, ZONE_IDS, type ZoneId } from '../data/zones';
import { createNoise, fbm } from './noise';
import type { Vec2 } from './movement';
import { createRng } from './rng';

export const TILE_SIZE = 16;
export type { ZoneId };

export type GroundKind = 'grass' | 'grassDark' | 'moss' | 'path' | 'stone' | 'water' | 'sand';

export interface PropInst { kind: PropKind; x: number; y: number }

export interface WorldMap {
  width: number;
  height: number;
  ground: GroundKind[];
  zone: ZoneId[];
  /** 1 = impassable tile (border, water, prop footprints) */
  blocked: Uint8Array;
  props: PropInst[];
  spawn: Vec2; // world units
  lair: Vec2;
  /** Nine-Tailed Fox den (in the peach grove) */
  den: Vec2;
  /** Jiao Dragon pool (in Mistveil Marsh) */
  pool: Vec2;
  anchors: Record<ZoneId, Vec2>;
  npcs: Record<string, Vec2>;
  herbs: Vec2[];
  arrayPos: Vec2;
}

export const idx = (m: Pick<WorldMap, 'width'>, tx: number, ty: number): number => ty * m.width + tx;

export function isBlockedTile(m: WorldMap, tx: number, ty: number): boolean {
  if (tx < 0 || ty < 0 || tx >= m.width || ty >= m.height) return true;
  return m.blocked[idx(m, tx, ty)] === 1;
}

export const tileToWorld = (t: { x: number; y: number }): Vec2 => ({ x: (t.x + 0.5) * TILE_SIZE, y: (t.y + 0.5) * TILE_SIZE });

const BORDER = 3;
const LAIR_RADIUS = 9;
const DEN_TILE = { x: 21, y: 15 };
const DEN_RADIUS = 7;
const POOL_TILE = { x: 54, y: 68 };
const POOL_RADIUS = 7;

/** Polyline of tile waypoints joining the village to a zone anchor (shape chosen so roads avoid the sect hall and gates). */
const ROADS: Record<Exclude<ZoneId, 'village'>, [number, number][]> = {
  bamboo: [[40, 42], [27, 42], [13, 42]],
  marsh: [[40, 42], [40, 56], [40, 68], [54, 68]],
  ruins: [[40, 42], [54, 45], [68, 48]],
  grove: [[40, 42], [32, 37], [30, 26], [30, 14], [21, 15]],
  lair: [[40, 42], [52, 38], [54, 24], [58, 13], [66, 13]],
};

/** Deterministic open world: six zones joined by roads, with collidable xianxia scenery. */
export function generateWorld(seed: number, width = 80, height = 80): WorldMap {
  const rng = createRng(seed);
  const noise = createNoise(seed ^ 0x9e3779b9);
  const n = (x: number, y: number, s = 0.12) => fbm(noise, x * s, y * s, 4);
  const N = width * height;
  const ground: GroundKind[] = new Array<GroundKind>(N).fill('grass');
  const zone: ZoneId[] = new Array<ZoneId>(N).fill('village');
  const blocked = new Uint8Array(N);
  const reserved = new Uint8Array(N); // roads/plaza: kept free of props and water
  const occ = new Uint8Array(N); // prop footprints (+margin) to avoid overlaps
  const props: PropInst[] = [];
  const at = (tx: number, ty: number) => ty * width + tx;
  const inMap = (tx: number, ty: number) => tx >= 0 && ty >= 0 && tx < width && ty < height;

  const anchors = Object.fromEntries(ZONE_IDS.map((z) => [z, tileToWorld(ZONES[z].anchor)])) as Record<ZoneId, Vec2>;
  const village = ZONES.village.anchor;

  // --- zones: village disc, otherwise nearest anchor with noisy borders
  for (let ty = 0; ty < height; ty++) {
    for (let tx = 0; tx < width; tx++) {
      const jitter = (n(tx + 50, ty + 50, 0.09) - 0.5) * 9;
      if (Math.hypot(tx - village.x, ty - village.y) < 13 + jitter * 0.3) { zone[at(tx, ty)] = 'village'; continue; }
      let best: ZoneId = 'bamboo', bd = Infinity;
      for (const z of ZONE_IDS) {
        if (z === 'village') continue;
        const a = ZONES[z].anchor;
        const d = Math.hypot(tx - a.x, ty - a.y) * (z === 'lair' ? 1.15 : 1) + jitter;
        if (d < bd) { bd = d; best = z; }
      }
      zone[at(tx, ty)] = best;
    }
  }

  // --- roads (reserved corridors, 3 tiles wide)
  const stamp = (x: number, y: number, r: number, f: (tx: number, ty: number) => void) => {
    for (let ty = Math.floor(y - r); ty <= Math.ceil(y + r); ty++) for (let tx = Math.floor(x - r); tx <= Math.ceil(x + r); tx++) {
      if (inMap(tx, ty) && Math.hypot(tx - x, ty - y) <= r) f(tx, ty);
    }
  };
  const roadTiles = new Set<number>();
  for (const pts of Object.values(ROADS)) {
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i]!, [x1, y1] = pts[i + 1]!;
      const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2);
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const wob = Math.sin(t * Math.PI * 3 + i) * 0.5;
        stamp(x0 + (x1 - x0) * t + wob * 0.4, y0 + (y1 - y0) * t + wob * 0.4, 1.6, (tx, ty) => roadTiles.add(at(tx, ty)));
      }
    }
  }
  stamp(village.x, village.y, 8.5, (tx, ty) => { reserved[at(tx, ty)] = 1; });
  for (const t of roadTiles) { reserved[t] = 1; }
  // wide reserved halo around roads so props never hug them
  const halo = new Uint8Array(N);
  for (const t of roadTiles) { const x = t % width, y = Math.floor(t / width); stamp(x, y, 2.2, (tx, ty) => { halo[at(tx, ty)] = 1; }); }

  // --- ground per zone
  const lair = ZONES.lair.anchor;
  for (let ty = 0; ty < height; ty++) {
    for (let tx = 0; tx < width; tx++) {
      const i = at(tx, ty), z = zone[i]!, v = n(tx, ty, 0.16), w = n(tx + 200, ty + 200, 0.1);
      let g: GroundKind;
      if (z === 'village') g = Math.hypot(tx - village.x, ty - village.y) < 7 ? 'stone' : v > 0.62 ? 'grassDark' : 'grass';
      else if (z === 'bamboo') g = v > 0.64 ? 'moss' : 'grassDark';
      else if (z === 'marsh') g = w > 0.62 ? 'water' : v > 0.55 ? 'moss' : 'grass';
      else if (z === 'grove') g = v > 0.7 ? 'grassDark' : 'grass';
      else if (z === 'ruins') g = v > 0.66 ? 'stone' : w > 0.62 ? 'sand' : v > 0.4 ? 'grass' : 'grassDark';
      else g = Math.hypot(tx - lair.x, ty - lair.y) < LAIR_RADIUS ? 'stone' : 'grassDark';
      ground[i] = g;
    }
  }
  for (const t of roadTiles) {
    if (ground[t] === 'water') ground[t] = 'moss';
    if (ground[t] !== 'stone') ground[t] = 'path';
  }
  // fox den: a mossy clearing
  for (let ty = 0; ty < height; ty++) for (let tx = 0; tx < width; tx++) if (Math.hypot(tx - DEN_TILE.x, ty - DEN_TILE.y) < DEN_RADIUS && ground[at(tx, ty)] !== 'path') ground[at(tx, ty)] = 'moss';
  // dragon pool clearing: moss ground, the pool itself is drawn as a lotus pond prop
  for (let ty = 0; ty < height; ty++) for (let tx = 0; tx < width; tx++) if (Math.hypot(tx - POOL_TILE.x, ty - POOL_TILE.y) < POOL_RADIUS && ground[at(tx, ty)] !== 'path') ground[at(tx, ty)] = 'moss';
  // water must not sit on reserved/halo tiles
  for (let i = 0; i < N; i++) if (ground[i] === 'water' && (reserved[i] || halo[i])) ground[i] = 'moss';
  // sand shore around water
  for (let ty = 1; ty < height - 1; ty++) for (let tx = 1; tx < width - 1; tx++) {
    if (ground[at(tx, ty)] === 'water') continue;
    if (ground[at(tx + 1, ty)] === 'water' || ground[at(tx - 1, ty)] === 'water' || ground[at(tx, ty + 1)] === 'water' || ground[at(tx, ty - 1)] === 'water') {
      if (ground[at(tx, ty)] !== 'path' && ground[at(tx, ty)] !== 'stone') ground[at(tx, ty)] = 'sand';
    }
  }

  // --- blocked: border + water
  for (let ty = 0; ty < height; ty++) for (let tx = 0; tx < width; tx++) {
    if (tx < BORDER || ty < BORDER || tx >= width - BORDER || ty >= height - BORDER || ground[at(tx, ty)] === 'water') blocked[at(tx, ty)] = 1;
  }

  // --- props
  const rectsOf = (kind: PropKind, x: number, y: number) => PROPS[kind].blocks.map((r) => {
    const bx = x / TILE_SIZE, by = y / TILE_SIZE;
    return { x0: Math.floor(bx + r.dx), y0: Math.floor(by + r.dy), x1: Math.ceil(bx + r.dx + r.w) - 1, y1: Math.ceil(by + r.dy + r.h) - 1 };
  });
  /** Places a prop if its footprint is free; `force` skips the reserved/halo test (hand-placed village pieces). */
  const place = (kind: PropKind, tx: number, ty: number, opts: { force?: boolean; margin?: number } = {}): boolean => {
    const x = (tx + 0.5) * TILE_SIZE, y = (ty + 1) * TILE_SIZE - 1;
    const rects = rectsOf(kind, x, y);
    const m = opts.margin ?? 1;
    for (const r of rects) for (let yy = r.y0 - m; yy <= r.y1 + m; yy++) for (let xx = r.x0 - m; xx <= r.x1 + m; xx++) {
      if (!inMap(xx, yy)) return false;
      const i = at(xx, yy);
      if (blocked[i] || occ[i]) return false;
      if (!opts.force && (reserved[i] || halo[i]) && xx >= r.x0 && xx <= r.x1 && yy >= r.y0 && yy <= r.y1) return false;
    }
    if (!inMap(tx, ty) || (!opts.force && (reserved[at(tx, ty)] || halo[at(tx, ty)]))) return false;
    for (const r of rects) for (let yy = r.y0; yy <= r.y1; yy++) for (let xx = r.x0; xx <= r.x1; xx++) { blocked[at(xx, yy)] = 1; }
    for (const r of rects) for (let yy = r.y0 - m; yy <= r.y1 + m; yy++) for (let xx = r.x0 - m; xx <= r.x1 + m; xx++) { occ[at(xx, yy)] = 1; }
    props.push({ kind, x, y });
    return true;
  };

  const vx = village.x, vy = village.y;
  // sect village (hand-placed around the plaza; roads stay clear)
  place('palace', vx, vy - 9, { force: true });
  place('pagoda7', vx + 11, vy - 6, { force: true });
  place('pavilion', vx + 8, vy + 9, { force: true });
  place('pavilion', vx - 9, vy + 10, { force: true });
  place('tower', vx - 11, vy - 5, { force: true });
  place('goldpaifang', vx, vy + 14, { force: true, margin: 0 });
  place('dragonpillar', vx - 5, vy - 3, { force: true, margin: 0 });
  place('dragonpillar', vx + 5, vy - 3, { force: true, margin: 0 });
  place('lotusbowl', vx - 6, vy + 4, { force: true, margin: 0 });
  place('lotusbowl', vx + 6, vy + 4, { force: true, margin: 0 });
  place('peachtree', vx - 12, vy + 3, { force: true });
  place('peachtree', vx + 12, vy + 2, { force: true });
  place('stonecircle', vx + 13, vy + 12, { force: true });
  const arrayPos = { x: (vx + 0.5) * TILE_SIZE, y: (vy + 1.5) * TILE_SIZE };
  props.push({ kind: 'array', x: arrayPos.x, y: arrayPos.y });

  // zone scatter
  const scatter = (z: ZoneId, kind: PropKind, p: number, margin = 1) => {
    for (let ty = BORDER; ty < height - BORDER; ty++) for (let tx = BORDER; tx < width - BORDER; tx++) {
      if (zone[at(tx, ty)] === z && rng() < p) place(kind, tx, ty, { margin });
    }
  };
  scatter('bamboo', 'bamboo', 0.085, 0); scatter('bamboo', 'pine', 0.012); scatter('bamboo', 'taihurocks', 0.004); scatter('bamboo', 'orchid', 0.02, 0); scatter('bamboo', 'bambooshoot', 0.014, 0);
  scatter('marsh', 'willow', 0.03); scatter('marsh', 'rock', 0.012, 0); scatter('marsh', 'orchid', 0.02, 0);
  scatter('grove', 'peachtree', 0.035); scatter('grove', 'pine', 0.015); scatter('grove', 'orchid', 0.025, 0); scatter('grove', 'rock', 0.006, 0);
  scatter('ruins', 'rock', 0.02, 0); scatter('ruins', 'standstone', 0.014); scatter('ruins', 'taihurocks', 0.004); scatter('ruins', 'moonwall', 0.003); scatter('ruins', 'pine', 0.008);
  scatter('village', 'pine', 0.004); scatter('village', 'orchid', 0.02, 0);
  place('stonecircle', 62, 60, {}); place('tower', 73, 56, {}); place('floatisle', 60, 35, {}); place('floatisle', 74, 38, {});

  // marsh lotus ponds drawn over water
  for (let k = 0; k < 40; k++) {
    const tx = BORDER + Math.floor(rng() * (width - 2 * BORDER)), ty = BORDER + Math.floor(rng() * (height - 2 * BORDER));
    if (zone[at(tx, ty)] === 'marsh' && ground[at(tx, ty)] === 'water' && ground[at(tx + 1, ty)] === 'water' && ground[at(tx - 1, ty)] === 'water') props.push({ kind: 'lotuspond', x: (tx + 0.5) * TILE_SIZE, y: (ty + 1) * TILE_SIZE });
  }

  // boss court: ring of standing stones (west side open), gate at the entrance, throne behind
  const lw = tileToWorld(lair);
  for (let a = 0; a < 16; a++) {
    const ang = (a / 16) * Math.PI * 2;
    if (Math.cos(ang) < -0.7) continue; // entrance gap
    place('standstone', Math.round(lair.x + Math.cos(ang) * (LAIR_RADIUS + 0.5)), Math.round(lair.y + Math.sin(ang) * (LAIR_RADIUS - 0.5)), { force: true, margin: 0 });
  }
  place('goldgate', lair.x - LAIR_RADIUS - 3, lair.y + 1, { force: true, margin: 0 });
  place('lotusthrone', lair.x + 4, lair.y - 5, { force: true, margin: 0 });
  props.push({ kind: 'array', x: lw.x, y: lw.y + 8 });
  // fox den: ring of peach trees with an altar of stone in the middle
  const dw = tileToWorld(DEN_TILE);
  for (let a = 0; a < 12; a++) {
    const ang = (a / 12) * Math.PI * 2;
    if (Math.cos(ang) > 0.75) continue; // road side stays open
    place('peachtree', Math.round(DEN_TILE.x + Math.cos(ang) * (DEN_RADIUS - 0.5)), Math.round(DEN_TILE.y + Math.sin(ang) * (DEN_RADIUS - 1)), { force: true, margin: 0 });
  }
  props.push({ kind: 'array', x: dw.x, y: dw.y + 6 });
  // dragon pool: willows and standing stones around a misty clearing
  const pw = tileToWorld(POOL_TILE);
  for (let a = 0; a < 14; a++) {
    const ang = (a / 14) * Math.PI * 2;
    if (Math.cos(ang) < -0.75) continue; // road side stays open
    place(a % 3 === 0 ? 'standstone' : 'willow', Math.round(POOL_TILE.x + Math.cos(ang) * (POOL_RADIUS - 0.5)), Math.round(POOL_TILE.y + Math.sin(ang) * (POOL_RADIUS - 1)), { force: true, margin: 0 });
  }
  props.push({ kind: 'array', x: pw.x, y: pw.y + 6 });

  // herbs: spirit-herb gathering nodes (lingzhi)
  const herbs: Vec2[] = [];
  const herbZones: [ZoneId, number][] = [['bamboo', 7], ['marsh', 5], ['grove', 5], ['ruins', 3]];
  for (const [z, count] of herbZones) {
    for (let k = 0, tries = 0; k < count && tries < 4000; tries++) {
      const tx = BORDER + 2 + Math.floor(rng() * (width - 2 * BORDER - 4)), ty = BORDER + 2 + Math.floor(rng() * (height - 2 * BORDER - 4));
      const i = at(tx, ty);
      if (zone[i] !== z || blocked[i] || occ[i] || ground[i] === 'water' || ground[i] === 'path' || Math.hypot(tx - village.x, ty - village.y) < 15) continue;
      const p = { x: (tx + 0.5) * TILE_SIZE, y: (ty + 1) * TILE_SIZE - 2 };
      herbs.push(p); props.push({ kind: 'lingzhi', x: p.x, y: p.y }); occ[i] = 1; k++;
    }
  }

  // border wall of trees (visual; the tiles are already blocked)
  for (let k = 0; k < width * 2; k++) {
    const side = k % 4, t = BORDER + Math.floor(rng() * (width - 2 * BORDER));
    const tx = side < 2 ? t : side === 2 ? 1 : width - 2, ty = side < 2 ? (side === 0 ? 1 : height - 2) : t;
    const z = zone[at(Math.min(width - 1, Math.max(0, tx)), Math.min(height - 1, Math.max(0, ty)))]!;
    props.push({ kind: z === 'marsh' ? 'willow' : z === 'bamboo' ? 'bamboo' : z === 'grove' ? 'peachtree' : 'pine', x: (tx + 0.5) * TILE_SIZE + (rng() - 0.5) * 10, y: (ty + 1) * TILE_SIZE });
  }

  const npcs: Record<string, Vec2> = {
    'elder-lin': tileToWorld({ x: vx + 2, y: vy - 5 }),
    'merchant-qiao': tileToWorld({ x: vx + 7, y: vy + 1 }),
    'alchemist-yun': tileToWorld({ x: vx - 7, y: vy + 1 }),
  };

  return { width, height, ground, zone, blocked, props, spawn: tileToWorld({ x: vx, y: vy + 7 }), lair: lw, den: dw, pool: pw, anchors, npcs, herbs, arrayPos };
}

function boxBlocked(m: WorldMap, x: number, y: number, r: number): boolean {
  const x0 = Math.floor((x - r) / TILE_SIZE), x1 = Math.floor((x + r) / TILE_SIZE);
  const y0 = Math.floor((y - r) / TILE_SIZE), y1 = Math.floor((y + r) / TILE_SIZE);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (isBlockedTile(m, tx, ty)) return true;
  return false;
}

/** Axis-separated move so entities slide along walls. `r` is the half-size of the collision box in world units. */
export function moveWithCollision(m: WorldMap, from: Vec2, to: Vec2, r: number): Vec2 {
  let { x, y } = from;
  if (!boxBlocked(m, to.x, y, r)) x = to.x;
  if (!boxBlocked(m, x, to.y, r)) y = to.y;
  return { x, y };
}

export const zoneAt = (m: WorldMap, p: Vec2): ZoneId => {
  const tx = Math.min(m.width - 1, Math.max(0, Math.floor(p.x / TILE_SIZE))), ty = Math.min(m.height - 1, Math.max(0, Math.floor(p.y / TILE_SIZE)));
  return m.zone[idx(m, tx, ty)]!;
};
