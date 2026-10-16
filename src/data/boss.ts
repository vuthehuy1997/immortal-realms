export interface BossDef {
  id: string; name: string;
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
  id: 'warden', name: 'Fallen Sword Immortal', sprite: 'boss.fallenimmortal', scale: 0.55, radius: 18,
  maxHp: 620, atk: 16, def: 6, speed: 36,
  slam: { radius: 56, windup: 0.9, recover: 0.5, cooldown: 4, damageMult: 1.8, triggerRange: 90 },
  summon: { windup: 0.8, cooldown: 12, count: 2, maxMinions: 4, minionType: 'swordspirit' },
  ring: { windup: 0.8, cooldown: 6, projectiles: 8, damageMult: 1.0 },
  phase2At: 0.66, phase3At: 0.33,
  enrage: { speedMult: 1.4, cooldownMult: 0.7 },
};
