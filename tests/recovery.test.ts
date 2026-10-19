import { describe, expect, it } from 'vitest';
import { deathTax, hpRegenPerSec } from '../src/core/recovery';

describe('recovery', () => {
  it('heals only after a quiet period, faster on the array', () => {
    expect(hpRegenPerSec(100, 3, false)).toBe(0);
    expect(hpRegenPerSec(100, 7, false)).toBeGreaterThan(0);
    expect(hpRegenPerSec(100, 2.5, true)).toBeGreaterThan(hpRegenPerSec(100, 7, false));
    expect(hpRegenPerSec(100, 0.5, true)).toBe(0);
  });
  it('death tax is at least 15 but never more than carried', () => {
    expect(deathTax(0)).toBe(0); expect(deathTax(8)).toBe(8); expect(deathTax(50)).toBe(15); expect(deathTax(1000)).toBe(100);
  });
});
