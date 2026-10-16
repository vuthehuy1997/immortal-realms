export interface Combatant {
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  atk: number;
  def: number;
  critChance: number; // 0..1
  critMult: number;
  manaRegen: number; // per second
}

export interface DamageResult { amount: number; crit: boolean }

/** damage = max(1, (atk * skillMult - def * 0.5) * (crit ? critMult : 1)), rounded. rng injected for determinism. */
export function computeDamage(
  attacker: Pick<Combatant, 'atk' | 'critChance' | 'critMult'>,
  defender: Pick<Combatant, 'def'>,
  skillMult: number,
  rng: () => number,
): DamageResult {
  const crit = rng() < attacker.critChance;
  const raw = (attacker.atk * skillMult - defender.def * 0.5) * (crit ? attacker.critMult : 1);
  return { amount: Math.max(1, Math.round(raw)), crit };
}

/** Applies damage, clamps hp at 0. Returns true if the target died from this hit. */
export function applyDamage(target: Combatant, amount: number): boolean {
  if (target.hp <= 0) return false;
  target.hp = Math.max(0, target.hp - amount);
  return target.hp === 0;
}

export function heal(target: Combatant, amount: number): void {
  target.hp = Math.min(target.maxHp, target.hp + amount);
}

export function regenMana(c: Combatant, dtSec: number): void {
  c.mana = Math.min(c.maxMana, c.mana + c.manaRegen * dtSec);
}

export interface SkillCost { id: string; manaCost: number; cooldown: number }

/** Per-entity cooldown tracker on a game clock (seconds). */
export class Cooldowns {
  private readyAt = new Map<string, number>();
  remaining(id: string, now: number): number {
    return Math.max(0, (this.readyAt.get(id) ?? 0) - now);
  }
  isReady(id: string, now: number): boolean {
    return this.remaining(id, now) === 0;
  }
  start(id: string, now: number, duration: number): void {
    this.readyAt.set(id, now + duration);
  }
}

export type CastFailure = 'cooldown' | 'mana' | 'dead';

/** Attempts a cast: checks life, cooldown, mana; spends mana and starts cooldown on success. */
export function tryCast(c: Combatant, cds: Cooldowns, skill: SkillCost, now: number): { ok: true } | { ok: false; reason: CastFailure } {
  if (c.hp <= 0) return { ok: false, reason: 'dead' };
  if (!cds.isReady(skill.id, now)) return { ok: false, reason: 'cooldown' };
  if (c.mana < skill.manaCost) return { ok: false, reason: 'mana' };
  c.mana -= skill.manaCost;
  cds.start(skill.id, now, skill.cooldown);
  return { ok: true };
}
