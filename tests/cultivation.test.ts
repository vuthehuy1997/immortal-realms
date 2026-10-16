import { describe, expect, it } from 'vitest';
import { addQi, attemptBreakthrough, canBreakthrough, meditate, qiMax } from '../src/core/cultivation';
import { REALMS } from '../src/data/realms';

describe('cultivation', () => {
  it('meditation accrues qi up to the cap', () => {
    const c = { realm: 0, qi: 0 };
    meditate(c, 1); expect(c.qi).toBeCloseTo(12);
    meditate(c, 1000); expect(c.qi).toBe(qiMax(c));
  });
  it('cannot break through before qi is full', () => {
    const c = { realm: 0, qi: 10 };
    expect(attemptBreakthrough(c, () => 0)).toEqual({ ok: false, reason: 'not-ready' });
    expect(c.realm).toBe(0);
  });
  it('success advances realm and resets qi', () => {
    const c = { realm: 0, qi: qiMax({ realm: 0, qi: 0 }) };
    expect(canBreakthrough(c)).toBe(true);
    expect(attemptBreakthrough(c, () => 0.1)).toEqual({ ok: true, success: true });
    expect(c).toEqual({ realm: 1, qi: 0 });
  });
  it('failure halves qi and keeps realm', () => {
    const c = { realm: 0, qi: 100 };
    expect(attemptBreakthrough(c, () => 0.99)).toEqual({ ok: true, success: false });
    expect(c).toEqual({ realm: 0, qi: 50 });
  });
  it('bonus raises the odds; chance is clamped to 95%', () => {
    expect(attemptBreakthrough({ realm: 0, qi: 100 }, () => 0.7, 0.2)).toEqual({ ok: true, success: true });
    expect(attemptBreakthrough({ realm: 0, qi: 100 }, () => 0.96, 5)).toEqual({ ok: true, success: false });
  });
  it('final slice realm cannot break through', () => {
    const last = REALMS.length - 1;
    const c = { realm: last, qi: REALMS[last]!.qiMax };
    expect(attemptBreakthrough(c, () => 0)).toEqual({ ok: false, reason: 'max-realm' });
  });
  it('qi never goes negative', () => { const c = { realm: 0, qi: 5 }; addQi(c, -50); expect(c.qi).toBe(0); });
});
