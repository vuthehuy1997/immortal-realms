export interface BossDef {
  id: string; name: string;
  maxHp: number; atk: number; def: number; speed: number;
  slam: { radius: number; windup: number; recover: number; cooldown: number; damageMult: number; triggerRange: number };
  summon: { windup: number; cooldown: number; count: number; maxMinions: number; minionType: string };
  ring: { windup: number; cooldown: number; projectiles: number; damageMult: number };
  phase2At: number; phase3At: number; // hp ratio thresholds
  enrage: { speedMult: number; cooldownMult: number };
}

export const WARDEN: BossDef = {
  id: 'warden', name: 'Stone Warden',
  maxHp: 420, atk: 14, def: 5, speed: 30,
  slam: { radius: 40, windup: 0.9, recover: 0.5, cooldown: 4, damageMult: 1.8, triggerRange: 70 },
  summon: { windup: 0.8, cooldown: 12, count: 2, maxMinions: 4, minionType: 'slime' },
  ring: { windup: 0.8, cooldown: 6, projectiles: 8, damageMult: 1.0 },
  phase2At: 0.66, phase3At: 0.33,
  enrage: { speedMult: 1.4, cooldownMult: 0.7 },
};
