import Phaser from 'phaser';
import { TILE_SIZE, type WorldMap } from '../core/world';
import { createRng } from '../core/rng';
import { PROPS } from '../data/props';
import { ZONES } from '../data/zones';
import { MANIFEST } from './assets';
import { GroundChunks } from './ground';

export interface Occluder { img: Phaser.GameObjects.Image; x: number; y: number; halfW: number; h: number }
export interface HerbNode { x: number; y: number; img: Phaser.GameObjects.Image; glow: Phaser.GameObjects.Image; alive: boolean; respawnAt: number }

/** Builds the visible world: baked ground, y-sorted scenery, herb nodes, water ripples. */
export function renderWorld(scene: Phaser.Scene, world: WorldMap, seed: number): { herbs: HerbNode[]; occluders: Occluder[]; ground: GroundChunks } {
  const occluders: Occluder[] = [];
  const ground = new GroundChunks(scene, world, seed);
  const rng = createRng(seed ^ 0xbeef);

  for (const p of world.props) {
    if (p.kind === 'lingzhi') continue; // herb nodes are created below
    const def = PROPS[p.kind];
    const img = scene.add.image(p.x, p.y, `prop.${p.kind}`).setOrigin(0.5, 1).setScale(def.scale);
    const tall = !def.flat;
    img.setDepth(def.flat ? 2 : p.y);
    if (p.kind === 'bamboo' || p.kind === 'pine' || p.kind === 'willow' || p.kind === 'peachtree' || p.kind === 'orchid' || p.kind === 'rock') {
      if (rng() < 0.5) img.setScale(-def.scale, def.scale); // mirror for variety
      const v = 0.9 + rng() * 0.1; const c = (x: number) => Math.round(Math.min(255, Math.max(0, 255 * x)));
      img.setTint(Phaser.Display.Color.GetColor(c(v + 0.05), c(v + 0.05), c(v)));
    }
    const zt = ZONES[world.zone[Math.min(world.height - 1, Math.floor((p.y - 1) / TILE_SIZE)) * world.width + Math.min(world.width - 1, Math.floor(p.x / TILE_SIZE))]!]?.propTint;
    if (zt !== undefined && !def.flat) img.setTint(zt);
    const src = MANIFEST.props[p.kind]!;
    if (tall && src.h * def.scale > 40) occluders.push({ img, x: p.x, y: p.y, halfW: (src.w * def.scale) / 2 * 0.8, h: src.h * def.scale });
    if (def.float) {
      img.setY(p.y - 18);
      scene.tweens.add({ targets: img, y: p.y - 26, duration: 2200 + rng() * 800, yoyo: true, repeat: -1, ease: 'sine.inOut' });
      scene.add.image(p.x, p.y + 2, 'shadow').setDepth(1).setDisplaySize(def.scale * 220, def.scale * 80).setAlpha(0.7);
    }
    if (tall && (p.kind === 'pavilion' || p.kind === 'palace' || p.kind === 'pagoda7' || p.kind === 'tower' || p.kind === 'goldpaifang' || p.kind === 'goldgate' || p.kind === 'paifang')) {
      scene.add.image(p.x, p.y - 2, 'shadow').setDepth(1).setDisplaySize(def.scale * 380, def.scale * 120).setAlpha(0.5);
    }
  }

  // herb nodes (lingzhi) with a soft golden pulse so they can be spotted
  const herbs: HerbNode[] = world.herbs.map((h) => {
    const glow = scene.add.image(h.x, h.y - 6, 'glow').setTint(0xffe27a).setBlendMode(Phaser.BlendModes.ADD).setDepth(h.y - 1).setDisplaySize(34, 34).setAlpha(0.5);
    scene.tweens.add({ targets: glow, alpha: 0.18, duration: 1300 + rng() * 600, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    const img = scene.add.image(h.x, h.y, 'prop.lingzhi').setOrigin(0.5, 1).setScale(PROPS.lingzhi.scale).setDepth(h.y);
    return { x: h.x, y: h.y, img, glow, alive: true, respawnAt: 0 };
  });

  // twinkling water: a handful of glints on water tiles
  const water: { x: number; y: number }[] = [];
  for (let i = 0; i < world.ground.length; i++) if (world.ground[i] === 'water') water.push({ x: (i % world.width) * TILE_SIZE, y: Math.floor(i / world.width) * TILE_SIZE });
  for (let k = 0; k < Math.min(90, water.length); k++) {
    const t = water[Math.floor(rng() * water.length)]!;
    const g = scene.add.image(t.x + rng() * TILE_SIZE, t.y + rng() * TILE_SIZE, 'spark').setBlendMode(Phaser.BlendModes.ADD).setDepth(3).setAlpha(0).setScale(0.5 + rng() * 0.6).setTint(0xcfefff);
    scene.tweens.add({ targets: g, alpha: 0.9, duration: 700 + rng() * 900, delay: rng() * 3000, yoyo: true, repeat: -1 });
  }
  return { herbs, occluders, ground };
}

const OCC_CELL = 96;
/** Occluders bucketed on a coarse grid, so the per-frame fade test only looks at scenery near a character (thousands on big maps). */
export class OccluderIndex {
  private cells = new Map<number, Occluder[]>();
  private faded = new Set<Occluder>();
  constructor(list: Occluder[]) {
    for (const o of list) {
      const k = this.key(Math.floor(o.x / OCC_CELL), Math.floor(o.y / OCC_CELL));
      const c = this.cells.get(k); if (c) c.push(o); else this.cells.set(k, [o]);
    }
  }
  private key(cx: number, cy: number): number { return cy * 4096 + cx; }

  /** Fades tall scenery that stands in front of a point so characters are never hidden. */
  update(points: { x: number; y: number }[], dtSec: number): void {
    const hide = new Set<Occluder>();
    for (const p of points) {
      const cx = Math.floor(p.x / OCC_CELL), cy = Math.floor(p.y / OCC_CELL);
      for (let y = cy; y <= cy + 2; y++) for (let x = cx - 1; x <= cx + 1; x++) {
        for (const o of this.cells.get(this.key(x, y)) ?? []) {
          if (o.y > p.y + 1 && Math.abs(p.x - o.x) < o.halfW + 10 && p.y - 24 < o.y && p.y > o.y - o.h) hide.add(o);
        }
      }
    }
    const k = Math.min(1, dtSec * 9);
    for (const o of hide) { this.faded.add(o); if (o.img.alpha !== 0.3) o.img.setAlpha(Phaser.Math.Linear(o.img.alpha, 0.3, k)); }
    for (const o of this.faded) {
      if (hide.has(o)) continue;
      const a = Phaser.Math.Linear(o.img.alpha, 1, k);
      if (a > 0.995) { o.img.setAlpha(1); this.faded.delete(o); } else o.img.setAlpha(a);
    }
  }
}
