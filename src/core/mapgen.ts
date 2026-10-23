import { PROPS, type PropKind } from '../data/props';
import { ZONES, type ZoneId } from '../data/zones';
import type { MapDef } from '../data/maps';
import { createNoise, fbm } from './noise';
import type { Vec2 } from './movement';
import { createRng } from './rng';
import { TILE_SIZE, tileToWorld, type GroundKind, type PropInst, type WorldMap } from './world';

const BORDER = 3;

/** Deterministic chapter map built from a declarative `MapDef`. Mirrors the chapter 1 generator's output shape. */
export function generateFromDef(def: MapDef): WorldMap {
  const { width, height } = def;
  const rng = createRng(def.seed);
  const noise = createNoise(def.seed ^ 0x9e3779b9);
  const n = (x: number, y: number, s = 0.12) => fbm(noise, x * s, y * s, 4);
  const N = width * height;
  const ground: GroundKind[] = new Array<GroundKind>(N).fill('snow');
  const zone: ZoneId[] = new Array<ZoneId>(N).fill(def.hub);
  const blocked = new Uint8Array(N);
  const reserved = new Uint8Array(N);
  const occ = new Uint8Array(N);
  const halo = new Uint8Array(N);
  const props: PropInst[] = [];
  const at = (tx: number, ty: number) => ty * width + tx;
  const inMap = (tx: number, ty: number) => tx >= 0 && ty >= 0 && tx < width && ty < height;
  const hub = def.hubTile;

  // zones: hub disc, otherwise nearest anchor with a noisy border
  for (let ty = 0; ty < height; ty++) for (let tx = 0; tx < width; tx++) {
    const jitter = (n(tx + 50, ty + 50, 0.09) - 0.5) * 9;
    if (Math.hypot(tx - hub.x, ty - hub.y) < def.hubRadius + jitter * 0.3) { zone[at(tx, ty)] = def.hub; continue; }
    let best: ZoneId = def.zones[1]!, bd = Infinity;
    for (const z of def.zones) {
      if (z === def.hub) continue;
      const a = ZONES[z].anchor;
      const d = Math.hypot(tx - a.x, ty - a.y) + jitter;
      if (d < bd) { bd = d; best = z; }
    }
    zone[at(tx, ty)] = best;
  }

  const stamp = (x: number, y: number, r: number, f: (tx: number, ty: number) => void) => {
    for (let ty = Math.floor(y - r); ty <= Math.ceil(y + r); ty++) for (let tx = Math.floor(x - r); tx <= Math.ceil(x + r); tx++) if (inMap(tx, ty) && Math.hypot(tx - x, ty - y) <= r) f(tx, ty);
  };
  const roadTiles = new Set<number>();
  for (const pts of def.roads) for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i]!, [x1, y1] = pts[i + 1]!;
    const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2);
    for (let s = 0; s <= steps; s++) {
      const t = s / steps, wob = Math.sin(t * Math.PI * 3 + i) * 0.5;
      stamp(x0 + (x1 - x0) * t + wob * 0.4, y0 + (y1 - y0) * t + wob * 0.4, 1.6, (tx, ty) => roadTiles.add(at(tx, ty)));
    }
  }
  stamp(hub.x, hub.y, def.hubRadius - 2.5, (tx, ty) => { reserved[at(tx, ty)] = 1; });
  for (const t of roadTiles) reserved[t] = 1;
  for (const t of roadTiles) stamp(t % width, Math.floor(t / width), 2.2, (tx, ty) => { halo[at(tx, ty)] = 1; });

  // ground: per-zone base + noise layers, stone hub plaza, stone arenas, roads
  for (let ty = 0; ty < height; ty++) for (let tx = 0; tx < width; tx++) {
    const i = at(tx, ty), z = zone[i]!, v = n(tx, ty, 0.16), w = n(tx + 200, ty + 200, 0.1);
    const zg = def.ground[z];
    let g: GroundKind = zg?.base ?? 'snow';
    for (const l of zg?.layers ?? []) if ((l.field === 'v' ? v : w) > l.gt) g = l.kind;
    if (z === def.hub && Math.hypot(tx - hub.x, ty - hub.y) < def.hubRadius - 4) g = 'stone';
    ground[i] = g;
  }
  for (const a of def.arenas) for (let ty = 0; ty < height; ty++) for (let tx = 0; tx < width; tx++) if (Math.hypot(tx - a.tile.x, ty - a.tile.y) < a.radius) ground[at(tx, ty)] = a.ground;
  for (const t of roadTiles) if (ground[t] !== 'stone') ground[t] = 'path';

  for (let ty = 0; ty < height; ty++) for (let tx = 0; tx < width; tx++) if (tx < BORDER || ty < BORDER || tx >= width - BORDER || ty >= height - BORDER) blocked[at(tx, ty)] = 1;

  const rectsOf = (kind: PropKind, x: number, y: number) => PROPS[kind].blocks.map((r) => {
    const bx = x / TILE_SIZE, by = y / TILE_SIZE;
    return { x0: Math.floor(bx + r.dx), y0: Math.floor(by + r.dy), x1: Math.ceil(bx + r.dx + r.w) - 1, y1: Math.ceil(by + r.dy + r.h) - 1 };
  });
  const place = (kind: PropKind, tx: number, ty: number, opts: { force?: boolean; margin?: number } = {}): boolean => {
    const x = (tx + 0.5) * TILE_SIZE, y = (ty + 1) * TILE_SIZE - 1;
    const rects = rectsOf(kind, x, y), m = opts.margin ?? 1;
    for (const r of rects) for (let yy = r.y0 - m; yy <= r.y1 + m; yy++) for (let xx = r.x0 - m; xx <= r.x1 + m; xx++) {
      if (!inMap(xx, yy)) return false;
      const i = at(xx, yy);
      if (blocked[i] || occ[i]) return false;
      if (!opts.force && (reserved[i] || halo[i]) && xx >= r.x0 && xx <= r.x1 && yy >= r.y0 && yy <= r.y1) return false;
    }
    if (!inMap(tx, ty) || (!opts.force && (reserved[at(tx, ty)] || halo[at(tx, ty)]))) return false;
    for (const r of rects) for (let yy = r.y0; yy <= r.y1; yy++) for (let xx = r.x0; xx <= r.x1; xx++) blocked[at(xx, yy)] = 1;
    for (const r of rects) for (let yy = r.y0 - m; yy <= r.y1 + m; yy++) for (let xx = r.x0 - m; xx <= r.x1 + m; xx++) occ[at(xx, yy)] = 1;
    props.push({ kind, x, y });
    return true;
  };

  // hub
  for (const p of def.hubProps) place(p.kind, hub.x + p.dx, hub.y + p.dy, { force: true });
  const arrayPos = { x: (hub.x + 0.5) * TILE_SIZE, y: (hub.y + 1.5) * TILE_SIZE };
  props.push({ kind: 'array', x: arrayPos.x, y: arrayPos.y });
  place('moonwall', hub.x + def.portal.dx, hub.y + def.portal.dy, { force: true, margin: 0 });
  const portal = tileToWorld({ x: hub.x + def.portal.dx, y: hub.y + def.portal.dy + 1 });
  props.push({ kind: 'array', x: portal.x, y: portal.y + 2 });

  // arenas first so scatter never fills them: ring with an open side, plus a magic array under the boss
  const bossHomes: Record<string, Vec2> = {};
  for (const a of def.arenas) {
    const centre = tileToWorld(a.tile);
    bossHomes[a.bossId] = centre;
    const ol = Math.hypot(a.open.x, a.open.y) || 1;
    for (let k = 0; k < 16; k++) {
      const ang = (k / 16) * Math.PI * 2, cx = Math.cos(ang), cy = Math.sin(ang);
      if ((cx * a.open.x + cy * a.open.y) / ol > 0.7) continue;
      place(a.ring, Math.round(a.tile.x + cx * (a.radius + 0.5)), Math.round(a.tile.y + cy * (a.radius - 0.5)), { force: true, margin: 0 });
    }
    props.push({ kind: 'array', x: centre.x, y: centre.y + 8 });
  }

  for (const r of def.scatter) {
    for (let ty = BORDER; ty < height - BORDER; ty++) for (let tx = BORDER; tx < width - BORDER; tx++) {
      if (zone[at(tx, ty)] === r.zone && rng() < r.p) place(r.kind, tx, ty, { margin: r.margin ?? 1 });
    }
  }
  for (const e of def.extras) place(e.kind, e.x, e.y, {});

  // herbs
  const herbs: Vec2[] = [];
  for (const [z, count] of def.herbs) {
    for (let k = 0, tries = 0; k < count && tries < 4000; tries++) {
      const tx = BORDER + 2 + Math.floor(rng() * (width - 2 * BORDER - 4)), ty = BORDER + 2 + Math.floor(rng() * (height - 2 * BORDER - 4));
      const i = at(tx, ty);
      if (zone[i] !== z || blocked[i] || occ[i] || ground[i] === 'path' || Math.hypot(tx - hub.x, ty - hub.y) < def.hubRadius + 4) continue;
      const p = { x: (tx + 0.5) * TILE_SIZE, y: (ty + 1) * TILE_SIZE - 2 };
      herbs.push(p); props.push({ kind: 'lingzhi', x: p.x, y: p.y }); occ[i] = 1; k++;
    }
  }

  // border wall (visual; tiles already blocked)
  for (let k = 0; k < width * 2; k++) {
    const side = k % 4, t = BORDER + Math.floor(rng() * ((side < 2 ? width : height) - 2 * BORDER));
    const tx = side < 2 ? t : side === 2 ? 1 : width - 2, ty = side < 2 ? (side === 0 ? 1 : height - 2) : t;
    const z = zone[at(Math.min(width - 1, Math.max(0, tx)), Math.min(height - 1, Math.max(0, ty)))]!;
    props.push({ kind: def.borderProp[z] ?? 'pine', x: (tx + 0.5) * TILE_SIZE + (rng() - 0.5) * 10, y: (ty + 1) * TILE_SIZE });
  }

  const npcs: Record<string, Vec2> = Object.fromEntries(Object.entries(def.npcs).map(([id, t]) => [id, tileToWorld(t)]));
  const anchors: Partial<Record<ZoneId, Vec2>> = Object.fromEntries(def.zones.map((z) => [z, tileToWorld(ZONES[z].anchor)]));
  const homes = def.arenas.map((a) => bossHomes[a.bossId]!);
  return {
    chapter: def.chapter, width, height, ground, zone, blocked, props, spawn: tileToWorld({ x: hub.x, y: hub.y + 7 }),
    lair: homes[2] ?? homes[0]!, den: homes[0]!, pool: homes[1] ?? homes[0]!, bossHomes, portal, anchors, npcs, herbs, arrayPos,
  };
}
