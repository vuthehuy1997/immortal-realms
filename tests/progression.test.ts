import { describe, expect, it } from 'vitest';
import { addXp, MAX_LEVEL, xpToNext } from '../src/core/progression';
import { deriveStats, validateName } from '../src/core/character';
import { ROOTS } from '../src/data/roots';

describe('progression', () => {
  it('xp curve increases', () => { for (let l = 1; l < 10; l++) expect(xpToNext(l + 1)).toBeGreaterThan(xpToNext(l)); });
  it('levels up and carries remainder', () => {
    const p = { level: 1, xp: 0 };
    expect(addXp(p, xpToNext(1) + 5)).toBe(1);
    expect(p).toEqual({ level: 2, xp: 5 });
  });
  it('handles multiple level-ups in one grant', () => {
    const p = { level: 1, xp: 0 };
    expect(addXp(p, xpToNext(1) + xpToNext(2) + xpToNext(3))).toBe(3);
    expect(p.level).toBe(4);
  });
  it('ignores non-positive xp and caps at max level', () => {
    const p = { level: 1, xp: 0 };
    expect(addXp(p, -50)).toBe(0); expect(p.xp).toBe(0);
    addXp(p, 1e9);
    expect(p.level).toBe(MAX_LEVEL); expect(p.xp).toBe(0);
  });
});

describe('character', () => {
  it('validates names', () => {
    expect(validateName('  Lin   Wei ')).toEqual({ ok: true, name: 'Lin Wei' });
    expect(validateName('   ').ok).toBe(false);
    expect(validateName('x'.repeat(17)).ok).toBe(false);
    expect(validateName('<script>').ok).toBe(false);
    expect(validateName('Nguyễn Văn').ok).toBe(true);
  });
  it('stats grow with level, realm and weapon', () => {
    const a = deriveStats('flame', 1, 0, null), b = deriveStats('flame', 5, 0, null), c = deriveStats('flame', 5, 1, null), d = deriveStats('flame', 5, 1, 'iron-sword');
    expect(b.maxHp).toBeGreaterThan(a.maxHp); expect(c.maxHp).toBeGreaterThan(b.maxHp); expect(d.atk).toBe(c.atk + 4);
  });
  it('roots differ meaningfully', () => {
    const f = deriveStats('flame', 1, 0, null), t = deriveStats('tide', 1, 0, null), v = deriveStats('verdant', 1, 0, null);
    expect(f.atk).toBeGreaterThan(t.atk); expect(t.maxMana).toBeGreaterThan(f.maxMana); expect(v.maxHp).toBeGreaterThan(f.maxHp);
    expect(Object.keys(ROOTS)).toHaveLength(3);
  });
});
