import { describe, expect, it } from 'vitest';
import { applyDamage, computeDamage, Cooldowns, heal, regenMana, tryCast, type Combatant } from '../src/core/combat';
import { SKILLS } from '../src/data/skills';

const mk = (o: Partial<Combatant> = {}): Combatant => ({ hp: 100, maxHp: 100, mana: 50, maxMana: 50, atk: 10, def: 4, critChance: 0, critMult: 2, manaRegen: 2, ...o });

describe('computeDamage', () => {
  it('uses (atk*mult - def/2), rounded', () => {
    expect(computeDamage(mk({ atk: 10 }), { def: 4 }, 1.5, () => 0.99).amount).toBe(13); // 15-2
  });
  it('never deals less than 1', () => {
    expect(computeDamage(mk({ atk: 1 }), { def: 999 }, 1, () => 0.99).amount).toBe(1);
  });
  it('crit multiplies and is rng-driven', () => {
    const a = mk({ atk: 10, critChance: 0.5, critMult: 2 });
    expect(computeDamage(a, { def: 0 }, 1, () => 0.4)).toEqual({ amount: 20, crit: true });
    expect(computeDamage(a, { def: 0 }, 1, () => 0.5)).toEqual({ amount: 10, crit: false });
  });
});

describe('hp & mana', () => {
  it('clamps hp at 0 and reports kill once', () => {
    const t = mk({ hp: 5 });
    expect(applyDamage(t, 99)).toBe(true);
    expect(t.hp).toBe(0);
    expect(applyDamage(t, 10)).toBe(false);
  });
  it('heal and mana regen clamp to max', () => {
    const t = mk({ hp: 95, mana: 49.5 });
    heal(t, 50); regenMana(t, 10);
    expect(t.hp).toBe(100);
    expect(t.mana).toBe(50);
  });
});

describe('tryCast / cooldowns', () => {
  const bolt = SKILLS.find((s) => s.id === 'flying-sword')!;
  it('spends mana and enforces cooldown', () => {
    const c = mk({ mana: 20 }); const cd = new Cooldowns();
    expect(tryCast(c, cd, bolt, 0)).toEqual({ ok: true });
    expect(c.mana).toBe(12);
    expect(tryCast(c, cd, bolt, 0.5)).toEqual({ ok: false, reason: 'cooldown' });
    expect(cd.remaining(bolt.id, 0.5)).toBeCloseTo(bolt.cooldown - 0.5);
    expect(tryCast(c, cd, bolt, bolt.cooldown)).toEqual({ ok: true });
  });
  it('fails without mana and does not start cooldown', () => {
    const c = mk({ mana: 1 }); const cd = new Cooldowns();
    expect(tryCast(c, cd, bolt, 0)).toEqual({ ok: false, reason: 'mana' });
    expect(cd.isReady(bolt.id, 0)).toBe(true);
  });
  it('dead entities cannot cast', () => {
    expect(tryCast(mk({ hp: 0 }), new Cooldowns(), bolt, 0)).toEqual({ ok: false, reason: 'dead' });
  });
});

describe('skill data', () => {
  it('has four valid techniques with unique ids and rising unlock levels', () => {
    expect(SKILLS).toHaveLength(4);
    expect(new Set(SKILLS.map((s) => s.id)).size).toBe(4);
    for (let i = 1; i < SKILLS.length; i++) expect(SKILLS[i]!.unlockLevel).toBeGreaterThanOrEqual(SKILLS[i - 1]!.unlockLevel);
    expect(new Set(SKILLS.map((s) => s.shape)).size).toBe(4);
    for (const s of SKILLS) { expect(s.cooldown).toBeGreaterThan(0); expect(s.damageMult).toBeGreaterThan(0); expect(s.manaCost).toBeGreaterThanOrEqual(0); }
  });
});
