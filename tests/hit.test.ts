import { describe, expect, it } from 'vitest';
import { inArc, inCircle, stepProjectile, normalize } from '../src/core/hit';

const O = { x: 0, y: 0 };
describe('inArc', () => {
  const half = Math.PI / 3;
  it('hits targets in front within range', () => { expect(inArc(O, { x: 1, y: 0 }, 26, half, { x: 20, y: 5 })).toBe(true); });
  it('misses targets behind', () => { expect(inArc(O, { x: 1, y: 0 }, 26, half, { x: -20, y: 0 })).toBe(false); });
  it('misses targets out of range', () => { expect(inArc(O, { x: 1, y: 0 }, 26, half, { x: 40, y: 0 })).toBe(false); });
  it('target radius extends reach', () => { expect(inArc(O, { x: 1, y: 0 }, 26, half, { x: 32, y: 0 }, 7)).toBe(true); });
  it('misses outside the cone angle', () => { expect(inArc(O, { x: 1, y: 0 }, 26, half, { x: 1, y: 20 })).toBe(false); });
  it('aim need not be normalised', () => { expect(inArc(O, { x: 50, y: 0 }, 26, half, { x: 20, y: 0 })).toBe(true); });
});
describe('inCircle / normalize / projectile', () => {
  it('circle test', () => { expect(inCircle(O, 10, { x: 8, y: 0 })).toBe(true); expect(inCircle(O, 10, { x: 12, y: 0 })).toBe(false); expect(inCircle(O, 10, { x: 12, y: 0 }, 3)).toBe(true); });
  it('normalize zero vector falls back to +x', () => { expect(normalize({ x: 0, y: 0 })).toEqual({ x: 1, y: 0 }); });
  it('projectile expires after max distance', () => {
    const p = { pos: { x: 0, y: 0 }, vel: { x: 100, y: 0 }, traveled: 0, maxDist: 150 };
    expect(stepProjectile(p, 1)).toBe(true);
    expect(stepProjectile(p, 1)).toBe(false);
    expect(p.pos.x).toBe(200);
  });
});
