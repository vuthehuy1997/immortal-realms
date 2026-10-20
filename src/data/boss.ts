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
  /** world anchor of the arena */
  home: 'lair' | 'den' | 'pool';
  /** zone its summoned minions belong to */
  zone: 'lair' | 'grove' | 'marsh';
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
  id: 'warden', name: 'Fallen Sword Immortal', home: 'lair', zone: 'lair', xp: 900, stones: [90, 140], sprite: 'boss.fallenimmortal', scale: 0.55, radius: 18,
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
  id: 'ninetail', name: 'Nine-Tailed Fox Spirit', home: 'den', zone: 'grove', xp: 420, stones: [55, 80], sprite: 'boss.ninetail', scale: 0.42, radius: 22,
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
  id: 'jiaolong', name: 'Jiao Dragon of the Mist Pool', home: 'pool', zone: 'marsh', xp: 1100, stones: [120, 180], sprite: 'boss.jiaolong', scale: 0.4, radius: 24,
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

export const BOSSES: Record<string, BossDef> = { warden: WARDEN, ninetail: NINETAIL, jiaolong: JIAOLONG };
export const BOSS_IDS = Object.keys(BOSSES);
