import type { BossDef } from '../boss';
import type { DungeonDef } from '../dungeons';
import type { EnemyDef } from '../enemies';
import type { ItemDef } from '../items';
import type { NpcDef, QuestDef } from '../quests';
import { emptyContent, type ChapterContent } from './types';

/** Boss of the Moonfang Den: a huge pack leader that calls its cubs. Art is the pack's wolf, enlarged and recoloured (PLACEHOLDER). */
const ALPHAWOLF: BossDef = {
  id: 'alphawolf', chapter: 1, dungeon: 'wolfden', name: 'Moonfang Alpha', home: 'wolfden', zone: 'wolfden', xp: 380, stones: [60, 90],
  sprite: 'mob.wolf', tint: 0xcfe0ff, scale: 0.95, radius: 20, maxHp: 4200, atk: 22, def: 6, speed: 56,
  moves: {
    sweep: { range: 70, halfAngle: 1.1, windup: 0.6, recover: 0.4, cooldown: 2.8, damageMult: 1.3, triggerRange: 76 },
    charge: { windup: 0.65, duration: 0.5, speed: 290, width: 22, recover: 0.7, cooldown: 4.2, damageMult: 1.5, minRange: 12, maxRange: 230 },
    summon: { windup: 0.7, cooldown: 11, count: 3, maxMinions: 5, minionType: 'wolf' },
    ring: { windup: 0.7, cooldown: 7, projectiles: 10, damageMult: 0.9 },
  },
  kit: [['sweep', 'charge'], ['charge', 'summon', 'sweep'], ['charge', 'ring', 'summon', 'sweep']],
  phase2At: 0.66, phase3At: 0.33, enrage: { speedMult: 1.3, cooldownMult: 0.7 },
};

/** Guardian of the Sanctum: the sword immortal's last disciple. PLACEHOLDER art: the fallen immortal, tinted. */
const SWORDSHADE: BossDef = {
  id: 'swordshade', chapter: 1, dungeon: 'swordsanctum', name: 'Shade of the Sword Disciple', home: 'swordsanctum', zone: 'swordsanctum', xp: 620, stones: [100, 150],
  sprite: 'boss.fallenimmortal', tint: 0xb8a8ff, scale: 0.5, radius: 17, maxHp: 6800, atk: 30, def: 9, speed: 40,
  moves: {
    slam: { radius: 52, windup: 0.85, recover: 0.5, cooldown: 4, damageMult: 1.7, triggerRange: 86 },
    sweep: { range: 80, halfAngle: 0.95, windup: 0.7, recover: 0.5, cooldown: 3.2, damageMult: 1.5, triggerRange: 80 },
    teleport: { windup: 0.8, recover: 0.5, cooldown: 9, behind: 44, radius: 48, damageMult: 1.5 },
    ring: { windup: 0.8, cooldown: 7, projectiles: 12, damageMult: 1.0 },
  },
  kit: [['slam', 'sweep'], ['slam', 'sweep', 'ring'], ['teleport', 'ring', 'sweep', 'slam']],
  phase2At: 0.66, phase3At: 0.33, enrage: { speedMult: 1.35, cooldownMult: 0.7 },
};

/** Queen of the Pearl Grotto: a drowned ghost grown vast on lake-water. PLACEHOLDER art: the waterghost, enlarged and teal. */
const TIDECALLER: BossDef = {
  id: 's1-tidecaller', chapter: 1, dungeon: 's1-pearlgrotto', name: 'Tidecaller Matron', home: 'pearlgrotto', zone: 's1-pearlgrotto', xp: 460, stones: [80, 120],
  sprite: 'mob.waterghost', tint: 0x7fe8ff, scale: 1.0, radius: 20, maxHp: 4800, atk: 25, def: 6, speed: 44,
  moves: {
    sweep: { range: 76, halfAngle: 1.2, windup: 0.6, recover: 0.4, cooldown: 2.8, damageMult: 1.3, triggerRange: 80 },
    rain: { count: 6, radius: 28, spread: 110, windup: 0.5, delay: 0.95, recover: 0.4, cooldown: 6, damageMult: 1.1 },
    summon: { windup: 0.7, cooldown: 12, count: 2, maxMinions: 4, minionType: 'waterghost' },
    ring: { windup: 0.75, cooldown: 7, projectiles: 10, damageMult: 0.9 },
  },
  kit: [['sweep', 'rain'], ['rain', 'summon', 'sweep'], ['rain', 'ring', 'summon', 'sweep']],
  phase2At: 0.66, phase3At: 0.33, enrage: { speedMult: 1.3, cooldownMult: 0.7 },
};

/** Matriarch of the Thunderroost: a storm-bird that rains lightning and dives. PLACEHOLDER art: the thunderbird, enlarged and gold. */
const STORMMATRIARCH: BossDef = {
  id: 's1-stormmatriarch', chapter: 1, dungeon: 's1-stormroost', name: 'Thunderroost Matriarch', home: 'stormroost', zone: 's1-stormroost', xp: 560, stones: [90, 140],
  sprite: 'mob.thunderbird', tint: 0xffe070, scale: 1.05, radius: 20, maxHp: 6000, atk: 29, def: 7, speed: 52,
  moves: {
    charge: { windup: 0.65, duration: 0.5, speed: 300, width: 22, recover: 0.7, cooldown: 4.6, damageMult: 1.5, minRange: 12, maxRange: 240 },
    rain: { count: 7, radius: 28, spread: 120, windup: 0.5, delay: 0.9, recover: 0.4, cooldown: 5.5, damageMult: 1.2 },
    teleport: { windup: 0.7, recover: 0.45, cooldown: 9, behind: 42, radius: 46, damageMult: 1.4 },
    ring: { windup: 0.75, cooldown: 6.5, projectiles: 12, damageMult: 0.95 },
    summon: { windup: 0.75, cooldown: 13, count: 2, maxMinions: 4, minionType: 's1-thunderimp' },
  },
  kit: [['charge', 'rain'], ['charge', 'rain', 'summon'], ['rain', 'teleport', 'ring', 'charge', 'summon']],
  phase2At: 0.66, phase3At: 0.33, enrage: { speedMult: 1.35, cooldownMult: 0.7 },
};

const WOLFDEN: DungeonDef = {
  id: 'wolfden', name: 'Moonfang Den', chapter: 1, kind: 'cave', blurb: 'a wolf pack\'s lair under the roots',
  entrance: { x: 10, y: 48, zone: 'bamboo' }, minLevel: 3, level: 'Lv 4-6', seed: 0x70f0d3, size: { w: 76, h: 56 }, floor: 'moss', wall: 'wall',
  scatter: [{ kind: 'rock', p: 0.02 }, { kind: 'taihurocks', p: 0.004 }, { kind: 'bambooshoot', p: 0.01 }],
  spawns: { wolf: 9, 's1-direwolf': 6, snake: 4, bat: 6, foxfire: 3 }, mood: 'night', tier: { hp: 1.5, atk: 1.55, xp: 1.7 }, propTint: 0xb8c8b0,
  boss: 'alphawolf', reward: { xp: 260, stones: 120, items: [{ id: 'steel-blade', count: 1 }, { id: 'qi-pill', count: 2 }] }, herbs: 6,
};

const SWORDSANCTUM: DungeonDef = {
  id: 'swordsanctum', name: 'Hidden Sword Sanctum', chapter: 1, kind: 'realm', blurb: 'a sealed pocket of the old sect, outside time',
  entrance: { x: 126, y: 88, zone: 'ruins' }, minLevel: 7, level: 'Lv 8-11', seed: 0x5ec7a1, size: { w: 104, h: 60 }, floor: 'stone', wall: 'void', rooms: 5,
  scatter: [{ kind: 'standstone', p: 0.006 }, { kind: 'stonecircle', p: 0.0015 }],
  spawns: { swordspirit: 8, skeleton: 6, soldier: 5, paperdoll: 5, golem: 2 }, mood: 'night', tier: { hp: 3.2, atk: 2.5, xp: 4.2 }, propTint: 0xc8c0ff,
  boss: 'swordshade', reward: { xp: 520, stones: 260, items: [{ id: 'spirit-silk', count: 1 }, { id: 'qi-pill', count: 3 }] }, herbs: 5,
};

const PEARLGROTTO: DungeonDef = {
  id: 's1-pearlgrotto', name: 'Pearl Grotto', chapter: 1, kind: 'cave', blurb: 'a drowned cavern where the lake keeps its dead',
  entrance: { x: 46, y: 106, zone: 'lake' }, minLevel: 4, level: 'Lv 5-8', seed: 0x9ea41c, size: { w: 84, h: 60 }, floor: 'sand', wall: 'wall',
  scatter: [{ kind: 'rock', p: 0.018 }, { kind: 'orchid', p: 0.012 }, { kind: 'taihurocks', p: 0.004 }],
  spawns: { waterghost: 6, 's1-pearlwisp': 6, 's1-tidemaiden': 4, 's1-driftwood': 3, toad: 4 }, mood: 'mist', tier: { hp: 1.7, atk: 1.7, xp: 2.0 }, propTint: 0x9fe0e8,
  boss: 's1-tidecaller', reward: { xp: 340, stones: 150, items: [{ id: 's1-lotus-draught', count: 3 }, { id: 'qi-pill', count: 2 }] }, herbs: 6,
};

const STORMROOST: DungeonDef = {
  id: 's1-stormroost', name: 'Thunderroost Cavern', chapter: 1, kind: 'cave', blurb: 'a nest of storm-birds inside the cliff, lit by lightning',
  entrance: { x: 98, y: 34, zone: 'cliffs' }, minLevel: 8, level: 'Lv 9-12', seed: 0x3ad7e5, size: { w: 88, h: 62 }, floor: 'basalt', wall: 'wall',
  scatter: [{ kind: 'rock', p: 0.022 }, { kind: 'standstone', p: 0.006 }, { kind: 'taihurocks', p: 0.004 }],
  spawns: { 's1-stormhawk': 6, 's1-cragbat': 6, 's1-thunderimp': 5, 's1-basaltgolem': 3, thunderbird: 3 }, mood: 'dusk', tier: { hp: 3.0, atk: 2.4, xp: 3.8 }, propTint: 0xd8c8ff,
  boss: 's1-stormmatriarch', reward: { xp: 560, stones: 240, items: [{ id: 's1-storm-pill', count: 3 }, { id: 'greater-hp-potion', count: 2 }] }, herbs: 5,
};

// PLACEHOLDER art: every enemy below recolours (tint) a pack mob; replace with dedicated sprites before release.
const ENEMIES: EnemyDef[] = [
  // lake / Pearl Grotto
  { id: 's1-pearlwisp', name: 'Pearl Wisp', behavior: 'caster', maxHp: 26, atk: 11, def: 0, speed: 40, aggroRange: 130, attackRange: 110, attackCooldown: 1.7, preferredRange: 80, volley: 2, xp: 18, sprite: 'mob.foxfire', tint: 0x9ff0e0, scale: 0.36, radius: 7, stones: [2, 4] },
  { id: 's1-driftwood', name: 'Driftwood Treant', behavior: 'charger', maxHp: 90, atk: 12, def: 4, speed: 26, aggroRange: 100, attackRange: 66, attackCooldown: 3.0, windup: 0.7, dashTime: 0.45, dashSpeedMult: 4, xp: 30, sprite: 'mob.treant', tint: 0x8fb0a0, scale: 0.4, radius: 10, stones: [3, 7] },
  { id: 's1-tidemaiden', name: 'Tide Maiden', behavior: 'caster', maxHp: 30, atk: 12, def: 0, speed: 38, aggroRange: 130, attackRange: 110, attackCooldown: 1.8, preferredRange: 85, volley: 2, xp: 22, sprite: 'mob.ghost', tint: 0x8fe0ff, scale: 0.37, radius: 7, stones: [2, 5] },
  // cliffs / Thunderroost
  { id: 's1-stormhawk', name: 'Storm Hawk', behavior: 'caster', maxHp: 42, atk: 14, def: 1, speed: 46, aggroRange: 150, attackRange: 130, attackCooldown: 1.5, preferredRange: 95, volley: 3, xp: 36, sprite: 'mob.thunderbird', tint: 0xffe890, scale: 0.42, radius: 8, stones: [4, 8] },
  { id: 's1-basaltgolem', name: 'Basalt Golem', behavior: 'charger', maxHp: 120, atk: 17, def: 9, speed: 24, aggroRange: 100, attackRange: 70, attackCooldown: 3.0, windup: 0.8, dashTime: 0.5, dashSpeedMult: 4, xp: 52, sprite: 'mob.golem', tint: 0x9a8a82, scale: 0.44, radius: 11, stones: [6, 12] },
  { id: 's1-cragbat', name: 'Crag Bat', behavior: 'rusher', maxHp: 28, atk: 7, def: 0, speed: 84, aggroRange: 130, attackRange: 14, attackCooldown: 0.7, strikeWindup: 0.24, xp: 10, sprite: 'mob.bat', tint: 0xe0a8a8, scale: 0.32, radius: 6, stones: [1, 3] },
  { id: 's1-thunderimp', name: 'Thunder Talisman', behavior: 'charger', maxHp: 30, atk: 12, def: 0, speed: 52, aggroRange: 110, attackRange: 84, attackCooldown: 2.2, windup: 0.4, dashTime: 0.3, dashSpeedMult: 6, xp: 20, sprite: 'mob.paperdoll', tint: 0xfff070, scale: 0.36, radius: 7, stones: [2, 5] },
  // Moonfang Den
  { id: 's1-direwolf', name: 'Moonfang Dire Wolf', behavior: 'rusher', maxHp: 52, atk: 9, def: 2, speed: 62, aggroRange: 120, attackRange: 18, attackCooldown: 1.0, strikeWindup: 0.3, xp: 16, sprite: 'mob.wolf', tint: 0x8a8aa8, scale: 0.42, radius: 9, stones: [2, 4] },
];

const ITEMS_NEW: ItemDef[] = [
  { id: 's1-lotus-draught', name: 'Lotus Draught', type: 'consumable', maxStack: 10, description: 'Restores 70 HP.', value: 20, rarity: 'uncommon', heal: 70 },
  { id: 's1-mist-tonic', name: 'Mist Tonic', type: 'consumable', maxStack: 10, description: 'Restores 55 mana.', value: 20, rarity: 'uncommon', mana: 55 },
  { id: 's1-storm-pill', name: 'Stormcharged Pill', type: 'consumable', maxStack: 10, description: 'Adds 100 qi.', value: 50, rarity: 'uncommon', qi: 100 },
  { id: 's1-moonfang-cloak', name: 'Moonfang Pelt Cloak', type: 'equipment', slot: 'armor', maxStack: 1, description: '+10 defence, +48 HP.', value: 420, rarity: 'rare', defBonus: 10, hpBonus: 48 },
  { id: 's1-tidepearl', name: 'Tidepearl Pendant', type: 'equipment', slot: 'charm', maxStack: 1, description: '+35 mana, +2 mana regeneration, +4 defence.', value: 500, rarity: 'rare', manaBonus: 35, regenBonus: 2, defBonus: 4 },
  { id: 's1-stormcaller-saber', name: 'Stormcaller Saber', type: 'equipment', slot: 'weapon', maxStack: 1, description: '+13 attack. It hums before rain.', value: 900, rarity: 'rare', weaponAtk: 13 },
  { id: 's1-discipline-seal', name: "Disciple's Sword Seal", type: 'equipment', slot: 'charm', maxStack: 1, description: '+4 attack, +5% critical chance.', value: 650, rarity: 'rare', atkBonus: 4, critBonus: 0.05 },
];

const QUESTS: QuestDef[] = [
  {
    id: 's1-ferry', name: "The Ferryman's Lantern", giver: 'ferryman-bo', requires: 'pests',
    intro: 'Eh? A sect robe at my landing. Good. Pearl wisps and drowned ghosts have been snuffing the lanterns I hang along the Moonmirror shore, and no barge will cross after dusk. Put out five Pearl Wisps and four Drowned Ghosts and I will show my gratitude.',
    reminder: 'Five Pearl Wisps and four Drowned Ghosts along the lake shore, south-west of the sect.',
    completeText: 'Look at that, the lanterns are burning again. A ferryman pays his debts: take these.',
    objectives: [
      { type: 'kill', target: 's1-pearlwisp', count: 5, label: 'Quench Pearl Wisps' },
      { type: 'kill', target: 'waterghost', count: 4, label: 'Lay Drowned Ghosts to rest' },
    ],
    reward: { xp: 150, stones: 60, items: [{ id: 'hp-potion', count: 2 }, { id: 's1-mist-tonic', count: 2 }] },
  },
  {
    id: 's1-grotto', name: 'The Tidecaller', giver: 'ferryman-bo', requires: 's1-ferry',
    intro: 'Under the south shore there is a cave the old boatmen called the Pearl Grotto. Something drowned in there and never left: the Tidecaller Matron. She calls the wisps and the ghosts up from the water. End her and the lake will rest.',
    reminder: 'Find the Pearl Grotto on the south shore of Moonmirror Lake and defeat the Tidecaller Matron.',
    completeText: 'The water is quiet. I can hear the reeds again. The lake owes you more than I can pay.',
    objectives: [{ type: 'kill', target: 's1-tidecaller', count: 1, label: 'Defeat the Tidecaller Matron' }],
    reward: { xp: 340, stones: 140, items: [{ id: 's1-lotus-draught', count: 3 }, { id: 's1-tidepearl', count: 1 }] },
  },
  {
    id: 's1-denhunt', name: 'The Moonfang Alpha', giver: 'hunter-tao', requires: 'pests',
    intro: 'You thinned the wolves on the road, and that was the easy part. The pack answers to a pale alpha that lives in the den under the old roots, west of here. I lost two good dogs to it. Go into the Moonfang Den and bring its head down.',
    reminder: 'The Moonfang Den lies in the far west of the bamboo forest. The alpha waits at its far end.',
    completeText: 'Quiet nights again. Take this: I cured the pelt from its last litter, and it will turn a blade better than silk.',
    objectives: [{ type: 'kill', target: 'alphawolf', count: 1, label: 'Slay the Moonfang Alpha' }],
    reward: { xp: 280, stones: 100, items: [{ id: 's1-moonfang-cloak', count: 1 }, { id: 'hp-potion', count: 3 }] },
  },
  {
    id: 's1-hawks', name: 'Lightning Tempering', giver: 'hermit-zhuo', requires: 'fox',
    intro: 'Quiet, child. Do you hear it? The cliffs hum before every storm. The storm hawks nest here and feed on what falls from the sky, and lately their talismans have gone mad. Kill five Storm Hawks and four Thunder Talismans and I will tell you what the lightning is for.',
    reminder: 'Five Storm Hawks and four Thunder Talismans on the Thunderpeak Cliffs, north of the ruins road.',
    completeText: 'Good. Lightning forgets nothing: it tempers or it breaks. You are tempered. Take these.',
    objectives: [
      { type: 'kill', target: 's1-stormhawk', count: 5, label: 'Bring down Storm Hawks' },
      { type: 'kill', target: 's1-thunderimp', count: 4, label: 'Tear up Thunder Talismans' },
    ],
    reward: { xp: 400, stones: 130, items: [{ id: 'mana-potion', count: 3 }, { id: 's1-storm-pill', count: 2 }] },
  },
  {
    id: 's1-stormroost', name: 'The Thunderroost Matriarch', giver: 'hermit-zhuo', requires: 's1-hawks',
    intro: 'The hawks have a mother, and she has made her roost in the cliff itself. The cavern is full of lightning, and she is its heart. She will not leave the nest, so you must go to her. Defeat the Thunderroost Matriarch.',
    reminder: 'The Thunderroost Cavern opens in the cliffs, west of the road to the Fallen Immortal.',
    completeText: 'The sky is calm for the first time in a decade. Keep this saber: it was made for exactly such a storm.',
    objectives: [{ type: 'kill', target: 's1-stormmatriarch', count: 1, label: 'Defeat the Thunderroost Matriarch' }],
    reward: { xp: 560, stones: 200, items: [{ id: 's1-stormcaller-saber', count: 1 }, { id: 'greater-hp-potion', count: 2 }] },
  },
  {
    id: 's1-sanctum', name: 'Echoes of the Sword Disciple', giver: 'sister-lan', requires: 'warden',
    intro: 'I tend the stones of the Broken Sword Ruins. The immortal you felled had one disciple, who would not leave his master, and sealed himself in a pocket of the sect outside time. His shade still keeps the Hidden Sword Sanctum. Free him, if you can.',
    reminder: 'The Hidden Sword Sanctum is a gate south of the ruins road. The disciple\'s shade waits at its end.',
    completeText: 'I felt the seal lift from here. He can finally put the sword down. Thank you, disciple.',
    objectives: [{ type: 'kill', target: 'swordshade', count: 1, label: 'Free the Shade of the Sword Disciple' }],
    reward: { xp: 620, stones: 220, items: [{ id: 's1-discipline-seal', count: 1 }, { id: 's1-mist-tonic', count: 3 }, { id: 'qi-pill', count: 3 }] },
  },
];

const NPCS: Record<string, NpcDef> = {
  'ferryman-bo': { sprite: 'hero.spearman', role: 'Ferryman Bo · Quests', name: 'Ferryman Bo', portrait: 'boatman_neutral', quests: ['s1-ferry', 's1-grotto'], idle: 'The lake gives and the lake takes. Keep to the shore after dark.' },
  'hunter-tao': { sprite: 'hero.archer', role: 'Hunter Tao · Quests', name: 'Hunter Tao', portrait: 'hunter_neutral', quests: ['s1-denhunt'], idle: 'Wolves hunt by moonlight. Do not be where the moon can find you.' },
  'hermit-zhuo': { sprite: 'hero.monk', role: 'Hermit Zhuo · Quests', name: 'Hermit Zhuo', portrait: 'hermit_neutral', quests: ['s1-hawks', 's1-stormroost'], idle: 'The founder carved the first seal on this very cliff. Lightning answered. It has not stopped since.' },
  'sister-lan': { sprite: 'hero.heroine', role: 'Sister Lan · Quests', name: 'Sister Lan', portrait: 'nun_neutral', quests: ['s1-sanctum'], idle: 'Every stone here was a sword once. They remember being swords.' },
};

/**
 * Chapter 1 expansion: two more zones (lake, cliffs) plus two more caves, a secret realm, wild NPCs and side quests.
 * The base chapter lives in zones.ts / quests.ts / boss.ts; every id there is kept.
 */
export const CH1: ChapterContent = {
  ...emptyContent(),
  zones: [
    { id: 'lake', chapter: 1, name: 'Moonmirror Lake', anchor: { x: 38, y: 98 }, level: 'Lv 2-6', spawns: { snake: 5, waterghost: 4, foxfire: 3, toad: 3, 's1-pearlwisp': 4, 's1-driftwood': 2, 's1-tidemaiden': 3 }, mood: 'dusk', tier: { hp: 1.25, atk: 1.35, xp: 1.4 } },
    { id: 'cliffs', chapter: 1, name: 'Thunderpeak Cliffs', anchor: { x: 110, y: 30 }, level: 'Lv 8-12', spawns: { thunderbird: 3, 's1-stormhawk': 4, swordspirit: 3, 's1-cragbat': 6, 's1-basaltgolem': 3, 's1-thunderimp': 4, jiangshi: 2 }, mood: 'dusk', tier: { hp: 2.7, atk: 2.2, xp: 3.4 } },
  ],
  enemies: ENEMIES,
  bosses: [ALPHAWOLF, SWORDSHADE, TIDECALLER, STORMMATRIARCH],
  quests: QUESTS,
  npcs: NPCS,
  items: ITEMS_NEW,
  icons: {
    's1-lotus-draught': { kind: 'ui', key: 'item_gourd' }, 's1-mist-tonic': { kind: 'ui', key: 'item_conch' }, 's1-storm-pill': { kind: 'ui', key: 'item_spirit_stone' },
    's1-moonfang-cloak': { kind: 'icon', key: 'relic_02_01' }, 's1-tidepearl': { kind: 'icon', key: 'relic_01_01' }, 's1-stormcaller-saber': { kind: 'icon', key: 'heavy_01_02' }, 's1-discipline-seal': { kind: 'icon', key: 'relic_02_00' },
  },
  drops: {
    alphawolf: [{ item: 'steel-blade', chance: 1 }, { item: 'hp-potion', chance: 1 }, { item: 's1-moonfang-cloak', chance: 0.5 }],
    swordshade: [{ item: 'spirit-silk', chance: 1 }, { item: 'qi-pill', chance: 1 }, { item: 's1-discipline-seal', chance: 0.5 }],
    's1-tidecaller': [{ item: 's1-tidepearl', chance: 1 }, { item: 's1-lotus-draught', chance: 1 }, { item: 'qi-pill', chance: 1 }],
    's1-stormmatriarch': [{ item: 's1-stormcaller-saber', chance: 1 }, { item: 's1-storm-pill', chance: 1 }, { item: 'qi-pill', chance: 1 }],
    's1-pearlwisp': [{ item: 'mana-potion', chance: 0.25 }, { item: 's1-mist-tonic', chance: 0.08 }],
    's1-driftwood': [{ item: 'hp-potion', chance: 0.35 }, { item: 'qi-pill', chance: 0.25 }],
    's1-tidemaiden': [{ item: 'mana-potion', chance: 0.3 }, { item: 's1-lotus-draught', chance: 0.08 }],
    's1-stormhawk': [{ item: 'qi-pill', chance: 0.3 }, { item: 'mana-potion', chance: 0.25 }],
    's1-basaltgolem': [{ item: 'qi-pill', chance: 0.35 }, { item: 'hp-potion', chance: 0.4 }],
    's1-cragbat': [],
    's1-thunderimp': [{ item: 'qi-pill', chance: 0.15 }, { item: 's1-storm-pill', chance: 0.08 }],
    's1-direwolf': [{ item: 'hp-potion', chance: 0.15 }],
  },
  eliteLoot: {
    lake: ['bronze-blade', 'cloth-robe', 'spirit-ring', 's1-tidepearl'],
    cliffs: ['steel-blade', 'spirit-silk', 'tiger-fang', 's1-stormcaller-saber'],
    wolfden: ['steel-blade', 's1-moonfang-cloak', 'jade-pendant'],
    swordsanctum: ['spirit-silk', 'tiger-fang', 's1-discipline-seal'],
    's1-pearlgrotto': ['spirit-ring', 's1-tidepearl', 'sect-robe'],
    's1-stormroost': ['s1-stormcaller-saber', 'spirit-silk', 'tiger-fang'],
  },
  dungeons: [WOLFDEN, SWORDSANCTUM, PEARLGROTTO, STORMROOST],
};
