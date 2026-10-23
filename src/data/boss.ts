import type { ZoneId } from './zones';

/** A boss is a sprite + stats + a kit of telegraphed moves; each phase draws from its own pool of moves. */
export type MoveId = 'slam' | 'sweep' | 'charge' | 'rain' | 'teleport' | 'summon' | 'ring';

export interface SlamDef { radius: number; windup: number; recover: number; cooldown: number; damageMult: number; triggerRange: number }
export interface SweepDef { range: number; halfAngle: number; windup: number; recover: number; cooldown: number; damageMult: number; triggerRange: number }
export interface ChargeDef { windup: number; duration: number; speed: number; width: number; recover: number; cooldown: number; damageMult: number; minRange: number; maxRange: number }
export interface RainDef { count: number; radius: number; spread: number; windup: number; delay: number; recover: number; cooldown: number; damageMult: number }
export interface TeleportDef { windup: number; recover: number; cooldown: number; behind: number; radius: number; damageMult: number }
export interface SummonDef { windup: number; cooldown: number; count: number; maxMinions: number; minionType: string }
export interface RingDef { windup: number; cooldown: number; projectiles: number; damageMult: number }

export interface BossDef {
  id: string; name: string;
  /** chapter (map) the boss lives in; its arena is `WorldMap.bossHomes[id]` */
  chapter: number;
  /** legacy chapter-1 landmark name (kept for the design export) */
  home: 'lair' | 'den' | 'pool' | 'barrow' | 'hollow' | 'summit';
  /** zone its summoned minions belong to */
  zone: ZoneId;
  /** multiply-tint over the sprite (recoloured reuse) */
  tint?: number;
  xp: number;
  stones: [number, number];
  /** sprite prefix in the manifest */
  sprite: string;
  scale: number;
  radius: number;
  maxHp: number; atk: number; def: number; speed: number;
  moves: { slam?: SlamDef; sweep?: SweepDef; charge?: ChargeDef; rain?: RainDef; teleport?: TeleportDef; summon?: SummonDef; ring?: RingDef };
  /** moves available in phase 1, 2, 3 */
  kit: [MoveId[], MoveId[], MoveId[]];
  phase2At: number; phase3At: number; // hp ratio thresholds
  enrage: { speedMult: number; cooldownMult: number };
}

export const WARDEN: BossDef = {
  id: 'warden', chapter: 1, name: 'Fallen Sword Immortal', home: 'lair', zone: 'lair', xp: 900, stones: [90, 140], sprite: 'boss.fallenimmortal', scale: 0.55, radius: 18,
  maxHp: 6600, atk: 30, def: 9, speed: 36,
  moves: {
    slam: { radius: 56, windup: 0.9, recover: 0.5, cooldown: 4, damageMult: 1.8, triggerRange: 90 },
    sweep: { range: 84, halfAngle: 0.95, windup: 0.75, recover: 0.5, cooldown: 3.2, damageMult: 1.5, triggerRange: 84 },
    rain: { count: 6, radius: 30, spread: 120, windup: 0.5, delay: 1.0, recover: 0.4, cooldown: 6, damageMult: 1.2 },
    teleport: { windup: 0.8, recover: 0.5, cooldown: 9, behind: 46, radius: 50, damageMult: 1.6 },
    summon: { windup: 0.8, cooldown: 14, count: 2, maxMinions: 4, minionType: 'swordspirit' },
    ring: { windup: 0.8, cooldown: 7, projectiles: 10, damageMult: 1.0 },
  },
  kit: [['slam', 'sweep'], ['slam', 'sweep', 'rain', 'summon'], ['rain', 'teleport', 'ring', 'sweep', 'slam']],
  phase2At: 0.66, phase3At: 0.33,
  enrage: { speedMult: 1.35, cooldownMult: 0.7 },
};

export const NINETAIL: BossDef = {
  id: 'ninetail', chapter: 1, name: 'Nine-Tailed Fox Spirit', home: 'den', zone: 'grove', xp: 420, stones: [55, 80], sprite: 'boss.ninetail', scale: 0.42, radius: 22,
  maxHp: 2400, atk: 22, def: 6, speed: 48,
  moves: {
    sweep: { range: 74, halfAngle: 1.25, windup: 0.6, recover: 0.4, cooldown: 2.6, damageMult: 1.3, triggerRange: 80 },
    charge: { windup: 0.7, duration: 0.5, speed: 300, width: 20, recover: 0.7, cooldown: 4.5, damageMult: 1.5, minRange: 12, maxRange: 230 },
    rain: { count: 5, radius: 28, spread: 100, windup: 0.4, delay: 0.9, recover: 0.4, cooldown: 6, damageMult: 1.1 },
    teleport: { windup: 0.7, recover: 0.4, cooldown: 8, behind: 40, radius: 46, damageMult: 1.4 },
    summon: { windup: 0.7, cooldown: 12, count: 3, maxMinions: 5, minionType: 'foxfire' },
    ring: { windup: 0.7, cooldown: 6, projectiles: 12, damageMult: 0.9 },
  },
  kit: [['sweep', 'charge'], ['charge', 'rain', 'summon', 'sweep'], ['teleport', 'charge', 'ring', 'rain', 'sweep']],
  phase2At: 0.66, phase3At: 0.33,
  enrage: { speedMult: 1.35, cooldownMult: 0.7 },
};

/** Water dragon of Mistveil Marsh: a mid-game boss built around geysers and orb rings, with drowned-ghost adds. */
export const JIAOLONG: BossDef = {
  id: 'jiaolong', chapter: 1, name: 'Jiao Dragon of the Mist Pool', home: 'pool', zone: 'marsh', xp: 1100, stones: [120, 180], sprite: 'boss.jiaolong', scale: 0.4, radius: 24,
  maxHp: 7400, atk: 34, def: 10, speed: 42,
  moves: {
    slam: { radius: 50, windup: 0.85, recover: 0.5, cooldown: 4.2, damageMult: 1.6, triggerRange: 84 },
    sweep: { range: 92, halfAngle: 1.1, windup: 0.65, recover: 0.45, cooldown: 3, damageMult: 1.4, triggerRange: 90 },
    charge: { windup: 0.75, duration: 0.55, speed: 280, width: 24, recover: 0.7, cooldown: 5, damageMult: 1.5, minRange: 14, maxRange: 240 },
    rain: { count: 7, radius: 28, spread: 110, windup: 0.5, delay: 0.95, recover: 0.4, cooldown: 5.5, damageMult: 1.1 },
    summon: { windup: 0.75, cooldown: 13, count: 2, maxMinions: 4, minionType: 'waterghost' },
    ring: { windup: 0.75, cooldown: 6.5, projectiles: 12, damageMult: 0.95 },
  },
  kit: [['sweep', 'rain'], ['sweep', 'charge', 'ring', 'summon'], ['rain', 'ring', 'charge', 'slam', 'sweep']],
  phase2At: 0.66, phase3At: 0.33,
  enrage: { speedMult: 1.3, cooldownMult: 0.7 },
};

// ---- Chapter 2 bosses. Art is PLACEHOLDER: pack mobs/bosses reused at larger scale and recoloured; replace before release. ----
/** Undead lord of the Ashen Barrow: heavy charges and jiangshi adds. */
export const CORPSEKING: BossDef = {
  id: 'corpseking', chapter: 2, name: 'Corpse King of the Ashen Barrow', home: 'barrow', zone: 'barrow', xp: 1500, stones: [160, 230], sprite: 'mob.jiangshi_v_red', scale: 0.78, radius: 22,
  maxHp: 9000, atk: 44, def: 12, speed: 44,
  moves: {
    slam: { radius: 58, windup: 0.85, recover: 0.5, cooldown: 4, damageMult: 1.7, triggerRange: 90 },
    sweep: { range: 90, halfAngle: 1.0, windup: 0.7, recover: 0.45, cooldown: 3, damageMult: 1.4, triggerRange: 88 },
    charge: { windup: 0.7, duration: 0.55, speed: 300, width: 26, recover: 0.7, cooldown: 4.6, damageMult: 1.6, minRange: 14, maxRange: 250 },
    summon: { windup: 0.75, cooldown: 12, count: 3, maxMinions: 5, minionType: 'bloodjiangshi' },
    ring: { windup: 0.75, cooldown: 6.5, projectiles: 12, damageMult: 0.95 },
  },
  kit: [['slam', 'charge'], ['charge', 'sweep', 'summon', 'slam'], ['charge', 'ring', 'summon', 'slam', 'sweep']],
  phase2At: 0.66, phase3At: 0.33,
  enrage: { speedMult: 1.3, cooldownMult: 0.7 },
};

/** Living crystal guarding the Hollow: slow, huge hits and shard rain. */
export const CRYSTALCOLOSSUS: BossDef = {
  id: 'crystalcolossus', chapter: 2, name: 'Crystal Colossus', home: 'hollow', zone: 'crystal', xp: 1900, stones: [200, 280], sprite: 'mob.golem', tint: 0x7fe6ff, scale: 1.0, radius: 26,
  maxHp: 11500, atk: 50, def: 18, speed: 32,
  moves: {
    slam: { radius: 66, windup: 1.0, recover: 0.6, cooldown: 4.2, damageMult: 1.9, triggerRange: 100 },
    sweep: { range: 100, halfAngle: 1.1, windup: 0.8, recover: 0.5, cooldown: 3.4, damageMult: 1.5, triggerRange: 96 },
    rain: { count: 8, radius: 30, spread: 130, windup: 0.5, delay: 1.0, recover: 0.4, cooldown: 5.5, damageMult: 1.2 },
    summon: { windup: 0.8, cooldown: 14, count: 2, maxMinions: 3, minionType: 'prismghost' },
    ring: { windup: 0.8, cooldown: 6, projectiles: 14, damageMult: 1.0 },
  },
  kit: [['slam', 'sweep'], ['slam', 'rain', 'summon', 'sweep'], ['rain', 'ring', 'slam', 'sweep', 'summon']],
  phase2At: 0.66, phase3At: 0.33,
  enrage: { speedMult: 1.4, cooldownMult: 0.65 },
};

/** The sealed thing the three guardians held back: every move in the book. */
export const SOVEREIGN: BossDef = {
  id: 'sovereign', chapter: 2, name: 'Sundered Sovereign', home: 'summit', zone: 'summit', xp: 3200, stones: [300, 420], sprite: 'boss.fallenimmortal', tint: 0x9fd0ff, scale: 0.72, radius: 22,
  maxHp: 16500, atk: 58, def: 20, speed: 42,
  moves: {
    slam: { radius: 62, windup: 0.85, recover: 0.45, cooldown: 3.8, damageMult: 1.8, triggerRange: 96 },
    sweep: { range: 96, halfAngle: 1.0, windup: 0.7, recover: 0.45, cooldown: 3, damageMult: 1.5, triggerRange: 92 },
    charge: { windup: 0.7, duration: 0.5, speed: 320, width: 24, recover: 0.6, cooldown: 5, damageMult: 1.6, minRange: 14, maxRange: 260 },
    rain: { count: 8, radius: 30, spread: 130, windup: 0.5, delay: 0.95, recover: 0.4, cooldown: 5.5, damageMult: 1.2 },
    teleport: { windup: 0.75, recover: 0.45, cooldown: 8, behind: 46, radius: 52, damageMult: 1.7 },
    summon: { windup: 0.8, cooldown: 13, count: 3, maxMinions: 5, minionType: 'prismghost' },
    ring: { windup: 0.75, cooldown: 6, projectiles: 14, damageMult: 1.0 },
  },
  kit: [['slam', 'sweep', 'charge'], ['slam', 'rain', 'summon', 'teleport', 'sweep'], ['rain', 'teleport', 'ring', 'charge', 'slam', 'sweep']],
  phase2At: 0.66, phase3At: 0.33,
  enrage: { speedMult: 1.4, cooldownMult: 0.62 },
};

export const BOSSES: Record<string, BossDef> = { warden: WARDEN, ninetail: NINETAIL, jiaolong: JIAOLONG, corpseking: CORPSEKING, crystalcolossus: CRYSTALCOLOSSUS, sovereign: SOVEREIGN };
export const bossesOfChapter = (chapter: number): BossDef[] => Object.values(BOSSES).filter((b) => b.chapter === chapter);

export const BOSS_IDS = Object.keys(BOSSES);
