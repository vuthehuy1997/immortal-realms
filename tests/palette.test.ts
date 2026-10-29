import { describe, expect, it } from 'vitest';
import { applyRamp, lumaRange, rampAt, type Ramp } from '../src/core/palette';

const RAMP: Ramp = [0x000000, 0xff0000, 0xffffff];
describe('palette ramp', () => {
  it('rampAt hits the stops and interpolates between them', () => {
    expect(rampAt(RAMP, 0)).toEqual([0, 0, 0]); expect(rampAt(RAMP, 0.5)).toEqual([255, 0, 0]); expect(rampAt(RAMP, 1)).toEqual([255, 255, 255]);
    expect(rampAt(RAMP, 0.25)[0]).toBeCloseTo(127.5); expect(rampAt(RAMP, 2)).toEqual([255, 255, 255]); expect(rampAt(RAMP, -1)).toEqual([0, 0, 0]);
  });
  it('recolours by luminance, keeps alpha, skips transparent pixels, and is deterministic', () => {
    const px = new Uint8ClampedArray([0, 200, 0, 255, 255, 255, 255, 255, 10, 10, 10, 0, 40, 40, 40, 128]);
    const a = new Uint8ClampedArray(px); applyRamp(a, RAMP, [0, 1], 1);
    expect(a[3]).toBe(255); expect(a[7]).toBe(255); expect(a[11]).toBe(0); expect(a[15]).toBe(128);
    expect([a[4], a[5], a[6]]).toEqual([255, 255, 255]); // brightest -> highlight
    expect([a[8], a[9], a[10]]).toEqual([10, 10, 10]); // transparent untouched
    const b = new Uint8ClampedArray(px); applyRamp(b, RAMP, [0, 1], 1); expect(Array.from(b)).toEqual(Array.from(a));
  });
  it('a green sprite and a blue sprite of the same luminance come out the same colour (identity from the ramp, not the source hue)', () => {
    const px = new Uint8ClampedArray([0, 150, 0, 255, 0, 0, 255, 255]);
    const g = new Uint8ClampedArray(px.slice(0, 4)), b = new Uint8ClampedArray(px.slice(4, 8));
    // equalise luminance: 150*0.59 = 88.5 ; 255*0.11 = 28 -> scale blue up
    b[2] = 255; const l = (p: Uint8ClampedArray) => 0.3 * p[0]! + 0.59 * p[1]! + 0.11 * p[2]!;
    expect(l(g)).toBeGreaterThan(l(b));
    applyRamp(g, RAMP, [0, 0.6], 1); applyRamp(b, RAMP, [0, 0.6], 1);
    for (const p of [g, b]) expect(p[1]).toBeLessThan(p[0]!); // both are reds, none stayed green/blue
  });
  it('mix blends toward the original', () => {
    const a = new Uint8ClampedArray([0, 100, 0, 255]); applyRamp(a, [0xff0000, 0xff0000, 0xff0000], [0, 1], 0.5);
    expect(a[0]).toBe(128); expect(a[1]).toBe(50);
  });
  it('lumaRange ignores outliers and never collapses', () => {
    const px = new Uint8ClampedArray(4 * 100); for (let i = 0; i < 100; i++) { px[i * 4] = px[i * 4 + 1] = px[i * 4 + 2] = 100 + (i % 10); px[i * 4 + 3] = 255; }
    px[0] = px[1] = px[2] = 255;
    const [lo, hi] = lumaRange(px); expect(hi - lo).toBeGreaterThan(0.08); expect(hi).toBeLessThan(0.6);
    expect(lumaRange(new Uint8ClampedArray(8))).toEqual([0, 1]);
  });
});
