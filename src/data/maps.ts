import type { PropKind } from './props';
import { CONTENT } from './content';
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
export interface RiverDef { pts: [number, number][]; r: number }
export interface MapDef {
  chapter: number;
  seed: number;
  width: number;
  height: number;
  hub: ZoneId;
  hubTile: { x: number; y: number };
  hubRadius: number;
  /** floor of the hub plaza (default stone) */
  hubGround?: GroundKind;
  /** zone ids of this chapter (hub first) */
  zones: ZoneId[];
  /** >1 shrinks a zone's territory, <1 grows it (default 1) */
  zoneWeight?: Partial<Record<ZoneId, number>>;
  /** road polylines (tiles); every road starts at the hub or at another road's end */
  roads: [number, number][][];
  /** rivers / lava flows: carved as the zone's blocking `liquid` ground, roads cross them as causeways */
  rivers?: RiverDef[];
  liquid?: GroundKind;
  /** sand (or other) shoreline drawn around water / lava */
  shore?: GroundKind;
  /** zones whose water is dotted with lotus pads */
  ponds?: ZoneId[];
  ground: Partial<Record<ZoneId, ZoneGround>>;
  scatter: ScatterRule[];
  arenas: ArenaDef[];
  /** hand-placed hub scenery, offsets from the hub tile */
  hubProps: { kind: PropKind; dx: number; dy: number }[];
  npcs: Record<string, { x: number; y: number }>;
  herbs: [ZoneId, number][];
  /** gate back to the previous chapter, offset from the hub tile (absent on chapter 1) */
  portal?: { dx: number; dy: number };
  /** gate to the next chapter, offset from the hub tile (absent on the last chapter's map is fine too) */
  portalNext?: { dx: number; dy: number };
  /** prop for the wall of trees along the border, by zone */
  borderProp: Partial<Record<ZoneId, PropKind>>;
  /** extra single props (tile coordinates) */
  extras: { kind: PropKind; x: number; y: number; force?: boolean }[];
}

export const CHAPTER1_MAP: MapDef = {
  chapter: 1, seed: 20261016, width: 144, height: 124,
  hub: 'village', hubTile: { x: 72, y: 66 }, hubRadius: 12,
  zones: ['village', 'bamboo', 'lake', 'marsh', 'grove', 'ruins', 'cliffs', 'lair'],
  zoneWeight: { lair: 1.15 },
  roads: [
    [[72, 66], [48, 64], [22, 62]],                           // sect -> Bamboo Forest
    [[48, 64], [44, 82], [38, 98]],                           // forest road -> Moonmirror Lake
    [[72, 66], [72, 86], [74, 104], [96, 106]],               // sect -> Mistveil Marsh -> dragon pool
    [[72, 66], [62, 56], [56, 40], [50, 26], [48, 24], [30, 20]], // sect -> Peach Grove -> fox den
    [[72, 66], [96, 68], [118, 70]],                          // sect -> Broken Sword Ruins
    [[100, 68], [104, 50], [110, 30]],                        // ruins road -> Thunderpeak Cliffs
    [[110, 30], [120, 24], [128, 18]],                        // cliffs -> the Fallen Immortal's court
    [[38, 98], [50, 112], [74, 112], [74, 104]],              // lake -> south shore -> marsh (a long way round)
    [[84, 105], [90, 116], [112, 114], [126, 100], [126, 88]], // marsh -> south-east track -> Hidden Sword Sanctum
    [[50, 26], [66, 14], [88, 14], [104, 22], [110, 30]],     // grove -> northern ridge -> cliffs
  ],
  shore: 'sand',
  ponds: ['marsh', 'lake'],
  ground: {
    village: { base: 'grass', layers: [{ kind: 'grassDark', field: 'v', gt: 0.62 }] },
    bamboo: { base: 'grassDark', layers: [{ kind: 'moss', field: 'v', gt: 0.64 }] },
    lake: { base: 'grass', layers: [{ kind: 'grassDark', field: 'v', gt: 0.6 }, { kind: 'water', field: 'w', gt: 0.52 }] },
    marsh: { base: 'grass', layers: [{ kind: 'moss', field: 'v', gt: 0.55 }, { kind: 'water', field: 'w', gt: 0.62 }] },
    grove: { base: 'grass', layers: [{ kind: 'grassDark', field: 'v', gt: 0.7 }] },
    ruins: { base: 'grassDark', layers: [{ kind: 'grass', field: 'v', gt: 0.4 }, { kind: 'sand', field: 'w', gt: 0.62 }, { kind: 'stone', field: 'v', gt: 0.66 }] },
    cliffs: { base: 'basalt', layers: [{ kind: 'grassDark', field: 'v', gt: 0.64 }, { kind: 'stone', field: 'w', gt: 0.7 }] },
    lair: { base: 'grassDark' },
  },
  scatter: [
    { zone: 'bamboo', kind: 'bamboo', p: 0.085, margin: 0 }, { zone: 'bamboo', kind: 'pine', p: 0.012 }, { zone: 'bamboo', kind: 'taihurocks', p: 0.004 }, { zone: 'bamboo', kind: 'orchid', p: 0.02, margin: 0 }, { zone: 'bamboo', kind: 'bambooshoot', p: 0.014, margin: 0 },
    { zone: 'lake', kind: 'willow', p: 0.02 }, { zone: 'lake', kind: 'orchid', p: 0.03, margin: 0 }, { zone: 'lake', kind: 'rock', p: 0.008, margin: 0 }, { zone: 'lake', kind: 'bamboo', p: 0.012, margin: 0 },
    { zone: 'marsh', kind: 'willow', p: 0.03 }, { zone: 'marsh', kind: 'rock', p: 0.012, margin: 0 }, { zone: 'marsh', kind: 'orchid', p: 0.02, margin: 0 },
    { zone: 'grove', kind: 'peachtree', p: 0.035 }, { zone: 'grove', kind: 'pine', p: 0.015 }, { zone: 'grove', kind: 'orchid', p: 0.025, margin: 0 }, { zone: 'grove', kind: 'rock', p: 0.006, margin: 0 },
    { zone: 'ruins', kind: 'rock', p: 0.02, margin: 0 }, { zone: 'ruins', kind: 'standstone', p: 0.014 }, { zone: 'ruins', kind: 'taihurocks', p: 0.004 }, { zone: 'ruins', kind: 'moonwall', p: 0.003 }, { zone: 'ruins', kind: 'pine', p: 0.008 },
    { zone: 'cliffs', kind: 'rock', p: 0.025, margin: 0 }, { zone: 'cliffs', kind: 'taihurocks', p: 0.01 }, { zone: 'cliffs', kind: 'standstone', p: 0.01 }, { zone: 'cliffs', kind: 'pine', p: 0.012 },
    { zone: 'lair', kind: 'standstone', p: 0.006 }, { zone: 'lair', kind: 'rock', p: 0.01, margin: 0 },
    { zone: 'village', kind: 'pine', p: 0.004 }, { zone: 'village', kind: 'orchid', p: 0.02, margin: 0 },
  ],
  arenas: [
    { bossId: 'ninetail', tile: { x: 30, y: 20 }, radius: 7, ring: 'peachtree', open: { x: 1, y: 0 }, ground: 'moss' },
    { bossId: 'jiaolong', tile: { x: 96, y: 106 }, radius: 7, ring: 'willow', open: { x: -1, y: 0 }, ground: 'moss' },
    { bossId: 'warden', tile: { x: 128, y: 18 }, radius: 9, ring: 'standstone', open: { x: -1, y: 1 }, ground: 'stone' },
  ],
  hubProps: [
    { kind: 'palace', dx: 0, dy: -9 }, { kind: 'pagoda7', dx: 11, dy: -6 }, { kind: 'pavilion', dx: 8, dy: 9 }, { kind: 'pavilion', dx: -9, dy: 10 }, { kind: 'tower', dx: -11, dy: -5 },
    { kind: 'goldpaifang', dx: 0, dy: 14 }, { kind: 'dragonpillar', dx: -5, dy: -3 }, { kind: 'dragonpillar', dx: 5, dy: -3 }, { kind: 'lotusbowl', dx: -6, dy: 4 }, { kind: 'lotusbowl', dx: 6, dy: 4 },
    { kind: 'peachtree', dx: -12, dy: 3 }, { kind: 'peachtree', dx: 12, dy: 2 }, { kind: 'stonecircle', dx: 13, dy: 12 },
  ],
  npcs: {
    'elder-lin': { x: 74, y: 61 }, 'merchant-qiao': { x: 79, y: 67 }, 'alchemist-yun': { x: 65, y: 67 }, 'keeper-ming': { x: 76, y: 71 },
    // wild NPCs: a ferryman on the lake shore, a hunter by the wolf den, a hermit on the cliffs, a sister among the ruins
    'ferryman-bo': { x: 41, y: 95 }, 'hunter-tao': { x: 15, y: 53 }, 'hermit-zhuo': { x: 105, y: 44 }, 'sister-lan': { x: 121, y: 80 },
  },
  herbs: [['bamboo', 14], ['lake', 6], ['marsh', 8], ['grove', 10], ['ruins', 6], ['cliffs', 6]],
  portalNext: { dx: 14, dy: 8 },
  borderProp: { village: 'pine', bamboo: 'bamboo', lake: 'willow', marsh: 'willow', grove: 'peachtree', ruins: 'pine', cliffs: 'pine', lair: 'pine' },
  extras: [
    { kind: 'goldgate', x: 116, y: 19, force: true }, { kind: 'lotusthrone', x: 132, y: 13, force: true },
    { kind: 'stonecircle', x: 100, y: 96 }, { kind: 'tower', x: 128, y: 84 }, { kind: 'floatisle', x: 92, y: 34 }, { kind: 'floatisle', x: 118, y: 46 }, { kind: 'floatisle', x: 62, y: 12 },
  ],
};

export const CHAPTER2_MAP: MapDef = {
  chapter: 2, seed: 0x5ca1ab1e, width: 144, height: 124,
  hub: 'outpost', hubTile: { x: 20, y: 102 }, hubRadius: 11,
  zones: ['outpost', 'frostpass', 'crystal', 'barrow', 'summit', 'glaciermaw', 'tundra'],
  zoneWeight: { summit: 1.1, barrow: 1.12 },
  roads: [
    [[20, 102], [34, 99], [46, 92], [62, 90]],            // outpost -> Whitefrost Pass
    [[62, 90], [84, 86], [100, 78], [120, 72]],           // pass -> Crystal Hollow
    [[120, 72], [128, 52], [118, 34], [112, 18]],         // hollow -> summit
    [[20, 102], [14, 82], [18, 62], [24, 50], [28, 36]],  // outpost -> Ashen Barrow
    [[62, 90], [64, 70], [72, 50]],                       // pass -> Glacier Maw
    [[72, 50], [50, 58], [18, 62]],                       // maw -> barrow road (the long way round)
    [[72, 50], [96, 40], [118, 34]],                      // maw -> summit road
    [[62, 90], [84, 102], [108, 108]],                    // pass -> Howling Tundra
    [[108, 108], [116, 92], [120, 72]],                   // tundra -> hollow
    [[18, 62], [8, 46], [10, 26], [22, 12]],              // barrow road -> the forgotten western graves (dead end with a watchtower)
  ],
  rivers: [{ pts: [[74, 60], [80, 76], [90, 92], [96, 106], [100, 122]], r: 1.8 }],  // meltwater from the maw to the south edge
  shore: 'snow',
  ground: {
    outpost: { base: 'snow' },
    frostpass: { base: 'snow', layers: [{ kind: 'ice', field: 'w', gt: 0.62 }, { kind: 'stone', field: 'v', gt: 0.7 }] },
    crystal: { base: 'ice', layers: [{ kind: 'stone', field: 'v', gt: 0.62 }, { kind: 'snow', field: 'w', gt: 0.6 }] },
    barrow: { base: 'ash', layers: [{ kind: 'stone', field: 'v', gt: 0.66 }] },
    summit: { base: 'stone', layers: [{ kind: 'snow', field: 'w', gt: 0.58 }, { kind: 'ash', field: 'v', gt: 0.66 }] },
    glaciermaw: { base: 'ice', layers: [{ kind: 'snow', field: 'w', gt: 0.56 }, { kind: 'basalt', field: 'v', gt: 0.64 }, { kind: 'water', field: 'w', gt: 0.78 }] },
    tundra: { base: 'snow', layers: [{ kind: 'ice', field: 'w', gt: 0.5 }, { kind: 'stone', field: 'v', gt: 0.74 }, { kind: 'water', field: 'w', gt: 0.8 }] },
  },
  scatter: [
    { zone: 'outpost', kind: 'pine', p: 0.006 },
    { zone: 'frostpass', kind: 'pine', p: 0.035 }, { zone: 'frostpass', kind: 'rock', p: 0.015, margin: 0 }, { zone: 'frostpass', kind: 'taihurocks', p: 0.006 }, { zone: 'frostpass', kind: 'standstone', p: 0.004 },
    { zone: 'crystal', kind: 'taihurocks', p: 0.014 }, { zone: 'crystal', kind: 'standstone', p: 0.014 }, { zone: 'crystal', kind: 'rock', p: 0.016, margin: 0 },
    { zone: 'barrow', kind: 'standstone', p: 0.016 }, { zone: 'barrow', kind: 'moonwall', p: 0.004 }, { zone: 'barrow', kind: 'rock', p: 0.012, margin: 0 }, { zone: 'barrow', kind: 'pine', p: 0.012 },
    { zone: 'summit', kind: 'standstone', p: 0.012 }, { zone: 'summit', kind: 'taihurocks', p: 0.01 }, { zone: 'summit', kind: 'rock', p: 0.01, margin: 0 },
    { zone: 'glaciermaw', kind: 'taihurocks', p: 0.02 }, { zone: 'glaciermaw', kind: 'rock', p: 0.022, margin: 0 }, { zone: 'glaciermaw', kind: 'standstone', p: 0.01 }, { zone: 'glaciermaw', kind: 'pine', p: 0.004 },
    { zone: 'tundra', kind: 'pine', p: 0.016 }, { zone: 'tundra', kind: 'rock', p: 0.012, margin: 0 }, { zone: 'tundra', kind: 'taihurocks', p: 0.005 }, { zone: 'tundra', kind: 'standstone', p: 0.003 },
  ],
  arenas: [
    { bossId: 'corpseking', tile: { x: 28, y: 36 }, radius: 9, ring: 'standstone', open: { x: 0, y: 1 }, ground: 'stone' },
    { bossId: 'crystalcolossus', tile: { x: 120, y: 72 }, radius: 9, ring: 'taihurocks', open: { x: -1, y: 0 }, ground: 'stone' },
    { bossId: 'sovereign', tile: { x: 112, y: 18 }, radius: 10, ring: 'standstone', open: { x: 0, y: 1 }, ground: 'stone' },
  ],
  hubProps: [
    { kind: 'tower', dx: -9, dy: -6 }, { kind: 'tower', dx: 9, dy: -6 }, { kind: 'pavilion', dx: -8, dy: 8 }, { kind: 'pavilion', dx: 8, dy: 8 },
    { kind: 'pagoda7', dx: 0, dy: -10 }, { kind: 'stonecircle', dx: 12, dy: 5 }, { kind: 'lotusbowl', dx: -5, dy: 3 }, { kind: 'lotusbowl', dx: 5, dy: 3 },
    { kind: 'pine', dx: -12, dy: 2 }, { kind: 'pine', dx: 12, dy: -2 },
  ],
  npcs: {
    'commander-shen': { x: 22, y: 97 }, 'quartermaster-gu': { x: 27, y: 103 }, 'herbalist-mo': { x: 13, y: 103 }, 'hermit-wen': { x: 36, y: 96 }, 'keeper-ren': { x: 19, y: 100 },
    // wild NPCs: a surveyor in the Glacier Maw, a warden at the barrow, a seer by the hollow, a trapper on the tundra
    'surveyor-pei': { x: 68, y: 60 }, 'warden-ling': { x: 36, y: 60 }, 'seer-lian': { x: 128, y: 88 }, 'trapper-hu': { x: 104, y: 107 },
  },
  herbs: [['frostpass', 8], ['crystal', 7], ['barrow', 7], ['glaciermaw', 6], ['tundra', 6], ['summit', 3]],
  portal: { dx: 0, dy: 11 },
  portalNext: { dx: 13, dy: 8 },
  borderProp: { outpost: 'pine', frostpass: 'pine', crystal: 'taihurocks', barrow: 'standstone', summit: 'standstone', glaciermaw: 'taihurocks', tundra: 'pine' },
  extras: [
    { kind: 'floatisle', x: 70, y: 28 }, { kind: 'floatisle', x: 100, y: 52 }, { kind: 'floatisle', x: 132, y: 36 }, { kind: 'floatisle', x: 50, y: 14 },
    { kind: 'tower', x: 82, y: 112 }, { kind: 'tower', x: 46, y: 70 }, { kind: 'tower', x: 24, y: 10, force: true }, { kind: 'stonecircle', x: 12, y: 36 }, { kind: 'stonecircle', x: 14, y: 20 }, { kind: 'stonecircle', x: 56, y: 66 }, { kind: 'stonecircle', x: 96, y: 96 }, { kind: 'stonecircle', x: 36, y: 72 },
  ],
};

export const MAP_DEFS: Record<number, MapDef> = { 1: CHAPTER1_MAP, 2: CHAPTER2_MAP };
for (const c of CONTENT) if (c.map) MAP_DEFS[c.map.chapter] = c.map;
