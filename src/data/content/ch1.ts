import type { BossDef } from '../boss';
import type { DungeonDef } from '../dungeons';
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

const WOLFDEN: DungeonDef = {
  id: 'wolfden', name: 'Moonfang Den', chapter: 1, kind: 'cave', blurb: 'a wolf pack\'s lair under the roots',
  entrance: { x: 10, y: 48, zone: 'bamboo' }, minLevel: 3, level: 'Lv 4-6', seed: 0x70f0d3, size: { w: 76, h: 56 }, floor: 'moss', wall: 'wall',
  scatter: [{ kind: 'rock', p: 0.02 }, { kind: 'taihurocks', p: 0.004 }, { kind: 'bambooshoot', p: 0.01 }],
  spawns: { wolf: 12, snake: 5, bat: 6, foxfire: 3 }, mood: 'night', tier: { hp: 1.5, atk: 1.55, xp: 1.7 }, propTint: 0xb8c8b0,
  boss: 'alphawolf', reward: { xp: 260, stones: 120, items: [{ id: 'steel-blade', count: 1 }, { id: 'qi-pill', count: 2 }] }, herbs: 6,
};

const SWORDSANCTUM: DungeonDef = {
  id: 'swordsanctum', name: 'Hidden Sword Sanctum', chapter: 1, kind: 'realm', blurb: 'a sealed pocket of the old sect, outside time',
  entrance: { x: 126, y: 88, zone: 'ruins' }, minLevel: 7, level: 'Lv 8-11', seed: 0x5ec7a1, size: { w: 104, h: 60 }, floor: 'stone', wall: 'void', rooms: 5,
  scatter: [{ kind: 'standstone', p: 0.006 }, { kind: 'stonecircle', p: 0.0015 }],
  spawns: { swordspirit: 8, skeleton: 6, soldier: 5, paperdoll: 5, golem: 2 }, mood: 'night', tier: { hp: 3.2, atk: 2.5, xp: 4.2 }, propTint: 0xc8c0ff,
  boss: 'swordshade', reward: { xp: 520, stones: 260, items: [{ id: 'spirit-silk', count: 1 }, { id: 'qi-pill', count: 3 }] }, herbs: 5,
};

/** Chapter 1 expansion: two more zones plus a cave and a secret realm (the base chapter lives in zones.ts / quests.ts / boss.ts). */
export const CH1: ChapterContent = {
  ...emptyContent(),
  zones: [
    { id: 'lake', chapter: 1, name: 'Moonmirror Lake', anchor: { x: 38, y: 98 }, level: 'Lv 2-6', spawns: { snake: 6, waterghost: 5, foxfire: 5, toad: 3 }, mood: 'dusk', tier: { hp: 1.25, atk: 1.35, xp: 1.4 } },
    { id: 'cliffs', chapter: 1, name: 'Thunderpeak Cliffs', anchor: { x: 110, y: 30 }, level: 'Lv 8-12', spawns: { thunderbird: 4, swordspirit: 5, bat: 6, golem: 3, jiangshi: 3 }, mood: 'dusk', tier: { hp: 2.7, atk: 2.2, xp: 3.4 } },
  ],
  bosses: [ALPHAWOLF, SWORDSHADE],
  drops: { alphawolf: [{ item: 'steel-blade', chance: 1 }, { item: 'hp-potion', chance: 1 }], swordshade: [{ item: 'spirit-silk', chance: 1 }, { item: 'qi-pill', chance: 1 }] },
  eliteLoot: { lake: ['bronze-blade', 'cloth-robe', 'spirit-ring'], cliffs: ['steel-blade', 'spirit-silk', 'tiger-fang'] },
  dungeons: [WOLFDEN, SWORDSANCTUM],
};
