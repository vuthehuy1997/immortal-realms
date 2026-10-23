import Phaser from 'phaser';
import { createNoise } from '../core/noise';
import { createRng } from '../core/rng';
import { TILE_SIZE, type GroundKind, type WorldMap } from '../core/world';

/** Texels per world unit for the baked ground texture. */
export const GROUND_PX = 2;

type RGB = [number, number, number];
const BASE: Record<GroundKind, RGB> = {
  grass: [104, 156, 74], grassDark: [66, 116, 62], moss: [78, 124, 84], path: [182, 146, 102],
  stone: [152, 154, 162], water: [50, 104, 152], sand: [208, 188, 134],
  snow: [226, 234, 244], ice: [150, 200, 226], ash: [96, 92, 98],
};
const LIGHT: Record<GroundKind, RGB> = {
  grass: [138, 190, 92], grassDark: [92, 146, 76], moss: [102, 150, 100], path: [208, 174, 128],
  stone: [182, 184, 192], water: [96, 160, 196], sand: [230, 212, 160],
  snow: [248, 252, 255], ice: [196, 234, 250], ash: [126, 122, 128],
};
const DARK: Record<GroundKind, RGB> = {
  grass: [72, 120, 56], grassDark: [44, 86, 48], moss: [56, 98, 70], path: [150, 116, 80],
  stone: [118, 120, 130], water: [34, 76, 124], sand: [180, 160, 108],
  snow: [190, 206, 226], ice: [108, 162, 204], ash: [68, 64, 72],
};
const KINDS: GroundKind[] = ['grass', 'grassDark', 'moss', 'path', 'stone', 'water', 'sand', 'snow', 'ice', 'ash'];
const KIND_ID = Object.fromEntries(KINDS.map((k, i) => [k, i])) as Record<GroundKind, number>;

const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const hash = (x: number, y: number) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

/**
 * Bakes the whole world floor into one canvas texture: soft blending between neighbouring ground kinds, painterly noise,
 * flagstones in plazas, pebbles on roads and ripples on water. Runs once per world (~0.5-1.5s).
 */
export function bakeGround(scene: Phaser.Scene, world: WorldMap, seed: number): Phaser.Textures.CanvasTexture {
  const W = world.width * TILE_SIZE * GROUND_PX, H = world.height * TILE_SIZE * GROUND_PX;
  const key = 'ground';
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.createCanvas(key, W, H)!;
  const ctx = tex.getContext();
  const img = ctx.createImageData(W, H);
  const d = img.data;
  const noiseA = createNoise(seed ^ 0xa5a5, 256), noiseB = createNoise(seed ^ 0x5a5a, 256);
  const kinds = new Uint8Array(world.width * world.height);
  for (let i = 0; i < kinds.length; i++) kinds[i] = KIND_ID[world.ground[i]!];
  const kindAt = (tx: number, ty: number) => kinds[Math.min(world.height - 1, Math.max(0, ty)) * world.width + Math.min(world.width - 1, Math.max(0, tx))]!;

  // Coarse fields (every STEP texels, bilinearly sampled): domain warp for organic borders + large painterly patches.
  const STEP = 4, CW = Math.ceil(W / STEP) + 2, CH = Math.ceil(H / STEP) + 2;
  const warpX = new Float32Array(CW * CH), warpY = new Float32Array(CW * CH), lfField = new Float32Array(CW * CH);
  for (let cy = 0; cy < CH; cy++) for (let cx = 0; cx < CW; cx++) {
    const wx = (cx * STEP) / GROUND_PX, wy = (cy * STEP) / GROUND_PX, i = cy * CW + cx;
    warpX[i] = (noiseA(wx * 0.05 + 11, wy * 0.05) - 0.5) * 22 + (noiseB(wx * 0.13, wy * 0.13) - 0.5) * 7;
    warpY[i] = (noiseB(wx * 0.05, wy * 0.05 + 23) - 0.5) * 22 + (noiseA(wx * 0.13 + 5, wy * 0.13) - 0.5) * 7;
    lfField[i] = noiseA(wx * 0.045, wy * 0.045) * 0.65 + noiseB(wx * 0.11, wy * 0.11) * 0.35;
  }
  const sample = (f: Float32Array, px: number, py: number) => {
    const gx = px / STEP, gy = py / STEP, x0 = Math.floor(gx), y0 = Math.floor(gy), fx = gx - x0, fy = gy - y0;
    const i = y0 * CW + x0;
    return f[i]! * (1 - fx) * (1 - fy) + f[i + 1]! * fx * (1 - fy) + f[i + CW]! * (1 - fx) * fy + f[i + CW + 1]! * fx * fy;
  };

  for (let py = 0; py < H; py++) {
    for (let px = 0; px < W; px++) {
      const wx = px / GROUND_PX, wy = py / GROUND_PX;
      const sx = wx + sample(warpX, px, py), sy = wy + sample(warpY, px, py); // warped lookup position
      const u = sx / TILE_SIZE - 0.5, v = sy / TILE_SIZE - 0.5;
      const ix = Math.floor(u), iy = Math.floor(v), fx = smooth(0.15, 0.85, u - ix), fy = smooth(0.15, 0.85, v - iy);
      const k00 = kindAt(ix, iy), k10 = kindAt(ix + 1, iy), k01 = kindAt(ix, iy + 1), k11 = kindAt(ix + 1, iy + 1);
      const w00 = (1 - fx) * (1 - fy), w10 = fx * (1 - fy), w01 = (1 - fx) * fy, w11 = fx * fy;
      const dom = w00 >= w10 && w00 >= w01 && w00 >= w11 ? k00 : w10 >= w01 && w10 >= w11 ? k10 : w01 >= w11 ? k01 : k11;
      const kd = KINDS[dom]!;
      let r = 0, g = 0, b = 0;
      for (const [k, w] of [[k00, w00], [k10, w10], [k01, w01], [k11, w11]] as [number, number][]) {
        const c = BASE[KINDS[k]!]; r += c[0] * w; g += c[1] * w; b += c[2] * w;
      }
      const lf = sample(lfField, px, py);
      const hf = hash(px, py); // per-texel grain
      let t = (lf - 0.5) * 1.1 + (hf - 0.5) * 0.3;
      let rim = 0;
      if (kd === 'stone') {
        const row = Math.floor(wy / 16), off = (row & 1) * 12;
        const ssx = (wx + off) % 24, ssy = wy % 16;
        const slab = hash(Math.floor((wx + off) / 24), row);
        t += (slab - 0.5) * 0.32;
        if (ssx < 0.7 || ssy < 0.7) rim = -1; else if (ssx < 1.7 || ssy < 1.7) rim = 0.3;
      } else if (kd === 'path') {
        const pebble = hash(Math.floor(wx * 1.3), Math.floor(wy * 1.3));
        if (pebble > 0.965) t += 0.8; else if (pebble < 0.025) t -= 0.7;
      } else if (kd === 'water') {
        const rip = Math.sin((wx * 0.5 + wy * 0.3) + lf * 9) * 0.5 + Math.sin(wy * 0.7 - wx * 0.2 + lf * 7) * 0.5;
        t = rip * 0.45 + (lf - 0.5) * 0.5; if (rip > 0.9) t += 0.5;
      } else if (kd === 'grass' || kd === 'grassDark' || kd === 'moss') {
        const bl = hash(Math.floor(wx * 1.1), Math.floor(wy * 1.1));
        if (bl > 0.93) t += 0.55; else if (hash(Math.floor(wx * 0.9) + 77, Math.floor(wy * 0.9)) > 0.93) t -= 0.5;
      }
      const lt = LIGHT[kd], dk = DARK[kd], base = BASE[kd];
      const tt = Math.max(-1, Math.min(1, t));
      const pick = tt >= 0 ? lt : dk, a = Math.abs(tt) * 0.8;
      r = r + (pick[0] - base[0]) * a; g = g + (pick[1] - base[1]) * a; b = b + (pick[2] - base[2]) * a;
      if (rim < 0) { r *= 0.62; g *= 0.62; b *= 0.66; } else if (rim > 0) { r += 14; g += 14; b += 14; }
      const o = (py * W + px) * 4;
      d[o] = r; d[o + 1] = g; d[o + 2] = b; d[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  // little flowers on open grass
  const rng = createRng(seed ^ 0xf10e);
  const palette = ['#ffffff', '#ffe27a', '#ff9fbd', '#c8a2ff', '#ff8a6b'];
  for (let i = 0; i < 1800; i++) {
    const tx = Math.floor(rng() * world.width), ty = Math.floor(rng() * world.height);
    const g = world.ground[ty * world.width + tx];
    if (g !== 'grass' && g !== 'grassDark') continue;
    const x = (tx + rng()) * TILE_SIZE * GROUND_PX, y = (ty + rng()) * TILE_SIZE * GROUND_PX;
    ctx.fillStyle = palette[Math.floor(rng() * palette.length)]!;
    ctx.fillRect(x, y, 3, 3); ctx.fillStyle = 'rgba(255,220,80,0.9)'; ctx.fillRect(x + 1, y + 1, 1, 1);
  }
  tex.refresh();
  tex.setFilter(Phaser.Textures.FilterMode.LINEAR);
  return tex;
}
