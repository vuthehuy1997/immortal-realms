import { describe, expect, it } from 'vitest';
import { FLASK_HEAL_PCT, FLASK_MAX, KILLS_PER_CHARGE, MANA_ON_FINISHER, MANA_ON_HIT, flaskOnKill, manaOnSwing, newFlask, refillFlask, useFlask, validFlask } from '../src/core/sustain';
import { newGameState, registerKill } from '../src/core/gameState';
import { parseSave, serialize, checksum } from '../src/core/save';

describe('spirit flask', () => {
  it('starts full and heals a percentage of max HP, scaling with the character', () => {
    const f = newFlask(); expect(f.charges).toBe(FLASK_MAX);
    expect(useFlask(f, 10, 200)).toBe(Math.round(200 * FLASK_HEAL_PCT));
    expect(useFlask(f, 10, 1000)).toBe(Math.round(1000 * FLASK_HEAL_PCT));
    expect(f.charges).toBe(FLASK_MAX - 2);
  });
  it('never overheals, and a full-health use costs nothing', () => {
    const f = newFlask();
    expect(useFlask(f, 190, 200)).toBe(10);
    expect(useFlask(f, 200, 200)).toBeNull(); expect(f.charges).toBe(FLASK_MAX - 1);
  });
  it('is empty after its charges and refills with kills or at a hub', () => {
    const f = newFlask(); for (let i = 0; i < FLASK_MAX; i++) useFlask(f, 1, 100);
    expect(useFlask(f, 1, 100)).toBeNull();
    for (let i = 0; i < KILLS_PER_CHARGE - 1; i++) expect(flaskOnKill(f)).toBe(false);
    expect(flaskOnKill(f)).toBe(true); expect(f.charges).toBe(1);
    refillFlask(f); expect(f).toEqual({ charges: FLASK_MAX, kills: 0 });
  });
  it('kills do not bank progress while the flask is full', () => {
    const f = newFlask(); for (let i = 0; i < 20; i++) flaskOnKill(f);
    expect(f).toEqual({ charges: FLASK_MAX, kills: 0 });
  });
  it('registerKill feeds the flask', () => {
    const gs = newGameState('T', 'flame', 'swordsman', { x: 0, y: 0 }); gs.flask.charges = 0;
    for (let i = 0; i < KILLS_PER_CHARGE; i++) registerKill(gs, 'wolf', () => 0.99);
    expect(gs.flask.charges).toBe(1);
  });
  it('validation rejects out-of-range flasks', () => {
    expect(validFlask({ charges: 2, kills: 3 })).toBe(true);
    for (const bad of [null, {}, { charges: -1, kills: 0 }, { charges: FLASK_MAX + 1, kills: 0 }, { charges: 1, kills: KILLS_PER_CHARGE }, { charges: 1.5, kills: 0 }]) expect(validFlask(bad)).toBe(false);
  });
  it('is saved, restored, and added to older saves', () => {
    const g = newGameState('T', 'flame', 'swordsman', { x: 5, y: 5 }); g.flask = { charges: 1, kills: 2 };
    const r = parseSave(serialize(g)); expect(r.ok && r.state.flask).toEqual({ charges: 1, kills: 2 });
    const old = JSON.parse(JSON.stringify(g)) as Record<string, unknown>; delete old.flask;
    const o = parseSave(JSON.stringify({ version: 4, savedAt: 1, checksum: checksum(JSON.stringify(old)), state: old }));
    expect(o.ok && o.state.flask).toEqual(newFlask());
    g.flask = { charges: 9, kills: 0 }; expect(parseSave(serialize(g)).ok).toBe(false);
  });
});

describe('mana from sword hits', () => {
  it('the finisher refunds more than a normal hit', () => {
    expect(manaOnSwing(false)).toBe(MANA_ON_HIT); expect(manaOnSwing(true)).toBe(MANA_ON_FINISHER);
    expect(MANA_ON_FINISHER).toBeGreaterThan(MANA_ON_HIT);
  });
  it('a full combo (2 hits + finisher) pays for a Flying Sword Art cast', () => {
    expect(MANA_ON_HIT * 2 + MANA_ON_FINISHER).toBeGreaterThanOrEqual(8 + 4);
  });
});
