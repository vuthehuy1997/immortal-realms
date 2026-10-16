export interface BossDef {
  id: string; name: string;
  /** world anchor: 'lair' or 'den' */
  home: 'lair' | 'den';
  xp: number;
  stones: [number, number];
  /** sprite prefix in the manifest */
  sprite: string;
  scale: number;
  radius: number;
  maxHp: number; atk: number; def: number; speed: number;
  slam: { radius: number; windup: number; recover: number; cooldown: number; damageMult: number; triggerRange: number };
  summon: { windup: number; cooldown: number; count: number; maxMinions: number; minionType: string };
  ring: { windup: number; cooldown: number; projectiles: number; damageMult: number };
  phase2At: number; phase3At: number; // hp ratio thresholds
  enrage: { speedMult: number; cooldownMult: number };
}

export const WARDEN: BossDef = {
  id: 'warden', name: 'Fallen Sword Immortal', home: 'lair', xp: 220, stones: [40, 60], sprite: 'boss.fallenimmortal', scale: 0.55, radius: 18,
  maxHp: 620, atk: 16, def: 6, speed: 36,
  slam: { radius: 56, windup: 0.9, recover: 0.5, cooldown: 4, damageMult: 1.8, triggerRange: 90 },
  summon: { windup: 0.8, cooldown: 12, count: 2, maxMinions: 4, minionType: 'swordspirit' },
  ring: { windup: 0.8, cooldown: 6, projectiles: 8, damageMult: 1.0 },
  phase2At: 0.66, phase3At: 0.33,
  enrage: { speedMult: 1.4, cooldownMult: 0.7 },
};

export const NINETAIL: BossDef = {
  id: 'ninetail', name: 'Nine-Tailed Fox Spirit', home: 'den', xp: 140, stones: [25, 40], sprite: 'boss.ninetail', scale: 0.42, radius: 22,
  maxHp: 420, atk: 14, def: 4, speed: 48,
  slam: { radius: 62, windup: 0.8, recover: 0.45, cooldown: 3.4, damageMult: 1.6, triggerRange: 100 },
  summon: { windup: 0.7, cooldown: 11, count: 3, maxMinions: 5, minionType: 'foxfire' },
  ring: { windup: 0.7, cooldown: 5, projectiles: 12, damageMult: 0.9 },
  phase2At: 0.66, phase3At: 0.33,
  enrage: { speedMult: 1.35, cooldownMult: 0.7 },
};

export const BOSSES: Record<string, BossDef> = { warden: WARDEN, ninetail: NINETAIL };
export const BOSS_IDS = Object.keys(BOSSES);
