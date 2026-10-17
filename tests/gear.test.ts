import { describe, expect, it } from 'vitest';
import { deriveStats } from '../src/core/character';
import { newGameState, statsOf, tryBreakthrough, unequipSlot, WARDEN_ID, registerKill } from '../src/core/gameState';
import { addItem, countOf, equipFromSlot } from '../src/core/inventory';
import { freePoints, scaledSkill, SKILL_MAX, skillLevel, totalPoints, upgradeSkill } from '../src/core/skills';
import { qiMax } from '../src/core/cultivation';
import { ITEMS } from '../src/data/items';
import { SKILLS } from '../src/data/skills';

const mk = () => newGameState('Gear', 'verdant', 'saber', { x: 0, y: 0 });

describe('three equipment slots', () => {
  it('armor adds defence and HP, charms add crit/mana/regen/attack, weapons add attack', () => {
    const base = deriveStats('flame', 5, 0, { weapon: null, armor: null, charm: null });
    const dressed = deriveStats('flame', 5, 0, { weapon: 'steel-blade', armor: 'sect-robe', charm: 'tiger-fang' });
    expect(dressed.def).toBe(base.def + 7); expect(dressed.maxHp).toBe(base.maxHp + 30);
    expect(dressed.atk).toBe(base.atk + 7 + 5); expect(dressed.critChance).toBeCloseTo(base.critChance + 0.04);
    const ring = deriveStats('flame', 5, 0, { charm: 'spirit-ring' });
    expect(ring.maxMana).toBe(base.maxMana + 25); expect(ring.manaRegen).toBeCloseTo(base.manaRegen + 1.5);
  });
  it('a bare weapon id still works (older call sites)', () => {
    expect(deriveStats('flame', 1, 0, 'iron-sword').atk).toBe(deriveStats('flame', 1, 0, null).atk + 4);
  });
  it('every equipment item declares a slot-appropriate bonus', () => {
    for (const d of Object.values(ITEMS).filter((i) => i.type === 'equipment')) {
      const slot = d.slot ?? 'weapon';
      if (slot === 'weapon') expect(d.weaponAtk, d.id).toBeGreaterThan(0);
      if (slot === 'armor') expect((d.defBonus ?? 0) + (d.hpBonus ?? 0), d.id).toBeGreaterThan(0);
      if (slot === 'charm') expect((d.critBonus ?? 0) + (d.manaBonus ?? 0) + (d.regenBonus ?? 0) + (d.atkBonus ?? 0), d.id).toBeGreaterThan(0);
    }
  });
  it('equipping goes to the right slot and swaps with what was there', () => {
    const gs = mk(); addItem(gs.inventory, 'cloth-robe', 1); addItem(gs.inventory, 'sect-robe', 1); addItem(gs.inventory, 'jade-pendant', 1);
    const idx = (id: string) => gs.inventory.slots.findIndex((s) => s?.id === id);
    expect(equipFromSlot(gs.inventory, idx('cloth-robe'))).toBe(true);
    expect(gs.inventory.armor).toBe('cloth-robe');
    expect(equipFromSlot(gs.inventory, idx('sect-robe'))).toBe(true);
    expect(gs.inventory.armor).toBe('sect-robe'); expect(countOf(gs.inventory, 'cloth-robe')).toBe(1);
    expect(equipFromSlot(gs.inventory, idx('jade-pendant'))).toBe(true);
    expect(gs.inventory.charm).toBe('jade-pendant'); expect(gs.inventory.weapon).toBeNull();
    const withGear = statsOf(gs).def;
    expect(unequipSlot(gs, 'armor')).toBe(true);
    expect(statsOf(gs).def).toBeLessThan(withGear);
  });
  it('unequip fails without changes when the bag is full', () => {
    const gs = mk(); gs.inventory.armor = 'cloth-robe'; gs.inventory.slots.fill({ id: 'iron-sword', count: 1 });
    expect(unequipSlot(gs, 'armor')).toBe(false); expect(gs.inventory.armor).toBe('cloth-robe');
  });
  it('the final boss drops epic armour too', () => {
    const gs = mk(); registerKill(gs, WARDEN_ID, () => 0);
    expect(countOf(gs.inventory, 'immortal-mantle')).toBe(1);
  });
});

describe('skill upgrades', () => {
  it('points come from levels and realms; upgrades cost points, respect unlock level and the cap', () => {
    const gs = mk(); expect(totalPoints(gs)).toBe(0);
    expect(upgradeSkill(gs, 'flying-sword')).toEqual({ ok: false, reason: 'points' });
    gs.progress.level = 4; expect(freePoints(gs)).toBe(3);
    expect(upgradeSkill(gs, 'sword-rain')).toEqual({ ok: false, reason: 'locked' });
    expect(upgradeSkill(gs, 'flying-sword')).toEqual({ ok: true });
    expect(skillLevel(gs, 'flying-sword')).toBe(2); expect(freePoints(gs)).toBe(2);
    gs.progress.level = 20; gs.cultivation.realm = 2;
    while (upgradeSkill(gs, 'moon-arc').ok) { /* spend until capped */ }
    expect(skillLevel(gs, 'moon-arc')).toBe(SKILL_MAX);
    expect(upgradeSkill(gs, 'moon-arc')).toEqual({ ok: false, reason: 'max' });
    expect(upgradeSkill(gs, 'nope')).toEqual({ ok: false, reason: 'unknown' });
  });
  it('higher skill levels hit harder and recharge faster (and lotus stuns longer)', () => {
    for (const d of SKILLS) {
      const a = scaledSkill(d, 1), b = scaledSkill(d, SKILL_MAX);
      expect(a.damageMult).toBeCloseTo(d.damageMult);
      expect(b.damageMult).toBeGreaterThan(a.damageMult * 1.5); expect(b.cooldown).toBeLessThan(a.cooldown);
      if (d.stun) expect(b.stun).toBeGreaterThan(a.stun);
    }
  });
});

describe('breakthrough needs a Foundation Pill', () => {
  const ready = () => { const gs = mk(); gs.progress.level = 6; gs.cultivation.qi = qiMax(gs.cultivation); return gs; };
  it('without a pill nothing is spent and the realm does not change', () => {
    const gs = ready(); const snap = JSON.stringify(gs);
    expect(tryBreakthrough(gs, () => 0)).toEqual({ ok: false, reason: 'no-pill' });
    expect(JSON.stringify(gs)).toBe(snap);
  });
  it('the pill is consumed on success AND on failure', () => {
    const win = ready(); addItem(win.inventory, 'foundation-pill', 2);
    expect(tryBreakthrough(win, () => 0.1)).toEqual({ ok: true, success: true });
    expect(win.cultivation.realm).toBe(1); expect(countOf(win.inventory, 'foundation-pill')).toBe(1);
    const lose = ready(); addItem(lose.inventory, 'foundation-pill', 1);
    expect(tryBreakthrough(lose, () => 0.99)).toEqual({ ok: true, success: false });
    expect(countOf(lose.inventory, 'foundation-pill')).toBe(0); expect(lose.cultivation.realm).toBe(0);
  });
  it('level and qi gates are reported before the pill is touched', () => {
    const gs = mk(); addItem(gs.inventory, 'foundation-pill', 1);
    expect(tryBreakthrough(gs, () => 0)).toEqual({ ok: false, reason: 'not-ready' });
    gs.cultivation.qi = qiMax(gs.cultivation);
    expect(tryBreakthrough(gs, () => 0)).toEqual({ ok: false, reason: 'level' });
    expect(countOf(gs.inventory, 'foundation-pill')).toBe(1);
  });
});
