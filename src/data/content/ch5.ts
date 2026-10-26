import type { ChapterDef } from '../chapters';
import type { BossDef } from '../boss';
import type { DungeonDef } from '../dungeons';
import type { EnemyDef } from '../enemies';
import type { ItemDef } from '../items';
import type { MapDef } from '../maps';
import type { NpcDef, QuestDef } from '../quests';
import type { ZoneDef } from '../zones';
import { CHAPTER_GEAR } from './gear';
import { emptyContent, type ChapterContent, type RecipeDef } from './types';

/**
 * Chapter 5: The Crimson Abyss (the finale).
 * After the Jade Magistrate falls the sky cracks and the realm beneath all realms opens. Every cultivator's unresolved ambition becomes a monster
 * here, and at the heart waits the Dao Demon of Tribulation, the thing every cultivator meets at the top of the Way.
 * All sprites are PLACEHOLDER art: the pack's mobs / bosses, recoloured with `tint` and scaled. Replace before release.
 */

// ---------------------------------------------------------------------------------------------------------------------------------
// Chapter
// ---------------------------------------------------------------------------------------------------------------------------------
const CHAPTER: ChapterDef = {
  id: 5, name: 'The Crimson Abyss', subtitle: 'Chapter 5', hub: 'lantern', gateName: 'Abyss Gate',
  gear: CHAPTER_GEAR[5],
  gate: { level: 35, hint: 'Bring down every lord of the Jade Heavens, ending with the Jade Magistrate, and reach level 35.' },
  story: [
    'The Magistrate fell, and the sky did not mend. It cracked from horizon to horizon, and through the crack the heavens drained away like water from a broken bowl.',
    'Beneath every realm lies one more: the Crimson Abyss. It is where a cultivator\'s unfinished wants are sent to wait. Every vow left unkept, every rival left unforgiven, every door left unopened is down here, and none of it has stayed quiet.',
    'At the edge of the dark, a few survivors keep one flame alive. They call their camp the Last Lantern, and they have kept it burning through nine winters of ash.',
    'At the heart of the Abyss, on a mountain of old tribulation lightning, waits the Dao Demon. Every cultivator meets it at the top of the Way. Most never come back to say what it asked.',
    'You have climbed further than anyone. There is only one road left, and it goes down.',
  ],
};

// ---------------------------------------------------------------------------------------------------------------------------------
// Map: 176 x 144 tiles. The hub sits in the south-west; the road winds east through the field of blades and the blood-fire basin,
// north through the mirror city and the bone forest, across the ash plains and the regret gardens, to the Tribulation Peak in the north-east.
// ---------------------------------------------------------------------------------------------------------------------------------
const MAP: MapDef = {
  chapter: 5, seed: 0xab155e5, width: 176, height: 144,
  hub: 'lantern', hubTile: { x: 26, y: 118 }, hubRadius: 12, hubGround: 'stone',
  zones: ['lantern', 'abyss-blades', 'abyss-basin', 'abyss-mirror', 'abyss-bonewood', 'abyss-ash', 'abyss-regret', 'abyss-peak'],
  zoneWeight: { 'abyss-peak': 0.72, 'abyss-regret': 1.08, 'abyss-bonewood': 1.05 },
  roads: [
    [[26, 118], [40, 114], [52, 108], [64, 104]],                           // Last Lantern -> Field of Unburied Blades
    [[64, 104], [80, 112], [92, 116], [106, 118]],                          // blades -> Bloodfire Basin
    [[106, 118], [122, 122], [140, 120]],                                   // basin -> the Blood-River Tyrant's shore
    [[64, 104], [56, 90], [52, 78], [58, 68]],                              // blades -> Ruined Mirror City
    [[58, 68], [44, 66], [28, 62]],                                         // mirror city -> Bone Forest
    [[26, 118], [22, 100], [30, 82], [28, 62]],                             // the western way: hub -> Bone Forest
    [[58, 68], [80, 72], [102, 76]],                                        // mirror city -> Ash Plains
    [[106, 118], [112, 100], [106, 88], [102, 76]],                         // basin -> ash plains (the burning road)
    [[102, 76], [116, 66], [136, 54]],                                      // ash plains -> Regret Gardens
    [[136, 54], [150, 58], [160, 62]],                                      // gardens -> the Matron's bower
    [[136, 54], [140, 38], [148, 26], [150, 16]],                           // gardens -> Tribulation Peak
    [[58, 68], [62, 52], [70, 40]],                                         // mirror city -> the vault gate
    [[28, 62], [24, 48], [30, 32]],                                         // bone forest -> the cavern mouth
  ],
  rivers: [
    { pts: [[82, 141], [88, 126], [100, 106], [112, 104], [130, 100], [150, 98], [172, 96]], r: 3 },
    { pts: [[130, 100], [138, 86], [146, 72], [162, 70]], r: 2.2 },
  ],
  liquid: 'lava', shore: 'basalt',
  ground: {
    lantern: { base: 'ash', layers: [{ kind: 'clay', field: 'v', gt: 0.62 }] },
    'abyss-blades': { base: 'basalt', layers: [{ kind: 'ash', field: 'v', gt: 0.5 }, { kind: 'crimson', field: 'w', gt: 0.7 }] },
    'abyss-basin': { base: 'crimson', layers: [{ kind: 'basalt', field: 'v', gt: 0.55 }, { kind: 'clay', field: 'w', gt: 0.7 }, { kind: 'lava', field: 'w', gt: 0.82 }] },
    'abyss-mirror': { base: 'stone', layers: [{ kind: 'jade', field: 'w', gt: 0.55 }, { kind: 'basalt', field: 'v', gt: 0.68 }] },
    'abyss-bonewood': { base: 'clay', layers: [{ kind: 'ash', field: 'v', gt: 0.5 }, { kind: 'crimson', field: 'w', gt: 0.7 }] },
    'abyss-ash': { base: 'ash', layers: [{ kind: 'basalt', field: 'v', gt: 0.58 }, { kind: 'sand', field: 'w', gt: 0.8 }, { kind: 'stone', field: 'v', gt: 0.8 }] },
    'abyss-regret': { base: 'jade', layers: [{ kind: 'moss', field: 'v', gt: 0.55 }, { kind: 'crimson', field: 'w', gt: 0.68 }, { kind: 'stone', field: 'v', gt: 0.78 }] },
    'abyss-peak': { base: 'basalt', layers: [{ kind: 'crimson', field: 'v', gt: 0.55 }, { kind: 'stone', field: 'w', gt: 0.7 }] },
  },
  scatter: [
    { zone: 'lantern', kind: 'rock', p: 0.01, margin: 0 }, { zone: 'lantern', kind: 'standstone', p: 0.004 },
    { zone: 'abyss-blades', kind: 'standstone', p: 0.022 }, { zone: 'abyss-blades', kind: 'rock', p: 0.02, margin: 0 }, { zone: 'abyss-blades', kind: 'taihurocks', p: 0.004 }, { zone: 'abyss-blades', kind: 'petals', p: 0.012, margin: 0 },
    { zone: 'abyss-basin', kind: 'rock', p: 0.022, margin: 0 }, { zone: 'abyss-basin', kind: 'taihurocks', p: 0.01 }, { zone: 'abyss-basin', kind: 'standstone', p: 0.008 }, { zone: 'abyss-basin', kind: 'dragonpillar', p: 0.003 },
    { zone: 'abyss-mirror', kind: 'moonwall', p: 0.005 }, { zone: 'abyss-mirror', kind: 'tower', p: 0.004 }, { zone: 'abyss-mirror', kind: 'corridor', p: 0.003 }, { zone: 'abyss-mirror', kind: 'pavilion', p: 0.003 }, { zone: 'abyss-mirror', kind: 'paifang', p: 0.003 }, { zone: 'abyss-mirror', kind: 'standstone', p: 0.01 }, { zone: 'abyss-mirror', kind: 'rock', p: 0.008, margin: 0 },
    { zone: 'abyss-bonewood', kind: 'willow', p: 0.034 }, { zone: 'abyss-bonewood', kind: 'pine', p: 0.034 }, { zone: 'abyss-bonewood', kind: 'bambooshoot', p: 0.02, margin: 0 }, { zone: 'abyss-bonewood', kind: 'rock', p: 0.008, margin: 0 }, { zone: 'abyss-bonewood', kind: 'taihurocks', p: 0.004 },
    { zone: 'abyss-ash', kind: 'rock', p: 0.016, margin: 0 }, { zone: 'abyss-ash', kind: 'standstone', p: 0.008 }, { zone: 'abyss-ash', kind: 'pine', p: 0.008 }, { zone: 'abyss-ash', kind: 'tower', p: 0.002 }, { zone: 'abyss-ash', kind: 'petals', p: 0.012, margin: 0 },
    { zone: 'abyss-regret', kind: 'peachtree', p: 0.036 }, { zone: 'abyss-regret', kind: 'willow', p: 0.02 }, { zone: 'abyss-regret', kind: 'orchid', p: 0.03, margin: 0 }, { zone: 'abyss-regret', kind: 'lotusbowl', p: 0.004 }, { zone: 'abyss-regret', kind: 'stonecircle', p: 0.003 }, { zone: 'abyss-regret', kind: 'petals', p: 0.02, margin: 0 },
    { zone: 'abyss-peak', kind: 'standstone', p: 0.014 }, { zone: 'abyss-peak', kind: 'taihurocks', p: 0.01 }, { zone: 'abyss-peak', kind: 'dragonpillar', p: 0.005 }, { zone: 'abyss-peak', kind: 'rock', p: 0.012, margin: 0 },
  ],
  arenas: [
    { bossId: 'abyss-tyrant', tile: { x: 140, y: 120 }, radius: 9, ring: 'taihurocks', open: { x: -1, y: 0 }, ground: 'basalt' },
    { bossId: 'abyss-matron', tile: { x: 160, y: 62 }, radius: 9, ring: 'peachtree', open: { x: -1, y: -0.3 }, ground: 'jade' },
    { bossId: 'abyss-daodemon', tile: { x: 150, y: 16 }, radius: 11, ring: 'dragonpillar', open: { x: -0.2, y: 1 }, ground: 'crimson' },
  ],
  hubProps: [
    { kind: 'tower', dx: 0, dy: -9 }, { kind: 'tower', dx: -11, dy: -5 }, { kind: 'pavilion', dx: 9, dy: 8 }, { kind: 'pavilion', dx: -9, dy: 9 },
    { kind: 'dragonpillar', dx: -5, dy: -3 }, { kind: 'dragonpillar', dx: 5, dy: -3 }, { kind: 'lotusbowl', dx: -6, dy: 4 }, { kind: 'lotusbowl', dx: 6, dy: 4 },
    { kind: 'stonecircle', dx: 13, dy: 11 }, { kind: 'standstone', dx: 12, dy: -4 }, { kind: 'standstone', dx: -13, dy: 5 },
  ],
  npcs: {
    'matron-hui': { x: 28, y: 113 }, 'smith-tang': { x: 33, y: 119 }, 'alchemist-lian': { x: 19, y: 119 },
    'gravetender-jun': { x: 55, y: 105 }, 'ferryman-tu': { x: 100, y: 120 }, 'scribe-ao': { x: 61, y: 71 },
    'huntress-ye': { x: 31, y: 65 }, 'drifter-dun': { x: 105, y: 79 }, 'sister-sen': { x: 133, y: 57 },
  },
  herbs: [['abyss-blades', 8], ['abyss-basin', 8], ['abyss-mirror', 8], ['abyss-bonewood', 8], ['abyss-ash', 7], ['abyss-regret', 8], ['abyss-peak', 3]],
  portal: { dx: 13, dy: 4 },
  borderProp: { lantern: 'standstone', 'abyss-blades': 'standstone', 'abyss-basin': 'taihurocks', 'abyss-mirror': 'standstone', 'abyss-bonewood': 'pine', 'abyss-ash': 'pine', 'abyss-regret': 'willow', 'abyss-peak': 'dragonpillar' },
  extras: [
    { kind: 'floatisle', x: 76, y: 42 }, { kind: 'floatisle', x: 118, y: 40 }, { kind: 'floatisle', x: 168, y: 36 }, { kind: 'floatisle', x: 40, y: 22 },
    { kind: 'stonecircle', x: 78, y: 96 }, { kind: 'stonecircle', x: 124, y: 82 }, { kind: 'tower', x: 70, y: 84 }, { kind: 'tower', x: 118, y: 132 },
    { kind: 'goldgate', x: 150, y: 34, force: true }, { kind: 'pagoda7', x: 84, y: 60 }, { kind: 'palace', x: 46, y: 80 },
  ],
};

// ---------------------------------------------------------------------------------------------------------------------------------
// Zones
// ---------------------------------------------------------------------------------------------------------------------------------
const ZONES_DEF: ZoneDef[] = [
  { id: 'lantern', chapter: 5, name: 'Last Lantern Camp', anchor: { x: 26, y: 118 }, level: 'Safe', spawns: {}, mood: 'dusk', tier: { hp: 1, atk: 1, xp: 1 }, propTint: 0xffd8a8 },
  { id: 'abyss-blades', chapter: 5, name: 'Field of Unburied Blades', anchor: { x: 64, y: 104 }, level: 'Lv 36-40', spawns: { 'abyss-bladewraith': 9, 'abyss-ashmoth': 6, 'abyss-regretghost': 4, 'abyss-ashknight': 4 }, mood: 'night', tier: { hp: 12, atk: 6.5, xp: 4.5 }, propTint: 0xcfa9a6 },
  { id: 'abyss-basin', chapter: 5, name: 'Bloodfire Basin', anchor: { x: 106, y: 118 }, level: 'Lv 38-42', spawns: { 'abyss-lavatoad': 8, 'abyss-bloodfoxfire': 6, 'abyss-emberbird': 4, 'abyss-hollowserpent': 5, 'abyss-cindergolem': 2 }, mood: 'dusk', tier: { hp: 13, atk: 7, xp: 5 }, propTint: 0xff9a78 },
  { id: 'abyss-mirror', chapter: 5, name: 'Ruined Mirror City', anchor: { x: 58, y: 68 }, level: 'Lv 39-43', spawns: { 'abyss-mirrorshade': 7, 'abyss-effigy': 7, 'abyss-bladewraith': 3, 'abyss-regretghost': 4, 'abyss-ashknight': 3 }, mood: 'mist', tier: { hp: 13.5, atk: 7.2, xp: 5.2 }, propTint: 0xb8d4ee },
  { id: 'abyss-bonewood', chapter: 5, name: 'Bone Forest', anchor: { x: 28, y: 62 }, level: 'Lv 40-44', spawns: { 'abyss-bonetreant': 5, 'abyss-bonehound': 9, 'abyss-penitent': 3, 'abyss-ashmoth': 5, 'abyss-bloodfoxfire': 3 }, mood: 'night', tier: { hp: 14.5, atk: 7.8, xp: 5.6 }, propTint: 0xe6dcc0 },
  { id: 'abyss-ash', chapter: 5, name: 'Ash Plains', anchor: { x: 102, y: 76 }, level: 'Lv 41-45', spawns: { 'abyss-ashknight': 8, 'abyss-cindergolem': 4, 'abyss-emberbird': 4, 'abyss-ashmoth': 5, 'abyss-penitent': 3 }, mood: 'dusk', tier: { hp: 15, atk: 8, xp: 5.9 }, propTint: 0xa8a0a8 },
  { id: 'abyss-regret', chapter: 5, name: 'Gardens of Regret', anchor: { x: 136, y: 54 }, level: 'Lv 43-47', spawns: { 'abyss-regretghost': 7, 'abyss-witheredpeach': 7, 'abyss-penitent': 4, 'abyss-mirrorshade': 3, 'abyss-bonetreant': 3 }, mood: 'mist', tier: { hp: 16.5, atk: 9, xp: 6.4 }, propTint: 0xd29cd6 },
  { id: 'abyss-peak', chapter: 5, name: 'Tribulation Peak', anchor: { x: 150, y: 16 }, level: 'Boss', spawns: {}, mood: 'night', tier: { hp: 17, atk: 9.5, xp: 7 }, propTint: 0xb07888 },
];

// ---------------------------------------------------------------------------------------------------------------------------------
// Enemies (PLACEHOLDER art: recoloured / scaled pack mobs)
// ---------------------------------------------------------------------------------------------------------------------------------
const ENEMIES_DEF: EnemyDef[] = [
  // PLACEHOLDER art: sword spirit, blood variant
  { id: 'abyss-bladewraith', name: 'Blade-Wraith', behavior: 'charger', maxHp: 150, atk: 26, def: 4, speed: 52, aggroRange: 150, attackRange: 100, attackCooldown: 2.0, windup: 0.5, dashTime: 0.36, dashSpeedMult: 6, xp: 50, sprite: 'mob.swordspirit_v_blood', scale: 0.4, radius: 8, stones: [8, 15], eliteSprites: ['mob.swordspirit_v_gold'] },
  // PLACEHOLDER art: bat, ash grey
  { id: 'abyss-ashmoth', name: 'Ash Moth', behavior: 'rusher', maxHp: 100, atk: 18, def: 1, speed: 90, aggroRange: 150, attackRange: 14, attackCooldown: 0.7, strikeWindup: 0.22, xp: 30, sprite: 'mob.bat', tint: 0x9a8e92, scale: 0.34, radius: 6, stones: [5, 10] },
  // PLACEHOLDER art: crimson lantern ghost
  { id: 'abyss-regretghost', name: 'Regret-Ghost', behavior: 'caster', maxHp: 90, atk: 26, def: 0, speed: 42, aggroRange: 160, attackRange: 125, attackCooldown: 1.6, preferredRange: 90, volley: 2, xp: 46, sprite: 'mob.ghost_v_crimson', scale: 0.4, radius: 7, stones: [8, 15], eliteSprites: ['mob.ghost_v_gold', 'mob.ghost_v_violet'] },
  // PLACEHOLDER art: soldier, charred
  { id: 'abyss-ashknight', name: 'Ash Knight', behavior: 'rusher', maxHp: 190, atk: 22, def: 8, speed: 44, aggroRange: 130, attackRange: 24, attackCooldown: 1.3, strikeWindup: 0.38, xp: 54, sprite: 'mob.soldier', tint: 0x6e5a5e, scale: 0.42, radius: 9, stones: [9, 17] },
  // PLACEHOLDER art: toad, magma orange
  { id: 'abyss-lavatoad', name: 'Magma Toad', behavior: 'rusher', maxHp: 210, atk: 23, def: 5, speed: 36, aggroRange: 110, attackRange: 20, attackCooldown: 1.4, strikeWindup: 0.44, xp: 50, sprite: 'mob.toad', tint: 0xff7a3a, scale: 0.42, radius: 10, stones: [9, 16] },
  // PLACEHOLDER art: foxfire, red variant
  { id: 'abyss-bloodfoxfire', name: 'Blood Foxfire', behavior: 'caster', maxHp: 100, atk: 28, def: 0, speed: 46, aggroRange: 160, attackRange: 125, attackCooldown: 1.5, preferredRange: 95, volley: 2, xp: 50, sprite: 'mob.foxfire_v_red', scale: 0.42, radius: 7, stones: [9, 16], eliteSprites: ['mob.foxfire_v_green'] },
  // PLACEHOLDER art: thunder bird, ember red
  { id: 'abyss-emberbird', name: 'Ember Shrike', behavior: 'caster', maxHp: 120, atk: 28, def: 2, speed: 50, aggroRange: 170, attackRange: 145, attackCooldown: 1.5, preferredRange: 105, volley: 3, xp: 58, sprite: 'mob.thunderbird', tint: 0xff6a4a, scale: 0.46, radius: 8, stones: [10, 18] },
  // PLACEHOLDER art: snake, deep crimson
  { id: 'abyss-hollowserpent', name: 'Hollow Serpent', behavior: 'rusher', maxHp: 150, atk: 21, def: 3, speed: 58, aggroRange: 120, attackRange: 18, attackCooldown: 0.9, strikeWindup: 0.26, xp: 42, sprite: 'mob.snake', tint: 0xb02a48, scale: 0.4, radius: 8, stones: [7, 13] },
  // PLACEHOLDER art: golem, cooled slag
  { id: 'abyss-cindergolem', name: 'Cinder Golem', behavior: 'charger', maxHp: 260, atk: 28, def: 12, speed: 28, aggroRange: 120, attackRange: 80, attackCooldown: 2.8, windup: 0.85, dashTime: 0.5, dashSpeedMult: 4, xp: 78, sprite: 'mob.golem', tint: 0x8a5a48, scale: 0.5, radius: 12, stones: [14, 24] },
  // PLACEHOLDER art: violet ghost, mirror-silver
  { id: 'abyss-mirrorshade', name: 'Mirror Shade', behavior: 'caster', maxHp: 95, atk: 27, def: 0, speed: 44, aggroRange: 160, attackRange: 125, attackCooldown: 1.6, preferredRange: 90, volley: 2, xp: 48, sprite: 'mob.ghost_v_violet', tint: 0xdff4ff, scale: 0.4, radius: 7, stones: [8, 15] },
  // PLACEHOLDER art: paper doll, funeral red
  { id: 'abyss-effigy', name: 'Burial Effigy', behavior: 'rusher', maxHp: 130, atk: 20, def: 2, speed: 62, aggroRange: 120, attackRange: 18, attackCooldown: 0.95, strikeWindup: 0.28, xp: 38, sprite: 'mob.paperdoll', tint: 0xff9a9a, scale: 0.4, radius: 7, stones: [6, 12] },
  // PLACEHOLDER art: treant, bleached bone
  { id: 'abyss-bonetreant', name: 'Bone Treant', behavior: 'charger', maxHp: 250, atk: 27, def: 10, speed: 30, aggroRange: 120, attackRange: 80, attackCooldown: 2.8, windup: 0.75, dashTime: 0.45, dashSpeedMult: 4.2, xp: 72, sprite: 'mob.treant', tint: 0xe4dcc0, scale: 0.52, radius: 11, stones: [13, 22] },
  // PLACEHOLDER art: wolf, bone white
  { id: 'abyss-bonehound', name: 'Bone Hound', behavior: 'rusher', maxHp: 150, atk: 20, def: 3, speed: 76, aggroRange: 150, attackRange: 18, attackCooldown: 0.85, strikeWindup: 0.26, xp: 42, sprite: 'mob.wolf', tint: 0xeee6d0, scale: 0.42, radius: 8, stones: [7, 13] },
  // PLACEHOLDER art: purple jiangshi
  { id: 'abyss-penitent', name: 'Penitent Corpse', behavior: 'charger', maxHp: 230, atk: 28, def: 7, speed: 38, aggroRange: 130, attackRange: 90, attackCooldown: 2.4, windup: 0.6, dashTime: 0.42, dashSpeedMult: 5, xp: 66, sprite: 'mob.jiangshi_v_purple', scale: 0.44, radius: 9, stones: [12, 20], eliteSprites: ['mob.jiangshi_v_red'] },
  // PLACEHOLDER art: peach spirit, withered plum
  { id: 'abyss-witheredpeach', name: 'Withered Peach Spirit', behavior: 'caster', maxHp: 105, atk: 27, def: 1, speed: 40, aggroRange: 160, attackRange: 120, attackCooldown: 1.5, preferredRange: 85, volley: 3, xp: 52, sprite: 'mob.peachspirit', tint: 0x9a4a78, scale: 0.4, radius: 7, stones: [9, 16] },
];

// ---------------------------------------------------------------------------------------------------------------------------------
// Bosses (PLACEHOLDER art: pack boss sheets and mobs, enlarged and tinted)
// ---------------------------------------------------------------------------------------------------------------------------------
/** Mid boss 1 (blood-fire basin): the river's old tyrant, a flood of fire and tide. Drops the Robe of Nine Tribulations. */
// PLACEHOLDER art: boss.jiaolong, blood-red
const TYRANT: BossDef = {
  id: 'abyss-tyrant', chapter: 5, name: 'Blood-River Tyrant', home: 'abyss-basin', zone: 'abyss-basin', xp: 7600, stones: [900, 1300],
  sprite: 'boss.jiaolong', tint: 0xff5a4a, scale: 0.55, radius: 28, maxHp: 150000, atk: 250, def: 40, speed: 46,
  moves: {
    slam: { radius: 64, windup: 0.9, recover: 0.5, cooldown: 4, damageMult: 1.7, triggerRange: 100 },
    sweep: { range: 104, halfAngle: 1.1, windup: 0.68, recover: 0.45, cooldown: 3, damageMult: 1.4, triggerRange: 100 },
    charge: { windup: 0.75, duration: 0.55, speed: 300, width: 28, recover: 0.7, cooldown: 4.8, damageMult: 1.6, minRange: 14, maxRange: 260 },
    rain: { count: 9, radius: 30, spread: 130, windup: 0.5, delay: 0.95, recover: 0.4, cooldown: 5.5, damageMult: 1.2 },
    summon: { windup: 0.8, cooldown: 13, count: 3, maxMinions: 5, minionType: 'abyss-lavatoad' },
    ring: { windup: 0.75, cooldown: 6, projectiles: 14, damageMult: 1.0 },
  },
  kit: [['sweep', 'rain', 'slam'], ['sweep', 'charge', 'ring', 'summon', 'rain'], ['rain', 'ring', 'charge', 'slam', 'sweep', 'summon']],
  phase2At: 0.66, phase3At: 0.33, enrage: { speedMult: 1.4, cooldownMult: 0.62 },
};

/** Mid boss 2 (gardens of regret): every might-have-been given a mother. Teleports, calls the dead, rains petals of fire. */
// PLACEHOLDER art: boss.ninetail, violet
const MATRON: BossDef = {
  id: 'abyss-matron', chapter: 5, name: 'Matron of Regrets', home: 'abyss-regret', zone: 'abyss-regret', xp: 8800, stones: [1100, 1600],
  sprite: 'boss.ninetail', tint: 0xb878ff, scale: 0.6, radius: 26, maxHp: 190000, atk: 270, def: 30, speed: 54,
  moves: {
    sweep: { range: 96, halfAngle: 1.25, windup: 0.62, recover: 0.4, cooldown: 2.8, damageMult: 1.4, triggerRange: 92 },
    charge: { windup: 0.7, duration: 0.5, speed: 330, width: 24, recover: 0.65, cooldown: 4.6, damageMult: 1.6, minRange: 14, maxRange: 270 },
    rain: { count: 8, radius: 30, spread: 130, windup: 0.45, delay: 0.9, recover: 0.4, cooldown: 5.2, damageMult: 1.2 },
    teleport: { windup: 0.7, recover: 0.4, cooldown: 7.5, behind: 44, radius: 52, damageMult: 1.7 },
    summon: { windup: 0.75, cooldown: 12, count: 3, maxMinions: 5, minionType: 'abyss-regretghost' },
    ring: { windup: 0.7, cooldown: 5.8, projectiles: 16, damageMult: 1.0 },
  },
  kit: [['sweep', 'charge', 'rain'], ['charge', 'rain', 'summon', 'teleport', 'sweep'], ['teleport', 'charge', 'ring', 'rain', 'sweep', 'summon']],
  phase2At: 0.66, phase3At: 0.33, enrage: { speedMult: 1.4, cooldownMult: 0.6 },
};

/** The finale. Every move in the book across three phases, the largest health pool and the highest damage in the game. */
// PLACEHOLDER art: boss.fallenimmortal, crimson
const DAODEMON: BossDef = {
  id: 'abyss-daodemon', chapter: 5, name: 'Dao Demon of Tribulation', home: 'abyss-peak', zone: 'abyss-peak', xp: 18000, stones: [3000, 4200],
  sprite: 'boss.fallenimmortal', tint: 0xff4658, scale: 0.85, radius: 28, maxHp: 330000, atk: 330, def: 60, speed: 48, poise: 0.1,
  moves: {
    slam: { radius: 70, windup: 0.85, recover: 0.45, cooldown: 3.6, damageMult: 1.8, triggerRange: 104 },
    sweep: { range: 108, halfAngle: 1.05, windup: 0.66, recover: 0.4, cooldown: 2.8, damageMult: 1.5, triggerRange: 102 },
    charge: { windup: 0.68, duration: 0.5, speed: 340, width: 26, recover: 0.6, cooldown: 4.6, damageMult: 1.7, minRange: 14, maxRange: 280 },
    rain: { count: 10, radius: 32, spread: 140, windup: 0.45, delay: 0.9, recover: 0.4, cooldown: 5, damageMult: 1.25 },
    teleport: { windup: 0.7, recover: 0.4, cooldown: 7, behind: 48, radius: 56, damageMult: 1.8 },
    summon: { windup: 0.75, cooldown: 12, count: 3, maxMinions: 6, minionType: 'abyss-regretghost' },
    ring: { windup: 0.7, cooldown: 5.4, projectiles: 18, damageMult: 1.05 },
  },
  kit: [['slam', 'sweep', 'charge', 'ring'], ['slam', 'rain', 'summon', 'teleport', 'sweep', 'charge'], ['rain', 'teleport', 'ring', 'charge', 'slam', 'sweep', 'summon']],
  phase2At: 0.7, phase3At: 0.35, enrage: { speedMult: 1.45, cooldownMult: 0.56 },
};

/** Bone-root cavern guardian. PLACEHOLDER art: treant, bone white. */
const ROOTKING: BossDef = {
  id: 'abyss-rootking', chapter: 5, dungeon: 'abyss-bonecavern', name: 'Ossuary Root-King', home: 'abyss-bonecavern', zone: 'abyss-bonecavern', xp: 4200, stones: [500, 760],
  sprite: 'mob.treant', tint: 0xe8e0c0, scale: 1.05, radius: 26, maxHp: 80000, atk: 210, def: 30, speed: 38,
  moves: {
    slam: { radius: 62, windup: 0.9, recover: 0.5, cooldown: 4, damageMult: 1.8, triggerRange: 96 },
    sweep: { range: 96, halfAngle: 1.0, windup: 0.7, recover: 0.45, cooldown: 3.2, damageMult: 1.4, triggerRange: 92 },
    charge: { windup: 0.75, duration: 0.5, speed: 300, width: 28, recover: 0.7, cooldown: 5, damageMult: 1.6, minRange: 14, maxRange: 250 },
    summon: { windup: 0.8, cooldown: 12, count: 3, maxMinions: 5, minionType: 'abyss-bonehound' },
    ring: { windup: 0.75, cooldown: 6.4, projectiles: 12, damageMult: 0.95 },
  },
  kit: [['slam', 'sweep'], ['slam', 'charge', 'summon', 'sweep'], ['charge', 'ring', 'summon', 'slam', 'sweep']],
  phase2At: 0.66, phase3At: 0.33, enrage: { speedMult: 1.35, cooldownMult: 0.66 },
};

/** Blood-spring grotto guardian. PLACEHOLDER art: fox demon, crimson. */
const WYRM: BossDef = {
  id: 'abyss-springfox', chapter: 5, dungeon: 'abyss-bloodgrotto', name: 'Heretic of the Blood Spring', home: 'abyss-bloodgrotto', zone: 'abyss-bloodgrotto', xp: 3800, stones: [460, 700],
  sprite: 'mob.foxdemon', tint: 0xff4a58, scale: 0.9, radius: 22, maxHp: 72000, atk: 200, def: 22, speed: 56,
  moves: {
    sweep: { range: 84, halfAngle: 1.2, windup: 0.6, recover: 0.4, cooldown: 2.8, damageMult: 1.4, triggerRange: 84 },
    charge: { windup: 0.65, duration: 0.5, speed: 320, width: 22, recover: 0.65, cooldown: 4.4, damageMult: 1.6, minRange: 14, maxRange: 260 },
    rain: { count: 7, radius: 28, spread: 120, windup: 0.45, delay: 0.9, recover: 0.4, cooldown: 5.4, damageMult: 1.15 },
    teleport: { windup: 0.7, recover: 0.4, cooldown: 8, behind: 42, radius: 48, damageMult: 1.6 },
    summon: { windup: 0.7, cooldown: 12, count: 3, maxMinions: 5, minionType: 'abyss-bloodfoxfire' },
  },
  kit: [['sweep', 'charge'], ['charge', 'rain', 'summon', 'sweep'], ['teleport', 'charge', 'rain', 'summon', 'sweep']],
  phase2At: 0.66, phase3At: 0.33, enrage: { speedMult: 1.35, cooldownMult: 0.66 },
};

/** The player's own past self, unbound. PLACEHOLDER art: fallen immortal, mirror-silver. */
const VAULTSELF: BossDef = {
  id: 'abyss-vaultself', chapter: 5, dungeon: 'abyss-mirrorvault', name: 'The Self You Left Behind', home: 'abyss-mirrorvault', zone: 'abyss-mirrorvault', xp: 5200, stones: [620, 900],
  sprite: 'boss.fallenimmortal', tint: 0xd8f0ff, scale: 0.6, radius: 20, maxHp: 105000, atk: 230, def: 34, speed: 58,
  moves: {
    slam: { radius: 56, windup: 0.8, recover: 0.45, cooldown: 3.8, damageMult: 1.7, triggerRange: 88 },
    sweep: { range: 90, halfAngle: 1.0, windup: 0.62, recover: 0.4, cooldown: 2.8, damageMult: 1.4, triggerRange: 88 },
    charge: { windup: 0.65, duration: 0.5, speed: 330, width: 22, recover: 0.6, cooldown: 4.6, damageMult: 1.6, minRange: 14, maxRange: 260 },
    teleport: { windup: 0.65, recover: 0.4, cooldown: 7, behind: 44, radius: 50, damageMult: 1.7 },
    summon: { windup: 0.75, cooldown: 13, count: 2, maxMinions: 4, minionType: 'abyss-mirrorshade' },
    ring: { windup: 0.7, cooldown: 6, projectiles: 14, damageMult: 1.0 },
  },
  kit: [['slam', 'sweep', 'charge'], ['sweep', 'teleport', 'summon', 'slam'], ['teleport', 'ring', 'charge', 'sweep', 'slam', 'summon']],
  phase2At: 0.66, phase3At: 0.33, enrage: { speedMult: 1.4, cooldownMult: 0.62 },
};

/** The reliquary's slag warden. PLACEHOLDER art: golem, ember. */
const CINDERLORD: BossDef = {
  id: 'abyss-cinderwarden', chapter: 5, dungeon: 'abyss-ashmaw', name: 'Cinder Warden of the Reliquary', home: 'abyss-ashmaw', zone: 'abyss-ashmaw', xp: 5600, stones: [680, 980],
  sprite: 'mob.golem', tint: 0xc8683c, scale: 1.15, radius: 28, maxHp: 118000, atk: 240, def: 48, speed: 34,
  moves: {
    slam: { radius: 72, windup: 1.0, recover: 0.55, cooldown: 4, damageMult: 1.9, triggerRange: 104 },
    sweep: { range: 104, halfAngle: 1.1, windup: 0.78, recover: 0.5, cooldown: 3.2, damageMult: 1.5, triggerRange: 100 },
    rain: { count: 9, radius: 32, spread: 140, windup: 0.5, delay: 1.0, recover: 0.4, cooldown: 5.4, damageMult: 1.2 },
    charge: { windup: 0.85, duration: 0.5, speed: 280, width: 30, recover: 0.8, cooldown: 5.4, damageMult: 1.7, minRange: 14, maxRange: 240 },
    summon: { windup: 0.85, cooldown: 14, count: 2, maxMinions: 4, minionType: 'abyss-ashknight' },
    ring: { windup: 0.8, cooldown: 6, projectiles: 16, damageMult: 1.0 },
  },
  kit: [['slam', 'sweep'], ['slam', 'rain', 'summon', 'sweep'], ['rain', 'ring', 'charge', 'slam', 'sweep', 'summon']],
  phase2At: 0.66, phase3At: 0.33, enrage: { speedMult: 1.4, cooldownMult: 0.64 },
};

// ---------------------------------------------------------------------------------------------------------------------------------
// Dungeons: two caves and two secret realms
// ---------------------------------------------------------------------------------------------------------------------------------
const BONECAVERN: DungeonDef = {
  id: 'abyss-bonecavern', name: 'Bone-Root Cavern', chapter: 5, kind: 'cave', blurb: 'the forest\'s roots grow through the dead, and the dead have started to answer',
  entrance: { x: 30, y: 32, zone: 'abyss-bonewood' }, minLevel: 38, level: 'Lv 40-44', seed: 0xb0ec0a7, size: { w: 84, h: 60 }, floor: 'clay', wall: 'wall',
  scatter: [{ kind: 'rock', p: 0.02 }, { kind: 'bambooshoot', p: 0.016 }, { kind: 'taihurocks', p: 0.005 }, { kind: 'pine', p: 0.006 }],
  spawns: { 'abyss-bonehound': 8, 'abyss-bonetreant': 4, 'abyss-ashmoth': 6, 'abyss-penitent': 3 }, mood: 'night', tier: { hp: 17, atk: 8.5, xp: 7 }, propTint: 0xdcd2b6,
  boss: 'abyss-rootking', reward: { xp: 5200, stones: 700, items: [{ id: 'abyss-bonefang', count: 1 }, { id: 'abyss-hp-potion', count: 4 }, { id: 'abyss-heal-pill', count: 1 }] }, herbs: 6,
};

const BLOODGROTTO: DungeonDef = {
  id: 'abyss-bloodgrotto', name: 'Blood-Spring Grotto', chapter: 5, kind: 'cave', blurb: 'a warm spring that runs red, and something that bathes in it',
  entrance: { x: 124, y: 134, zone: 'abyss-basin' }, minLevel: 36, level: 'Lv 38-42', seed: 0xb100d57, size: { w: 80, h: 58 }, floor: 'crimson', wall: 'wall',
  scatter: [{ kind: 'rock', p: 0.022 }, { kind: 'taihurocks', p: 0.006 }, { kind: 'petals', p: 0.01 }, { kind: 'dragonpillar', p: 0.002 }],
  spawns: { 'abyss-lavatoad': 7, 'abyss-bloodfoxfire': 6, 'abyss-hollowserpent': 6, 'abyss-emberbird': 3 }, mood: 'dusk', tier: { hp: 15.5, atk: 7.5, xp: 6.4 }, propTint: 0xff8a70,
  boss: 'abyss-springfox', reward: { xp: 4800, stones: 640, items: [{ id: 'abyss-ember-ring', count: 1 }, { id: 'abyss-mana-potion', count: 4 }, { id: 'abyss-qi-pill', count: 2 }] }, herbs: 6,
};

const MIRRORVAULT: DungeonDef = {
  id: 'abyss-mirrorvault', name: 'Vault of Past Selves', chapter: 5, kind: 'realm', blurb: 'a hall of mirrors, each one showing who you chose not to be',
  entrance: { x: 70, y: 40, zone: 'abyss-mirror' }, minLevel: 41, level: 'Lv 43-47', seed: 0x31770a1, size: { w: 112, h: 62 }, floor: 'jade', wall: 'void', rooms: 5,
  scatter: [{ kind: 'moonwall', p: 0.002 }, { kind: 'standstone', p: 0.006 }, { kind: 'stonecircle', p: 0.0015 }],
  spawns: { 'abyss-mirrorshade': 8, 'abyss-effigy': 6, 'abyss-regretghost': 5, 'abyss-bladewraith': 4 }, mood: 'mist', tier: { hp: 19, atk: 9, xp: 8 }, propTint: 0xc4e0ff,
  boss: 'abyss-vaultself', reward: { xp: 6200, stones: 860, items: [{ id: 'abyss-veil-robe', count: 1 }, { id: 'abyss-heal-pill', count: 2 }, { id: 'abyss-mana-potion', count: 4 }] }, herbs: 5,
};

const ASHMAW: DungeonDef = {
  id: 'abyss-ashmaw', name: 'Cinder Reliquary', chapter: 5, kind: 'realm', blurb: 'a burnt-out shrine where the Abyss keeps what cultivators wished to be remembered for',
  entrance: { x: 116, y: 88, zone: 'abyss-ash' }, minLevel: 42, level: 'Lv 44-48', seed: 0xa5a0a77, size: { w: 116, h: 60 }, floor: 'ash', wall: 'void', rooms: 5,
  scatter: [{ kind: 'standstone', p: 0.007 }, { kind: 'stonecircle', p: 0.002 }, { kind: 'dragonpillar', p: 0.002 }],
  spawns: { 'abyss-ashknight': 7, 'abyss-cindergolem': 4, 'abyss-emberbird': 4, 'abyss-witheredpeach': 4, 'abyss-penitent': 3 }, mood: 'dusk', tier: { hp: 20, atk: 9.5, xp: 8.4 }, propTint: 0xb4a4b0,
  boss: 'abyss-cinderwarden', reward: { xp: 6800, stones: 920, items: [{ id: 'abyss-bone-charm', count: 1 }, { id: 'abyss-hp-potion', count: 5 }, { id: 'abyss-heal-pill', count: 2 }] }, herbs: 5,
};

// ---------------------------------------------------------------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------------------------------------------------------------
const ITEMS_DEF: ItemDef[] = [
  { id: 'abyss-hp-potion', name: 'Crimson Lotus Draught', type: 'consumable', maxStack: 10, description: 'Restores 450 HP.', value: 90, rarity: 'rare', heal: 450 },
  { id: 'abyss-mana-potion', name: 'Draught of Still Water', type: 'consumable', maxStack: 10, description: 'Restores 220 mana.', value: 90, rarity: 'rare', mana: 220 },
  { id: 'abyss-qi-pill', name: 'Tribulation Qi Pill', type: 'consumable', maxStack: 10, description: 'Adds 240 qi.', value: 110, rarity: 'rare', qi: 240 },
  { id: 'abyss-heal-pill', name: 'Deathless Pill', type: 'consumable', maxStack: 5, description: 'Restores 1000 HP. Said to have been refined from a promise.', value: 260, rarity: 'epic', heal: 1000 },
  { id: 'abyss-blade-shard', name: 'Unburied Blade Shard', type: 'material', maxStack: 20, description: 'A splinter of a sword nobody came back for.', value: 40, rarity: 'uncommon' },
  { id: 'abyss-bone-root', name: 'Bone Root', type: 'material', maxStack: 20, description: 'White, damp and faintly warm.', value: 40, rarity: 'uncommon' },
  { id: 'abyss-mirror-shard', name: 'Mirror Shard', type: 'material', maxStack: 20, description: 'It shows you slightly younger.', value: 40, rarity: 'uncommon' },
  { id: 'abyss-regret-bloom', name: 'Regret Bloom', type: 'material', maxStack: 20, description: 'A petal that never finished falling.', value: 40, rarity: 'uncommon' },
  { id: 'abyss-ash-ore', name: 'Reliquary Ash Ore', type: 'material', maxStack: 20, description: 'Ash that remembers being a name.', value: 40, rarity: 'uncommon' },
  { id: 'abyss-bonefang', name: 'Ossuary Fang', type: 'equipment', slot: 'weapon', maxStack: 1, description: '+76 attack. Grown, not forged.', value: 11000, rarity: 'epic', weaponAtk: 76 },
  { id: 'abyss-veil-robe', name: 'Veil of Past Selves', type: 'equipment', slot: 'armor', maxStack: 1, description: '+70 defence, +390 HP. It fits better than it should.', value: 10400, rarity: 'epic', defBonus: 70, hpBonus: 390 },
  { id: 'abyss-ember-ring', name: 'Ring of the Blood Spring', type: 'equipment', slot: 'charm', maxStack: 1, description: '+14 attack, +9 defence, +4 mana regeneration.', value: 9000, rarity: 'epic', atkBonus: 14, defBonus: 9, regenBonus: 4 },
  { id: 'abyss-bone-charm', name: 'Reliquary Bone Charm', type: 'equipment', slot: 'charm', maxStack: 1, description: '+18 attack, +7% critical chance, +60 mana.', value: 12000, rarity: 'epic', atkBonus: 18, critBonus: 0.07, manaBonus: 60 },
];

const ICONS_DEF: ChapterContent['icons'] = {
  // PLACEHOLDER art: pack UI / weapon icons
  'abyss-hp-potion': { kind: 'ui', key: 'item_gourd' }, 'abyss-mana-potion': { kind: 'ui', key: 'item_conch' }, 'abyss-qi-pill': { kind: 'ui', key: 'item_pill_bottle' }, 'abyss-heal-pill': { kind: 'ui', key: 'item_peach' },
  'abyss-blade-shard': { kind: 'icon', key: 'blade_01_02' }, 'abyss-bone-root': { kind: 'ui', key: 'item_ginseng' }, 'abyss-mirror-shard': { kind: 'ui', key: 'item_token' }, 'abyss-regret-bloom': { kind: 'ui', key: 'item_lingzhi' }, 'abyss-ash-ore': { kind: 'ui', key: 'item_spirit_stone' },
  'abyss-bonefang': { kind: 'icon', key: 'heavy_01_02' }, 'abyss-veil-robe': { kind: 'icon', key: 'relic_02_01' }, 'abyss-ember-ring': { kind: 'icon', key: 'relic_01_00' }, 'abyss-bone-charm': { kind: 'icon', key: 'relic_01_04' },
};

const DROPS_DEF: ChapterContent['drops'] = {
  'abyss-bladewraith': [{ item: 'abyss-blade-shard', chance: 0.42 }, { item: 'abyss-hp-potion', chance: 0.06 }],
  'abyss-ashmoth': [{ item: 'abyss-ash-ore', chance: 0.1 }],
  'abyss-regretghost': [{ item: 'abyss-regret-bloom', chance: 0.4 }, { item: 'abyss-mana-potion', chance: 0.08 }],
  'abyss-ashknight': [{ item: 'abyss-ash-ore', chance: 0.4 }, { item: 'abyss-hp-potion', chance: 0.08 }],
  'abyss-lavatoad': [{ item: 'abyss-hp-potion', chance: 0.1 }],
  'abyss-bloodfoxfire': [{ item: 'abyss-mana-potion', chance: 0.12 }, { item: 'abyss-qi-pill', chance: 0.06 }],
  'abyss-emberbird': [{ item: 'abyss-qi-pill', chance: 0.12 }, { item: 'abyss-mana-potion', chance: 0.1 }],
  'abyss-hollowserpent': [{ item: 'abyss-hp-potion', chance: 0.08 }],
  'abyss-cindergolem': [{ item: 'abyss-ash-ore', chance: 0.45 }, { item: 'abyss-heal-pill', chance: 0.04 }, { item: 'abyss-hp-potion', chance: 0.14 }],
  'abyss-mirrorshade': [{ item: 'abyss-mirror-shard', chance: 0.5 }, { item: 'abyss-mana-potion', chance: 0.08 }],
  'abyss-effigy': [{ item: 'abyss-mirror-shard', chance: 0.15 }, { item: 'abyss-hp-potion', chance: 0.06 }],
  'abyss-bonetreant': [{ item: 'abyss-bone-root', chance: 0.5 }, { item: 'abyss-qi-pill', chance: 0.12 }, { item: 'abyss-heal-pill', chance: 0.04 }],
  'abyss-bonehound': [{ item: 'abyss-bone-root', chance: 0.25 }, { item: 'abyss-hp-potion', chance: 0.06 }],
  'abyss-penitent': [{ item: 'abyss-bone-root', chance: 0.15 }, { item: 'abyss-heal-pill', chance: 0.05 }, { item: 'abyss-qi-pill', chance: 0.12 }],
  'abyss-witheredpeach': [{ item: 'abyss-regret-bloom', chance: 0.45 }, { item: 'abyss-mana-potion', chance: 0.1 }],
  'abyss-tyrant': [{ item: 'tribulation-robe', chance: 1 }, { item: 'abyss-heal-pill', chance: 1 }, { item: 'abyss-hp-potion', chance: 1 }],
  'abyss-matron': [{ item: 'abyss-bone-charm', chance: 0.5 }, { item: 'abyss-heal-pill', chance: 1 }, { item: 'abyss-qi-pill', chance: 1 }],
  'abyss-daodemon': [{ item: 'tribulation-sword', chance: 1 }, { item: 'abyss-seal', chance: 1 }, { item: 'abyss-heal-pill', chance: 1 }],
  'abyss-rootking': [{ item: 'abyss-bonefang', chance: 0.6 }, { item: 'abyss-hp-potion', chance: 1 }],
  'abyss-springfox': [{ item: 'abyss-ember-ring', chance: 0.6 }, { item: 'abyss-mana-potion', chance: 1 }],
  'abyss-vaultself': [{ item: 'abyss-veil-robe', chance: 0.6 }, { item: 'abyss-heal-pill', chance: 1 }],
  'abyss-cinderwarden': [{ item: 'abyss-bone-charm', chance: 0.6 }, { item: 'abyss-heal-pill', chance: 1 }],
};

const ELITE_LOOT_DEF: ChapterContent['eliteLoot'] = {
  'abyss-blades': ['abyss-blade', 'abyss-mail', 'abyss-hp-potion'],
  'abyss-basin': ['abyss-blade', 'abyss-ember-ring', 'abyss-mail'],
  'abyss-mirror': ['abyss-mail', 'abyss-veil-robe', 'abyss-blade'],
  'abyss-bonewood': ['abyss-bonefang', 'abyss-mail', 'abyss-bone-charm'],
  'abyss-ash': ['abyss-bonefang', 'abyss-veil-robe', 'abyss-ember-ring'],
  'abyss-regret': ['abyss-bonefang', 'abyss-veil-robe', 'abyss-bone-charm'],
};

const STOCKS_DEF: ChapterContent['stocks'] = {
  abyss: ['abyss-hp-potion', 'abyss-mana-potion', 'abyss-qi-pill', 'abyss-heal-pill', 'foundation-pill', 'abyss-blade', 'abyss-mail'],
};

const RECIPES_DEF: Record<string, RecipeDef[]> = {
  abyss: [
    { id: 'brew-abyss-hp', name: 'Crimson Lotus Draught', output: 'abyss-hp-potion', herbs: 2, stones: 40, note: 'Restores 450 HP' },
    { id: 'brew-abyss-mana', name: 'Draught of Still Water', output: 'abyss-mana-potion', herbs: 2, stones: 40, note: 'Restores 220 mana' },
    { id: 'brew-abyss-qi', name: 'Tribulation Qi Pill', output: 'abyss-qi-pill', herbs: 3, stones: 60, note: 'Adds 240 qi' },
    { id: 'brew-abyss-heal', name: 'Deathless Pill', output: 'abyss-heal-pill', herbs: 6, stones: 160, note: 'Restores 1000 HP' },
    { id: 'brew-abyss-foundation', name: 'Foundation Pill', output: 'foundation-pill', herbs: 3, stones: 40, note: 'Needed for every breakthrough' },
  ],
};

// ---------------------------------------------------------------------------------------------------------------------------------
// NPCs and quests
// ---------------------------------------------------------------------------------------------------------------------------------
const NPCS_DEF: Record<string, NpcDef> = {
  // PLACEHOLDER art: pack hero sprites / portraits reused for every NPC
  'matron-hui': { chapter: 5, sprite: 'hero.heroine', role: 'Matron Hui · Quests', name: 'Matron Hui', portrait: 'granny_neutral', quests: ['abyss-first-flame', 'abyss-blood-river', 'abyss-ash-trial', 'abyss-dao-demon'], idle: 'Sit. Eat something. The flame does not mind if you rest, only if you give up.' },
  'smith-tang': { chapter: 5, sprite: 'hero.twinblade', role: 'Smith Tang · Shop', blurb: 'Blades reforged from what the Abyss gave back. They remember. I only make them sharper.', name: 'Smith Tang', portrait: 'blacksmith_neutral', quests: ['abyss-slag-and-ash'], idle: 'Everything here is heavier than it looks. Mind the edge, mind the weight.', trade: 'shop', stock: 'abyss' },
  'alchemist-lian': { chapter: 5, sprite: 'hero.fanscholar', role: 'Alchemist Lian · Alchemy', blurb: 'Bring me lingzhi and a few stones. I brew with what the Abyss cannot spoil.', name: 'Alchemist Lian', portrait: 'alchemist_neutral', quests: [], idle: 'Even down here the furnace is warm. That counts for something.', trade: 'alchemy', recipes: 'abyss' },
  'gravetender-jun': { chapter: 5, sprite: 'hero.swordsman', role: 'Gravetender Jun · Quests', name: 'Gravetender Jun', portrait: 'swordsman_neutral', quests: ['abyss-sword-grave'], idle: 'I bury the blades when I can. There are always more blades than I have hands.' },
  'ferryman-tu': { chapter: 5, sprite: 'hero.saber', role: 'Ferryman Tu · Quests', name: 'Ferryman Tu', portrait: 'boatman_neutral', quests: ['abyss-ferry-fire', 'abyss-grotto-spring'], idle: 'The river is fire, friend. My boat is the only thing between the two shores. It is mostly a very long bridge.' },
  'scribe-ao': { chapter: 5, sprite: 'hero.archer', role: 'Scribe Ao · Lore', name: 'Scribe Ao', portrait: 'scholar_neutral', quests: ['abyss-mirror-truth', 'abyss-vault-selves'], idle: 'I write what the mirrors say. It changes each time I read it back.' },
  'huntress-ye': { chapter: 5, sprite: 'hero.spearman', role: 'Huntress Ye · Quests', name: 'Huntress Ye', portrait: 'hunter_neutral', quests: ['abyss-bone-ledger', 'abyss-bone-cavern-delve'], idle: 'The forest grows toward the dead. Do not stand still too long.' },
  'drifter-dun': { chapter: 5, sprite: 'hero.staffbeggar', role: 'Drifter Dun · Lore', name: 'Drifter Dun', portrait: 'drunkard_neutral', quests: ['abyss-ash-whispers', 'abyss-reliquary-delve'], idle: 'I was a sect elder once. I forget which sect. The ash remembers, if you ask it nicely.' },
  'sister-sen': { chapter: 5, sprite: 'hero.monk', role: 'Sister Sen · Quests', name: 'Sister Sen', portrait: 'nun_neutral', quests: ['abyss-matron', 'abyss-regret-letters'], idle: 'Every petal here was a letter nobody sent. Please do not step on them.' },
};

const QUESTS_DEF: QuestDef[] = [
  // ---- main chain ----
  {
    id: 'abyss-first-flame', chapter: 5, name: 'The Last Lantern', giver: 'matron-hui',
    intro: 'So you are the one who came down. Good. The lantern is our only law: while it burns, nobody here is alone. The blade-wraiths in the field to the east keep trying to put it out. Cut down eight of them, and bring back four lingzhi for the furnace. Then we will talk about the rest of the Abyss.',
    reminder: 'Eight Blade-Wraiths in the Field of Unburied Blades, and four Spirit Herbs. East along the road.',
    completeText: 'The lantern did not flicker once tonight. That is the nicest thing anyone has done for this camp in a year. Sit, eat, and then I will tell you about the river.',
    objectives: [{ type: 'kill', target: 'abyss-bladewraith', count: 8, label: 'Cut down Blade-Wraiths' }, { type: 'collect', item: 'spirit-herb', count: 4, label: 'Gather Spirit Herbs' }],
    reward: { xp: 4200, stones: 800, items: [{ id: 'abyss-hp-potion', count: 4 }, { id: 'abyss-mana-potion', count: 3 }] },
  },
  {
    id: 'abyss-blood-river', chapter: 5, name: 'The Blood-River Tyrant', giver: 'matron-hui', requires: 'abyss-first-flame',
    intro: 'A river of fire runs through the south of the Abyss, and it has a king. The Tyrant was once a flood god, sworn to carry the dead across. It ferries nobody now. It is in the way of everything. Follow the road through the Bloodfire Basin to its shore, and put it to rest.',
    reminder: 'The Blood-River Tyrant waits on the far shore of Bloodfire Basin, east of the blades along the southern road.',
    completeText: 'The river is quiet. I can hear it breathing, almost like water. Take this robe. It was the Tyrant\'s promise to keep the dead dry, and it never did get to use it.',
    objectives: [{ type: 'kill', target: 'abyss-tyrant', count: 1, label: 'Slay the Blood-River Tyrant' }],
    reward: { xp: 5200, stones: 1200, items: [{ id: 'abyss-heal-pill', count: 2 }, { id: 'abyss-hp-potion', count: 4 }] },
  },
  {
    id: 'abyss-mirror-truth', chapter: 5, name: 'What the Mirrors Say', giver: 'scribe-ao', requires: 'abyss-blood-river',
    intro: 'You crossed the river? Then you can walk the Mirror City. The mirrors there show a person what they refused to become. Some people stay. Bring me six shards from the shades that wander its streets, and cut down eight of them; I would like the streets quiet enough to read in.',
    reminder: 'Eight Mirror Shades, and six Mirror Shards from them. The Ruined Mirror City, north of the Field of Blades.',
    completeText: 'This is strange. The shard reads, "You were right to be afraid." And on the back: "That is not the same as being wrong." Thank you. It helps more than you know.',
    objectives: [{ type: 'kill', target: 'abyss-mirrorshade', count: 8, label: 'Banish Mirror Shades' }, { type: 'collect', item: 'abyss-mirror-shard', count: 6, label: 'Collect Mirror Shards' }],
    reward: { xp: 5000, stones: 1000, items: [{ id: 'abyss-mana-potion', count: 5 }, { id: 'abyss-qi-pill', count: 3 }] },
  },
  {
    id: 'abyss-matron', chapter: 5, name: 'The Matron of Regrets', giver: 'sister-sen', requires: 'abyss-mirror-truth',
    intro: 'Do you hear the singing? It is the Matron. She gathers every might-have-been in the Abyss and gives each one a name and a bed. She means it kindly. That is the worst part. Beyond the Ash Plains lies her bower. Please end her song, and let the petals fall.',
    reminder: 'The Matron\'s bower lies east of the Gardens of Regret, past the ash.',
    completeText: 'It is quiet at last. Thank you. She truly meant well, you know. Take this robe: the hem is scorched, and she wore it all the same.',
    objectives: [{ type: 'kill', target: 'abyss-matron', count: 1, label: 'End the Matron of Regrets' }],
    reward: { xp: 6200, stones: 1600, items: [{ id: 'abyss-heal-pill', count: 3 }, { id: 'abyss-qi-pill', count: 3 }] },
  },
  {
    id: 'abyss-ash-trial', chapter: 5, name: 'The Procession of Ash', giver: 'matron-hui', requires: 'abyss-matron',
    intro: 'Word came down from the peak: the Dao Demon has woken, and the marked ones are marching to meet it. These are gold-named elites, and stronger than anything you have met. Cut down four of them before you climb. A student who comes to the examiner unprepared has only herself to blame.',
    reminder: 'Four elite monsters (golden names), anywhere in the Abyss.',
    completeText: 'Four fewer between you and the mountain. I will light the lantern in the window tonight. If you do not come down again, at least you will know there was a light.',
    objectives: [{ type: 'elite', count: 4, label: 'Slay Elite Monsters' }],
    reward: { xp: 5600, stones: 1800, items: [{ id: 'abyss-heal-pill', count: 3 }, { id: 'abyss-hp-potion', count: 5 }, { id: 'abyss-mana-potion', count: 5 }] },
  },
  {
    id: 'abyss-dao-demon', chapter: 5, name: 'The Dao Demon of Tribulation', giver: 'matron-hui', requires: 'abyss-ash-trial',
    intro: 'This is the last road. Every cultivator meets it at the top of the Way, and every one of them thought they would be ready. The Demon wears every ambition you ever set down and says each one back to you. It is not evil. It is only complete. Climb the peak in the north-east, and give it your answer.',
    reminder: 'Follow the road north from the Gardens of Regret, through the gold gate, to the Tribulation Peak.',
    completeText: 'It was never the monster at the top. It was whoever you were willing to become to reach it, and you walked past that, too. The Abyss grows quiet. Somewhere above, the sky is mending: slowly, like a bone. Come back to the lantern when you are ready. There is soup, and there is time. The Way goes on, and so, for now, do you.',
    objectives: [{ type: 'kill', target: 'abyss-daodemon', count: 1, label: 'Defeat the Dao Demon of Tribulation' }],
    reward: { xp: 12000, stones: 6000, items: [{ id: 'abyss-heal-pill', count: 5 }, { id: 'abyss-hp-potion', count: 5 }, { id: 'abyss-qi-pill', count: 5 }] },
  },
  // ---- side quests ----
  {
    id: 'abyss-sword-grave', chapter: 5, name: 'Swords Without Hands', giver: 'gravetender-jun', requires: 'abyss-first-flame',
    intro: 'Every blade in this field was drawn by someone who never came back, and they still hum at night. Bring me six shards so I can bury what is left, and cut down ten of the wraiths that carry them. I will pay in what I have.',
    reminder: 'Ten Blade-Wraiths and six Blade Shards, Field of Unburied Blades.',
    completeText: 'That is six fewer songs in the dark. I will bury them by the lantern, where someone can hear. Take this.',
    objectives: [{ type: 'kill', target: 'abyss-bladewraith', count: 10, label: 'Cut down Blade-Wraiths' }, { type: 'collect', item: 'abyss-blade-shard', count: 6, label: 'Collect Blade Shards' }],
    reward: { xp: 3600, stones: 900, items: [{ id: 'abyss-hp-potion', count: 4 }, { id: 'abyss-qi-pill', count: 2 }] },
  },
  {
    id: 'abyss-ferry-fire', chapter: 5, name: 'A Boat for the Fire', giver: 'ferryman-tu', requires: 'abyss-first-flame',
    intro: 'My boat has an easy job: carry a thing from one shore of fire to the other. The toads and foxfires have made it hard. Burn out eight of the magma toads and six of the blood foxfires, and I will tell you the river\'s secret.',
    reminder: 'Eight Magma Toads and six Blood Foxfires in Bloodfire Basin.',
    completeText: 'The river\'s secret is that it is only afraid. It flows fast so nothing can catch it. Here: for a crossing well made.',
    objectives: [{ type: 'kill', target: 'abyss-lavatoad', count: 8, label: 'Slay Magma Toads' }, { type: 'kill', target: 'abyss-bloodfoxfire', count: 6, label: 'Douse Blood Foxfires' }],
    reward: { xp: 4000, stones: 1000, items: [{ id: 'abyss-mana-potion', count: 4 }, { id: 'abyss-hp-potion', count: 3 }] },
  },
  {
    id: 'abyss-grotto-spring', chapter: 5, name: 'The Spring That Runs Red', giver: 'ferryman-tu', requires: 'abyss-ferry-fire',
    intro: 'South of the river, a spring bubbles up in a cave, warm and red as a pulse. Someone bathes there, and nothing that goes in comes back quite the same. Go into the Blood-Spring Grotto and put the Heretic out of its misery.',
    reminder: 'The Blood-Spring Grotto lies in the south of Bloodfire Basin. Defeat the Heretic inside.',
    completeText: 'The spring is turning clear again. It looks like nothing so much as water. That is the best thing I have seen in ten years.',
    objectives: [{ type: 'kill', target: 'abyss-springfox', count: 1, label: 'Defeat the Heretic of the Blood Spring' }],
    reward: { xp: 4800, stones: 1200, items: [{ id: 'abyss-heal-pill', count: 2 }, { id: 'abyss-qi-pill', count: 3 }] },
  },
  {
    id: 'abyss-vault-selves', chapter: 5, name: 'The Vault of Past Selves', giver: 'scribe-ao', requires: 'abyss-mirror-truth',
    intro: 'In the north of the city there is a vault of mirrors, and in the deepest hall stands the person you used to be. I do not recommend meeting yourself. But if you are going to, someone should write down who wins.',
    reminder: 'The Vault of Past Selves is a gate in the north of the Mirror City. Defeat what waits at the end.',
    completeText: 'I will write that you won. Then I will write that you were gentle, because I think that is what happened. Thank you.',
    objectives: [{ type: 'kill', target: 'abyss-vaultself', count: 1, label: 'Defeat the Self You Left Behind' }],
    reward: { xp: 5400, stones: 1400, items: [{ id: 'abyss-heal-pill', count: 3 }, { id: 'abyss-mana-potion', count: 4 }] },
  },
  {
    id: 'abyss-bone-ledger', chapter: 5, name: 'The Bone Ledger', giver: 'huntress-ye', requires: 'abyss-first-flame',
    intro: 'The forest is growing, and what it grows from is not wood. I count what I can: five of the great treants, and bone roots enough to read the pattern. Help me with the ledger, and I will give you a share of the payment.',
    reminder: 'Five Bone Treants, five Bone Roots. The Bone Forest, north-west of the camp.',
    completeText: 'The ledger balances. The forest has taken forty from us and returned nothing. Take this, and tell no one how short the list is.',
    objectives: [{ type: 'kill', target: 'abyss-bonetreant', count: 5, label: 'Fell Bone Treants' }, { type: 'collect', item: 'abyss-bone-root', count: 5, label: 'Collect Bone Roots' }],
    reward: { xp: 4000, stones: 1100, items: [{ id: 'abyss-hp-potion', count: 4 }, { id: 'abyss-heal-pill', count: 1 }] },
  },
  {
    id: 'abyss-ash-whispers', chapter: 5, name: 'What the Ash Remembers', giver: 'drifter-dun', requires: 'abyss-first-flame',
    intro: 'Eight knights wander the plains in armour with nobody inside. I want to know who they were. Cut down eight of the Ash Knights and bring me five pieces of their ore; if the ash remembers, I will learn it.',
    reminder: 'Eight Ash Knights and five Reliquary Ash Ore. The Ash Plains and the Mirror City.',
    completeText: 'The ore says only one thing, over and over: "I was going to be somebody." That will do. Thank you. Here, take what I carry.',
    objectives: [{ type: 'kill', target: 'abyss-ashknight', count: 8, label: 'Fell Ash Knights' }, { type: 'collect', item: 'abyss-ash-ore', count: 5, label: 'Collect Ash Ore' }],
    reward: { xp: 4400, stones: 1000, items: [{ id: 'abyss-qi-pill', count: 3 }, { id: 'abyss-mana-potion', count: 4 }] },
  },
  {
    id: 'abyss-regret-letters', chapter: 5, name: 'Letters Never Sent', giver: 'sister-sen', requires: 'abyss-mirror-truth',
    intro: 'The peach trees here bloom with every apology nobody made. I gather the petals and read them aloud to the dead. Cut down six of the withered spirits that shake them loose, and bring me five blooms.',
    reminder: 'Six Withered Peach Spirits and five Regret Blooms, in the Gardens of Regret.',
    completeText: 'I will read these tonight. The dead are patient listeners. Please take this for your trouble.',
    objectives: [{ type: 'kill', target: 'abyss-witheredpeach', count: 6, label: 'Quiet Withered Peach Spirits' }, { type: 'collect', item: 'abyss-regret-bloom', count: 5, label: 'Collect Regret Blooms' }],
    reward: { xp: 5200, stones: 1200, items: [{ id: 'abyss-heal-pill', count: 2 }, { id: 'abyss-qi-pill', count: 3 }] },
  },
  {
    id: 'abyss-slag-and-ash', chapter: 5, name: 'Slag and Ash', giver: 'smith-tang', requires: 'abyss-first-flame',
    intro: 'The cinder golems on the plains and in the basin are made of the finest slag I have ever seen, and it is just lying there inside them. Break four, and bring me six pieces of ash ore. I will make you something sharp.',
    reminder: 'Four Cinder Golems and six Reliquary Ash Ore. The Ash Plains and Bloodfire Basin.',
    completeText: 'Excellent slag. It rings like a bell when I strike it. Here is your payment; the sword will take a week.',
    objectives: [{ type: 'kill', target: 'abyss-cindergolem', count: 4, label: 'Break Cinder Golems' }, { type: 'collect', item: 'abyss-ash-ore', count: 6, label: 'Collect Ash Ore' }],
    reward: { xp: 4600, stones: 1500, items: [{ id: 'abyss-heal-pill', count: 2 }, { id: 'abyss-hp-potion', count: 4 }] },
  },
  {
    id: 'abyss-bone-cavern-delve', chapter: 5, name: 'The Ossuary Below', giver: 'huntress-ye', requires: 'abyss-bone-ledger',
    intro: 'Every root in this forest leads to one place, a cavern under the western woods where the dead have been stacked like firewood. Go in and break the Root-King. Everything else is only branches.',
    reminder: 'The Bone-Root Cavern lies in the west of the Bone Forest. Defeat the Root-King inside.',
    completeText: 'You went all the way down and came back up. Most people only do one of those. Take this.',
    objectives: [{ type: 'kill', target: 'abyss-rootking', count: 1, label: 'Defeat the Ossuary Root-King' }],
    reward: { xp: 5000, stones: 1300, items: [{ id: 'abyss-heal-pill', count: 2 }, { id: 'abyss-hp-potion', count: 4 }] },
  },
  {
    id: 'abyss-reliquary-delve', chapter: 5, name: 'The Cinder Reliquary', giver: 'drifter-dun', requires: 'abyss-ash-whispers',
    intro: 'There is a shrine inside the plains, burnt out and hollow. The ash comes from there. The warden at its centre is made from every name left unwritten. Go inside and put it down; then we will both know if anyone was remembered.',
    reminder: 'The Cinder Reliquary stands east of the Ash Plains. Defeat the warden within.',
    completeText: 'It said a name. One. Mine, I think. I had forgotten. Thank you. Go on, I will stay here a while.',
    objectives: [{ type: 'kill', target: 'abyss-cinderwarden', count: 1, label: 'Defeat the Cinder Warden' }],
    reward: { xp: 5800, stones: 1500, items: [{ id: 'abyss-heal-pill', count: 3 }, { id: 'abyss-qi-pill', count: 3 }] },
  },
];

export const CH5: ChapterContent = {
  ...emptyContent(),
  chapter: CHAPTER,
  map: MAP,
  zones: ZONES_DEF,
  enemies: ENEMIES_DEF,
  bosses: [TYRANT, MATRON, DAODEMON, ROOTKING, WYRM, VAULTSELF, CINDERLORD],
  quests: QUESTS_DEF,
  npcs: NPCS_DEF,
  items: ITEMS_DEF,
  icons: ICONS_DEF,
  drops: DROPS_DEF,
  eliteLoot: ELITE_LOOT_DEF,
  stocks: STOCKS_DEF,
  recipes: RECIPES_DEF,
  dungeons: [BONECAVERN, BLOODGROTTO, MIRRORVAULT, ASHMAW],
};
