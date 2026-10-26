import type { BossDef } from '../boss';
import type { DungeonDef } from '../dungeons';
import type { EnemyDef } from '../enemies';
import type { ItemDef } from '../items';
import type { NpcDef, QuestDef } from '../quests';
import { emptyContent, type ChapterContent } from './types';

/**
 * Chapter 2 expansion (the base chapter lives in zones.ts / quests.ts / boss.ts / maps.ts; every id there is kept):
 * two new zones (Glacier Maw, Howling Tundra), four dungeons (three caves and a secret realm), wild NPCs, side quests, gear.
 * All art is PLACEHOLDER: pack sprites reused, enlarged and tinted.
 */

// ---- dungeon bosses -------------------------------------------------------------------------------------------------
/** Rimeheart Cave: a frost-wolf matriarch that leads the pack. PLACEHOLDER art: the wolf, enlarged and icy. */
const RIMEMATRIARCH: BossDef = {
  id: 's2-rimematriarch', chapter: 2, dungeon: 's2-rimeheart', name: 'Rime Matriarch', home: 'rimeheart', zone: 's2-rimeheart', xp: 700, stones: [120, 180],
  sprite: 'mob.wolf', tint: 0xcfe8ff, scale: 1.15, radius: 22, maxHp: 8800, atk: 38, def: 10, speed: 62,
  moves: {
    sweep: { range: 78, halfAngle: 1.15, windup: 0.55, recover: 0.4, cooldown: 2.8, damageMult: 1.35, triggerRange: 82 },
    charge: { windup: 0.6, duration: 0.5, speed: 320, width: 24, recover: 0.65, cooldown: 4.0, damageMult: 1.55, minRange: 12, maxRange: 250 },
    summon: { windup: 0.7, cooldown: 11, count: 3, maxMinions: 5, minionType: 's2-glacierwolf' },
    ring: { windup: 0.7, cooldown: 7, projectiles: 12, damageMult: 0.9 },
  },
  kit: [['sweep', 'charge'], ['charge', 'summon', 'sweep'], ['charge', 'ring', 'summon', 'sweep']],
  phase2At: 0.66, phase3At: 0.33, enrage: { speedMult: 1.3, cooldownMult: 0.7 },
};

/** Gravewind Catacomb: the first guardian of the barrow, still standing. PLACEHOLDER art: the skeleton, enlarged and bone-white. */
const BONEWARDEN: BossDef = {
  id: 's2-bonewarden', chapter: 2, dungeon: 's2-gravewind', name: 'Bone Warden of the Gravewind', home: 'gravewind', zone: 's2-gravewind', xp: 900, stones: [150, 220],
  sprite: 'mob.skeleton', tint: 0xe8e0d0, scale: 1.0, radius: 22, maxHp: 11500, atk: 44, def: 14, speed: 44,
  moves: {
    slam: { radius: 60, windup: 0.85, recover: 0.5, cooldown: 4, damageMult: 1.7, triggerRange: 92 },
    sweep: { range: 92, halfAngle: 1.0, windup: 0.7, recover: 0.45, cooldown: 3, damageMult: 1.4, triggerRange: 90 },
    charge: { windup: 0.7, duration: 0.5, speed: 300, width: 26, recover: 0.7, cooldown: 4.8, damageMult: 1.6, minRange: 14, maxRange: 250 },
    summon: { windup: 0.75, cooldown: 12, count: 3, maxMinions: 5, minionType: 'ashskeleton' },
    ring: { windup: 0.75, cooldown: 6.5, projectiles: 12, damageMult: 0.95 },
  },
  kit: [['slam', 'sweep'], ['slam', 'charge', 'summon', 'sweep'], ['charge', 'ring', 'summon', 'slam', 'sweep']],
  phase2At: 0.66, phase3At: 0.33, enrage: { speedMult: 1.3, cooldownMult: 0.7 },
};

/** Mirror Vault: a sage who tried to freeze the Fissure's light into glass. PLACEHOLDER art: the fallen immortal, violet. */
const PRISMSAGE: BossDef = {
  id: 's2-prismsage', chapter: 2, dungeon: 's2-mirrorvault', name: 'Prism Sage of the Mirror Vault', home: 'mirrorvault', zone: 's2-mirrorvault', xp: 1000, stones: [170, 250],
  sprite: 'boss.fallenimmortal', tint: 0xd8b8ff, scale: 0.55, radius: 18, maxHp: 12500, atk: 46, def: 15, speed: 40,
  moves: {
    slam: { radius: 56, windup: 0.9, recover: 0.5, cooldown: 4.2, damageMult: 1.7, triggerRange: 88 },
    sweep: { range: 86, halfAngle: 0.95, windup: 0.7, recover: 0.45, cooldown: 3.2, damageMult: 1.45, triggerRange: 84 },
    rain: { count: 7, radius: 30, spread: 130, windup: 0.5, delay: 0.95, recover: 0.4, cooldown: 5.5, damageMult: 1.15 },
    teleport: { windup: 0.75, recover: 0.45, cooldown: 8.5, behind: 44, radius: 50, damageMult: 1.6 },
    summon: { windup: 0.8, cooldown: 13, count: 2, maxMinions: 4, minionType: 'prismghost' },
    ring: { windup: 0.75, cooldown: 6.2, projectiles: 14, damageMult: 1.0 },
  },
  kit: [['slam', 'sweep'], ['slam', 'rain', 'summon', 'sweep'], ['rain', 'teleport', 'ring', 'summon', 'slam']],
  phase2At: 0.66, phase3At: 0.33, enrage: { speedMult: 1.35, cooldownMult: 0.65 },
};

/** Wyrm Den: the Glacier Maw's namesake, a frozen river-dragon. PLACEHOLDER art: the jiao dragon, icy and smaller. */
const GLACIERWYRM: BossDef = {
  id: 's2-glacierwyrm', chapter: 2, dungeon: 's2-wyrmden', name: 'Glacier Wyrm', home: 'wyrmden', zone: 's2-wyrmden', xp: 1100, stones: [190, 270],
  sprite: 'boss.jiaolong', tint: 0xbfe4ff, scale: 0.44, radius: 24, maxHp: 13500, atk: 48, def: 14, speed: 42,
  moves: {
    slam: { radius: 56, windup: 0.9, recover: 0.5, cooldown: 4.2, damageMult: 1.7, triggerRange: 90 },
    sweep: { range: 96, halfAngle: 1.1, windup: 0.65, recover: 0.45, cooldown: 3, damageMult: 1.4, triggerRange: 92 },
    charge: { windup: 0.75, duration: 0.55, speed: 290, width: 26, recover: 0.7, cooldown: 5, damageMult: 1.55, minRange: 14, maxRange: 250 },
    rain: { count: 8, radius: 30, spread: 120, windup: 0.5, delay: 0.95, recover: 0.4, cooldown: 5.5, damageMult: 1.15 },
    summon: { windup: 0.75, cooldown: 13, count: 2, maxMinions: 4, minionType: 's2-mawserpent' },
    ring: { windup: 0.75, cooldown: 6.5, projectiles: 12, damageMult: 0.95 },
  },
  kit: [['sweep', 'rain'], ['sweep', 'charge', 'ring', 'summon'], ['rain', 'ring', 'charge', 'slam', 'sweep']],
  phase2At: 0.66, phase3At: 0.33, enrage: { speedMult: 1.3, cooldownMult: 0.68 },
};

// ---- dungeons -------------------------------------------------------------------------------------------------------
const RIMEHEART: DungeonDef = {
  id: 's2-rimeheart', name: 'Rimeheart Cave', chapter: 2, kind: 'cave', blurb: 'an ice cave where a wolf queen rules the cold',
  entrance: { x: 52, y: 78, zone: 'frostpass' }, minLevel: 10, level: 'Lv 11-14', seed: 0x41ce4a2, size: { w: 80, h: 58 }, floor: 'ice', wall: 'wall',
  scatter: [{ kind: 'rock', p: 0.02 }, { kind: 'taihurocks', p: 0.005 }, { kind: 'standstone', p: 0.004 }],
  spawns: { frostwolf: 6, 's2-glacierwolf': 6, icesnake: 4, rimebat: 5, frostwisp: 3 }, mood: 'frost', tier: { hp: 4.5, atk: 3.1, xp: 4.8 }, propTint: 0xc8e4ff,
  boss: 's2-rimematriarch', reward: { xp: 700, stones: 320, items: [{ id: 's2-rime-elixir', count: 3 }, { id: 'greater-hp-potion', count: 3 }] }, herbs: 6,
};

const GRAVEWIND: DungeonDef = {
  id: 's2-gravewind', name: 'Gravewind Catacomb', chapter: 2, kind: 'cave', blurb: 'catacombs under the barrow, where a cold wind walks the halls',
  entrance: { x: 38, y: 46, zone: 'barrow' }, minLevel: 13, level: 'Lv 15-18', seed: 0x6a7e3d1, size: { w: 86, h: 62 }, floor: 'ash', wall: 'wall',
  scatter: [{ kind: 'standstone', p: 0.01 }, { kind: 'rock', p: 0.016 }, { kind: 'moonwall', p: 0.0015 }],
  spawns: { ashskeleton: 6, 's2-frozencorpse': 4, 's2-tombwraith': 4, ashguard: 4, bloodjiangshi: 3 }, mood: 'night', tier: { hp: 5.4, atk: 3.7, xp: 5.9 }, propTint: 0x9c98b4,
  boss: 's2-bonewarden', reward: { xp: 900, stones: 400, items: [{ id: 's2-frostlotus-pill', count: 3 }, { id: 'greater-hp-potion', count: 3 }] }, herbs: 6,
};

const MIRRORVAULT: DungeonDef = {
  id: 's2-mirrorvault', name: 'Mirror Vault', chapter: 2, kind: 'realm', blurb: 'a hall of ice mirrors, folded out of the Fissure\'s light',
  entrance: { x: 134, y: 84, zone: 'crystal' }, minLevel: 12, level: 'Lv 14-17', seed: 0x2bd90e7, size: { w: 108, h: 60 }, floor: 'ice', wall: 'void', rooms: 5,
  scatter: [{ kind: 'standstone', p: 0.005 }, { kind: 'stonecircle', p: 0.0015 }, { kind: 'taihurocks', p: 0.002 }],
  spawns: { 's2-mirrorspirit': 7, 's2-glasspuppet': 6, 's2-rimesentinel': 4, prismghost: 4, crystalgolem: 2 }, mood: 'frost', tier: { hp: 5.0, atk: 3.5, xp: 5.6 }, propTint: 0xb8ccff,
  boss: 's2-prismsage', reward: { xp: 1000, stones: 450, items: [{ id: 's2-aurora-draught', count: 3 }, { id: 'greater-mana-potion', count: 3 }] }, herbs: 5,
};

const WYRMDEN: DungeonDef = {
  id: 's2-wyrmden', name: 'Glacier Wyrm Den', chapter: 2, kind: 'cave', blurb: 'the frozen river bed where the glacier\'s wyrm sleeps',
  entrance: { x: 86, y: 60, zone: 'glaciermaw' }, minLevel: 14, level: 'Lv 16-19', seed: 0x7f31c58, size: { w: 90, h: 64 }, floor: 'ice', wall: 'wall',
  scatter: [{ kind: 'taihurocks', p: 0.008 }, { kind: 'rock', p: 0.02 }, { kind: 'standstone', p: 0.005 }],
  spawns: { 's2-mawserpent': 6, 's2-aurorawisp': 5, 's2-glacierbrute': 4, icesnake: 4, prismghost: 3 }, mood: 'frost', tier: { hp: 5.2, atk: 3.6, xp: 5.8 }, propTint: 0x88b8e8,
  boss: 's2-glacierwyrm', reward: { xp: 1100, stones: 480, items: [{ id: 's2-glacier-saber', count: 1 }, { id: 's2-rime-elixir', count: 2 }] }, herbs: 6,
};

// ---- enemies (PLACEHOLDER art: tinted pack mobs) --------------------------------------------------------------------
const ENEMIES: EnemyDef[] = [
  // Howling Tundra
  { id: 's2-glacierwolf', name: 'Glacier Wolf', behavior: 'rusher', maxHp: 56, atk: 11, def: 2, speed: 68, aggroRange: 120, attackRange: 18, attackCooldown: 0.9, strikeWindup: 0.28, xp: 22, sprite: 'mob.wolf', tint: 0xdff0ff, scale: 0.42, radius: 9, stones: [3, 6] },
  { id: 's2-howlwraith', name: 'Howling Wraith', behavior: 'caster', maxHp: 44, atk: 14, def: 0, speed: 40, aggroRange: 140, attackRange: 120, attackCooldown: 1.6, preferredRange: 90, volley: 2, xp: 28, sprite: 'mob.ghost', tint: 0xbfe0ff, scale: 0.4, radius: 7, stones: [4, 8] },
  { id: 's2-blizzardhawk', name: 'Blizzard Hawk', behavior: 'caster', maxHp: 54, atk: 16, def: 1, speed: 50, aggroRange: 160, attackRange: 140, attackCooldown: 1.4, preferredRange: 100, volley: 3, xp: 38, sprite: 'mob.thunderbird', tint: 0xf0f8ff, scale: 0.44, radius: 8, stones: [6, 11] },
  // Glacier Maw
  { id: 's2-mawserpent', name: 'Maw Serpent', behavior: 'rusher', maxHp: 48, atk: 12, def: 2, speed: 52, aggroRange: 110, attackRange: 16, attackCooldown: 0.85, strikeWindup: 0.26, xp: 22, sprite: 'mob.snake', tint: 0x7fc8ff, scale: 0.46, radius: 8, stones: [3, 6] },
  { id: 's2-aurorawisp', name: 'Aurora Wisp', behavior: 'caster', maxHp: 46, atk: 15, def: 0, speed: 42, aggroRange: 140, attackRange: 120, attackCooldown: 1.5, preferredRange: 90, volley: 2, xp: 26, sprite: 'mob.foxfire', tint: 0x9fffd0, scale: 0.4, radius: 7, stones: [3, 7] },
  { id: 's2-glacierbrute', name: 'Glacier Brute', behavior: 'charger', maxHp: 135, atk: 18, def: 10, speed: 26, aggroRange: 110, attackRange: 76, attackCooldown: 2.8, windup: 0.8, dashTime: 0.5, dashSpeedMult: 4, xp: 62, sprite: 'mob.golem', tint: 0xb0d8f0, scale: 0.5, radius: 12, stones: [9, 16] },
  // Gravewind Catacomb
  { id: 's2-frozencorpse', name: 'Frozen Corpse', behavior: 'charger', maxHp: 100, atk: 20, def: 6, speed: 36, aggroRange: 120, attackRange: 84, attackCooldown: 2.4, windup: 0.55, dashTime: 0.4, dashSpeedMult: 5, xp: 48, sprite: 'mob.jiangshi', tint: 0xbfd0ff, scale: 0.4, radius: 8, stones: [6, 12] },
  { id: 's2-tombwraith', name: 'Tomb Wraith', behavior: 'caster', maxHp: 46, atk: 17, def: 0, speed: 40, aggroRange: 140, attackRange: 120, attackCooldown: 1.6, preferredRange: 90, volley: 2, xp: 32, sprite: 'mob.ghost_v_crimson', scale: 0.4, radius: 7, stones: [4, 8] },
  // Mirror Vault
  { id: 's2-mirrorspirit', name: 'Mirror Blade Spirit', behavior: 'charger', maxHp: 50, atk: 16, def: 2, speed: 44, aggroRange: 140, attackRange: 96, attackCooldown: 2.0, windup: 0.4, dashTime: 0.35, dashSpeedMult: 6, xp: 34, sprite: 'mob.swordspirit', tint: 0xc0f0ff, scale: 0.4, radius: 8, stones: [4, 9] },
  { id: 's2-glasspuppet', name: 'Glass Puppet', behavior: 'rusher', maxHp: 44, atk: 13, def: 1, speed: 56, aggroRange: 110, attackRange: 16, attackCooldown: 0.9, strikeWindup: 0.28, xp: 22, sprite: 'mob.paperdoll', tint: 0xd0ecff, scale: 0.38, radius: 7, stones: [3, 6] },
  { id: 's2-rimesentinel', name: 'Rime Sentinel', behavior: 'rusher', maxHp: 90, atk: 15, def: 7, speed: 40, aggroRange: 120, attackRange: 22, attackCooldown: 1.3, strikeWindup: 0.34, xp: 38, sprite: 'mob.soldier', tint: 0xa0c0d8, scale: 0.4, radius: 8, stones: [5, 10] },
];

// ---- items ----------------------------------------------------------------------------------------------------------
const ITEMS_NEW: ItemDef[] = [
  { id: 's2-rime-elixir', name: 'Rime Elixir', type: 'consumable', maxStack: 10, description: 'Restores 200 HP.', value: 70, rarity: 'rare', heal: 200 },
  { id: 's2-aurora-draught', name: 'Aurora Draught', type: 'consumable', maxStack: 10, description: 'Restores 140 mana.', value: 70, rarity: 'rare', mana: 140 },
  { id: 's2-frostlotus-pill', name: 'Frostlotus Pill', type: 'consumable', maxStack: 10, description: 'Adds 150 qi.', value: 80, rarity: 'rare', qi: 150 },
  { id: 's2-glacier-saber', name: 'Glacier Wyrm Saber', type: 'equipment', slot: 'weapon', maxStack: 1, description: '+22 attack. The edge never thaws.', value: 1900, rarity: 'rare', weaponAtk: 22 },
  { id: 's2-mirror-blade', name: 'Mirrorvault Blade', type: 'equipment', slot: 'weapon', maxStack: 1, description: '+26 attack. It shows you what you will do next.', value: 3000, rarity: 'epic', weaponAtk: 26 },
  { id: 's2-rime-cloak', name: 'Rime Matriarch Cloak', type: 'equipment', slot: 'armor', maxStack: 1, description: '+25 defence, +140 HP.', value: 2000, rarity: 'rare', defBonus: 25, hpBonus: 140 },
  { id: 's2-warden-signet', name: 'Bone Warden Signet', type: 'equipment', slot: 'charm', maxStack: 1, description: '+6 attack, +5% critical chance, +4 defence.', value: 1500, rarity: 'rare', atkBonus: 6, critBonus: 0.05, defBonus: 4 },
  { id: 's2-wyrm-pearl', name: 'Glacier Wyrm Pearl', type: 'equipment', slot: 'charm', maxStack: 1, description: '+50 mana, +3 mana regeneration, +8 defence.', value: 2800, rarity: 'epic', manaBonus: 50, regenBonus: 3, defBonus: 8 },
];

// ---- quests and wild NPCs -------------------------------------------------------------------------------------------
const QUESTS: QuestDef[] = [
  {
    id: 's2-trapper', chapter: 2, name: "The Trapper's Due", giver: 'trapper-hu', requires: 'rift-scouts',
    intro: 'You walk like someone who can fight. Good: the tundra is crawling. Glacier wolves hunt in packs of ten and the hawks above them pick off whatever the wolves leave. Thin out six Glacier Wolves and four Blizzard Hawks and I can run my lines again.',
    reminder: 'Six Glacier Wolves and four Blizzard Hawks on the Howling Tundra, south-east of the pass.',
    completeText: 'Now that is a clean sweep. My lines are yours to follow, and so are these.',
    objectives: [
      { type: 'kill', target: 's2-glacierwolf', count: 6, label: 'Cull Glacier Wolves' },
      { type: 'kill', target: 's2-blizzardhawk', count: 4, label: 'Shoot down Blizzard Hawks' },
    ],
    reward: { xp: 520, stones: 350, items: [{ id: 'greater-hp-potion', count: 3 }, { id: 'greater-mana-potion', count: 3 }] },
  },
  {
    id: 's2-rimeheart', chapter: 2, name: 'The Rime Matriarch', giver: 'trapper-hu', requires: 's2-trapper',
    intro: 'Every pack has a queen, and this one has a cave in the Whitefrost Pass. The wolves never stop coming while she lives. Go into Rimeheart Cave and end her.',
    reminder: 'Rimeheart Cave opens in the rocks north of the pass road. The Matriarch lairs at its far end.',
    completeText: 'No more howling at night. Her cloak is yours: nothing in the north keeps out the cold better.',
    objectives: [{ type: 'kill', target: 's2-rimematriarch', count: 1, label: 'Slay the Rime Matriarch' }],
    reward: { xp: 760, stones: 380, items: [{ id: 's2-rime-elixir', count: 3 }, { id: 's2-rime-cloak', count: 1 }] },
  },
  {
    id: 's2-gravewind', chapter: 2, name: 'Rest for the Barrow Dead', giver: 'warden-ling', requires: 'rift-scouts',
    intro: 'I keep the old rites here, or what is left of them. The soldiers in the ash were buried with honour, and now they walk. I cannot lay eight of them to rest alone. Break eight Ash Soldiers and four Barrow Guards, and I will do the rest.',
    reminder: 'Eight Ash Soldiers and four Barrow Guards in the Ashen Barrow, north of the outpost.',
    completeText: 'The wind is quieter. Thank you. There is one more thing under the barrow, though.',
    objectives: [
      { type: 'kill', target: 'ashskeleton', count: 8, label: 'Lay Ash Soldiers to rest' },
      { type: 'kill', target: 'ashguard', count: 4, label: 'Break Barrow Guards' },
    ],
    reward: { xp: 640, stones: 320, items: [{ id: 'greater-hp-potion', count: 3 }, { id: 'qi-pill', count: 3 }] },
  },
  {
    id: 's2-bonewarden', chapter: 2, name: 'The Bone Warden', giver: 'warden-ling', requires: 's2-gravewind',
    intro: 'Beneath the barrow there is a catacomb the founders sealed with a single guardian, the Bone Warden. It keeps the dead in. Something has made it keep the living out, too. Descend into the Gravewind Catacomb and put him down.',
    reminder: 'The Gravewind Catacomb opens in the barrow ash, south-east of the Corpse King\'s court.',
    completeText: 'He was a good man once. His signet is yours; wear it for the dead.',
    objectives: [{ type: 'kill', target: 's2-bonewarden', count: 1, label: 'Defeat the Bone Warden' }],
    reward: { xp: 980, stones: 450, items: [{ id: 's2-warden-signet', count: 1 }, { id: 's2-frostlotus-pill', count: 2 }] },
  },
  {
    id: 's2-survey', chapter: 2, name: 'Charting the Maw', giver: 'surveyor-pei', requires: 'rift-scouts',
    intro: 'Surveyor Pei, of the old sect cartographers. The Glacier Maw moves: every winter it swallows another valley. I am mapping its edge, but serpents and wisps drive off my crew. Kill six Maw Serpents and five Aurora Wisps so I can finish the chart.',
    reminder: 'Six Maw Serpents and five Aurora Wisps in the Glacier Maw, in the middle of the sundered plateau.',
    completeText: 'The edge is mapped, and it is closer than we feared. Take this for your trouble.',
    objectives: [
      { type: 'kill', target: 's2-mawserpent', count: 6, label: 'Slay Maw Serpents' },
      { type: 'kill', target: 's2-aurorawisp', count: 5, label: 'Douse Aurora Wisps' },
    ],
    reward: { xp: 700, stones: 380, items: [{ id: 's2-aurora-draught', count: 3 }, { id: 'greater-hp-potion', count: 2 }] },
  },
  {
    id: 's2-wyrm', chapter: 2, name: 'The Glacier Wyrm', giver: 'surveyor-pei', requires: 's2-survey',
    intro: 'Now the thing I could not chart. The ice booms from below, and the old river bed under the Maw is not empty. A wyrm, I think, frozen into the glacier and finally waking. Whatever it is, go down into its den and stop it.',
    reminder: 'The Glacier Wyrm Den opens in the ice of the Maw, east of the meltwater river.',
    completeText: 'The booming has stopped. I will mark the den closed. That blade is the least of what you have earned.',
    objectives: [{ type: 'kill', target: 's2-glacierwyrm', count: 1, label: 'Slay the Glacier Wyrm' }],
    reward: { xp: 1050, stones: 480, items: [{ id: 's2-glacier-saber', count: 1 }, { id: 's2-aurora-draught', count: 3 }] },
  },
  {
    id: 's2-mirror', chapter: 2, name: 'The Mirror Vault', giver: 'seer-lian', requires: 'hollow-heart',
    intro: 'I see you in a hundred mirrors, and in each one you are about to ask me something. Yes: a vault of ice mirrors lies behind the Hollow, and a sage sleeps in it who tried to hold the Fissure\'s light. I cannot see how it ends. Go and see for both of us.',
    reminder: 'The Mirror Vault is a gate in the ice, south-east of the Crystal Hollow.',
    completeText: 'In every mirror now, you win. How strange. Take the blade; it was always meant for the one who walked in.',
    objectives: [{ type: 'kill', target: 's2-prismsage', count: 1, label: 'Defeat the Prism Sage' }],
    reward: { xp: 1000, stones: 500, items: [{ id: 's2-aurora-draught', count: 3 }, { id: 'greater-mana-potion', count: 3 }] },
  },
];

const NPCS: Record<string, NpcDef> = {
  'trapper-hu': { chapter: 2, sprite: 'hero.archer', role: 'Trapper Hu · Quests', name: 'Trapper Hu', portrait: 'hunter_neutral', quests: ['s2-trapper', 's2-rimeheart'], idle: 'The tundra remembers every footprint. So do the wolves.' },
  'warden-ling': { chapter: 2, sprite: 'hero.swordsman', role: 'Warden Ling · Quests', name: 'Warden Ling', portrait: 'taoist_neutral', quests: ['s2-gravewind', 's2-bonewarden'], idle: 'Do not hurry the dead. They have waited longer than you have lived.' },
  'surveyor-pei': { chapter: 2, sprite: 'hero.fanscholar', role: 'Surveyor Pei · Quests', name: 'Surveyor Pei', portrait: 'scholar_neutral', quests: ['s2-survey', 's2-wyrm'], idle: 'Every map is a promise. Out here the ground breaks it every winter.' },
  'seer-lian': { chapter: 2, sprite: 'hero.heroine', role: 'Seer Lian · Quests', name: 'Seer Lian', portrait: 'fairy_neutral', quests: ['s2-mirror'], idle: 'I have seen your road. It has more stairs than I would like.' },
};

export const CH2: ChapterContent = {
  ...emptyContent(),
  zones: [
    // PLACEHOLDER art for the zones' props is the same pack scenery as the rest of the chapter, tinted.
    { id: 'glaciermaw', chapter: 2, name: 'Glacier Maw', anchor: { x: 72, y: 50 }, level: 'Lv 14-18', spawns: { 's2-mawserpent': 6, 's2-aurorawisp': 5, 's2-glacierbrute': 4, icesnake: 3, prismghost: 3, rimebat: 3 }, mood: 'frost', tier: { hp: 5.0, atk: 3.4, xp: 5.4 }, propTint: 0x9ad0f0 },
    { id: 'tundra', chapter: 2, name: 'Howling Tundra', anchor: { x: 108, y: 108 }, level: 'Lv 12-16', spawns: { 's2-glacierwolf': 7, 's2-howlwraith': 4, 's2-blizzardhawk': 4, frostwolf: 4, rimebat: 4, snowtreant: 2 }, mood: 'frost', tier: { hp: 4.6, atk: 3.2, xp: 4.8 }, propTint: 0xd0e4f8 },
  ],
  enemies: ENEMIES,
  bosses: [RIMEMATRIARCH, BONEWARDEN, PRISMSAGE, GLACIERWYRM],
  quests: QUESTS,
  npcs: NPCS,
  items: ITEMS_NEW,
  icons: {
    's2-rime-elixir': { kind: 'ui', key: 'item_peach' }, 's2-aurora-draught': { kind: 'ui', key: 'item_lantern' }, 's2-frostlotus-pill': { kind: 'ui', key: 'item_ginseng' },
    's2-glacier-saber': { kind: 'icon', key: 'heavy_01_01' }, 's2-mirror-blade': { kind: 'icon', key: 'ranged_01_02' }, 's2-rime-cloak': { kind: 'icon', key: 'relic_01_02' },
    's2-warden-signet': { kind: 'icon', key: 'relic_02_01' }, 's2-wyrm-pearl': { kind: 'icon', key: 'relic_02_05' },
  },
  drops: {
    's2-rimematriarch': [{ item: 's2-rime-cloak', chance: 0.7 }, { item: 's2-rime-elixir', chance: 1 }, { item: 'qi-pill', chance: 1 }],
    's2-bonewarden': [{ item: 's2-warden-signet', chance: 0.8 }, { item: 's2-frostlotus-pill', chance: 1 }, { item: 'greater-hp-potion', chance: 1 }],
    's2-prismsage': [{ item: 's2-mirror-blade', chance: 1 }, { item: 's2-aurora-draught', chance: 1 }, { item: 'qi-pill', chance: 1 }],
    's2-glacierwyrm': [{ item: 's2-wyrm-pearl', chance: 1 }, { item: 's2-glacier-saber', chance: 0.5 }, { item: 's2-rime-elixir', chance: 1 }],
    's2-glacierwolf': [{ item: 'greater-hp-potion', chance: 0.08 }, { item: 'hp-potion', chance: 0.15 }],
    's2-howlwraith': [{ item: 'greater-mana-potion', chance: 0.1 }, { item: 'mana-potion', chance: 0.25 }],
    's2-blizzardhawk': [{ item: 'qi-pill', chance: 0.3 }, { item: 'greater-mana-potion', chance: 0.15 }],
    's2-mawserpent': [{ item: 'hp-potion', chance: 0.12 }],
    's2-aurorawisp': [{ item: 'greater-mana-potion', chance: 0.1 }, { item: 's2-aurora-draught', chance: 0.04 }],
    's2-glacierbrute': [{ item: 'qi-pill', chance: 0.4 }, { item: 'greater-hp-potion', chance: 0.2 }],
    's2-frozencorpse': [{ item: 'qi-pill', chance: 0.3 }, { item: 's2-frostlotus-pill', chance: 0.05 }],
    's2-tombwraith': [{ item: 'greater-mana-potion', chance: 0.12 }, { item: 'qi-pill', chance: 0.15 }],
    's2-mirrorspirit': [{ item: 'qi-pill', chance: 0.2 }, { item: 'greater-mana-potion', chance: 0.1 }],
    's2-glasspuppet': [{ item: 'greater-hp-potion', chance: 0.08 }],
    's2-rimesentinel': [{ item: 'greater-hp-potion', chance: 0.12 }, { item: 'hp-potion', chance: 0.25 }],
  },
  eliteLoot: {
    glaciermaw: ['froststeel-blade', 'frost-mail', 's2-glacier-saber', 'barrow-ward'],
    tundra: ['froststeel-blade', 'frost-mail', 's2-rime-cloak', 'greater-hp-potion'],
    's2-rimeheart': ['froststeel-blade', 's2-rime-cloak', 'greater-hp-potion'],
    's2-gravewind': ['frost-mail', 'barrow-ward', 's2-warden-signet'],
    's2-mirrorvault': ['s2-glacier-saber', 'barrow-ward', 's2-wyrm-pearl'],
    's2-wyrmden': ['s2-glacier-saber', 'frost-mail', 's2-wyrm-pearl'],
  },
  dungeons: [RIMEHEART, GRAVEWIND, MIRRORVAULT, WYRMDEN],
};
