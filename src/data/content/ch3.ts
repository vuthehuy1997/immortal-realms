import type { BossDef } from '../boss';
import type { DungeonDef } from '../dungeons';
import type { EnemyDef } from '../enemies';
import type { ItemDef } from '../items';
import type { MapDef } from '../maps';
import type { NpcDef, QuestDef } from '../quests';
import type { ZoneDef } from '../zones';
import { CHAPTER_GEAR } from './gear';
import { emptyContent, type ChapterContent } from './types';

/**
 * Chapter 3: The Ember Wastes (levels 18-28).
 * The Fissure's stolen heat woke the buried Heavenly Furnace. Dunes turn to glass, a magma rift opens, caravans stop coming.
 * All art here is PLACEHOLDER: pack mobs / bosses / props reused, recoloured (`tint`) and rescaled. Replace before release.
 */

// ---------------------------------------------------------------- map
const MAP: MapDef = {
  chapter: 3, seed: 0xe3b1a5ca, width: 160, height: 132,
  hub: 'bazaar', hubTile: { x: 24, y: 104 }, hubRadius: 12, hubGround: 'stone',
  zones: ['bazaar', 'dunes', 'oasis', 'canyon', 'saltflats', 'magmarift', 'suntemple', 'furnace'],
  zoneWeight: { dunes: 0.8, canyon: 0.82, magmarift: 1.18, saltflats: 1.08, oasis: 1.05 },
  roads: [
    [[24, 104], [34, 111], [44, 108], [51, 101], [58, 96]],                           // Cinder Bazaar -> Sunscour Dunes
    [[58, 96], [66, 104], [76, 103], [86, 112], [94, 110], [100, 108]],               // dunes -> Scorched Canyon (sand wyrm)
    [[58, 96], [62, 88], [66, 80], [60, 76], [56, 72]],                               // dunes -> Mirage Oasis
    [[56, 72], [48, 66], [40, 62], [36, 54], [30, 48], [28, 44]],                     // oasis -> Whitesalt Flats
    [[100, 108], [108, 100], [114, 92], [118, 82], [118, 66]],                        // canyon -> Magma Rift
    [[118, 66], [112, 60], [106, 54], [98, 46], [94, 40], [90, 36]],                  // rift -> Buried Sun Temple
    [[28, 44], [38, 38], [50, 40], [62, 34], [76, 38], [90, 36]],                     // salt flats -> temple (second approach)
    [[90, 36], [102, 31], [112, 28], [126, 24], [140, 20]],                           // temple -> Furnace Summit
    [[114, 92], [124, 100], [134, 108], [146, 116]],                                  // dead-end trail to a fallen watchtower (south-east)
    [[30, 48], [22, 38], [16, 28], [14, 16]],                                         // dead-end trail across the salt (north-west)
  ],
  rivers: [
    { pts: [[142, 104], [136, 92], [130, 80], [128, 68], [134, 54], [130, 40], [131, 21]], r: 2.4 }, // the eastern magma river
    { pts: [[90, 70], [100, 72], [110, 75], [124, 76], [128, 70]], r: 2.2 },                        // rift crossing (causeway at the road)
    { pts: [[78, 124], [88, 106], [86, 92], [80, 82], [74, 78]], r: 1.8 },                          // canyon vein
  ],
  liquid: 'lava',
  shore: 'sand',
  ponds: ['oasis'],
  ground: {
    bazaar: { base: 'sand', layers: [{ kind: 'clay', field: 'v', gt: 0.62 }] },
    dunes: { base: 'sand', layers: [{ kind: 'clay', field: 'v', gt: 0.7 }, { kind: 'basalt', field: 'w', gt: 0.76 }] },
    oasis: { base: 'sand', layers: [{ kind: 'grass', field: 'v', gt: 0.46 }, { kind: 'moss', field: 'v', gt: 0.62 }, { kind: 'water', field: 'w', gt: 0.645 }] },
    canyon: { base: 'clay', layers: [{ kind: 'basalt', field: 'v', gt: 0.56 }, { kind: 'sand', field: 'w', gt: 0.66 }, { kind: 'stone', field: 'v', gt: 0.78 }] },
    saltflats: { base: 'snow', layers: [{ kind: 'sand', field: 'v', gt: 0.7 }, { kind: 'ice', field: 'w', gt: 0.7 }] },
    magmarift: { base: 'basalt', layers: [{ kind: 'ash', field: 'v', gt: 0.5 }, { kind: 'clay', field: 'w', gt: 0.7 }, { kind: 'lava', field: 'w', gt: 0.82 }] },
    suntemple: { base: 'sand', layers: [{ kind: 'stone', field: 'v', gt: 0.56 }, { kind: 'clay', field: 'w', gt: 0.6 }] },
    furnace: { base: 'basalt', layers: [{ kind: 'ash', field: 'v', gt: 0.5 }, { kind: 'stone', field: 'w', gt: 0.68 }] },
  },
  scatter: [
    { zone: 'bazaar', kind: 'rock', p: 0.006, margin: 0 }, { zone: 'bazaar', kind: 'pine', p: 0.004 },
    { zone: 'dunes', kind: 'rock', p: 0.02, margin: 0 }, { zone: 'dunes', kind: 'pine', p: 0.012 }, { zone: 'dunes', kind: 'taihurocks', p: 0.008 }, { zone: 'dunes', kind: 'standstone', p: 0.004 }, { zone: 'dunes', kind: 'orchid', p: 0.01, margin: 0 }, { zone: 'dunes', kind: 'stonecircle', p: 0.0012 },
    { zone: 'oasis', kind: 'willow', p: 0.03 }, { zone: 'oasis', kind: 'peachtree', p: 0.02 }, { zone: 'oasis', kind: 'orchid', p: 0.03, margin: 0 }, { zone: 'oasis', kind: 'bamboo', p: 0.012 }, { zone: 'oasis', kind: 'rock', p: 0.006, margin: 0 },
    { zone: 'canyon', kind: 'taihurocks', p: 0.016 }, { zone: 'canyon', kind: 'rock', p: 0.022, margin: 0 }, { zone: 'canyon', kind: 'standstone', p: 0.011 }, { zone: 'canyon', kind: 'pine', p: 0.004 },
    { zone: 'saltflats', kind: 'rock', p: 0.012, margin: 0 }, { zone: 'saltflats', kind: 'standstone', p: 0.006 }, { zone: 'saltflats', kind: 'taihurocks', p: 0.004 }, { zone: 'saltflats', kind: 'rock', p: 0.008 },
    { zone: 'magmarift', kind: 'rock', p: 0.03, margin: 0 }, { zone: 'magmarift', kind: 'standstone', p: 0.014 }, { zone: 'magmarift', kind: 'taihurocks', p: 0.01 },
    { zone: 'suntemple', kind: 'standstone', p: 0.018 }, { zone: 'suntemple', kind: 'taihurocks', p: 0.01 }, { zone: 'suntemple', kind: 'stonecircle', p: 0.003 }, { zone: 'suntemple', kind: 'moonwall', p: 0.002 }, { zone: 'suntemple', kind: 'pagoda7', p: 0.0012 }, { zone: 'suntemple', kind: 'rock', p: 0.008, margin: 0 },
    { zone: 'furnace', kind: 'standstone', p: 0.012 }, { zone: 'furnace', kind: 'taihurocks', p: 0.012 }, { zone: 'furnace', kind: 'rock', p: 0.014, margin: 0 }, { zone: 'furnace', kind: 'dragonpillar', p: 0.005 },
  ],
  arenas: [
    { bossId: 'sandwyrm', tile: { x: 100, y: 108 }, radius: 8, ring: 'taihurocks', open: { x: -1, y: 0 }, ground: 'stone' },
    { bossId: 'mirageempress', tile: { x: 90, y: 36 }, radius: 9, ring: 'standstone', open: { x: 1, y: 1 }, ground: 'stone' },
    { bossId: 'furnacewarden', tile: { x: 140, y: 20 }, radius: 10, ring: 'dragonpillar', open: { x: -1, y: 0 }, ground: 'stone' },
  ],
  hubProps: [ // caravan bazaar: a market street of stalls either side of a central well, watchtower and gate at the ends
    { kind: 'pavilion', dx: -9, dy: -4 }, { kind: 'pavilion', dx: -9, dy: 6 }, { kind: 'pavilion', dx: 9, dy: -4 }, { kind: 'pavilion', dx: 9, dy: 6 },
    { kind: 'tower', dx: -15, dy: -2 }, { kind: 'pagoda7', dx: 15, dy: -1 }, { kind: 'goldpaifang', dx: 0, dy: -11 }, { kind: 'stonecircle', dx: 0, dy: -6 },
    { kind: 'standstone', dx: -4, dy: 10 }, { kind: 'standstone', dx: 4, dy: 10 }, { kind: 'rock', dx: -14, dy: 3 }, { kind: 'rock', dx: 14, dy: 4 }, { kind: 'pine', dx: -13, dy: 11 },
  ],
  npcs: {
    'caravan-master-hui': { x: 26, y: 98 }, 'trader-sahn': { x: 31, y: 105 }, 'alchemist-zhu': { x: 17, y: 105 },
    'wanderer-dahl': { x: 62, y: 99 }, 'keeper-ila': { x: 57, y: 74 }, 'hunter-tarq': { x: 76, y: 111 },
    'miner-borok': { x: 119, y: 83 }, 'hermit-zaim': { x: 30, y: 47 }, 'scholar-eun': { x: 97, y: 45 },
  },
  herbs: [['dunes', 12], ['oasis', 12], ['canyon', 8], ['saltflats', 9], ['magmarift', 8], ['suntemple', 8]],
  portal: { dx: -10, dy: -9 },
  portalNext: { dx: 11, dy: -10 },
  borderProp: { bazaar: 'rock', dunes: 'rock', oasis: 'willow', canyon: 'taihurocks', saltflats: 'rock', magmarift: 'standstone', suntemple: 'standstone', furnace: 'taihurocks' },
  extras: [
    { kind: 'stonecircle', x: 74, y: 92 }, { kind: 'tower', x: 108, y: 120 }, { kind: 'floatisle', x: 40, y: 20 }, { kind: 'pagoda7', x: 62, y: 56 },
    { kind: 'tower', x: 12, y: 60 }, { kind: 'stonecircle', x: 146, y: 80 }, { kind: 'pagoda7', x: 80, y: 20 },
    { kind: 'tower', x: 148, y: 114, force: true }, { kind: 'stonecircle', x: 142, y: 112 }, { kind: 'floatisle', x: 14, y: 12, force: true },
  ],
};

// ---------------------------------------------------------------- zones
const ZONES: ZoneDef[] = [
  { id: 'bazaar', chapter: 3, name: 'Cinder Bazaar', anchor: { x: 24, y: 104 }, level: 'Safe', spawns: {}, mood: 'day', tier: { hp: 1, atk: 1, xp: 1 }, propTint: 0xf2e2c2 },
  { id: 'dunes', chapter: 3, name: 'Sunscour Dunes', anchor: { x: 58, y: 96 }, level: 'Lv 18-21', spawns: { sandviper: 8, dunejackal: 7, glassscorpion: 5, dustwisp: 4, cactuswarden: 3 }, mood: 'day', tier: { hp: 6.0, atk: 4.2, xp: 6.4 }, propTint: 0xf2c88c },
  { id: 'oasis', chapter: 3, name: 'Mirage Oasis', anchor: { x: 56, y: 72 }, level: 'Lv 19-22', spawns: { reedtoad: 6, drownedcaravaneer: 6, oasisnymph: 6, dunejackal: 4, sandviper: 4, cactuswarden: 2 }, mood: 'mist', tier: { hp: 6.4, atk: 4.5, xp: 6.9 }, propTint: 0xd6f0b8 },
  { id: 'canyon', chapter: 3, name: 'Scorched Canyon', anchor: { x: 100, y: 108 }, level: 'Lv 21-24', spawns: { claygolem: 5, ashroc: 4, glassscorpion: 6, duneraider: 7, cindermoth: 6 }, mood: 'dusk', tier: { hp: 6.9, atk: 4.8, xp: 7.4 }, propTint: 0xd89070 },
  { id: 'saltflats', chapter: 3, name: 'Whitesalt Flats', anchor: { x: 28, y: 44 }, level: 'Lv 22-25', spawns: { saltghoul: 4, mirageghost: 6, brinecrawler: 6, saltsoldier: 7, ashroc: 3 }, mood: 'frost', tier: { hp: 7.4, atk: 5.1, xp: 8.0 }, propTint: 0xe6eeff },
  { id: 'magmarift', chapter: 3, name: 'Magma Rift', anchor: { x: 118, y: 66 }, level: 'Lv 24-27', spawns: { magmasprite: 7, cindermoth: 7, obsidiangolem: 4, slagtoad: 6, cinderhound: 6 }, mood: 'night', tier: { hp: 8.0, atk: 5.5, xp: 8.8 }, propTint: 0xff8e6c },
  { id: 'suntemple', chapter: 3, name: 'Buried Sun Temple', anchor: { x: 90, y: 36 }, level: 'Lv 26-28', spawns: { mummy: 7, sunhusk: 4, templeguard: 6, mirageghost: 5, sunblade: 3 }, mood: 'dusk', tier: { hp: 8.5, atk: 5.8, xp: 9.4 }, propTint: 0xeccc78 },
  { id: 'furnace', chapter: 3, name: 'Furnace Summit', anchor: { x: 140, y: 20 }, level: 'Boss', spawns: {}, mood: 'night', tier: { hp: 9.0, atk: 6.1, xp: 10 }, propTint: 0xff9e6c },
];

// ---------------------------------------------------------------- enemies
// PLACEHOLDER art: every enemy reuses a pack sprite, recoloured with `tint` and rescaled. Replace with dedicated desert/ember art.
const rusher = (id: string, name: string, sprite: string, tint: number | undefined, scale: number, s: { hp: number; atk: number; def: number; speed: number; cd?: number; windup?: number; xp: number; stones: [number, number]; aggro?: number; radius?: number }): EnemyDef => ({
  id, name, behavior: 'rusher', maxHp: s.hp, atk: s.atk, def: s.def, speed: s.speed, aggroRange: s.aggro ?? 115, attackRange: 18, attackCooldown: s.cd ?? 1.0, strikeWindup: s.windup ?? 0.3, xp: s.xp, sprite, tint, scale, radius: s.radius ?? 8, stones: s.stones,
});
const caster = (id: string, name: string, sprite: string, tint: number | undefined, scale: number, s: { hp: number; atk: number; speed: number; cd: number; range: number; keep: number; volley?: number; xp: number; stones: [number, number] }): EnemyDef => ({
  id, name, behavior: 'caster', maxHp: s.hp, atk: s.atk, def: 0, speed: s.speed, aggroRange: s.range + 25, attackRange: s.range, attackCooldown: s.cd, preferredRange: s.keep, volley: s.volley, xp: s.xp, sprite, tint, scale, radius: 7, stones: s.stones,
});
const charger = (id: string, name: string, sprite: string, tint: number | undefined, scale: number, s: { hp: number; atk: number; def: number; speed: number; cd: number; windup: number; dash: number; mult: number; xp: number; stones: [number, number]; radius?: number; reach?: number }): EnemyDef => ({
  id, name, behavior: 'charger', maxHp: s.hp, atk: s.atk, def: s.def, speed: s.speed, aggroRange: 115, attackRange: s.reach ?? 80, attackCooldown: s.cd, windup: s.windup, dashTime: s.dash, dashSpeedMult: s.mult, xp: s.xp, sprite, tint, scale, radius: s.radius ?? 9, stones: s.stones,
});

const ENEMIES: EnemyDef[] = [
  // dunes
  rusher('sandviper', 'Sand Viper', 'mob.snake', 0xe6bc64, 0.38, { hp: 47, atk: 12, def: 1, speed: 58, cd: 0.8, windup: 0.26, xp: 22, stones: [3, 6], radius: 7 }),
  rusher('dunejackal', 'Dune Jackal', 'mob.wolf', 0xd9a45c, 0.38, { hp: 56, atk: 13, def: 2, speed: 72, cd: 0.9, windup: 0.28, xp: 26, stones: [3, 7] }),
  rusher('glassscorpion', 'Glass Scorpion', 'mob.snake', 0x8fe8d8, 0.46, { hp: 74, atk: 14, def: 6, speed: 40, cd: 1.2, windup: 0.4, xp: 34, stones: [5, 10], radius: 9 }),
  caster('dustwisp', 'Dust Wisp', 'mob.foxfire', 0xffd890, 0.38, { hp: 44, atk: 15, speed: 42, cd: 1.6, range: 120, keep: 88, volley: 2, xp: 28, stones: [4, 8] }),
  charger('cactuswarden', 'Cactus Warden', 'mob.treant', 0xb8d868, 0.44, { hp: 120, atk: 18, def: 6, speed: 28, cd: 2.8, windup: 0.7, dash: 0.45, mult: 4, xp: 56, stones: [8, 14], radius: 10, reach: 76 }),
  // oasis
  rusher('reedtoad', 'Reed Toad', 'mob.toad', 0xc8d070, 0.38, { hp: 84, atk: 14, def: 4, speed: 32, cd: 1.3, windup: 0.4, xp: 32, stones: [4, 9], radius: 9 }),
  rusher('drownedcaravaneer', 'Drowned Caravaneer', 'mob.waterghost', 0xe0d0a0, 0.38, { hp: 56, atk: 14, def: 1, speed: 38, cd: 1.1, windup: 0.3, xp: 30, stones: [4, 8], radius: 7 }),
  caster('oasisnymph', 'Oasis Nymph', 'mob.peachspirit', 0x9fffd4, 0.36, { hp: 52, atk: 15, speed: 38, cd: 1.5, range: 115, keep: 80, volley: 2, xp: 32, stones: [4, 9] }),
  // canyon
  charger('claygolem', 'Clay Golem', 'mob.golem', 0xc88a50, 0.46, { hp: 130, atk: 18, def: 9, speed: 26, cd: 2.8, windup: 0.8, dash: 0.5, mult: 4, xp: 70, stones: [10, 18], radius: 11 }),
  caster('ashroc', 'Ash Roc', 'mob.thunderbird', 0x9a8f88, 0.44, { hp: 58, atk: 17, speed: 48, cd: 1.4, range: 140, keep: 100, volley: 3, xp: 42, stones: [6, 12] }),
  rusher('duneraider', 'Dune Raider', 'mob.soldier', 0xc89060, 0.38, { hp: 84, atk: 15, def: 6, speed: 44, cd: 1.2, windup: 0.34, xp: 38, stones: [6, 12] }),
  rusher('cindermoth', 'Cinder Moth', 'mob.bat', 0xff9a60, 0.34, { hp: 46, atk: 11, def: 0, speed: 88, cd: 0.7, windup: 0.22, xp: 20, stones: [3, 6], aggro: 140, radius: 6 }),
  // salt flats
  charger('saltghoul', 'Salt Ghoul', 'mob.jiangshi', 0xe8f0f0, 0.4, { hp: 100, atk: 20, def: 5, speed: 36, cd: 2.4, windup: 0.55, dash: 0.4, mult: 5, xp: 52, stones: [7, 14], reach: 86 }),
  caster('mirageghost', 'Mirage Ghost', 'mob.ghost', 0xfff0b0, 0.4, { hp: 50, atk: 17, speed: 40, cd: 1.6, range: 125, keep: 92, volley: 2, xp: 36, stones: [5, 10] }),
  rusher('brinecrawler', 'Brine Crawler', 'mob.snake', 0xcfe4ff, 0.44, { hp: 66, atk: 16, def: 3, speed: 50, cd: 0.9, windup: 0.28, xp: 34, stones: [5, 10], radius: 8 }),
  rusher('saltsoldier', 'Salt-Preserved Soldier', 'mob.skeleton', 0xeef2ff, 0.38, { hp: 88, atk: 16, def: 6, speed: 46, cd: 1.0, windup: 0.3, xp: 40, stones: [6, 12] }),
  // magma rift
  caster('magmasprite', 'Magma Sprite', 'mob.foxfire', 0xff6a20, 0.4, { hp: 54, atk: 19, speed: 44, cd: 1.5, range: 125, keep: 90, volley: 2, xp: 40, stones: [6, 12] }),
  charger('obsidiangolem', 'Obsidian Golem', 'mob.golem', 0x4a4458, 0.5, { hp: 150, atk: 20, def: 12, speed: 26, cd: 2.8, windup: 0.8, dash: 0.5, mult: 4, xp: 84, stones: [12, 22], radius: 12, reach: 80 }),
  rusher('slagtoad', 'Slag Toad', 'mob.toad', 0xff8a40, 0.4, { hp: 100, atk: 17, def: 6, speed: 34, cd: 1.3, windup: 0.4, xp: 44, stones: [7, 14], radius: 9 }),
  rusher('cinderhound', 'Cinder Hound', 'mob.wolf', 0xff5a30, 0.4, { hp: 72, atk: 15, def: 3, speed: 76, cd: 0.85, windup: 0.26, xp: 42, stones: [6, 12] }),
  // sun temple
  rusher('mummy', 'Gilded Mummy', 'mob.skeleton', 0xd8c890, 0.42, { hp: 104, atk: 14, def: 8, speed: 40, cd: 1.2, windup: 0.34, xp: 52, stones: [8, 16], radius: 9 }),
  charger('sunhusk', 'Sun-Cursed Husk', 'mob.jiangshi', 0xffd060, 0.42, { hp: 116, atk: 18, def: 7, speed: 38, cd: 2.4, windup: 0.55, dash: 0.4, mult: 5, xp: 62, stones: [9, 17], reach: 88 }),
  rusher('templeguard', 'Temple Sentinel', 'mob.soldier', 0xe8b830, 0.42, { hp: 108, atk: 13, def: 11, speed: 42, cd: 1.3, windup: 0.36, xp: 58, stones: [8, 16], radius: 9 }),
  charger('sunblade', 'Sun Blade Spirit', 'mob.swordspirit', 0xffe090, 0.42, { hp: 62, atk: 20, def: 3, speed: 42, cd: 2.0, windup: 0.45, dash: 0.35, mult: 6, xp: 50, stones: [7, 14], reach: 96 }),
  // vault (dungeon-only)
  charger('vaultblade', 'Furnace Blade Spirit', 'mob.swordspirit_v_blood', 0xff9040, 0.42, { hp: 70, atk: 22, def: 4, speed: 44, cd: 1.9, windup: 0.42, dash: 0.35, mult: 6, xp: 54, stones: [8, 15], reach: 98 }),
  rusher('homunculus', 'Alchemy Homunculus', 'mob.paperdoll', 0xffc080, 0.42, { hp: 76, atk: 15, def: 4, speed: 54, cd: 0.95, windup: 0.28, xp: 44, stones: [6, 12] }),
  caster('vaultwisp', 'Vapour Wisp', 'mob.foxfire_v_green', 0xfff0a0, 0.4, { hp: 56, atk: 20, speed: 44, cd: 1.5, range: 125, keep: 90, volley: 3, xp: 46, stones: [7, 13] }),
  charger('bronzeguardian', 'Bronze Guardian', 'mob.golem', 0xc89838, 0.5, { hp: 150, atk: 17, def: 13, speed: 26, cd: 2.8, windup: 0.8, dash: 0.5, mult: 4, xp: 90, stones: [13, 24], radius: 12, reach: 82 }),
  // burrow (dungeon-only)
  rusher('glasswormling', 'Glass Wormling', 'mob.snake', 0x7fe0c8, 0.5, { hp: 70, atk: 15, def: 3, speed: 50, cd: 0.9, windup: 0.3, xp: 34, stones: [5, 10], radius: 9 }),
];

// ---------------------------------------------------------------- bosses
// PLACEHOLDER art: boss.jiaolong / boss.ninetail / boss.fallenimmortal sheets recoloured and rescaled; mobs enlarged for dungeon bosses.
const BOSSES: BossDef[] = [
  {
    id: 'sandwyrm', chapter: 3, name: 'Sand Wyrm of the Scorched Canyon', home: 'canyon', zone: 'canyon', tint: 0xffe890, xp: 1800, stones: [260, 360], sprite: 'boss.jiaolong', scale: 0.5, radius: 26,
    maxHp: 22000, atk: 70, def: 20, speed: 46,
    moves: {
      slam: { radius: 62, windup: 0.9, recover: 0.5, cooldown: 4.2, damageMult: 1.7, triggerRange: 96 },
      sweep: { range: 100, halfAngle: 1.1, windup: 0.65, recover: 0.45, cooldown: 3, damageMult: 1.4, triggerRange: 96 },
      charge: { windup: 0.7, duration: 0.55, speed: 330, width: 28, recover: 0.7, cooldown: 4.6, damageMult: 1.6, minRange: 14, maxRange: 260 },
      rain: { count: 8, radius: 30, spread: 130, windup: 0.5, delay: 0.95, recover: 0.4, cooldown: 5.5, damageMult: 1.2 },
      summon: { windup: 0.8, cooldown: 13, count: 3, maxMinions: 5, minionType: 'sandviper' },
      ring: { windup: 0.75, cooldown: 6.5, projectiles: 12, damageMult: 0.95 },
    },
    kit: [['sweep', 'charge'], ['charge', 'rain', 'summon', 'slam'], ['rain', 'ring', 'charge', 'slam', 'sweep']],
    phase2At: 0.66, phase3At: 0.33, enrage: { speedMult: 1.35, cooldownMult: 0.68 },
  },
  {
    id: 'mirageempress', chapter: 3, name: 'Mirage Empress', home: 'suntemple', zone: 'suntemple', tint: 0xffcf88, xp: 2400, stones: [320, 440], sprite: 'boss.ninetail', scale: 0.5, radius: 24,
    maxHp: 30000, atk: 80, def: 22, speed: 52,
    moves: {
      sweep: { range: 92, halfAngle: 1.3, windup: 0.6, recover: 0.4, cooldown: 2.8, damageMult: 1.4, triggerRange: 90 },
      charge: { windup: 0.65, duration: 0.5, speed: 340, width: 24, recover: 0.6, cooldown: 4.8, damageMult: 1.6, minRange: 14, maxRange: 250 },
      rain: { count: 9, radius: 30, spread: 140, windup: 0.5, delay: 0.9, recover: 0.4, cooldown: 5.5, damageMult: 1.2 },
      teleport: { windup: 0.7, recover: 0.4, cooldown: 7, behind: 44, radius: 50, damageMult: 1.6 },
      summon: { windup: 0.75, cooldown: 12, count: 3, maxMinions: 5, minionType: 'mirageghost' },
      ring: { windup: 0.7, cooldown: 6, projectiles: 14, damageMult: 1.0 },
    },
    kit: [['sweep', 'teleport'], ['teleport', 'rain', 'summon', 'sweep'], ['teleport', 'ring', 'rain', 'charge', 'sweep']],
    phase2At: 0.66, phase3At: 0.33, enrage: { speedMult: 1.4, cooldownMult: 0.65 },
  },
  {
    id: 'furnacewarden', chapter: 3, name: 'Furnace Warden', home: 'furnace', zone: 'furnace', tint: 0xff9a60, xp: 3600, stones: [480, 640], sprite: 'boss.fallenimmortal', scale: 0.8, radius: 24,
    maxHp: 48000, atk: 95, def: 26, speed: 46,
    moves: {
      slam: { radius: 68, windup: 0.85, recover: 0.45, cooldown: 3.8, damageMult: 1.8, triggerRange: 100 },
      sweep: { range: 104, halfAngle: 1.0, windup: 0.7, recover: 0.45, cooldown: 3, damageMult: 1.5, triggerRange: 98 },
      charge: { windup: 0.7, duration: 0.5, speed: 340, width: 26, recover: 0.6, cooldown: 5, damageMult: 1.6, minRange: 14, maxRange: 270 },
      rain: { count: 10, radius: 32, spread: 140, windup: 0.5, delay: 0.9, recover: 0.4, cooldown: 5.2, damageMult: 1.25 },
      teleport: { windup: 0.75, recover: 0.45, cooldown: 8, behind: 48, radius: 54, damageMult: 1.7 },
      summon: { windup: 0.8, cooldown: 13, count: 3, maxMinions: 5, minionType: 'sunblade' },
      ring: { windup: 0.75, cooldown: 5.8, projectiles: 16, damageMult: 1.0 },
    },
    kit: [['slam', 'sweep', 'charge'], ['slam', 'rain', 'summon', 'ring', 'sweep'], ['rain', 'teleport', 'ring', 'charge', 'slam', 'summon']],
    phase2At: 0.66, phase3At: 0.33, enrage: { speedMult: 1.4, cooldownMult: 0.6 },
  },
  // dungeon bosses
  {
    id: 'glasswormqueen', chapter: 3, dungeon: 'ember-burrow', name: 'Glass-Worm Queen', home: 'burrow', zone: 'ember-burrow', tint: 0x7fe0c8, xp: 1400, stones: [200, 300], sprite: 'mob.snake', scale: 1.3, radius: 24,
    maxHp: 17000, atk: 62, def: 18, speed: 44,
    moves: {
      slam: { radius: 58, windup: 0.9, recover: 0.5, cooldown: 4.2, damageMult: 1.6, triggerRange: 90 },
      charge: { windup: 0.75, duration: 0.55, speed: 310, width: 26, recover: 0.7, cooldown: 4.8, damageMult: 1.5, minRange: 14, maxRange: 240 },
      rain: { count: 7, radius: 28, spread: 120, windup: 0.5, delay: 1.0, recover: 0.4, cooldown: 6, damageMult: 1.1 },
      summon: { windup: 0.8, cooldown: 12, count: 3, maxMinions: 5, minionType: 'glasswormling' },
    },
    kit: [['slam', 'charge'], ['charge', 'rain', 'summon'], ['rain', 'charge', 'summon', 'slam']],
    phase2At: 0.66, phase3At: 0.33, enrage: { speedMult: 1.3, cooldownMult: 0.7 },
  },
  {
    id: 'obsidiancolossus', chapter: 3, dungeon: 'ember-mine', name: 'Obsidian Colossus', home: 'mine', zone: 'ember-mine', tint: 0xe6d8ff, aura: 0xff5a1f, xp: 1800, stones: [260, 380], sprite: 'mob.golem', scale: 1.15, radius: 28,
    maxHp: 22000, atk: 72, def: 26, speed: 30,
    moves: {
      slam: { radius: 70, windup: 1.0, recover: 0.6, cooldown: 4, damageMult: 1.8, triggerRange: 104 },
      sweep: { range: 104, halfAngle: 1.1, windup: 0.8, recover: 0.5, cooldown: 3.4, damageMult: 1.5, triggerRange: 100 },
      rain: { count: 9, radius: 30, spread: 140, windup: 0.5, delay: 1.0, recover: 0.4, cooldown: 5.5, damageMult: 1.2 },
      ring: { windup: 0.8, cooldown: 6, projectiles: 14, damageMult: 1.0 },
      summon: { windup: 0.8, cooldown: 14, count: 2, maxMinions: 3, minionType: 'magmasprite' },
    },
    kit: [['slam', 'sweep'], ['slam', 'rain', 'summon', 'sweep'], ['rain', 'ring', 'slam', 'sweep', 'summon']],
    phase2At: 0.66, phase3At: 0.33, enrage: { speedMult: 1.4, cooldownMult: 0.65 },
  },
  {
    id: 'vaultwarden', chapter: 3, dungeon: 'ember-vault', name: 'Vault Warden of the Forge', home: 'vault', zone: 'ember-vault', tint: 0xff9040, xp: 2200, stones: [300, 420], sprite: 'mob.swordspirit_v_gold', scale: 1.1, radius: 20,
    maxHp: 26000, atk: 78, def: 22, speed: 50,
    moves: {
      sweep: { range: 96, halfAngle: 1.2, windup: 0.6, recover: 0.4, cooldown: 2.8, damageMult: 1.4, triggerRange: 92 },
      charge: { windup: 0.6, duration: 0.45, speed: 350, width: 24, recover: 0.6, cooldown: 4.4, damageMult: 1.6, minRange: 14, maxRange: 260 },
      rain: { count: 9, radius: 30, spread: 130, windup: 0.5, delay: 0.9, recover: 0.4, cooldown: 5.4, damageMult: 1.2 },
      teleport: { windup: 0.7, recover: 0.4, cooldown: 7.5, behind: 44, radius: 50, damageMult: 1.6 },
      summon: { windup: 0.75, cooldown: 12, count: 3, maxMinions: 5, minionType: 'vaultblade' },
      ring: { windup: 0.7, cooldown: 6, projectiles: 14, damageMult: 1.0 },
    },
    kit: [['sweep', 'charge'], ['teleport', 'rain', 'summon', 'sweep'], ['teleport', 'ring', 'rain', 'charge', 'summon']],
    phase2At: 0.66, phase3At: 0.33, enrage: { speedMult: 1.4, cooldownMult: 0.62 },
  },
];

// ---------------------------------------------------------------- dungeons
const DUNGEONS: DungeonDef[] = [
  {
    id: 'ember-burrow', name: 'Glass-Worm Burrow', chapter: 3, kind: 'cave', blurb: 'The dunes above this tunnel have fused into green glass. Something large is still turning underneath.',
    entrance: { x: 68, y: 88, zone: 'dunes' }, minLevel: 18, level: 'Lv 19-22', seed: 0x6a3b01, size: { w: 80, h: 60 }, floor: 'sand', wall: 'wall',
    scatter: [{ kind: 'rock', p: 0.02 }, { kind: 'taihurocks', p: 0.008 }, { kind: 'standstone', p: 0.006 }],
    spawns: { sandviper: 7, glassscorpion: 8, glasswormling: 8, dustwisp: 4, cactuswarden: 2 },
    mood: 'dusk', tier: { hp: 6.6, atk: 4.6, xp: 7.4 }, propTint: 0x9fe8d4, boss: 'glasswormqueen',
    reward: { xp: 2600, stones: 700, items: [{ id: 'ember-glassblade', count: 1 }, { id: 'ember-hp-potion', count: 3 }] }, herbs: 6,
  },
  {
    id: 'ember-mine', name: 'Obsidian Mine', chapter: 3, kind: 'cave', blurb: 'Miners dug for obsidian until the stone began to glow. Their lamps still burn somewhere below.',
    entrance: { x: 108, y: 64, zone: 'magmarift' }, minLevel: 23, level: 'Lv 24-27', seed: 0x6a3b02, size: { w: 90, h: 64 }, floor: 'basalt', wall: 'wall',
    scatter: [{ kind: 'rock', p: 0.03 }, { kind: 'standstone', p: 0.01 }, { kind: 'taihurocks', p: 0.008 }],
    spawns: { obsidiangolem: 5, magmasprite: 6, cindermoth: 8, slagtoad: 5, cinderhound: 5 },
    mood: 'night', tier: { hp: 8.2, atk: 5.5, xp: 9.2 }, propTint: 0xff9272, boss: 'obsidiancolossus',
    reward: { xp: 3200, stones: 900, items: [{ id: 'ember-obsidian-plate', count: 1 }, { id: 'ember-hp-potion', count: 4 }, { id: 'ember-mana-potion', count: 3 }] }, herbs: 6,
  },
  {
    id: 'ember-vault', name: 'Sunken Alchemy Vault', chapter: 3, kind: 'realm', blurb: 'A sealed laboratory of the immortals, drowned in salt. Its furnaces were never put out.',
    entrance: { x: 22, y: 58, zone: 'saltflats' }, minLevel: 25, level: 'Lv 25-28', seed: 0x6a3b03, size: { w: 112, h: 60 }, floor: 'stone', wall: 'void', rooms: 5,
    scatter: [{ kind: 'lotusbowl', p: 0.004 }, { kind: 'standstone', p: 0.006 }, { kind: 'dragonpillar', p: 0.004 }],
    spawns: { vaultblade: 6, homunculus: 8, vaultwisp: 6, bronzeguardian: 4 },
    mood: 'night', tier: { hp: 8.8, atk: 5.9, xp: 10 }, propTint: 0xffd488, boss: 'vaultwarden',
    reward: { xp: 3800, stones: 1100, items: [{ id: 'ember-vault-sigil', count: 1 }, { id: 'ember-qi-pill', count: 3 }, { id: 'foundation-pill', count: 1 }] }, herbs: 6,
  },
];

// ---------------------------------------------------------------- items
const potion = (id: string, name: string, desc: string, value: number, fx: Pick<ItemDef, 'heal' | 'mana' | 'qi'>): ItemDef => ({ id, name, type: 'consumable', maxStack: 10, description: desc, value, rarity: 'rare', ...fx });
const mat = (id: string, name: string, desc: string, value: number): ItemDef => ({ id, name, type: 'quest', maxStack: 20, description: desc, value, rarity: 'uncommon' });

const ITEMS: ItemDef[] = [
  potion('ember-hp-potion', 'Sunfire Elixir', 'Restores 300 HP.', 90, { heal: 300 }),
  potion('ember-mana-potion', 'Moonwell Elixir', 'Restores 160 mana.', 90, { mana: 160 }),
  potion('ember-qi-pill', 'Cinder Qi Pill', 'Adds 180 qi.', 100, { qi: 180 }),
  mat('ember-viper-fang', 'Sand Viper Fang', 'A hooked yellow fang. Caravan guards pay for these.', 20),
  mat('ember-roc-feather', 'Ash Roc Feather', 'Grey as cold ash, and stiff as wire.', 24),
  mat('ember-obsidian-shard', 'Obsidian Shard', 'Black glass that stays warm in the hand.', 26),
  mat('ember-sun-tablet', 'Sun Tablet Fragment', 'A gilded scrap of the temple\'s record.', 30),
  mat('ember-glass-shard', 'Dune-Glass Shard', 'Green glass fused from sand. It rings when struck.', 22),
  { id: 'ember-glassblade', name: 'Glass-Worm Fang Blade', type: 'equipment', slot: 'weapon', maxStack: 1, description: '+41 attack. Cut from the Queen\'s own fang.', value: 4200, rarity: 'epic', weaponAtk: 41 },
  { id: 'ember-obsidian-plate', name: 'Obsidian Miner\'s Plate', type: 'equipment', slot: 'armor', maxStack: 1, description: '+36 defence, +190 HP.', value: 4400, rarity: 'epic', defBonus: 36, hpBonus: 190 },
  { id: 'ember-wyrm-scale', name: 'Sand Wyrm Scale', type: 'equipment', slot: 'charm', maxStack: 1, description: '+7 attack, +5% critical chance, +6 defence.', value: 4000, rarity: 'epic', atkBonus: 7, critBonus: 0.05, defBonus: 6 },
  { id: 'ember-vault-sigil', name: 'Vault Alchemist\'s Sigil', type: 'equipment', slot: 'charm', maxStack: 1, description: '+90 mana, +5 mana regeneration, +8 defence.', value: 4300, rarity: 'epic', manaBonus: 90, regenBonus: 5, defBonus: 8 },
];

const ICONS: ChapterContent['icons'] = {
  'ember-hp-potion': { kind: 'ui', key: 'item_furnace' }, 'ember-mana-potion': { kind: 'ui', key: 'item_conch' }, 'ember-qi-pill': { kind: 'ui', key: 'item_ginseng' },
  'ember-viper-fang': { kind: 'ui', key: 'item_token' }, 'ember-roc-feather': { kind: 'ui', key: 'item_talisman' }, 'ember-obsidian-shard': { kind: 'ui', key: 'item_spirit_stone' },
  'ember-sun-tablet': { kind: 'ui', key: 'item_jade_slip' }, 'ember-glass-shard': { kind: 'ui', key: 'item_compass' },
  'ember-glassblade': { kind: 'icon', key: 'heavy_01_02' }, 'ember-obsidian-plate': { kind: 'icon', key: 'relic_02_01' },
  'ember-wyrm-scale': { kind: 'icon', key: 'relic_01_04' }, 'ember-vault-sigil': { kind: 'icon', key: 'relic_02_03' },
};

const DROPS: ChapterContent['drops'] = {
  sandviper: [{ item: 'ember-viper-fang', chance: 0.4 }, { item: 'greater-hp-potion', chance: 0.08 }],
  dunejackal: [{ item: 'greater-hp-potion', chance: 0.1 }, { item: 'hp-potion', chance: 0.2 }],
  glassscorpion: [{ item: 'ember-glass-shard', chance: 0.35 }, { item: 'greater-hp-potion', chance: 0.1 }],
  dustwisp: [{ item: 'greater-mana-potion', chance: 0.15 }],
  cactuswarden: [{ item: 'qi-pill', chance: 0.35 }, { item: 'ember-hp-potion', chance: 0.08 }],
  reedtoad: [{ item: 'greater-hp-potion', chance: 0.14 }],
  drownedcaravaneer: [{ item: 'greater-mana-potion', chance: 0.14 }, { item: 'ember-glass-shard', chance: 0.15 }],
  oasisnymph: [{ item: 'greater-mana-potion', chance: 0.18 }, { item: 'qi-pill', chance: 0.2 }],
  claygolem: [{ item: 'qi-pill', chance: 0.4 }, { item: 'ember-hp-potion', chance: 0.1 }],
  ashroc: [{ item: 'ember-roc-feather', chance: 0.45 }, { item: 'greater-mana-potion', chance: 0.15 }],
  duneraider: [{ item: 'greater-hp-potion', chance: 0.16 }, { item: 'ember-hp-potion', chance: 0.05 }],
  cindermoth: [{ item: 'hp-potion', chance: 0.12 }],
  saltghoul: [{ item: 'qi-pill', chance: 0.3 }, { item: 'ember-hp-potion', chance: 0.08 }],
  mirageghost: [{ item: 'ember-mana-potion', chance: 0.07 }, { item: 'greater-mana-potion', chance: 0.18 }],
  brinecrawler: [{ item: 'greater-hp-potion', chance: 0.12 }],
  saltsoldier: [{ item: 'greater-hp-potion', chance: 0.14 }, { item: 'ember-hp-potion', chance: 0.05 }],
  magmasprite: [{ item: 'ember-mana-potion', chance: 0.1 }, { item: 'greater-mana-potion', chance: 0.18 }],
  obsidiangolem: [{ item: 'ember-obsidian-shard', chance: 0.5 }, { item: 'ember-qi-pill', chance: 0.12 }],
  slagtoad: [{ item: 'ember-hp-potion', chance: 0.1 }, { item: 'greater-hp-potion', chance: 0.15 }],
  cinderhound: [{ item: 'ember-hp-potion', chance: 0.08 }, { item: 'greater-hp-potion', chance: 0.15 }],
  mummy: [{ item: 'ember-sun-tablet', chance: 0.3 }, { item: 'ember-hp-potion', chance: 0.1 }],
  sunhusk: [{ item: 'ember-sun-tablet', chance: 0.25 }, { item: 'ember-qi-pill', chance: 0.12 }],
  templeguard: [{ item: 'ember-sun-tablet', chance: 0.25 }, { item: 'ember-hp-potion', chance: 0.1 }],
  sunblade: [{ item: 'ember-qi-pill', chance: 0.15 }],
  vaultblade: [{ item: 'ember-qi-pill', chance: 0.15 }],
  homunculus: [{ item: 'ember-hp-potion', chance: 0.1 }],
  vaultwisp: [{ item: 'ember-mana-potion', chance: 0.12 }],
  bronzeguardian: [{ item: 'ember-qi-pill', chance: 0.2 }, { item: 'ember-obsidian-shard', chance: 0.2 }],
  glasswormling: [{ item: 'ember-glass-shard', chance: 0.3 }],
  sandwyrm: [{ item: 'ember-wyrm-scale', chance: 1 }, { item: 'ember-hp-potion', chance: 1 }, { item: 'ember-qi-pill', chance: 1 }],
  mirageempress: [{ item: 'furnace-robe', chance: 1 }, { item: 'ember-mana-potion', chance: 1 }, { item: 'ember-qi-pill', chance: 1 }],
  furnacewarden: [{ item: 'furnace-saber', chance: 1 }, { item: 'furnace-seal', chance: 1 }, { item: 'ember-qi-pill', chance: 1 }],
  glasswormqueen: [{ item: 'ember-glass-shard', chance: 1 }, { item: 'ember-hp-potion', chance: 1 }],
  obsidiancolossus: [{ item: 'ember-obsidian-shard', chance: 1 }, { item: 'ember-mana-potion', chance: 1 }],
  vaultwarden: [{ item: 'ember-qi-pill', chance: 1 }, { item: 'ember-hp-potion', chance: 1 }],
};

const ELITE_LOOT: ChapterContent['eliteLoot'] = {
  dunes: ['ember-hp-potion', 'ember-blade', 'greater-hp-potion'],
  oasis: ['ember-mail', 'ember-mana-potion', 'ember-hp-potion'],
  canyon: ['ember-blade', 'ember-mail', 'ember-wyrm-scale'],
  saltflats: ['ember-mail', 'ember-glassblade', 'ember-vault-sigil'],
  magmarift: ['ember-glassblade', 'ember-obsidian-plate', 'ember-wyrm-scale'],
  suntemple: ['ember-obsidian-plate', 'ember-vault-sigil', 'ember-glassblade'],
};

const STOCKS: ChapterContent['stocks'] = {
  ember: ['ember-hp-potion', 'ember-mana-potion', 'greater-hp-potion', 'greater-mana-potion', 'qi-pill', 'ember-qi-pill', 'foundation-pill', 'ember-blade', 'ember-mail'],
};

const RECIPES: ChapterContent['recipes'] = {
  ember: [
    { id: 'ember-brew-hp', name: 'Sunfire Elixir', output: 'ember-hp-potion', herbs: 2, stones: 24, note: 'Restores 300 HP' },
    { id: 'ember-brew-mana', name: 'Moonwell Elixir', output: 'ember-mana-potion', herbs: 2, stones: 24, note: 'Restores 160 mana' },
    { id: 'ember-brew-qi', name: 'Cinder Qi Pill', output: 'ember-qi-pill', herbs: 3, stones: 40, note: 'Adds 180 qi' },
    { id: 'ember-brew-foundation', name: 'Foundation Pill', output: 'foundation-pill', herbs: 3, stones: 25, note: 'Needed for every breakthrough' },
    { id: 'ember-brew-greater-hp', name: 'Greater Vitality Draught', output: 'greater-hp-potion', herbs: 1, stones: 10, note: 'Restores 120 HP' },
  ],
};

// ---------------------------------------------------------------- npcs & quests
const NPCS: Record<string, NpcDef> = {
  'caravan-master-hui': { chapter: 3, sprite: 'hero.saber', role: 'Caravan-Master Hui · Quests', name: 'Caravan-Master Hui', portrait: 'general_neutral', quests: ['ember-silent-roads', 'ember-wyrm', 'ember-champions', 'ember-rift-survey', 'ember-mirage', 'ember-furnace'], idle: 'Forty caravans sailed these dunes every season. This season, none. Find out why, disciple.' },
  'trader-sahn': { chapter: 3, sprite: 'hero.spearman', role: 'Trader Sahn · Shop', blurb: 'Whatever the caravans carried, I still stock. Prices have gone up, naturally.', name: 'Trader Sahn', portrait: 'peddler_neutral', quests: [], idle: 'Cinderforged steel, sun-elixirs, honest weight. Sit, sit.', trade: 'shop', stock: 'ember' },
  'alchemist-zhu': { chapter: 3, sprite: 'hero.fanscholar', role: 'Alchemist Zhu · Alchemy', blurb: 'The old furnace is awake again. I can feel its heat in my teeth. Bring herbs and I will brew.', name: 'Alchemist Zhu', portrait: 'alchemist_neutral', quests: [], idle: 'Every pill I brew now tastes of smoke. Make of that what you will.', trade: 'alchemy', recipes: 'ember' },
  'wanderer-dahl': { chapter: 3, sprite: 'hero.swordsman', role: 'Wanderer Dahl · Quests', name: 'Wanderer Dahl', portrait: 'hunter_neutral', quests: ['ember-viper-fangs', 'ember-worm-queen'], idle: 'The sand sings before it moves. Learn to hear it and you will outlive the vipers.' },
  'keeper-ila': { chapter: 3, sprite: 'hero.heroine', role: 'Keeper Ila · Quests', name: 'Keeper Ila', portrait: 'granny_neutral', quests: ['ember-oasis-herbs'], idle: 'This spring has fed travellers for a thousand years. I will not watch it go dry.' },
  'hunter-tarq': { chapter: 3, sprite: 'hero.archer', role: 'Hunter Tarq · Quests', name: 'Hunter Tarq', portrait: 'drunkard_neutral', quests: ['ember-roc-hunt'], idle: 'Rocs nest on the canyon rim. The ash makes them mean. The heat makes them clever.' },
  'miner-borok': { chapter: 3, sprite: 'hero.twinblade', role: 'Miner Borok · Quests', name: 'Miner Borok', portrait: 'blacksmith_neutral', quests: ['ember-obsidian', 'ember-mine-heart'], idle: 'Forty years I cut obsidian. It never used to be warm.' },
  'hermit-zaim': { chapter: 3, sprite: 'hero.staffbeggar', role: 'Hermit Zaim · Quests', name: 'Hermit Zaim', portrait: 'hermit_neutral', quests: ['ember-salt-road', 'ember-vault-seal'], idle: 'White ground, white sky, white ghosts. Watch which footprints are yours.' },
  'scholar-eun': { chapter: 3, sprite: 'hero.monk', role: 'Scholar Eun · Lore', name: 'Scholar Eun', portrait: 'scholar_neutral', quests: ['ember-sun-scrolls'], idle: 'The temple was a clock for the Furnace. Every hour was a different fire.' },
};

const kill = (target: string, count: number, label: string) => ({ type: 'kill' as const, target, count, label });
const collect = (item: string, count: number, label: string) => ({ type: 'collect' as const, item, count, label });
const QUESTS: QuestDef[] = [
  {
    id: 'ember-silent-roads', chapter: 3, name: 'The Silent Roads', giver: 'caravan-master-hui',
    intro: 'You came through the Ember Gate, so you know the Fissure bled its heat south. This is where it landed. The dunes east of the Bazaar crawl with vipers and jackals, and not one caravan has crossed in a month. Cull eight sand vipers and six dune jackals.',
    reminder: 'Eight Sand Vipers and six Dune Jackals in the Sunscour Dunes, east of the Bazaar.',
    completeText: 'Better. The first road is breathing again. Spend this at Trader Sahn\'s: the steel here is made for the heat.',
    objectives: [kill('sandviper', 8, 'Cull Sand Vipers'), kill('dunejackal', 6, 'Cull Dune Jackals')],
    reward: { xp: 390, stones: 500, items: [{ id: 'greater-hp-potion', count: 4 }, { id: 'qi-pill', count: 2 }] },
  },
  {
    id: 'ember-wyrm', chapter: 3, name: 'The Wyrm Under the Road', giver: 'caravan-master-hui', requires: 'ember-silent-roads',
    intro: 'The vipers are only the smallest teeth. Something vast burrows under the canyon road, and caravans vanish where it surfaces. Scouts call it the Sand Wyrm. It guards the Scorched Canyon, south-east along the road. End it.',
    reminder: 'The Sand Wyrm lies at the end of the canyon road, south-east of the dunes.',
    completeText: 'The road is open to the Magma Rift. Take this, you will need it.',
    objectives: [kill('sandwyrm', 1, 'Slay the Sand Wyrm')],
    reward: { xp: 600, stones: 800, items: [{ id: 'ember-hp-potion', count: 3 }, { id: 'ember-mana-potion', count: 3 }] },
  },
  {
    id: 'ember-champions', chapter: 3, name: 'Champions of the Sands', giver: 'caravan-master-hui', requires: 'ember-wyrm',
    intro: 'Heat twists the strongest beasts: gold-marked, cruel, clever. My guards refuse to ride while four of them walk the wastes. Slay four elite monsters.',
    reminder: 'Four elite monsters (golden names), anywhere in the Ember Wastes.',
    completeText: 'Four fewer. The guards are saddling up. Here is the purse I promised.',
    objectives: [{ type: 'elite', count: 4, label: 'Slay Elite Monsters' }],
    reward: { xp: 620, stones: 900, items: [{ id: 'ember-qi-pill', count: 2 }, { id: 'ember-hp-potion', count: 3 }] },
  },
  {
    id: 'ember-rift-survey', chapter: 3, name: 'Survey of the Rift', giver: 'caravan-master-hui', requires: 'ember-wyrm',
    intro: 'Beyond the canyon the ground splits and lava flows where there was a dry riverbed. If we are to reach the temple, we must know the way. Clear eight magma sprites and six cinder hounds from the Magma Rift.',
    reminder: 'Eight Magma Sprites and six Cinder Hounds in the Magma Rift, north of the canyon.',
    completeText: 'A map I can finally draw. The causeways hold. The temple is next, and beyond it, the Furnace.',
    objectives: [kill('magmasprite', 8, 'Douse Magma Sprites'), kill('cinderhound', 6, 'Cull Cinder Hounds')],
    reward: { xp: 650, stones: 1000, items: [{ id: 'ember-hp-potion', count: 4 }, { id: 'ember-mana-potion', count: 4 }] },
  },
  {
    id: 'ember-mirage', chapter: 3, name: 'The Mirage Empress', giver: 'caravan-master-hui', requires: 'ember-rift-survey',
    intro: 'The Sun Temple lies buried north of the rift. Travellers who reach it speak of an empress who walks on sand without leaving a mark, and who wears a different face for each. She holds the temple key to the Furnace. Slay the Mirage Empress.',
    reminder: 'The Mirage Empress holds the Buried Sun Temple, north of the Magma Rift.',
    completeText: 'The mirage has broken. The way to the summit stands open, and this vestment is yours.',
    objectives: [kill('mirageempress', 1, 'Slay the Mirage Empress')],
    reward: { xp: 780, stones: 1400, items: [{ id: 'ember-hp-potion', count: 4 }, { id: 'ember-qi-pill', count: 3 }] },
  },
  {
    id: 'ember-furnace', chapter: 3, name: 'The Heavenly Furnace', giver: 'caravan-master-hui', requires: 'ember-mirage',
    intro: 'At the summit the Furnace Warden, the immortals\' last servant, feeds the forge with whatever the Fissure sends it. The dunes turn to glass because it has not stopped burning. Climb the east road and put out the fire.',
    reminder: 'The Furnace Warden waits at the Furnace Summit, at the far end of the north-east road.',
    completeText: 'The sands are cooling. Disciple, you have done what the sect could not. But the smoke still reaches the sky, and something up there has noticed.',
    objectives: [kill('furnacewarden', 1, 'Slay the Furnace Warden')],
    reward: { xp: 1090, stones: 2400, items: [{ id: 'ember-hp-potion', count: 6 }, { id: 'ember-mana-potion', count: 6 }, { id: 'ember-qi-pill', count: 4 }] },
  },
  // side quests
  {
    id: 'ember-viper-fangs', chapter: 3, name: 'Fangs for the Guards', giver: 'wanderer-dahl', requires: 'ember-silent-roads',
    intro: 'Caravan guards pay well for sand viper fangs: they grind them into antivenom. Bring me six, and I will split what they give me.',
    reminder: 'Six Sand Viper Fangs. Sand vipers dwell in the dunes, and in the oasis reeds.',
    completeText: 'Clean fangs, good work. Here is your share.',
    objectives: [collect('ember-viper-fang', 6, 'Collect Sand Viper Fangs')],
    reward: { xp: 260, stones: 450, items: [{ id: 'greater-hp-potion', count: 3 }] },
  },
  {
    id: 'ember-worm-queen', chapter: 3, name: 'The Queen Beneath the Glass', giver: 'wanderer-dahl', requires: 'ember-viper-fangs',
    intro: 'South of the dunes the sand has fused into green glass, and the tunnels beneath ring when I knock. A queen lives there. I have heard her breathe. If you go in, go strong: there is a cave mouth by the standing stones.',
    reminder: 'The Glass-Worm Burrow opens by a pair of standing stones in the Sunscour Dunes. Clear it and slay the Queen.',
    completeText: 'You went down and came back up. That is rarer than you think. Keep the fang.',
    objectives: [kill('glasswormqueen', 1, 'Slay the Glass-Worm Queen')],
    reward: { xp: 470, stones: 700, items: [{ id: 'ember-hp-potion', count: 3 }, { id: 'ember-qi-pill', count: 2 }] },
  },
  {
    id: 'ember-oasis-herbs', chapter: 3, name: 'The Spring Still Runs', giver: 'keeper-ila', requires: 'ember-silent-roads',
    intro: 'The heat is poisoning my spring-herbs. Bring me eight Spirit Herbs and put down the drowned caravaneers that haunt the reeds: they stir the water until it clouds.',
    reminder: 'Eight Spirit Herbs, and six Drowned Caravaneers, at the Mirage Oasis.',
    completeText: 'The water clears already. Drink, and take this with my blessing.',
    objectives: [collect('spirit-herb', 8, 'Gather Spirit Herbs'), kill('drownedcaravaneer', 6, 'Lay Drowned Caravaneers to rest')],
    reward: { xp: 340, stones: 550, items: [{ id: 'ember-mana-potion', count: 3 }, { id: 'greater-hp-potion', count: 3 }] },
  },
  {
    id: 'ember-roc-hunt', chapter: 3, name: 'Rocs on the Rim', giver: 'hunter-tarq', requires: 'ember-silent-roads',
    intro: 'Ash rocs nest on the canyon rim and rain feathers like knives. I need five of their grey feathers to fletch arrows that can pierce glass-scorpion shells, and I need six of the birds gone before they get clever.',
    reminder: 'Five Ash Roc Feathers and six Ash Rocs, in the Scorched Canyon and the Salt Flats.',
    completeText: 'Good feathers. These will fly true. Take your pay, and a few draughts.',
    objectives: [collect('ember-roc-feather', 5, 'Collect Ash Roc Feathers'), kill('ashroc', 6, 'Cull Ash Rocs')],
    reward: { xp: 440, stones: 650, items: [{ id: 'ember-hp-potion', count: 3 }, { id: 'greater-mana-potion', count: 3 }] },
  },
  {
    id: 'ember-obsidian', chapter: 3, name: 'Warm Stone', giver: 'miner-borok', requires: 'ember-wyrm',
    intro: 'My crew dug the Obsidian Mine until the stone started to glow. Golems walk out of the rock now. Break six of them and bring me five shards from their chests: I need to know what is waking them.',
    reminder: 'Six Obsidian Golems and five Obsidian Shards, in the Magma Rift.',
    completeText: 'Still warm, and getting warmer. You should know: the mine goes deeper than any map I made. Be careful.',
    objectives: [kill('obsidiangolem', 6, 'Break Obsidian Golems'), collect('ember-obsidian-shard', 5, 'Collect Obsidian Shards')],
    reward: { xp: 620, stones: 900, items: [{ id: 'ember-hp-potion', count: 4 }, { id: 'ember-qi-pill', count: 2 }] },
  },
  {
    id: 'ember-mine-heart', chapter: 3, name: 'The Heart of the Mine', giver: 'miner-borok', requires: 'ember-obsidian',
    intro: 'At the bottom of my mine stands a thing the crew named the Colossus: a pile of obsidian that remembers being a man. Enter the Obsidian Mine and put it down. My crew\'s lamps are still down there.',
    reminder: 'The Obsidian Mine opens in the Magma Rift. Its Colossus waits at the bottom.',
    completeText: 'The lamps went out. I could hear it from here. Rest, friend. Take this.',
    objectives: [kill('obsidiancolossus', 1, 'Slay the Obsidian Colossus')],
    reward: { xp: 680, stones: 1100, items: [{ id: 'ember-obsidian-plate', count: 1 }, { id: 'ember-hp-potion', count: 3 }] },
  },
  {
    id: 'ember-salt-road', chapter: 3, name: 'Footprints in the Salt', giver: 'hermit-zaim', requires: 'ember-wyrm',
    intro: 'The salt flats keep every footprint, even the ones that have not been made yet. Salt ghouls rise where the drowned lie, and mirage ghosts lure the living in circles. Lay five ghouls and six ghosts to rest.',
    reminder: 'Five Salt Ghouls and six Mirage Ghosts, on the Whitesalt Flats.',
    completeText: 'My footprints are my own again. Thank you. The vault in the salt opens only to the strong; ask me when you are ready.',
    objectives: [kill('saltghoul', 5, 'Lay Salt Ghouls to rest'), kill('mirageghost', 6, 'Banish Mirage Ghosts')],
    reward: { xp: 520, stones: 800, items: [{ id: 'ember-mana-potion', count: 3 }, { id: 'ember-qi-pill', count: 2 }] },
  },
  {
    id: 'ember-vault-seal', chapter: 3, name: 'The Sunken Vault', giver: 'hermit-zaim', requires: 'ember-salt-road',
    intro: 'Under the white ground lies a laboratory of the immortals, drowned in brine, its furnaces still burning. Its Warden never stopped working. Open the vault by the standing moon-gate near my hut and put the Warden out.',
    reminder: 'The Sunken Alchemy Vault is a moon-gate in the Whitesalt Flats. Slay the Vault Warden within.',
    completeText: 'The furnaces beneath the salt are quiet. Perhaps the great one will quiet now too.',
    objectives: [kill('vaultwarden', 1, 'Slay the Vault Warden')],
    reward: { xp: 780, stones: 1300, items: [{ id: 'ember-qi-pill', count: 3 }, { id: 'ember-mana-potion', count: 4 }] },
  },
  {
    id: 'ember-sun-scrolls', chapter: 3, name: 'Records of the Sun', giver: 'scholar-eun', requires: 'ember-rift-survey',
    intro: 'The temple\'s records were gilded tablets, shattered when it sank. Bring me four fragments from the mummies and sentinels that guard it, and I will tell you how the Empress was made.',
    reminder: 'Four Sun Tablet Fragments, from mummies and temple sentinels in the Buried Sun Temple.',
    completeText: 'Yes. She was a mirror the immortals built to see the sun without being burned. The mirror cracked, and it stares back. That is what you will meet.',
    objectives: [collect('ember-sun-tablet', 4, 'Collect Sun Tablet Fragments')],
    reward: { xp: 680, stones: 1000, items: [{ id: 'ember-mana-potion', count: 3 }, { id: 'ember-hp-potion', count: 3 }] },
  },
];

export const CH3: ChapterContent = {
  ...emptyContent(),
  chapter: {
    id: 3, name: 'The Ember Wastes', subtitle: 'Chapter 3', hub: 'bazaar', gateName: 'Ember Gate', gear: CHAPTER_GEAR[3],
    // bosses listed explicitly (same as the default, chapter 2's open-map bosses) because tools/export_design.mjs reads gate.bosses directly
    gate: { level: 17, bosses: ['corpseking', 'crystalcolossus', 'sovereign'], hint: 'Defeat the Corpse King, the Crystal Colossus and the Sundered Sovereign, and reach level 17.' },
    story: [
      'The Sundered Sovereign is dead and the cold is gone. The Fissure did not close. It bled its other heat south, into the desert, and the heat woke what lay buried there.',
      'The Heavenly Furnace was the immortals\' forge, where they refined pills and flying swords before they fled to the sky. Now it burns again. Dunes melt to green glass, a rift of magma opens in the old caravan roads.',
      'At the Cinder Bazaar, the last town on the trade route, caravans have stopped arriving. Caravan-Master Hui keeps the lanterns lit, in case anyone still comes.',
      'Cross the dunes, the canyon and the salt, and climb to the summit of the Furnace. Whatever feeds it must be stopped.',
    ],
  },
  map: MAP,
  zones: ZONES,
  enemies: ENEMIES,
  bosses: BOSSES,
  quests: QUESTS,
  npcs: NPCS,
  items: ITEMS,
  icons: ICONS,
  drops: DROPS,
  eliteLoot: ELITE_LOOT,
  stocks: STOCKS,
  recipes: RECIPES,
  dungeons: DUNGEONS,
};
