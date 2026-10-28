import { describe, expect, it } from 'vitest';
import { HERO_IDS } from '../src/data/heroes';
import { SKILLS, activeKit, kitFor, setKit } from '../src/data/skills';
import { skillLevel, scaledSkill } from '../src/core/skills';

describe('hero technique kits', () => {
  it('every hero keeps the shared slot ids, order, unlock levels and shapes', () => {
    for (const h of HERO_IDS) {
      const kit = kitFor(h);
      expect(kit.map((s) => s.id)).toEqual(SKILLS.map((s) => s.id));
      expect(kit.map((s) => s.unlockLevel)).toEqual(SKILLS.map((s) => s.unlockLevel));
      expect(kit.map((s) => s.shape)).toEqual(SKILLS.map((s) => s.shape));
      for (const s of kit) { expect(s.cooldown).toBeGreaterThan(0); expect(s.damageMult).toBeGreaterThan(0); expect(s.manaCost).toBeGreaterThan(0); }
    }
  });
  it('non-default heroes have their own names for all four techniques', () => {
    const base = SKILLS.map((s) => s.name);
    for (const h of HERO_IDS.filter((x) => x !== 'swordsman')) for (const [i, s] of kitFor(h).entries()) expect(s.name, `${h} slot ${i}`).not.toBe(base[i]);
    expect(new Set(HERO_IDS.flatMap((h) => kitFor(h).map((s) => s.name))).size).toBeGreaterThanOrEqual(HERO_IDS.length * 4 - 3);
  });
  it('hotbar names fit the slot (16 chars)', () => {
    for (const h of HERO_IDS.filter((x) => x !== 'swordsman')) for (const s of kitFor(h)) expect(s.name.length, s.name).toBeLessThanOrEqual(16);
  });
  it('fans have at least two bolts and a spread; burst twists are only on bursts', () => {
    for (const h of HERO_IDS) for (const s of kitFor(h)) {
      if (s.count !== undefined) { expect(s.count).toBeGreaterThan(1); expect(s.spread).toBeGreaterThan(0); expect(['projectile', 'wave']).toContain(s.shape); }
      if (s.heal !== undefined || s.pull) expect(s.shape).toBe('burst');
    }
  });
  it('kits differ in sustained damage output so heroes feel distinct but stay within a band', () => {
    const dps = (h: (typeof HERO_IDS)[number]) => kitFor(h).reduce((a, s) => a + (s.damageMult * (s.count ?? 1) * (s.ticks ?? 1)) / s.cooldown, 0);
    const vals = HERO_IDS.map(dps), lo = Math.min(...vals), hi = Math.max(...vals);
    expect(new Set(vals.map((v) => v.toFixed(2))).size).toBeGreaterThan(3);
    expect(hi / lo).toBeLessThan(1.35);
  });
  it('setKit refills the live kit in place and upgrades scale from the hero numbers', () => {
    setKit('twinblade');
    expect(activeKit[0]!.name).toBe('Twin Daggers');
    expect(scaledSkill(activeKit[0]!, skillLevel({ skills: {} }, 'flying-sword')).damageMult).toBeCloseTo(1.0);
    setKit('swordsman');
    expect(activeKit.map((s) => s.name)).toEqual(SKILLS.map((s) => s.name));
  });
});
