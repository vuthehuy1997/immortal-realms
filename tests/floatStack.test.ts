import { describe, expect, it } from 'vitest';
import { FLOAT_LIFE_MS, placeFloat, type FloatSlot } from '../src/core/floatStack';

describe('floating number layout (B2)', () => {
  it('numbers spawned at the same spot rise into separate rows', () => {
    const s: FloatSlot[] = [];
    const ys = [0, 1, 2, 3].map(() => placeFloat(s, 100, 50, 1000));
    expect(new Set(ys).size).toBe(4);
    for (let i = 1; i < ys.length; i++) expect(ys[i - 1]! - ys[i]!).toBeGreaterThanOrEqual(8);
  });
  it('far-apart numbers keep their own height and old ones expire', () => {
    const s: FloatSlot[] = [];
    expect(placeFloat(s, 0, 50, 0)).toBe(50);
    expect(placeFloat(s, 200, 50, 10)).toBe(50);
    expect(placeFloat(s, 0, 50, FLOAT_LIFE_MS + 5)).toBe(50);
    expect(s.length).toBe(2);
  });
  it('stack height is bounded', () => {
    const s: FloatSlot[] = [];
    const ys = Array.from({ length: 30 }, () => placeFloat(s, 5, 50, 0));
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(50 - 8 * 6);
  });
});
