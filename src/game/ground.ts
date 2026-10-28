import Phaser from 'phaser';
import { createNoise } from '../core/noise';
import { createRng } from '../core/rng';
import { TILE_SIZE, type GroundKind, type WorldMap } from '../core/world';

/** Texels per world unit for the baked ground texture. */
export const GROUND_PX = 2;
/** Chunk edge in tiles: 32 tiles = 1024 texels, small enough for any GPU and cheap to bake one at a time. */
export const CHUNK_TILES = 32;
const CHUNK_PX = CHUNK_TILES * TILE_SIZE * GROUND_PX;
const CHUNK_WORLD = CHUNK_TILES * TILE_SIZE;
/** Texels of overlap around each chunk so bilinear filtering never shows a seam. */
const PAD = 2;
const CANVAS_PX = CHUNK_PX + PAD * 2;

export interface ViewRect { x: number; y: number; width: number; height: number }
type RGB = [number, number, number];
const BASE: Record<GroundKind, RGB> = {
  grass: [104, 156, 74], grassDark: [66, 116, 62], moss: [78, 124, 84], path: [182, 146, 102],
  stone: [152, 154, 162], water: [50, 104, 152], sand: [208, 188, 134],
  snow: [226, 234, 244], ice: [150, 200, 226], ash: [96, 92, 98],
  lava: [196, 66, 26], cloud: [168, 166, 206], jade: [92, 164, 138], crimson: [124, 50, 58], clay: [194, 132, 86], basalt: [72, 68, 82],
  wall: [46, 40, 42], void: [20, 18, 48],
};
const LIGHT: Record<GroundKind, RGB> = {
  grass: [138, 190, 92], grassDark: [92, 146, 76], moss: [102, 150, 100], path: [208, 174, 128],
  stone: [182, 184, 192], water: [96, 160, 196], sand: [230, 212, 160],
  snow: [248, 252, 255], ice: [196, 234, 250], ash: [126, 122, 128],
  lava: [255, 160, 56], cloud: [206, 204, 240], jade: [140, 212, 178], crimson: [170, 84, 84], clay: [226, 168, 114], basalt: [104, 100, 118],
  wall: [70, 62, 62], void: [46, 40, 90],
};
const DARK: Record<GroundKind, RGB> = {
  grass: [72, 120, 56], grassDark: [44, 86, 48], moss: [56, 98, 70], path: [150, 116, 80],
  stone: [118, 120, 130], water: [34, 76, 124], sand: [180, 160, 108],
  snow: [190, 206, 226], ice: [108, 162, 204], ash: [68, 64, 72],
  lava: [108, 26, 14], cloud: [118, 114, 168], jade: [54, 116, 98], crimson: [84, 30, 44], clay: [148, 96, 58], basalt: [46, 44, 58],
  wall: [26, 22, 26], void: [10, 8, 26],
};
const KINDS: GroundKind[] = ['grass', 'grassDark', 'moss', 'path', 'stone', 'water', 'sand', 'snow', 'ice', 'ash', 'lava', 'cloud', 'jade', 'crimson', 'clay', 'basalt', 'wall', 'void'];
const KIND_ID = Object.fromEntries(KINDS.map((k, i) => [k, i])) as Record<GroundKind, number>;

const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const hash = (x: number, y: number) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

const STEP = 4;
const CW = Math.ceil(CANVAS_PX / STEP) + 2;

/**
 * The world floor, painted in 32x32-tile chunks that are baked on demand and freed when the camera leaves.
 * A chunk is computed in row slices (see `bake`), so walking into new ground never stalls a frame.
 * Soft blending between ground kinds, painterly noise, flagstones in plazas, pebbles on roads, ripples on water.
 */
export class GroundChunks {
  private readonly cols: number;
  private readonly rows: number;
  private readonly kinds: Uint8Array;
  private readonly noiseA: (x: number, y: number) => number;
  private readonly noiseB: (x: number, y: number) => number;
  private readonly images = new Map<number, Phaser.GameObjects.Image>();
  private job: { id: number; gen: Generator<void> } | null = null;
  private wanted: number[] = [];

  constructor(private readonly scene: Phaser.Scene, private readonly world: WorldMap, private readonly seed: number) {
    this.cols = Math.ceil(world.width / CHUNK_TILES); this.rows = Math.ceil(world.height / CHUNK_TILES);
    this.noiseA = createNoise(seed ^ 0xa5a5, 256); this.noiseB = createNoise(seed ^ 0x5a5a, 256);
    this.kinds = new Uint8Array(world.width * world.height);
    for (let i = 0; i < this.kinds.length; i++) this.kinds[i] = KIND_ID[world.ground[i]!];
  }

  private key(id: number): string { return `ground_${id}`; }
  private kindAt(tx: number, ty: number): number {
    const w = this.world;
    return this.kinds[Math.min(w.height - 1, Math.max(0, ty)) * w.width + Math.min(w.width - 1, Math.max(0, tx))]!;
  }

  /** Chunk ids touching a world-space rectangle grown by `pad` units. */
  private chunksIn(x: number, y: number, w: number, h: number, pad: number): number[] {
    const c0 = Math.max(0, Math.floor((x - pad) / CHUNK_WORLD)), c1 = Math.min(this.cols - 1, Math.floor((x + w + pad) / CHUNK_WORLD));
    const r0 = Math.max(0, Math.floor((y - pad) / CHUNK_WORLD)), r1 = Math.min(this.rows - 1, Math.floor((y + h + pad) / CHUNK_WORLD));
    const out: number[] = [];
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) out.push(r * this.cols + c);
    return out;
  }

  /** Bakes every chunk the camera can see right now, synchronously (call once when the scene starts). */
  prime(v: ViewRect): void {
    for (const id of this.chunksIn(v.x, v.y, v.width, v.height, CHUNK_WORLD * 0.6)) if (!this.images.has(id)) { const g = this.bake(id); while (!g.next().done); }
  }

  /** Per frame: queue chunks around the camera, bake for at most `budgetMs`, drop chunks that are far away. */
  update(v: ViewRect, budgetMs = 4): void {
    for (const id of this.chunksIn(v.x, v.y, v.width, v.height, 0)) if (!this.images.has(id)) { if (this.job?.id === id) this.job = null; const g = this.bake(id); while (!g.next().done); } // a teleport or restart: never show bare ground
    this.wanted = this.chunksIn(v.x, v.y, v.width, v.height, CHUNK_WORLD * 0.6);
    const keep = new Set(this.chunksIn(v.x, v.y, v.width, v.height, CHUNK_WORLD * 1.6));
    for (const [id, img] of this.images) if (!keep.has(id)) { img.destroy(); this.scene.textures.remove(this.key(id)); this.images.delete(id); }
    const t0 = performance.now();
    while (performance.now() - t0 < budgetMs) {
      if (!this.job) {
        const id = this.wanted.find((c) => !this.images.has(c));
        if (id === undefined) return;
        this.job = { id, gen: this.bake(id) };
      }
      if (this.job.gen.next().done) this.job = null;
    }
  }

  get residentChunks(): number { return this.images.size; }

  destroy(): void {
    for (const [id, img] of this.images) { img.destroy(); this.scene.textures.remove(this.key(id)); }
    this.images.clear(); this.job = null;
  }

  /** Paints one chunk; yields every 64 rows so the caller can spread the work over frames. */
  private *bake(id: number): Generator<void> {
    const cx = id % this.cols, cy = Math.floor(id / this.cols), w = this.world;
    const ox = cx * CHUNK_PX - PAD, oy = cy * CHUNK_PX - PAD; // absolute texel origin of the padded canvas
    const { noiseA, noiseB } = this;

    // coarse fields (every STEP texels, bilinearly sampled): domain warp for organic borders + large painterly patches
    const warpX = new Float32Array(CW * CW), warpY = new Float32Array(CW * CW), lfField = new Float32Array(CW * CW);
    for (let gy = 0; gy < CW; gy++) for (let gx = 0; gx < CW; gx++) {
      const wx = (ox + gx * STEP) / GROUND_PX, wy = (oy + gy * STEP) / GROUND_PX, i = gy * CW + gx;
      warpX[i] = (noiseA(wx * 0.05 + 11, wy * 0.05) - 0.5) * 22 + (noiseB(wx * 0.13, wy * 0.13) - 0.5) * 7;
      warpY[i] = (noiseB(wx * 0.05, wy * 0.05 + 23) - 0.5) * 22 + (noiseA(wx * 0.13 + 5, wy * 0.13) - 0.5) * 7;
      lfField[i] = noiseA(wx * 0.045, wy * 0.045) * 0.65 + noiseB(wx * 0.11, wy * 0.11) * 0.35;
    }
    const sample = (f: Float32Array, px: number, py: number) => {
      const gx = px / STEP, gy = py / STEP, x0 = Math.floor(gx), y0 = Math.floor(gy), fx = gx - x0, fy = gy - y0;
      const i = y0 * CW + x0;
      return f[i]! * (1 - fx) * (1 - fy) + f[i + 1]! * fx * (1 - fy) + f[i + CW]! * (1 - fx) * fy + f[i + CW + 1]! * fx * fy;
    };

    const key = this.key(id);
    if (this.scene.textures.exists(key)) this.scene.textures.remove(key);
    const tex = this.scene.textures.createCanvas(key, CANVAS_PX, CANVAS_PX)!;
    const ctx = tex.getContext();
    const img = ctx.createImageData(CANVAS_PX, CANVAS_PX);
    const d = img.data;

    for (let py = 0; py < CANVAS_PX; py++) {
      for (let px = 0; px < CANVAS_PX; px++) {
        const ax = ox + px, ay = oy + py;
        const wx = ax / GROUND_PX, wy = ay / GROUND_PX;
        const sx = wx + sample(warpX, px, py), sy = wy + sample(warpY, px, py); // warped lookup position
        const u = sx / TILE_SIZE - 0.5, v = sy / TILE_SIZE - 0.5;
        const ix = Math.floor(u), iy = Math.floor(v), fx = smooth(0.15, 0.85, u - ix), fy = smooth(0.15, 0.85, v - iy);
        const k00 = this.kindAt(ix, iy), k10 = this.kindAt(ix + 1, iy), k01 = this.kindAt(ix, iy + 1), k11 = this.kindAt(ix + 1, iy + 1);
        const w00 = (1 - fx) * (1 - fy), w10 = fx * (1 - fy), w01 = (1 - fx) * fy, w11 = fx * fy;
        const dom = w00 >= w10 && w00 >= w01 && w00 >= w11 ? k00 : w10 >= w01 && w10 >= w11 ? k10 : w01 >= w11 ? k01 : k11;
        const kd = KINDS[dom]!;
        let r = 0, g = 0, b = 0;
        for (const [k, wt] of [[k00, w00], [k10, w10], [k01, w01], [k11, w11]] as [number, number][]) {
          const c = BASE[KINDS[k]!]; r += c[0] * wt; g += c[1] * wt; b += c[2] * wt;
        }
        const lf = sample(lfField, px, py);
        const hf = hash(ax, ay); // per-texel grain
        let t = (lf - 0.5) * 1.1 + (hf - 0.5) * 0.3;
        let rim = 0;
        if (kd === 'stone') {
          const row = Math.floor(wy / 16), off = (row & 1) * 12;
          const ssx = (wx + off) % 24, ssy = wy % 16;
          const slab = hash(Math.floor((wx + off) / 24), row);
          t += (slab - 0.5) * 0.32;
          if (ssx < 0.7 || ssy < 0.7) rim = -1; else if (ssx < 1.7 || ssy < 1.7) rim = 0.3;
        } else if (kd === 'path' || kd === 'clay') {
          const pebble = hash(Math.floor(wx * 1.3), Math.floor(wy * 1.3));
          if (pebble > 0.965) t += 0.8; else if (pebble < 0.025) t -= 0.7;
        } else if (kd === 'water') {
          const rip = Math.sin((wx * 0.5 + wy * 0.3) + lf * 9) * 0.5 + Math.sin(wy * 0.7 - wx * 0.2 + lf * 7) * 0.5;
          t = rip * 0.45 + (lf - 0.5) * 0.5; if (rip > 0.9) t += 0.5;
        } else if (kd === 'lava') {
          const vein = Math.sin((wx * 0.35 - wy * 0.5) + lf * 11) * 0.5 + Math.sin(wy * 0.6 + wx * 0.25 + lf * 8) * 0.5;
          t = vein * 0.7; if (vein > 0.72) t = 1; // bright molten seams
        } else if (kd === 'cloud') {
          // pale flagstones under drifting mist: seams and per-slab shade mark where the floor is (it used to read as open sky)
          const row = Math.floor(wy / 20), off = (row & 1) * 14, ssx = (wx + off) % 28, ssy = wy % 20;
          t = (lf - 0.5) * 1.3 + Math.sin(wx * 0.2 + lf * 6) * 0.12 + (hash(Math.floor((wx + off) / 28), row) - 0.5) * 0.4;
          if (ssx < 0.8 || ssy < 0.8) rim = -1; else if (ssx < 1.8 || ssy < 1.8) rim = 0.25;
        } else if (kd === 'wall' || kd === 'basalt') {
          // natural rock: wavy strata, blotchy lichen-dark patches and thin cracks (no masonry pattern)
          const strata = Math.sin(wy * 0.33 + lf * 9 + Math.sin(wx * 0.07) * 2) * 0.22;
          const blot = hash(Math.floor(wx / 5), Math.floor(wy / 5)) - 0.5;
          t += strata + blot * 0.35;
          const crack = hash(Math.floor((wx + wy * 0.6) / 3), Math.floor((wy - wx * 0.4) / 9));
          if (crack > 0.93) t -= 0.7;
        } else if (kd === 'void') {
          t = (lf - 0.5) * 0.8; if (hf > 0.9985) t = 1.6; // distant stars
        } else if (kd === 'jade' || kd === 'crimson') {
          const slab = hash(Math.floor(wx / 20), Math.floor(wy / 20));
          t += (slab - 0.5) * 0.4;
          const ssx = wx % 20, ssy = wy % 20; if (ssx < 0.8 || ssy < 0.8) rim = -1;
        } else if (kd === 'grass' || kd === 'grassDark' || kd === 'moss') {
          const bl = hash(Math.floor(wx * 1.1), Math.floor(wy * 1.1));
          if (bl > 0.93) t += 0.55; else if (hash(Math.floor(wx * 0.9) + 77, Math.floor(wy * 0.9)) > 0.93) t -= 0.5;
        }
        const lt = LIGHT[kd], dk = DARK[kd], base = BASE[kd];
        const tt = Math.max(-1, Math.min(1, t));
        const pick = tt >= 0 ? lt : dk, a = Math.abs(tt) * 0.8;
        r = r + (pick[0] - base[0]) * a; g = g + (pick[1] - base[1]) * a; b = b + (pick[2] - base[2]) * a;
        if (rim < 0) { r *= 0.62; g *= 0.62; b *= 0.66; } else if (rim > 0) { r += 14; g += 14; b += 14; }
        const o = (py * CANVAS_PX + px) * 4;
        d[o] = r; d[o + 1] = g; d[o + 2] = b; d[o + 3] = 255;
      }
      if ((py & 63) === 63) yield;
    }
    ctx.putImageData(img, 0, 0);

    // little flowers on open grass
    const rng = createRng(this.seed ^ 0xf10e ^ (id * 7919));
    const palette = ['#ffffff', '#ffe27a', '#ff9fbd', '#c8a2ff', '#ff8a6b'];
    for (let i = 0; i < 70; i++) {
      const tx = cx * CHUNK_TILES + Math.floor(rng() * CHUNK_TILES), ty = cy * CHUNK_TILES + Math.floor(rng() * CHUNK_TILES);
      if (tx >= w.width || ty >= w.height) continue;
      const g = w.ground[ty * w.width + tx];
      if (g !== 'grass' && g !== 'grassDark') continue;
      const x = (tx - cx * CHUNK_TILES + rng()) * TILE_SIZE * GROUND_PX + PAD, y = (ty - cy * CHUNK_TILES + rng()) * TILE_SIZE * GROUND_PX + PAD;
      ctx.fillStyle = palette[Math.floor(rng() * palette.length)]!;
      ctx.fillRect(x, y, 3, 3); ctx.fillStyle = 'rgba(255,220,80,0.9)'; ctx.fillRect(x + 1, y + 1, 1, 1);
    }
    tex.refresh();
    tex.setFilter(Phaser.Textures.FilterMode.LINEAR);
    this.images.set(id, this.scene.add.image(cx * CHUNK_WORLD - PAD / GROUND_PX, cy * CHUNK_WORLD - PAD / GROUND_PX, key).setOrigin(0).setScale(1 / GROUND_PX).setDepth(0));
  }
}
