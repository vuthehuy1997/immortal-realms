import type { PropKind } from './props';
import type { ZoneId } from './zones';
import type { GroundKind } from '../core/world';

/** Declarative description of a generated chapter map (see src/core/mapgen.ts). Tiles are map-local. */
export interface GroundLayer { kind: GroundKind; field: 'v' | 'w'; gt: number }
export interface ZoneGround { base: GroundKind; layers?: GroundLayer[] }
export interface ScatterRule { zone: ZoneId; kind: PropKind; p: number; margin?: number }
export interface ArenaDef {
  bossId: string;
  tile: { x: number; y: number };
  radius: number;
  /** prop used for the ring of standing pieces */
  ring: PropKind;
  /** direction (unit-ish vector) the ring leaves open: where the road enters */
  open: { x: number; y: number };
  ground: GroundKind;
}
export interface MapDef {
  chapter: number;
  seed: number;
  width: number;
  height: number;
  hub: ZoneId;
  hubTile: { x: number; y: number };
  hubRadius: number;
  /** zone ids of this chapter (hub first) */
  zones: ZoneId[];
  /** road polylines (tiles); every road starts at the hub or at another road's end */
  roads: [number, number][][];
  ground: Partial<Record<ZoneId, ZoneGround>>;
  scatter: ScatterRule[];
  arenas: ArenaDef[];
  /** hand-placed hub scenery, offsets from the hub tile */
  hubProps: { kind: PropKind; dx: number; dy: number }[];
  npcs: Record<string, { x: number; y: number }>;
  herbs: [ZoneId, number][];
  /** return gate (a moonwall) offset from the hub tile */
  portal: { dx: number; dy: number };
  /** prop for the wall of trees along the border, by zone */
  borderProp: Partial<Record<ZoneId, PropKind>>;
  /** extra single props (tile coordinates) */
  extras: { kind: PropKind; x: number; y: number }[];
}

export const CHAPTER2_MAP: MapDef = {
  chapter: 2, seed: 0x5ca1ab1e, width: 112, height: 96,
  hub: 'outpost', hubTile: { x: 18, y: 80 }, hubRadius: 11,
  zones: ['outpost', 'frostpass', 'crystal', 'barrow', 'summit'],
  roads: [
    [[18, 80], [34, 77], [52, 68]],             // outpost -> Whitefrost Pass
    [[52, 68], [70, 66], [90, 62]],             // pass -> Crystal Hollow
    [[90, 62], [97, 46], [90, 28], [84, 16]],   // hollow -> summit
    [[18, 80], [15, 62], [22, 46], [26, 36]],   // outpost -> Ashen Barrow
  ],
  ground: {
    outpost: { base: 'snow' },
    frostpass: { base: 'snow', layers: [{ kind: 'ice', field: 'w', gt: 0.62 }, { kind: 'stone', field: 'v', gt: 0.7 }] },
    crystal: { base: 'ice', layers: [{ kind: 'stone', field: 'v', gt: 0.62 }, { kind: 'snow', field: 'w', gt: 0.6 }] },
    barrow: { base: 'ash', layers: [{ kind: 'stone', field: 'v', gt: 0.66 }] },
    summit: { base: 'stone', layers: [{ kind: 'snow', field: 'w', gt: 0.58 }, { kind: 'ash', field: 'v', gt: 0.66 }] },
  },
  scatter: [
    { zone: 'outpost', kind: 'pine', p: 0.006 },
    { zone: 'frostpass', kind: 'pine', p: 0.035 }, { zone: 'frostpass', kind: 'rock', p: 0.015, margin: 0 }, { zone: 'frostpass', kind: 'taihurocks', p: 0.006 }, { zone: 'frostpass', kind: 'standstone', p: 0.004 },
    { zone: 'crystal', kind: 'taihurocks', p: 0.014 }, { zone: 'crystal', kind: 'standstone', p: 0.014 }, { zone: 'crystal', kind: 'rock', p: 0.016, margin: 0 },
    { zone: 'barrow', kind: 'standstone', p: 0.016 }, { zone: 'barrow', kind: 'moonwall', p: 0.004 }, { zone: 'barrow', kind: 'rock', p: 0.012, margin: 0 }, { zone: 'barrow', kind: 'pine', p: 0.012 },
    { zone: 'summit', kind: 'standstone', p: 0.012 }, { zone: 'summit', kind: 'taihurocks', p: 0.01 }, { zone: 'summit', kind: 'rock', p: 0.01, margin: 0 },
  ],
  arenas: [
    { bossId: 'corpseking', tile: { x: 26, y: 36 }, radius: 9, ring: 'standstone', open: { x: 0, y: 1 }, ground: 'stone' },
    { bossId: 'crystalcolossus', tile: { x: 90, y: 62 }, radius: 9, ring: 'taihurocks', open: { x: -1, y: 0 }, ground: 'stone' },
    { bossId: 'sovereign', tile: { x: 84, y: 16 }, radius: 10, ring: 'standstone', open: { x: 0, y: 1 }, ground: 'stone' },
  ],
  hubProps: [
    { kind: 'tower', dx: -9, dy: -6 }, { kind: 'tower', dx: 9, dy: -6 }, { kind: 'pavilion', dx: -8, dy: 8 }, { kind: 'pavilion', dx: 8, dy: 8 },
    { kind: 'pagoda7', dx: 0, dy: -10 }, { kind: 'stonecircle', dx: 12, dy: 5 }, { kind: 'lotusbowl', dx: -5, dy: 3 }, { kind: 'lotusbowl', dx: 5, dy: 3 },
    { kind: 'pine', dx: -12, dy: 2 }, { kind: 'pine', dx: 12, dy: -2 },
  ],
  npcs: { 'commander-shen': { x: 20, y: 75 }, 'quartermaster-gu': { x: 25, y: 81 }, 'herbalist-mo': { x: 11, y: 81 }, 'hermit-wen': { x: 31, y: 69 }, 'keeper-ren': { x: 17, y: 78 } },
  herbs: [['frostpass', 6], ['crystal', 5], ['barrow', 5]],
  portal: { dx: 0, dy: 11 },
  borderProp: { outpost: 'pine', frostpass: 'pine', crystal: 'taihurocks', barrow: 'standstone', summit: 'standstone' },
  extras: [{ kind: 'floatisle', x: 70, y: 40 }, { kind: 'floatisle', x: 100, y: 24 }, { kind: 'tower', x: 60, y: 82 }, { kind: 'stonecircle', x: 44, y: 54 }],
};

export const MAP_DEFS: Record<number, MapDef> = { 2: CHAPTER2_MAP };
