/**
 * Palette ramps for recoloured sprites. A plain multiply-tint cannot turn a green dragon into a sand wyrm; a gradient map can: every pixel's
 * luminance (stretched over the sprite's own range) picks a colour from a 3-stop ramp [shadow, mid, highlight], blended with the original by `mix`.
 * Pure: works on RGBA byte arrays, so it is unit-tested without a canvas.
 */
export type Ramp = [number, number, number];

const lum = (r: number, g: number, b: number): number => (0.3 * r + 0.59 * g + 0.11 * b) / 255;
const ch = (c: number, s: number): number => (c >> s) & 255;

/** 2nd and 98th percentile of the luminance of the visible pixels (so one stray white pixel does not flatten the ramp). */
export function lumaRange(rgba: Uint8ClampedArray | Uint8Array, alphaMin = 40): [number, number] {
  const hist = new Uint32Array(256); let n = 0;
  for (let i = 0; i < rgba.length; i += 4) if (rgba[i + 3]! >= alphaMin) { hist[Math.min(255, Math.round(lum(rgba[i]!, rgba[i + 1]!, rgba[i + 2]!) * 255))]!++; n++; }
  if (!n) return [0, 1];
  let acc = 0, lo = 0, hi = 255;
  for (let v = 0; v < 256; v++) { acc += hist[v]!; if (acc >= n * 0.02) { lo = v; break; } }
  acc = 0;
  for (let v = 255; v >= 0; v--) { acc += hist[v]!; if (acc >= n * 0.02) { hi = v; break; } }
  if (hi - lo < 24) { lo = Math.max(0, lo - 12); hi = Math.min(255, hi + 12); }
  return [lo / 255, hi / 255];
}

/** The ramp colour for a stretched luminance t in 0..1 (piecewise linear through the 3 stops). */
export function rampAt(ramp: Ramp, t: number): [number, number, number] {
  const k = Math.min(1, Math.max(0, t)) * 2, i = Math.min(1, Math.floor(k)), f = k - i, a = ramp[i]!, b = ramp[i + 1]!;
  return [ch(a, 16) + (ch(b, 16) - ch(a, 16)) * f, ch(a, 8) + (ch(b, 8) - ch(a, 8)) * f, ch(a, 0) + (ch(b, 0) - ch(a, 0)) * f];
}

/** Recolours `rgba` in place. Alpha is untouched. */
export function applyRamp(rgba: Uint8ClampedArray | Uint8Array, ramp: Ramp, range: [number, number], mix = 0.85): void {
  const span = Math.max(1e-3, range[1] - range[0]);
  for (let i = 0; i < rgba.length; i += 4) {
    if (rgba[i + 3] === 0) continue;
    const r = rgba[i]!, g = rgba[i + 1]!, b = rgba[i + 2]!;
    const [mr, mg, mb] = rampAt(ramp, (lum(r, g, b) - range[0]) / span);
    rgba[i] = Math.round(r + (mr - r) * mix); rgba[i + 1] = Math.round(g + (mg - g) * mix); rgba[i + 2] = Math.round(b + (mb - b) * mix);
  }
}
