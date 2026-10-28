import type { BossDef } from '../boss';
import type { ChapterDef } from '../chapters';
import type { DungeonDef } from '../dungeons';
import type { EnemyDef } from '../enemies';
import type { ItemDef } from '../items';
import type { MapDef } from '../maps';
import type { NpcDef, QuestDef } from '../quests';
import type { ZoneDef } from '../zones';
import { CHAPTER_GEAR } from './gear';
import { emptyContent, type ChapterContent } from './types';

/**
 * Chapter 4: The Jade Heavens. A sky-realm of floating terraces (cloud / jade / stone / grass islands) divided by chasms of void,
 * linked by long causeways and jade bridges. Climb from Nine-Cloud Terrace to the Celestial Magistrate's dais.
 * ALL art here is PLACEHOLDER: pack sprites reused, enlarged and recoloured; replace before release.
 */

// ---------------------------------------------------------------- chapter
const CHAPTER: ChapterDef = {
  id: 4, name: 'The Jade Heavens', subtitle: 'Chapter 4', hub: 'terrace', gateName: 'Jade Gate',
  gear: CHAPTER_GEAR[4],
  story: [
    'Above the clouds the immortals who fled the Fissure built terraces of jade and floating stone, each one a quiet island in the wind.',
    'For an age they watched the mortal world shrink beneath them. Then the Heavenly Furnace woke, and its smoke climbed the sky and stained the jade.',
    'The Celestial Magistrate judged the smoke and found the mortal world guilty. He shut the Jade Gate and sent constructs and spirit beasts down the stair.',
    'You have come up through the closed gate. Climb the terraces, cross the chasms, and stand before the Magistrate on his dais.',
  ],
  gate: { level: 25, hint: 'Defeat the guardians of the Ember Wastes and reach level 25 to climb the Jade Gate.' },
};

// ---------------------------------------------------------------- map
const MAP: MapDef = {
  chapter: 4, seed: 0x4a4ade, width: 164, height: 136,
  hub: 'terrace', hubTile: { x: 28, y: 110 }, hubRadius: 12, hubGround: 'stone',
  zones: ['terrace', 'orchard', 'mirror', 'stair', 'storm', 'crane', 'library', 'dais'],
  zoneWeight: { dais: 0.9 },
  roads: [
    [[28, 110], [44, 113], [54, 110], [64, 108]],                                       // terrace -> Peach Orchard
    [[64, 108], [80, 112], [92, 116], [104, 114]],                                      // orchard -> Mirror Lake
    [[28, 110], [26, 98], [34, 88], [42, 80], [50, 74]],                                // terrace -> Thousand-Step Stair
    [[50, 74], [54, 62], [48, 50], [38, 42], [32, 36], [30, 32]],                       // stair -> Library of Jade Slips
    [[50, 74], [66, 72], [78, 64], [90, 66]],                                           // stair -> Storm Court
    [[104, 114], [114, 106], [126, 100], [134, 92], [136, 86]],                         // lake -> Crane Pavilions
    [[90, 66], [102, 58], [110, 46], [120, 34], [130, 24]],                             // storm court -> dais
    [[136, 86], [144, 72], [140, 56], [132, 42], [130, 24]],                            // cranes -> dais (second causeway)
  ],
  liquid: 'void',
  rivers: [
    { pts: [[4, 90], [20, 92], [36, 94], [56, 92]], r: 3 },                              // below the stair, above the terrace
    { pts: [[74, 96], [96, 92], [116, 98], [138, 108], [158, 104]], r: 3.4 },
    { pts: [[6, 58], [22, 62], [40, 58], [64, 58], [72, 48]], r: 3 },                   // between stair and library
    { pts: [[80, 42], [100, 44], [118, 54], [140, 50], [158, 58]], r: 3.2 },
    { pts: [[82, 100], [86, 118], [82, 132]], r: 2.6 },                                  // orchard | lake
    { pts: [[62, 4], [64, 22], [58, 40]], r: 3 },
    { pts: [[102, 4], [106, 22], [96, 38]], r: 3 },
    { pts: [[148, 4], [150, 22], [156, 36]], r: 2.6 },
    { pts: [[96, 66], [100, 78], [112, 84], [124, 78]], r: 2.4 },
  ],
  shore: 'cloud',
  ground: {
    terrace: { base: 'cloud', layers: [{ kind: 'jade', field: 'v', gt: 0.7 }] },
    orchard: { base: 'grass', layers: [{ kind: 'grassDark', field: 'v', gt: 0.6 }, { kind: 'cloud', field: 'w', gt: 0.7 }] },
    mirror: { base: 'cloud', layers: [{ kind: 'jade', field: 'v', gt: 0.74 }, { kind: 'water', field: 'w', gt: 0.56 }] },
    stair: { base: 'stone', layers: [{ kind: 'cloud', field: 'w', gt: 0.58 }, { kind: 'jade', field: 'v', gt: 0.72 }] },
    storm: { base: 'basalt', layers: [{ kind: 'stone', field: 'v', gt: 0.55 }, { kind: 'cloud', field: 'w', gt: 0.66 }] },
    crane: { base: 'jade', layers: [{ kind: 'cloud', field: 'v', gt: 0.56 }, { kind: 'grass', field: 'w', gt: 0.64 }] },
    library: { base: 'stone', layers: [{ kind: 'jade', field: 'w', gt: 0.56 }, { kind: 'cloud', field: 'v', gt: 0.7 }] },
    dais: { base: 'jade', layers: [{ kind: 'stone', field: 'v', gt: 0.56 }, { kind: 'cloud', field: 'w', gt: 0.74 }] },
  },
  ponds: ['mirror'],
  scatter: [
    { zone: 'terrace', kind: 'willow', p: 0.006 }, { zone: 'terrace', kind: 'peachtree', p: 0.006 }, { zone: 'terrace', kind: 'orchid', p: 0.02, margin: 0 },
    { zone: 'orchard', kind: 'peachtree', p: 0.06 }, { zone: 'orchard', kind: 'willow', p: 0.012 }, { zone: 'orchard', kind: 'orchid', p: 0.03, margin: 0 }, { zone: 'orchard', kind: 'petals', p: 0.03, margin: 0 }, { zone: 'orchard', kind: 'rock', p: 0.005, margin: 0 },
    { zone: 'mirror', kind: 'willow', p: 0.035 }, { zone: 'mirror', kind: 'orchid', p: 0.025, margin: 0 }, { zone: 'mirror', kind: 'lotusbowl', p: 0.004 }, { zone: 'mirror', kind: 'pavilion', p: 0.0012 }, { zone: 'mirror', kind: 'rock', p: 0.006, margin: 0 },
    { zone: 'stair', kind: 'standstone', p: 0.016 }, { zone: 'stair', kind: 'paifang', p: 0.0025 }, { zone: 'stair', kind: 'stairs', p: 0.004, margin: 0 }, { zone: 'stair', kind: 'pagoda7', p: 0.0015 }, { zone: 'stair', kind: 'rock', p: 0.012, margin: 0 }, { zone: 'stair', kind: 'pine', p: 0.006 },
    { zone: 'storm', kind: 'standstone', p: 0.02 }, { zone: 'storm', kind: 'taihurocks', p: 0.012 }, { zone: 'storm', kind: 'dragonpillar', p: 0.008 }, { zone: 'storm', kind: 'rock', p: 0.022, margin: 0 }, { zone: 'storm', kind: 'moonwall', p: 0.0012 },
    { zone: 'crane', kind: 'pavilion', p: 0.0035 }, { zone: 'crane', kind: 'pagoda7', p: 0.0022 }, { zone: 'crane', kind: 'peachtree', p: 0.018 }, { zone: 'crane', kind: 'willow', p: 0.01 }, { zone: 'crane', kind: 'lotusbowl', p: 0.003 }, { zone: 'crane', kind: 'orchid', p: 0.02, margin: 0 },
    { zone: 'library', kind: 'pavilion', p: 0.003 }, { zone: 'library', kind: 'corridor', p: 0.0015 }, { zone: 'library', kind: 'bamboo', p: 0.035 }, { zone: 'library', kind: 'standstone', p: 0.01 }, { zone: 'library', kind: 'orchid', p: 0.02, margin: 0 }, { zone: 'library', kind: 'taihurocks', p: 0.004 },
    { zone: 'dais', kind: 'paifang', p: 0.002 }, { zone: 'dais', kind: 'dragonpillar', p: 0.012 }, { zone: 'dais', kind: 'standstone', p: 0.01 }, { zone: 'dais', kind: 'pagoda7', p: 0.002 }, { zone: 'dais', kind: 'goldpaifang', p: 0.0012 },
  ],
  arenas: [
    { bossId: 'cranelord', tile: { x: 90, y: 66 }, radius: 8, ring: 'stonecircle', open: { x: -1, y: 0 }, ground: 'stone' },
    { bossId: 'archivekeeper', tile: { x: 30, y: 32 }, radius: 8, ring: 'taihurocks', open: { x: 1, y: 1 }, ground: 'jade' },
    { bossId: 'magistrate', tile: { x: 130, y: 24 }, radius: 10, ring: 'dragonpillar', open: { x: 0, y: 1 }, ground: 'stone' },
  ],
  hubProps: [ // jade terrace: stairs climbing to a pagoda, lotus ponds either side, a bridge across the foot
    { kind: 'pagoda7', dx: 0, dy: -11 }, { kind: 'stairs', dx: 0, dy: -6 }, { kind: 'pavilion', dx: -10, dy: -7 }, { kind: 'pavilion', dx: 10, dy: -7 }, { kind: 'paifang', dx: 0, dy: 14 },
    { kind: 'jadebridge', dx: 0, dy: 9 }, { kind: 'lotuspond', dx: -8, dy: 3 }, { kind: 'lotuspond', dx: 8, dy: 3 }, { kind: 'dragonpillar', dx: -3, dy: -2 }, { kind: 'dragonpillar', dx: 3, dy: -2 },
    { kind: 'peachtree', dx: -13, dy: 7 }, { kind: 'peachtree', dx: 13, dy: 8 }, { kind: 'willow', dx: -10, dy: 12 }, { kind: 'floatisle', dx: -15, dy: -9 },
  ],
  npcs: {
    'warden-lian': { x: 30, y: 105 }, 'trader-yue': { x: 36, y: 111 }, 'alchemist-ning': { x: 21, y: 111 }, 'keeper-sui': { x: 27, y: 115 },
    'gardener-fen': { x: 61, y: 110 }, 'boatman-ke': { x: 100, y: 116 }, 'sentinel-zhao': { x: 48, y: 78 }, 'scholar-mei': { x: 37, y: 41 }, 'hermit-gu': { x: 132, y: 90 },
  },
  herbs: [['orchard', 12], ['mirror', 8], ['stair', 8], ['storm', 8], ['crane', 9], ['library', 8]],
  portal: { dx: -13, dy: 2 },
  portalNext: { dx: 13, dy: -6 },
  borderProp: { terrace: 'willow', orchard: 'peachtree', mirror: 'willow', stair: 'standstone', storm: 'taihurocks', crane: 'peachtree', library: 'bamboo', dais: 'dragonpillar' },
  extras: [
    { kind: 'floatisle', x: 12, y: 74 }, { kind: 'floatisle', x: 100, y: 128 }, { kind: 'floatisle', x: 76, y: 30 }, { kind: 'floatisle', x: 146, y: 118 }, { kind: 'floatisle', x: 118, y: 12 }, { kind: 'floatisle', x: 150, y: 74 },
    // jade bridges dressing the causeways over the chasms
    { kind: 'jadebridge', x: 108, y: 49, force: true }, { kind: 'jadebridge', x: 137, y: 51, force: true }, { kind: 'jadebridge', x: 52, y: 58, force: true },
    { kind: 'jadebridge', x: 30, y: 93, force: true }, { kind: 'jadebridge', x: 123, y: 102, force: true }, { kind: 'jadebridge', x: 85, y: 114, force: true },
    { kind: 'pagoda7', x: 70, y: 118 }, { kind: 'pavilion', x: 118, y: 120 }, { kind: 'pagoda7', x: 140, y: 100 }, { kind: 'goldgate', x: 122, y: 26, force: true }, { kind: 'lotusthrone', x: 134, y: 14, force: true },
  ],
};

// ---------------------------------------------------------------- zones
// tiers rise along the main path: orchard -> stair / lake -> storm -> cranes -> library -> dais
const ZONES: ZoneDef[] = [
  { id: 'terrace', chapter: 4, name: 'Nine-Cloud Terrace', anchor: { x: 28, y: 110 }, level: 'Safe', spawns: {}, mood: 'day', tier: { hp: 1, atk: 1, xp: 1 }, propTint: 0xf2f6ff },
  { id: 'orchard', chapter: 4, name: 'Peach Blossom Orchard', anchor: { x: 64, y: 108 }, level: 'Lv 26-28', spawns: { blossomsprite: 6, blossomtreant: 3, cloudhound: 6, jadesentinel: 4, cloudserpent: 4 }, mood: 'dusk', tier: { hp: 7.6, atk: 5.2, xp: 7.4 }, propTint: 0xffe6f0 },
  { id: 'mirror', chapter: 4, name: 'Mirror Lake of Heaven', anchor: { x: 104, y: 114 }, level: 'Lv 28-31', spawns: { mirrorwraith: 8, cloudserpent: 6, jadesentinel: 4, blossomsprite: 3, cloudhound: 3 }, mood: 'mist', tier: { hp: 8.6, atk: 5.8, xp: 8.6 }, propTint: 0xd0ecff },
  { id: 'stair', chapter: 4, name: 'Thousand-Step Stair', anchor: { x: 50, y: 74 }, level: 'Lv 28-31', spawns: { jadesentinel: 7, jadecolossus: 3, skyblade: 6, celestialguard: 4, cloudhound: 3 }, mood: 'day', tier: { hp: 8.9, atk: 6.0, xp: 8.8 }, propTint: 0xdfe8e8 },
  { id: 'storm', chapter: 4, name: 'Court of Storms', anchor: { x: 90, y: 66 }, level: 'Lv 30-33', spawns: { stormcrane: 7, stormhound: 6, skyblade: 4, jadesentinel: 3, cloudserpent: 3 }, mood: 'night', tier: { hp: 9.8, atk: 6.5, xp: 9.8 }, propTint: 0xa8b4d8 },
  { id: 'crane', chapter: 4, name: 'Crane Pavilions', anchor: { x: 136, y: 86 }, level: 'Lv 32-35', spawns: { stormcrane: 6, celestialguard: 7, skyblade: 5, mirrorwraith: 3, cloudhound: 3 }, mood: 'dusk', tier: { hp: 10.6, atk: 7.0, xp: 10.6 }, propTint: 0xfff0d8 },
  { id: 'library', chapter: 4, name: 'Library of Jade Slips', anchor: { x: 30, y: 32 }, level: 'Lv 33-36', spawns: { scrollwraith: 9, inkwisp: 7, jadecolossus: 3, celestialguard: 5, scribe: 3 }, mood: 'mist', tier: { hp: 11.6, atk: 7.6, xp: 11.6 }, propTint: 0xe4ecd0 },
  { id: 'dais', chapter: 4, name: "Magistrate's Dais", anchor: { x: 130, y: 24 }, level: 'Boss', spawns: {}, mood: 'night', tier: { hp: 12.4, atk: 8.0, xp: 12.4 }, propTint: 0xc8e4f0 },
];

// ---------------------------------------------------------------- enemies
// PLACEHOLDER art: every enemy below reuses a pack sprite (recoloured by `tint` and rescaled).
const ENEMY_LIST: EnemyDef[] = [
  // PLACEHOLDER art: mob.soldier, jade tint
  { id: 'jadesentinel', name: 'Jade Sentinel', behavior: 'rusher', maxHp: 62, atk: 21, def: 8, speed: 42, aggroRange: 120, attackRange: 22, attackCooldown: 1.2, strikeWindup: 0.34, xp: 40, sprite: 'mob.soldier', tint: 0x9fe8c8, scale: 0.4, radius: 8, stones: [6, 12] },
  // PLACEHOLDER art: mob.golem, deep-jade tint
  { id: 'jadecolossus', name: 'Jade Colossus', behavior: 'charger', maxHp: 120, atk: 28, def: 16, speed: 26, aggroRange: 110, attackRange: 80, attackCooldown: 2.8, windup: 0.8, dashTime: 0.5, dashSpeedMult: 4, xp: 90, sprite: 'mob.golem', tint: 0x6fe0b0, scale: 0.48, radius: 11, stones: [14, 26] },
  // PLACEHOLDER art: mob.thunderbird, white tint
  { id: 'stormcrane', name: 'Storm Crane', behavior: 'caster', maxHp: 52, atk: 22, def: 2, speed: 46, aggroRange: 160, attackRange: 140, attackCooldown: 1.4, volley: 3, preferredRange: 100, xp: 60, sprite: 'mob.thunderbird', tint: 0xe8f0ff, scale: 0.44, radius: 8, stones: [10, 18] },
  // PLACEHOLDER art: mob.snake, pale sky tint
  { id: 'cloudserpent', name: 'Cloud Serpent', behavior: 'rusher', maxHp: 64, atk: 16, def: 2, speed: 54, aggroRange: 110, attackRange: 16, attackCooldown: 0.85, strikeWindup: 0.26, xp: 32, sprite: 'mob.snake', tint: 0xe0f4ff, scale: 0.4, radius: 7, stones: [4, 9] },
  // PLACEHOLDER art: mob.paperdoll, gold tint
  { id: 'scrollwraith', name: 'Scroll Wraith', behavior: 'rusher', maxHp: 46, atk: 19, def: 1, speed: 56, aggroRange: 110, attackRange: 16, attackCooldown: 0.95, strikeWindup: 0.28, xp: 38, sprite: 'mob.paperdoll', tint: 0xffe8a0, scale: 0.38, radius: 7, stones: [5, 10] },
  // PLACEHOLDER art: mob.ghost, ink-violet tint
  { id: 'inkwisp', name: 'Ink Wisp', behavior: 'caster', maxHp: 58, atk: 24, def: 0, speed: 42, aggroRange: 150, attackRange: 125, attackCooldown: 1.6, volley: 2, preferredRange: 95, xp: 55, sprite: 'mob.ghost', tint: 0x7878c0, scale: 0.4, radius: 7, stones: [8, 15] },
  // PLACEHOLDER art: mob.soldier, gold tint
  { id: 'celestialguard', name: 'Celestial Guard', behavior: 'rusher', maxHp: 92, atk: 20, def: 14, speed: 40, aggroRange: 120, attackRange: 24, attackCooldown: 1.3, strikeWindup: 0.38, xp: 70, sprite: 'mob.soldier', tint: 0xffd878, scale: 0.42, radius: 9, stones: [10, 20] },
  // PLACEHOLDER art: mob.swordspirit_v_gold
  { id: 'skyblade', name: 'Heavenly Sword Spirit', behavior: 'charger', maxHp: 56, atk: 24, def: 4, speed: 44, aggroRange: 140, attackRange: 100, attackCooldown: 2.0, windup: 0.42, dashTime: 0.35, dashSpeedMult: 6, xp: 52, sprite: 'mob.swordspirit_v_gold', scale: 0.42, radius: 8, stones: [8, 14] },
  // PLACEHOLDER art: mob.peachspirit, pink tint
  { id: 'blossomsprite', name: 'Blossom Sprite', behavior: 'caster', maxHp: 46, atk: 20, def: 0, speed: 38, aggroRange: 140, attackRange: 110, attackCooldown: 1.5, volley: 2, preferredRange: 75, xp: 42, sprite: 'mob.peachspirit', tint: 0xffc8e0, scale: 0.38, radius: 7, stones: [5, 10] },
  // PLACEHOLDER art: mob.treant, pink tint
  { id: 'blossomtreant', name: 'Blossom Treant', behavior: 'charger', maxHp: 130, atk: 27, def: 9, speed: 28, aggroRange: 110, attackRange: 76, attackCooldown: 2.8, windup: 0.7, dashTime: 0.45, dashSpeedMult: 4, xp: 78, sprite: 'mob.treant', tint: 0xffb8d8, scale: 0.5, radius: 10, stones: [12, 22] },
  // PLACEHOLDER art: mob.ghost_v_violet, ice-blue tint
  { id: 'mirrorwraith', name: 'Mirror Wraith', behavior: 'caster', maxHp: 50, atk: 21, def: 0, speed: 40, aggroRange: 150, attackRange: 120, attackCooldown: 1.5, volley: 2, preferredRange: 90, xp: 46, sprite: 'mob.ghost_v_violet', tint: 0xc0f0ff, scale: 0.4, radius: 7, stones: [6, 12] },
  // PLACEHOLDER art: mob.wolf, white tint
  { id: 'cloudhound', name: 'Cloud Hound', behavior: 'rusher', maxHp: 76, atk: 17, def: 3, speed: 72, aggroRange: 130, attackRange: 18, attackCooldown: 0.85, strikeWindup: 0.26, xp: 36, sprite: 'mob.wolf', tint: 0xf4f4ff, scale: 0.42, radius: 8, stones: [5, 10] },
  // PLACEHOLDER art: mob.wolf, storm-blue tint
  { id: 'stormhound', name: 'Thunder Hound', behavior: 'charger', maxHp: 70, atk: 25, def: 4, speed: 52, aggroRange: 140, attackRange: 110, attackCooldown: 2.2, windup: 0.5, dashTime: 0.4, dashSpeedMult: 5, xp: 58, sprite: 'mob.wolf', tint: 0xa8b0ff, scale: 0.46, radius: 8, stones: [8, 15] },
  // ---- found mostly underground
  // PLACEHOLDER art: mob.bat, jade tint
  { id: 'veinbat', name: 'Jadevein Bat', behavior: 'rusher', maxHp: 62, atk: 13, def: 0, speed: 90, aggroRange: 140, attackRange: 14, attackCooldown: 0.65, strikeWindup: 0.22, xp: 26, sprite: 'mob.bat', tint: 0x70ffc0, scale: 0.34, radius: 6, stones: [3, 7] },
  // PLACEHOLDER art: mob.golem, ore-gold tint
  { id: 'oregolem', name: 'Ore Golem', behavior: 'charger', maxHp: 140, atk: 29, def: 18, speed: 24, aggroRange: 110, attackRange: 80, attackCooldown: 3.0, windup: 0.85, dashTime: 0.5, dashSpeedMult: 4, xp: 100, sprite: 'mob.golem', tint: 0xe8d070, scale: 0.5, radius: 12, stones: [16, 28] },
  // PLACEHOLDER art: mob.skeleton, parchment tint
  { id: 'scribe', name: 'Archive Scribe', behavior: 'caster', maxHp: 54, atk: 25, def: 2, speed: 40, aggroRange: 150, attackRange: 130, attackCooldown: 1.5, volley: 3, preferredRange: 100, xp: 58, sprite: 'mob.skeleton', tint: 0xf0e0b8, scale: 0.4, radius: 8, stones: [9, 16] },
  // PLACEHOLDER art: mob.soldier, silver tint
  { id: 'mirrorknight', name: 'Mirror Knight', behavior: 'rusher', maxHp: 88, atk: 18, def: 13, speed: 44, aggroRange: 120, attackRange: 24, attackCooldown: 1.25, strikeWindup: 0.36, xp: 68, sprite: 'mob.soldier', tint: 0xc8d4e8, scale: 0.42, radius: 9, stones: [10, 19] },
  // PLACEHOLDER art: mob.foxfire, moon-blue tint
  { id: 'moonwisp', name: 'Moon Wisp', behavior: 'caster', maxHp: 52, atk: 24, def: 0, speed: 42, aggroRange: 150, attackRange: 125, attackCooldown: 1.5, volley: 2, preferredRange: 90, xp: 52, sprite: 'mob.foxfire', tint: 0xb8d0ff, scale: 0.4, radius: 7, stones: [7, 13] },
  // PLACEHOLDER art: mob.bat, pale blue tint
  { id: 'echobat', name: 'Echo Bat', behavior: 'rusher', maxHp: 66, atk: 12, def: 0, speed: 92, aggroRange: 140, attackRange: 14, attackCooldown: 0.65, strikeWindup: 0.22, xp: 28, sprite: 'mob.bat', tint: 0xb0c0ff, scale: 0.34, radius: 6, stones: [3, 7] },
];

// ---------------------------------------------------------------- bosses
// PLACEHOLDER art for every boss: pack mobs / boss sheets, enlarged and tinted.
const CRANELORD: BossDef = {
  id: 'cranelord', chapter: 4, name: 'Storm Crane Lord', home: 'storm', zone: 'storm', xp: 3400, stones: [380, 520],
  sprite: 'mob.thunderbird', tint: 0xf4faff, scale: 0.95, radius: 24, maxHp: 52000, atk: 130, def: 20, speed: 46,
  moves: {
    sweep: { range: 96, halfAngle: 1.2, windup: 0.65, recover: 0.45, cooldown: 3, damageMult: 1.4, triggerRange: 92 },
    charge: { windup: 0.7, duration: 0.5, speed: 320, width: 26, recover: 0.65, cooldown: 4.6, damageMult: 1.6, minRange: 14, maxRange: 260 },
    rain: { count: 8, radius: 30, spread: 130, windup: 0.5, delay: 0.95, recover: 0.4, cooldown: 5.4, damageMult: 1.2 },
    teleport: { windup: 0.7, recover: 0.4, cooldown: 8, behind: 44, radius: 50, damageMult: 1.5 },
    summon: { windup: 0.75, cooldown: 13, count: 3, maxMinions: 5, minionType: 'stormcrane' },
    ring: { windup: 0.7, cooldown: 6, projectiles: 14, damageMult: 1.0 },
  },
  kit: [['sweep', 'charge'], ['charge', 'rain', 'summon', 'sweep'], ['teleport', 'rain', 'ring', 'charge', 'sweep']],
  phase2At: 0.66, phase3At: 0.33, enrage: { speedMult: 1.35, cooldownMult: 0.68 },
};

const ARCHIVEKEEPER: BossDef = {
  id: 'archivekeeper', chapter: 4, name: 'Keeper of the Jade Archive', home: 'library', zone: 'library', xp: 4200, stones: [450, 600],
  sprite: 'boss.ninetail', tint: 0xffe6a8, scale: 0.46, radius: 24, maxHp: 64000, atk: 145, def: 24, speed: 44,
  moves: {
    slam: { radius: 62, windup: 0.85, recover: 0.5, cooldown: 4, damageMult: 1.7, triggerRange: 94 },
    sweep: { range: 92, halfAngle: 1.2, windup: 0.65, recover: 0.45, cooldown: 3, damageMult: 1.4, triggerRange: 90 },
    rain: { count: 9, radius: 30, spread: 140, windup: 0.5, delay: 1.0, recover: 0.4, cooldown: 5.4, damageMult: 1.2 },
    teleport: { windup: 0.75, recover: 0.45, cooldown: 8, behind: 46, radius: 52, damageMult: 1.6 },
    summon: { windup: 0.8, cooldown: 12, count: 3, maxMinions: 6, minionType: 'scrollwraith' },
    ring: { windup: 0.75, cooldown: 6, projectiles: 14, damageMult: 1.0 },
  },
  kit: [['sweep', 'rain'], ['slam', 'rain', 'summon', 'sweep'], ['teleport', 'ring', 'rain', 'summon', 'slam', 'sweep']],
  phase2At: 0.66, phase3At: 0.33, enrage: { speedMult: 1.35, cooldownMult: 0.66 },
};

const MAGISTRATE: BossDef = {
  id: 'magistrate', chapter: 4, name: 'Celestial Magistrate', home: 'dais', zone: 'dais', xp: 7000, stones: [800, 1100],
  sprite: 'boss.fallenimmortal', tint: 0xd8f4ff, scale: 0.8, radius: 24, maxHp: 118000, atk: 170, def: 28, speed: 44,
  moves: {
    slam: { radius: 68, windup: 0.85, recover: 0.45, cooldown: 3.8, damageMult: 1.8, triggerRange: 100 },
    sweep: { range: 100, halfAngle: 1.0, windup: 0.7, recover: 0.45, cooldown: 3, damageMult: 1.5, triggerRange: 96 },
    charge: { windup: 0.7, duration: 0.5, speed: 330, width: 26, recover: 0.6, cooldown: 5, damageMult: 1.6, minRange: 14, maxRange: 270 },
    rain: { count: 10, radius: 30, spread: 150, windup: 0.5, delay: 0.95, recover: 0.4, cooldown: 5, damageMult: 1.25 },
    teleport: { windup: 0.7, recover: 0.4, cooldown: 7.5, behind: 48, radius: 54, damageMult: 1.75 },
    summon: { windup: 0.8, cooldown: 13, count: 3, maxMinions: 6, minionType: 'celestialguard' },
    ring: { windup: 0.75, cooldown: 5.6, projectiles: 16, damageMult: 1.05 },
  },
  kit: [['slam', 'sweep', 'charge'], ['slam', 'rain', 'summon', 'teleport', 'sweep'], ['rain', 'teleport', 'ring', 'charge', 'slam', 'sweep', 'summon']],
  phase2At: 0.66, phase3At: 0.33, enrage: { speedMult: 1.4, cooldownMult: 0.62 },
};

const CLOUDWYRM: BossDef = {
  id: 'cloudwyrm', chapter: 4, dungeon: 'cloudhollow', name: 'Cloudwyrm of the Hollow', home: 'cloudhollow', zone: 'cloudhollow', xp: 2400, stones: [260, 360],
  sprite: 'boss.jiaolong', tint: 0xdff4ff, scale: 0.42, radius: 24, maxHp: 30000, atk: 118, def: 18, speed: 44,
  moves: {
    slam: { radius: 56, windup: 0.85, recover: 0.5, cooldown: 4.2, damageMult: 1.6, triggerRange: 90 },
    sweep: { range: 96, halfAngle: 1.1, windup: 0.65, recover: 0.45, cooldown: 3, damageMult: 1.4, triggerRange: 92 },
    charge: { windup: 0.75, duration: 0.55, speed: 300, width: 26, recover: 0.7, cooldown: 5, damageMult: 1.5, minRange: 14, maxRange: 250 },
    rain: { count: 7, radius: 28, spread: 120, windup: 0.5, delay: 0.95, recover: 0.4, cooldown: 5.5, damageMult: 1.1 },
    summon: { windup: 0.75, cooldown: 13, count: 2, maxMinions: 4, minionType: 'cloudserpent' },
    ring: { windup: 0.75, cooldown: 6.5, projectiles: 12, damageMult: 0.95 },
  },
  kit: [['sweep', 'rain'], ['sweep', 'charge', 'ring', 'summon'], ['rain', 'ring', 'charge', 'slam', 'sweep']],
  phase2At: 0.66, phase3At: 0.33, enrage: { speedMult: 1.3, cooldownMult: 0.7 },
};

const SEAMTYRANT: BossDef = {
  id: 'seamtyrant', chapter: 4, dungeon: 'jademine', name: 'Jade Seam Tyrant', home: 'jademine', zone: 'jademine', xp: 3000, stones: [320, 440],
  sprite: 'mob.golem', tint: 0x40d890, scale: 1.1, radius: 28, maxHp: 38000, atk: 135, def: 30, speed: 32,
  moves: {
    slam: { radius: 70, windup: 1.0, recover: 0.6, cooldown: 4.2, damageMult: 1.9, triggerRange: 100 },
    sweep: { range: 104, halfAngle: 1.1, windup: 0.8, recover: 0.5, cooldown: 3.4, damageMult: 1.5, triggerRange: 98 },
    charge: { windup: 0.85, duration: 0.5, speed: 280, width: 30, recover: 0.8, cooldown: 5.6, damageMult: 1.7, minRange: 16, maxRange: 240 },
    rain: { count: 9, radius: 32, spread: 140, windup: 0.55, delay: 1.0, recover: 0.4, cooldown: 5.5, damageMult: 1.2 },
    summon: { windup: 0.8, cooldown: 14, count: 2, maxMinions: 4, minionType: 'oregolem' },
  },
  kit: [['slam', 'sweep'], ['slam', 'rain', 'summon', 'sweep'], ['rain', 'charge', 'slam', 'sweep', 'summon']],
  phase2At: 0.66, phase3At: 0.33, enrage: { speedMult: 1.3, cooldownMult: 0.7 },
};

const VAULTCALLIGRAPHER: BossDef = {
  id: 'vaultcalligrapher', chapter: 4, dungeon: 'scrollvault', name: 'Calligrapher of the Sealed Vault', home: 'scrollvault', zone: 'scrollvault', xp: 3800, stones: [380, 520],
  sprite: 'boss.fallenimmortal', tint: 0xffe8a8, scale: 0.55, radius: 22, maxHp: 44000, atk: 150, def: 22, speed: 42,
  moves: {
    slam: { radius: 60, windup: 0.85, recover: 0.5, cooldown: 4, damageMult: 1.7, triggerRange: 92 },
    sweep: { range: 90, halfAngle: 1.0, windup: 0.7, recover: 0.45, cooldown: 3, damageMult: 1.45, triggerRange: 90 },
    rain: { count: 10, radius: 30, spread: 140, windup: 0.5, delay: 0.95, recover: 0.4, cooldown: 5, damageMult: 1.2 },
    teleport: { windup: 0.75, recover: 0.45, cooldown: 8, behind: 44, radius: 50, damageMult: 1.6 },
    summon: { windup: 0.8, cooldown: 12, count: 3, maxMinions: 6, minionType: 'scrollwraith' },
    ring: { windup: 0.75, cooldown: 6, projectiles: 16, damageMult: 1.0 },
  },
  kit: [['slam', 'sweep'], ['rain', 'summon', 'slam', 'sweep'], ['teleport', 'ring', 'rain', 'summon', 'slam']],
  phase2At: 0.66, phase3At: 0.33, enrage: { speedMult: 1.35, cooldownMult: 0.68 },
};

const MIRRORQUEEN: BossDef = {
  id: 'mirrorqueen', chapter: 4, dungeon: 'moonpalace', name: 'Lady of the Moon Mirror', home: 'moonpalace', zone: 'moonpalace', xp: 4000, stones: [400, 560],
  sprite: 'boss.ninetail', tint: 0xc8e0ff, scale: 0.44, radius: 22, maxHp: 48000, atk: 155, def: 22, speed: 48,
  moves: {
    sweep: { range: 86, halfAngle: 1.3, windup: 0.6, recover: 0.4, cooldown: 2.8, damageMult: 1.35, triggerRange: 84 },
    charge: { windup: 0.7, duration: 0.5, speed: 320, width: 24, recover: 0.65, cooldown: 4.4, damageMult: 1.55, minRange: 12, maxRange: 250 },
    rain: { count: 8, radius: 30, spread: 130, windup: 0.45, delay: 0.9, recover: 0.4, cooldown: 5, damageMult: 1.2 },
    teleport: { windup: 0.65, recover: 0.4, cooldown: 7, behind: 42, radius: 50, damageMult: 1.55 },
    summon: { windup: 0.75, cooldown: 12, count: 3, maxMinions: 5, minionType: 'moonwisp' },
    ring: { windup: 0.7, cooldown: 5.6, projectiles: 16, damageMult: 1.0 },
  },
  kit: [['sweep', 'charge'], ['charge', 'rain', 'summon', 'sweep'], ['teleport', 'charge', 'ring', 'rain', 'summon', 'sweep']],
  phase2At: 0.66, phase3At: 0.33, enrage: { speedMult: 1.4, cooldownMult: 0.65 },
};

// ---------------------------------------------------------------- dungeons
const CLOUDHOLLOW: DungeonDef = {
  id: 'cloudhollow', name: 'Cloudhollow Cavern', chapter: 4, kind: 'cave', blurb: 'a wind-bored cavern under the orchard terrace',
  entrance: { x: 62, y: 122, zone: 'orchard' }, minLevel: 26, level: 'Lv 27-30', seed: 0xc10d01, size: { w: 82, h: 60 }, floor: 'cloud', wall: 'wall',
  scatter: [{ kind: 'rock', p: 0.02 }, { kind: 'taihurocks', p: 0.004 }, { kind: 'orchid', p: 0.012 }, { kind: 'petals', p: 0.01 }],
  spawns: { cloudserpent: 6, cloudhound: 6, veinbat: 7, blossomsprite: 3, stormhound: 3 }, mood: 'mist', tier: { hp: 9.4, atk: 6.2, xp: 10 }, propTint: 0xd8ecff,
  boss: 'cloudwyrm', reward: { xp: 2600, stones: 900, items: [{ id: 'jade-wyrm-pearl', count: 1 }, { id: 'jade-hp-potion', count: 4 }, { id: 'jade-pill', count: 2 }] }, herbs: 6,
};

const JADEMINE: DungeonDef = {
  id: 'jademine', name: 'Seamdeep Jade Mine', chapter: 4, kind: 'cave', blurb: 'the old quarry where the terraces were cut',
  entrance: { x: 62, y: 82, zone: 'stair' }, minLevel: 29, level: 'Lv 30-33', seed: 0x5ea7d3, size: { w: 90, h: 64 }, floor: 'basalt', wall: 'wall',
  scatter: [{ kind: 'rock', p: 0.03 }, { kind: 'taihurocks', p: 0.008 }, { kind: 'standstone', p: 0.006 }, { kind: 'dragonpillar', p: 0.002 }],
  spawns: { jadesentinel: 7, oregolem: 4, veinbat: 8, jadecolossus: 3, skyblade: 3 }, mood: 'night', tier: { hp: 10.8, atk: 7.0, xp: 12 }, propTint: 0xa8e8c8,
  boss: 'seamtyrant', reward: { xp: 3200, stones: 1200, items: [{ id: 'jade-miner-plate', count: 1 }, { id: 'jade-elixir', count: 2 }, { id: 'jade-ore', count: 6 }] }, herbs: 5,
};

const SCROLLVAULT: DungeonDef = {
  id: 'scrollvault', name: 'Sealed Scripture Vault', chapter: 4, kind: 'realm', blurb: 'a vault of forbidden scrolls, folded out of the library',
  entrance: { x: 14, y: 34, zone: 'library' }, minLevel: 32, level: 'Lv 34-37', seed: 0x5c701a, size: { w: 100, h: 56 }, floor: 'jade', wall: 'void', rooms: 5,
  scatter: [{ kind: 'bamboo', p: 0.006 }, { kind: 'standstone', p: 0.005 }, { kind: 'pavilion', p: 0.0006 }, { kind: 'orchid', p: 0.01 }],
  spawns: { scrollwraith: 8, inkwisp: 6, scribe: 6, celestialguard: 4, jadecolossus: 2 }, mood: 'mist', tier: { hp: 12.2, atk: 8.0, xp: 14 }, propTint: 0xf0e8c0,
  boss: 'vaultcalligrapher', reward: { xp: 3800, stones: 1600, items: [{ id: 'jade-vault-robe', count: 1 }, { id: 'jade-elixir', count: 3 }, { id: 'jade-pill', count: 3 }] }, herbs: 6,
};

const MOONPALACE: DungeonDef = {
  id: 'moonpalace', name: 'Palace Beneath the Moon Mirror', chapter: 4, kind: 'realm', blurb: 'a palace that exists only in the reflection of the lake',
  entrance: { x: 118, y: 111, zone: 'mirror' }, minLevel: 33, level: 'Lv 35-38', seed: 0x300a1e, size: { w: 104, h: 56 }, floor: 'stone', wall: 'void', rooms: 5,
  scatter: [{ kind: 'lotusbowl', p: 0.002 }, { kind: 'stonecircle', p: 0.0012 }, { kind: 'willow', p: 0.003 }, { kind: 'petals', p: 0.012 }],
  spawns: { mirrorknight: 7, mirrorwraith: 6, moonwisp: 6, echobat: 6, celestialguard: 3 }, mood: 'frost', tier: { hp: 13.0, atk: 8.4, xp: 15 }, propTint: 0xc8d8ff,
  boss: 'mirrorqueen', reward: { xp: 4200, stones: 1800, items: [{ id: 'jade-moon-pendant', count: 1 }, { id: 'jade-elixir', count: 3 }, { id: 'jade-pill', count: 3 }] }, herbs: 6,
};

// ---------------------------------------------------------------- items
const potion = (id: string, name: string, desc: string, value: number, rarity: ItemDef['rarity'], extra: Pick<ItemDef, 'heal' | 'mana' | 'qi'>): ItemDef => ({ id, name, type: 'consumable', maxStack: 10, description: desc, value, rarity, ...extra });
const quest = (id: string, name: string, desc: string, value: number): ItemDef => ({ id, name, type: 'quest', maxStack: 20, description: desc, value, rarity: 'uncommon' });

const ITEM_LIST: ItemDef[] = [
  potion('jade-hp-potion', 'Celestial Vitality Draught', 'Restores 320 HP.', 90, 'uncommon', { heal: 320 }),
  potion('jade-mana-potion', 'Celestial Clarity Draught', 'Restores 200 mana.', 90, 'uncommon', { mana: 200 }),
  potion('jade-pill', 'Nine-Cloud Qi Pill', 'Adds 180 qi.', 120, 'rare', { qi: 180 }),
  potion('jade-elixir', 'Peach-Blossom Elixir', 'Restores 700 HP.', 260, 'rare', { heal: 700 }),
  { id: 'jade-ore', name: 'Raw Jade Ore', type: 'material', maxStack: 20, description: 'Heavy, cold, faintly singing. The mine-masters pay well for it.', value: 60, rarity: 'uncommon' },
  quest('jade-peach', 'Heavenly Peach', 'A peach that ripened in the thin air. It smells of rain.', 40),
  quest('jade-slip-scrap', 'Charred Jade Slip', 'A scrap of a scripture, scorched by furnace smoke.', 40),
  quest('jade-feather', 'Storm Crane Feather', 'White, crackling with static.', 40),
  // gear below the ladder's best (heaven-sword / heaven-robe / jade-seal)
  { id: 'jade-crane-saber', name: 'Saber of the Crane Lord', type: 'equipment', slot: 'weapon', maxStack: 1, description: '+56 attack. It hums before thunder.', value: 7600, rarity: 'epic', weaponAtk: 56 },
  { id: 'jade-miner-plate', name: 'Seamdeep Miner\'s Plate', type: 'equipment', slot: 'armor', maxStack: 1, description: '+49 defence, +250 HP. Jade dust in every joint.', value: 7000, rarity: 'epic', defBonus: 49, hpBonus: 250 },
  { id: 'jade-vault-robe', name: 'Vault-Scribe Robe', type: 'equipment', slot: 'armor', maxStack: 1, description: '+51 defence, +270 HP. Sewn with sealed verses.', value: 8000, rarity: 'epic', defBonus: 51, hpBonus: 270 },
  { id: 'jade-wyrm-pearl', name: 'Cloudwyrm Pearl', type: 'equipment', slot: 'charm', maxStack: 1, description: '+60 mana, +3 mana regeneration, +12 defence.', value: 6000, rarity: 'epic', manaBonus: 60, regenBonus: 3, defBonus: 12 },
  { id: 'jade-moon-pendant', name: 'Moon-Mirror Pendant', type: 'equipment', slot: 'charm', maxStack: 1, description: '+10 attack, +6% critical chance, +50 mana.', value: 7200, rarity: 'epic', atkBonus: 10, critBonus: 0.06, manaBonus: 50 },
];

const ICONS: ChapterContent['icons'] = {
  'jade-hp-potion': { kind: 'ui', key: 'item_gourd' }, 'jade-mana-potion': { kind: 'ui', key: 'item_conch' }, 'jade-pill': { kind: 'ui', key: 'item_pill_bottle' }, 'jade-elixir': { kind: 'ui', key: 'item_ginseng' },
  'jade-ore': { kind: 'ui', key: 'item_spirit_stone' }, 'jade-peach': { kind: 'ui', key: 'item_peach' }, 'jade-slip-scrap': { kind: 'ui', key: 'item_jade_slip' }, 'jade-feather': { kind: 'ui', key: 'item_talisman' },
  'jade-crane-saber': { kind: 'icon', key: 'blade_01_05' }, 'jade-miner-plate': { kind: 'icon', key: 'relic_02_03' }, 'jade-vault-robe': { kind: 'icon', key: 'relic_01_04' },
  'jade-wyrm-pearl': { kind: 'icon', key: 'relic_02_01' }, 'jade-moon-pendant': { kind: 'icon', key: 'relic_01_05' },
};

// ---------------------------------------------------------------- npcs
const NPC_MAP: Record<string, NpcDef> = {
  // PLACEHOLDER art: hero sprites and portraits are reused across NPCs
  'warden-lian': { chapter: 4, sprite: 'hero.heroine', role: 'Warden Lian · Quests', name: 'Warden Lian', portrait: 'fairy_neutral', quests: ['jade-ascent', 'jade-storm-lord', 'jade-magistrate'], idle: 'The wind is steady on the terrace. Below the cloud line, nothing is.' },
  'trader-yue': { chapter: 4, sprite: 'hero.twinblade', role: 'Trader Yue · Shop', blurb: 'Terrace prices are spirit-stone prices. Cloudscale, jade, draughts.', name: 'Trader Yue', portrait: 'innkeeper_neutral', quests: [], idle: 'Everything here was carried up the stair on someone\'s back. Mind the price.', trade: 'shop', stock: 'jade' },
  'alchemist-ning': { chapter: 4, sprite: 'hero.fanscholar', role: 'Alchemist Ning · Alchemy', blurb: 'Peach, jade dust and a slow fire. Bring herbs.', name: 'Alchemist Ning', portrait: 'doctor_neutral', quests: ['jade-mine-dust'], idle: 'Fire slow, patience slower. What are we brewing?', trade: 'alchemy', recipes: 'jade' },
  'keeper-sui': { chapter: 4, sprite: 'hero.monk', role: 'Keeper Sui · Trial Rift', name: 'Keeper Sui', portrait: 'nun_neutral', quests: [], idle: 'The Rift opens a floor for every one you clear. How deep can you go?', trade: 'tower' },
  'gardener-fen': { chapter: 4, sprite: 'hero.staffbeggar', role: 'Gardener Fen · Quests', name: 'Gardener Fen', portrait: 'granny_neutral', quests: ['jade-peach-wine'], idle: 'Forty summers I have pruned these trees. They have never once fruited out of season. Until now.' },
  'boatman-ke': { chapter: 4, sprite: 'hero.spearman', role: 'Boatman Ke · Quests', name: 'Boatman Ke', portrait: 'boatman_neutral', quests: ['jade-lake-lanterns', 'jade-moon-echo'], idle: 'The lake is a mirror. Do not look too long at the other side.' },
  'sentinel-zhao': { chapter: 4, sprite: 'hero.saber', role: 'Sentinel Zhao · Quests', name: 'Sentinel Zhao', portrait: 'general_neutral', quests: ['jade-stair-toll', 'jade-cavern-echo'], idle: 'A thousand steps, and every step a guard. I used to count them.' },
  'scholar-mei': { chapter: 4, sprite: 'hero.archer', role: 'Scholar Mei · Quests', name: 'Scholar Mei', portrait: 'scholar_neutral', quests: ['jade-archive-keeper', 'jade-lost-slips', 'jade-vault-key'], idle: 'The slips remember everything. That is the problem with them.' },
  'hermit-gu': { chapter: 4, sprite: 'hero.swordsman', role: 'Hermit Gu · Lore', name: 'Hermit Gu', portrait: 'taoist_neutral', quests: ['jade-crane-feathers'], idle: 'I was an immortal once. Then I looked down, and could not stop looking.' },
};

// ---------------------------------------------------------------- quests
const QUEST_LIST: QuestDef[] = [
  // ---- main chain
  {
    id: 'jade-ascent', chapter: 4, name: 'Up the Closed Gate', giver: 'warden-lian',
    intro: 'You came through the Jade Gate? It has been shut for a season. Sentinels of jade patrol the orchard and the stair now, and blossom sprites bewitch whoever walks the petals. Cull eight Jade Sentinels and six Blossom Sprites, and the road east is yours.',
    reminder: 'Eight Jade Sentinels and six Blossom Sprites, in the Peach Blossom Orchard and on the stair beyond it.',
    completeText: 'The road holds. Take these; the Magistrate\'s beasts will not be so gentle.',
    objectives: [{ type: 'kill', target: 'jadesentinel', count: 8, label: 'Smash Jade Sentinels' }, { type: 'kill', target: 'blossomsprite', count: 6, label: 'Banish Blossom Sprites' }],
    reward: { xp: 1060, stones: 700, items: [{ id: 'jade-hp-potion', count: 4 }, { id: 'jade-mana-potion', count: 3 }] },
  },
  {
    id: 'jade-storm-lord', chapter: 4, name: 'The Crane That Calls Thunder', giver: 'warden-lian', requires: 'jade-ascent',
    intro: 'The thunder over the Court of Storms is not weather. The Magistrate\'s crane lord answers his call, and the sky answers the crane. Follow the stair road north-east and bring the Storm Crane Lord down.',
    reminder: 'The Storm Crane Lord holds the Court of Storms, north-east along the stair road.',
    completeText: 'The clouds are quiet. Its saber is yours; the Court owes it to you.',
    objectives: [{ type: 'kill', target: 'cranelord', count: 1, label: 'Slay the Storm Crane Lord' }],
    reward: { xp: 1440, stones: 1100, items: [{ id: 'jade-hp-potion', count: 4 }, { id: 'jade-pill', count: 2 }] },
  },
  {
    id: 'jade-archive-keeper', chapter: 4, name: 'What the Archive Remembers', giver: 'scholar-mei', requires: 'jade-storm-lord',
    intro: 'The Archive Keeper was a gentle thing once. When the smoke stained the slips it decided that knowledge from below must be burned, and now it burns everything. It guards the way to the dais. End it, and save what slips remain.',
    reminder: 'The Keeper of the Jade Archive is at the heart of the Library, north-west of the stair.',
    completeText: 'The slips are quiet. The Magistrate\'s dais is open to you now. Go. Finish this.',
    objectives: [{ type: 'kill', target: 'archivekeeper', count: 1, label: 'Slay the Keeper of the Jade Archive' }],
    reward: { xp: 1750, stones: 1400, items: [{ id: 'jade-elixir', count: 3 }, { id: 'jade-mana-potion', count: 4 }] },
  },
  {
    id: 'jade-magistrate', chapter: 4, name: 'The Celestial Magistrate', giver: 'warden-lian', requires: 'jade-archive-keeper',
    intro: 'The last judge sits on his dais at the top of the terraces. He is not cruel; he is certain, which is worse. Cross the causeway north-east of the Court of Storms and show him the mortal world is more than smoke.',
    reminder: 'Follow either causeway north to the Magistrate\'s Dais, in the far north-east.',
    completeText: 'The gate is open. For the first time in an age, the sky is willing to listen. Rest, climber. There is more below the clouds than any of us knew.',
    objectives: [{ type: 'kill', target: 'magistrate', count: 1, label: 'Defeat the Celestial Magistrate' }],
    reward: { xp: 2660, stones: 2500, items: [{ id: 'jade-elixir', count: 5 }, { id: 'jade-pill', count: 4 }] },
  },
  // ---- side quests
  {
    id: 'jade-peach-wine', chapter: 4, name: 'Peaches Out of Season', giver: 'gardener-fen', requires: 'jade-ascent',
    intro: 'My treants have gone wild and the peaches ripen too fast and rot before I can reach them. Fell six Blossom Treants and bring me five Heavenly Peaches from the trees, and I will brew you something worth drinking.',
    reminder: 'Six Blossom Treants and five Heavenly Peaches in the orchard.',
    completeText: 'Sweet as the first spring. Drink slowly; it is stronger than it tastes.',
    objectives: [{ type: 'kill', target: 'blossomtreant', count: 6, label: 'Fell Blossom Treants' }, { type: 'collect', item: 'jade-peach', count: 5, label: 'Gather Heavenly Peaches' }],
    reward: { xp: 760, stones: 500, items: [{ id: 'jade-elixir', count: 2 }, { id: 'jade-mana-potion', count: 3 }] },
  },
  {
    id: 'jade-lake-lanterns', chapter: 4, name: 'Lanterns for the Drowned', giver: 'boatman-ke', requires: 'jade-ascent',
    intro: 'On still nights the lake shows a second sky, and things step out of it with my lost passengers\' faces. Banish eight Mirror Wraiths and bring me four Spirit Herbs to light the lanterns.',
    reminder: 'Eight Mirror Wraiths and four Spirit Herbs by the Mirror Lake.',
    completeText: 'The lanterns burn steady. Thank you. They can rest now.',
    objectives: [{ type: 'kill', target: 'mirrorwraith', count: 8, label: 'Banish Mirror Wraiths' }, { type: 'collect', item: 'spirit-herb', count: 4, label: 'Gather Spirit Herbs' }],
    reward: { xp: 840, stones: 600, items: [{ id: 'jade-hp-potion', count: 4 }, { id: 'jade-pill', count: 1 }] },
  },
  {
    id: 'jade-stair-toll', chapter: 4, name: 'The Thousand-Step Toll', giver: 'sentinel-zhao', requires: 'jade-ascent',
    intro: 'The stair\'s old wards now strike at anyone who climbs. Break six Jade Colossi and two of the elite guardians that lead them, and the steps will be safe again.',
    reminder: 'Six Jade Colossi and two elites on the Thousand-Step Stair.',
    completeText: 'Quieter already. Take this. You earned it more honestly than I did mine.',
    objectives: [{ type: 'kill', target: 'jadecolossus', count: 6, label: 'Shatter Jade Colossi' }, { type: 'elite', count: 2, label: 'Slay Elite Monsters' }],
    reward: { xp: 990, stones: 800, items: [{ id: 'jade-elixir', count: 2 }, { id: 'jade-hp-potion', count: 3 }] },
  },
  {
    id: 'jade-cavern-echo', chapter: 4, name: 'The Wyrm Under the Orchard', giver: 'sentinel-zhao', requires: 'jade-stair-toll',
    intro: 'Something old turns in the cavern under the orchard terrace, and the whole stair feels it. Go down into Cloudhollow Cavern and slay the Cloudwyrm.',
    reminder: 'Cloudhollow Cavern lies on the south edge of the Peach Blossom Orchard.',
    completeText: 'The stair has stopped shaking. Good work, climber.',
    objectives: [{ type: 'kill', target: 'cloudwyrm', count: 1, label: 'Slay the Cloudwyrm' }],
    reward: { xp: 1220, stones: 1000, items: [{ id: 'jade-hp-potion', count: 5 }, { id: 'jade-pill', count: 2 }] },
  },
  {
    id: 'jade-lost-slips', chapter: 4, name: 'Scraps of Scripture', giver: 'scholar-mei', requires: 'jade-ascent',
    intro: 'The scroll wraiths are made of the slips that burned. If I can piece enough of them together I might learn what the Magistrate was told. Banish eight Scroll Wraiths and bring me six Charred Jade Slips.',
    reminder: 'Eight Scroll Wraiths and six Charred Jade Slips, in the Library of Jade Slips.',
    completeText: 'It is worse than I feared and better than I hoped. The smoke did not poison the Magistrate; someone told him it did.',
    objectives: [{ type: 'kill', target: 'scrollwraith', count: 8, label: 'Banish Scroll Wraiths' }, { type: 'collect', item: 'jade-slip-scrap', count: 6, label: 'Gather Charred Jade Slips' }],
    reward: { xp: 1060, stones: 800, items: [{ id: 'jade-mana-potion', count: 4 }, { id: 'jade-pill', count: 2 }] },
  },
  {
    id: 'jade-vault-key', chapter: 4, name: 'The Sealed Vault', giver: 'scholar-mei', requires: 'jade-lost-slips',
    intro: 'The worst slips were folded into a vault, out of reach. Its door has opened on the west edge of the Library, and its calligrapher is still writing. Put down the Calligrapher of the Sealed Vault.',
    reminder: 'The vault door is on the west edge of the Library of Jade Slips.',
    completeText: 'It is finished. May we never need to write that page again.',
    objectives: [{ type: 'kill', target: 'vaultcalligrapher', count: 1, label: 'Slay the Vault Calligrapher' }],
    reward: { xp: 1520, stones: 1400, items: [{ id: 'jade-elixir', count: 3 }, { id: 'jade-mana-potion', count: 4 }] },
  },
  {
    id: 'jade-crane-feathers', chapter: 4, name: 'Feathers of Thunder', giver: 'hermit-gu', requires: 'jade-ascent',
    intro: 'A crane\'s feather still holds a little of its sky. Bring me five from the Storm Cranes, and slay three of the gold-named elites that lead them. I mean to make a talisman against the Magistrate\'s judgement.',
    reminder: 'Five Storm Crane Feathers and three elites around the Crane Pavilions and the Court of Storms.',
    completeText: 'It will not stop a verdict. It may make him listen to the appeal.',
    objectives: [{ type: 'collect', item: 'jade-feather', count: 5, label: 'Gather Storm Crane Feathers' }, { type: 'elite', count: 3, label: 'Slay Elite Monsters' }],
    reward: { xp: 1290, stones: 1000, items: [{ id: 'jade-elixir', count: 3 }, { id: 'jade-pill', count: 2 }] },
  },
  {
    id: 'jade-mine-dust', chapter: 4, name: 'Jade Dust for the Furnace', giver: 'alchemist-ning', requires: 'jade-ascent',
    intro: 'My finest pills need raw jade dust. Bring me six Raw Jade Ore from the stair\'s Colossi, and clear the Jade Seam Tyrant out of the old mine so we can dig in peace.',
    reminder: 'Six Raw Jade Ore from jade constructs, and the Jade Seam Tyrant in Seamdeep Jade Mine on the stair.',
    completeText: 'Beautiful. Heavy and pure. Here is the first batch, as promised.',
    objectives: [{ type: 'collect', item: 'jade-ore', count: 6, label: 'Gather Raw Jade Ore' }, { type: 'kill', target: 'seamtyrant', count: 1, label: 'Slay the Jade Seam Tyrant' }],
    reward: { xp: 1370, stones: 1200, items: [{ id: 'jade-elixir', count: 3 }, { id: 'jade-pill', count: 3 }] },
  },
  {
    id: 'jade-moon-echo', chapter: 4, name: 'The Palace in the Water', giver: 'boatman-ke', requires: 'jade-lake-lanterns',
    intro: 'There is a palace under the lake, and a lady in it who wears my wife\'s face. I cannot row there. You can. Break the Lady of the Moon Mirror.',
    reminder: 'The palace gate stands on the south shore of the Mirror Lake.',
    completeText: 'The water is just water now. I think I can sleep. Thank you.',
    objectives: [{ type: 'kill', target: 'mirrorqueen', count: 1, label: 'Defeat the Lady of the Moon Mirror' }],
    reward: { xp: 1600, stones: 1500, items: [{ id: 'jade-elixir', count: 3 }, { id: 'jade-hp-potion', count: 5 }] },
  },
];

// ---------------------------------------------------------------- module
export const CH4: ChapterContent = {
  ...emptyContent(),
  chapter: CHAPTER,
  map: MAP,
  zones: ZONES,
  enemies: ENEMY_LIST,
  bosses: [CRANELORD, ARCHIVEKEEPER, MAGISTRATE, CLOUDWYRM, SEAMTYRANT, VAULTCALLIGRAPHER, MIRRORQUEEN],
  quests: QUEST_LIST,
  npcs: NPC_MAP,
  items: ITEM_LIST,
  icons: ICONS,
  drops: {
    jadesentinel: [{ item: 'jade-hp-potion', chance: 0.08 }, { item: 'jade-ore', chance: 0.12 }],
    jadecolossus: [{ item: 'jade-ore', chance: 0.4 }, { item: 'jade-pill', chance: 0.12 }],
    oregolem: [{ item: 'jade-ore', chance: 0.5 }, { item: 'jade-hp-potion', chance: 0.1 }],
    stormcrane: [{ item: 'jade-feather', chance: 0.35 }, { item: 'jade-mana-potion', chance: 0.1 }],
    stormhound: [{ item: 'jade-hp-potion', chance: 0.1 }],
    cloudserpent: [{ item: 'hp-potion', chance: 0.2 }],
    cloudhound: [{ item: 'jade-hp-potion', chance: 0.06 }],
    scrollwraith: [{ item: 'jade-slip-scrap', chance: 0.4 }, { item: 'jade-mana-potion', chance: 0.08 }],
    inkwisp: [{ item: 'jade-slip-scrap', chance: 0.3 }, { item: 'jade-mana-potion', chance: 0.14 }],
    scribe: [{ item: 'jade-slip-scrap', chance: 0.3 }, { item: 'jade-pill', chance: 0.1 }],
    celestialguard: [{ item: 'jade-hp-potion', chance: 0.12 }, { item: 'jade-pill', chance: 0.08 }],
    skyblade: [{ item: 'jade-pill', chance: 0.1 }],
    blossomsprite: [{ item: 'jade-peach', chance: 0.3 }, { item: 'jade-mana-potion', chance: 0.08 }],
    blossomtreant: [{ item: 'jade-peach', chance: 0.5 }, { item: 'jade-hp-potion', chance: 0.14 }],
    mirrorwraith: [{ item: 'jade-mana-potion', chance: 0.12 }],
    mirrorknight: [{ item: 'jade-hp-potion', chance: 0.12 }],
    moonwisp: [{ item: 'jade-mana-potion', chance: 0.12 }],
    veinbat: [{ item: 'jade-ore', chance: 0.1 }],
    echobat: [],
    cranelord: [{ item: 'jade-crane-saber', chance: 1 }, { item: 'jade-elixir', chance: 1 }],
    archivekeeper: [{ item: 'heaven-robe', chance: 1 }, { item: 'jade-elixir', chance: 1 }],
    magistrate: [{ item: 'heaven-sword', chance: 1 }, { item: 'jade-seal', chance: 1 }, { item: 'jade-elixir', chance: 1 }],
    cloudwyrm: [{ item: 'jade-wyrm-pearl', chance: 0.5 }, { item: 'jade-hp-potion', chance: 1 }],
    seamtyrant: [{ item: 'jade-miner-plate', chance: 0.5 }, { item: 'jade-ore', chance: 1 }],
    vaultcalligrapher: [{ item: 'jade-vault-robe', chance: 0.5 }, { item: 'jade-pill', chance: 1 }],
    mirrorqueen: [{ item: 'jade-moon-pendant', chance: 0.5 }, { item: 'jade-elixir', chance: 1 }],
  },
  eliteLoot: {
    orchard: ['jade-blade', 'jade-mail', 'furnace-seal'],
    mirror: ['jade-blade', 'jade-mail', 'jade-wyrm-pearl'],
    stair: ['jade-blade', 'jade-mail', 'jade-miner-plate'],
    storm: ['jade-crane-saber', 'jade-mail', 'jade-moon-pendant'],
    crane: ['jade-crane-saber', 'jade-miner-plate', 'jade-wyrm-pearl'],
    library: ['jade-vault-robe', 'jade-crane-saber', 'jade-moon-pendant'],
  },
  stocks: {
    jade: ['jade-hp-potion', 'jade-mana-potion', 'jade-pill', 'jade-elixir', 'foundation-pill', 'jade-blade', 'jade-mail'],
  },
  recipes: {
    jade: [
      { id: 'jade-brew-hp', name: 'Celestial Vitality Draught', output: 'jade-hp-potion', herbs: 1, stones: 30, note: 'Restores 320 HP' },
      { id: 'jade-brew-mana', name: 'Celestial Clarity Draught', output: 'jade-mana-potion', herbs: 1, stones: 30, note: 'Restores 200 mana' },
      { id: 'jade-brew-pill', name: 'Nine-Cloud Qi Pill', output: 'jade-pill', herbs: 2, stones: 60, note: 'Adds 180 qi' },
      { id: 'jade-brew-elixir', name: 'Peach-Blossom Elixir', output: 'jade-elixir', herbs: 3, stones: 140, note: 'Restores 700 HP' },
      { id: 'jade-brew-foundation', name: 'Foundation Pill', output: 'foundation-pill', herbs: 3, stones: 60, note: 'Needed for every breakthrough' },
    ],
  },
  dungeons: [CLOUDHOLLOW, JADEMINE, SCROLLVAULT, MOONPALACE],
};
