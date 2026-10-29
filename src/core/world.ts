import type { PropKind } from '../data/props';
import type { ZoneId } from '../data/zones';
import type { Vec2 } from './movement';
import { MAP_DEFS } from '../data/maps';
import { generateFromDef } from './mapgen';
import { generateDungeon } from './dungeon';
import { DUNGEONS } from '../data/dungeons';

export const TILE_SIZE = 16;
export type { ZoneId };

export type GroundKind =
  | 'grass' | 'grassDark' | 'moss' | 'path' | 'stone' | 'water' | 'sand' | 'snow' | 'ice' | 'ash'
  | 'lava' | 'cloud' | 'jade' | 'crimson' | 'clay' | 'basalt' | 'wall' | 'void';

/** Ground you cannot walk on: bodies of water and lava, cave rock, the void between realm chambers. */
export const BLOCKING_GROUND: ReadonlySet<GroundKind> = new Set<GroundKind>(['water', 'lava', 'wall', 'void']);

export interface PropInst { kind: PropKind; x: number; y: number }

import type { FeatureLayout } from './dungeonFeatures';
export interface WorldMap {
  /** chapter this map belongs to */
  chapter: number;
  width: number;
  height: number;
  ground: GroundKind[];
  zone: ZoneId[];
  /** 1 = impassable tile (border, water, prop footprints) */
  blocked: Uint8Array;
  props: PropInst[];
  spawn: Vec2; // world units
  lair: Vec2;
  /** Landmarks of chapter 1 (in other chapters: the first three boss arenas in id order). */
  /** Nine-Tailed Fox den (in the peach grove) */
  den: Vec2;
  /** Jiao Dragon pool (in Mistveil Marsh) */
  pool: Vec2;
  /** boss id -> arena centre (world units) */
  bossHomes: Record<string, Vec2>;
  /** chapter 1: the gate to chapter 2; later chapters: the gate back; dungeons: the exit */
  portal: Vec2;
  /** gate to the next chapter (chapters 2+ only) */
  portalNext?: Vec2;
  /** dungeon id -> entrance gate (world units) on a chapter map */
  entrances: Record<string, Vec2>;
  /** set on the map of a cave / secret realm */
  dungeon?: string;
  /** dungeon mechanics (traps, seal gate, plates, braziers, collapsing floor, ambush): see `core/dungeonFeatures.ts` */
  features?: FeatureLayout;
  anchors: Partial<Record<ZoneId, Vec2>>;
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

function boxBlocked(m: WorldMap, x: number, y: number, r: number): boolean {
  const x0 = Math.floor((x - r) / TILE_SIZE), x1 = Math.floor((x + r) / TILE_SIZE);
  const y0 = Math.floor((y - r) / TILE_SIZE), y1 = Math.floor((y + r) / TILE_SIZE);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (isBlockedTile(m, tx, ty)) return true;
  return false;
}

/** Nearest spot to `p` (spiralling outwards, preferring below it) where a body of half-size `r` fits, or null. */
export function nearestFree(m: WorldMap, p: Vec2, r = 6, maxRing = 12): Vec2 | null {
  if (!boxBlocked(m, p.x, p.y, r)) return { ...p };
  for (let ring = 1; ring <= maxRing; ring++) {
    for (let dy = ring; dy >= -ring; dy--) for (let dx = -ring; dx <= ring; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
      const q = { x: p.x + dx * TILE_SIZE, y: p.y + dy * TILE_SIZE };
      if (!boxBlocked(m, q.x, q.y, r)) return q;
    }
  }
  return null;
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

/** Builds the map of chapter `n` from its declarative map def (the seed lives in the def, so a chapter always looks the same). */
export function generateChapter(n: number): WorldMap {
  const def = MAP_DEFS[n];
  if (!def) throw new Error(`no map for chapter ${n}`);
  return generateFromDef(def);
}

/** Map of a cave / secret realm. */
export function generateDungeonMap(id: string): WorldMap {
  const d = DUNGEONS[id];
  if (!d) throw new Error(`no dungeon ${id}`);
  return generateDungeon(d);
}
