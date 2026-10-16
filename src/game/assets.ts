import Phaser from 'phaser';
import raw from '../data/manifest.generated.json';

export interface SheetDef { url: string; fw: number; fh: number; frames: number; fps: number; loop: boolean; ox: number; oy: number }
export interface PropAsset { url: string; w: number; h: number }
export interface FxDef { url: string; fw: number; fh: number; frames: number; ox: number; oy: number; anchor: string }
export interface UrlAsset { url: string; w?: number; h?: number }
export interface Manifest {
  sheets: Record<string, SheetDef>; props: Record<string, PropAsset>; fx: Record<string, FxDef>;
  ui: Record<string, UrlAsset>; icons: Record<string, UrlAsset>; portraits: Record<string, UrlAsset>;
}
export const MANIFEST = raw as unknown as Manifest;

/** Queue every game asset on the loader (spritesheets keep their manifest key). */
export function queueAssets(load: Phaser.Loader.LoaderPlugin): void {
  for (const [key, s] of Object.entries(MANIFEST.sheets)) load.spritesheet(key, s.url, { frameWidth: s.fw, frameHeight: s.fh });
  for (const [key, p] of Object.entries(MANIFEST.props)) load.image(`prop.${key}`, p.url);
  for (const [key, f] of Object.entries(MANIFEST.fx)) {
    if (f.frames > 1) load.spritesheet(`fx.${key}`, f.url, { frameWidth: f.fw, frameHeight: f.fh });
    else load.image(`fx.${key}`, f.url);
  }
}

/** Smooth (linear) filtering: the art is high-density and is drawn at non-integer scales. */
export function applyTextureFilters(textures: Phaser.Textures.TextureManager): void {
  for (const key of textures.getTextureKeys()) {
    if (/^(prop|fx|hero|mob|boss)\./.test(key)) textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
  }
}

export function registerAnimations(anims: Phaser.Animations.AnimationManager): void {
  for (const [key, s] of Object.entries(MANIFEST.sheets)) {
    if (anims.exists(key)) continue;
    anims.create({ key, frames: anims.generateFrameNumbers(key, { start: 0, end: s.frames - 1 }), frameRate: s.fps, repeat: s.loop ? -1 : 0 });
  }
  for (const [key, f] of Object.entries(MANIFEST.fx)) {
    if (f.frames <= 1 || anims.exists(`fx.${key}`)) continue;
    anims.create({ key: `fx.${key}`, frames: anims.generateFrameNumbers(`fx.${key}`, { start: 0, end: f.frames - 1 }), frameRate: 26, repeat: 0 });
  }
}

/** Procedural helper textures (shadow, glow, spark, petal, ring). */
export function makeHelperTextures(textures: Phaser.Textures.TextureManager): void {
  const radial = (key: string, w: number, h: number, stops: [number, string][]) => {
    if (textures.exists(key)) return;
    const t = textures.createCanvas(key, w, h)!; const c = t.getContext();
    const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    for (const [o, col] of stops) g.addColorStop(o, col);
    c.save(); c.translate(0, h / 2); c.scale(1, h / w); c.translate(0, -w / 2); c.fillStyle = g; c.fillRect(0, 0, w, w); c.restore();
    t.refresh();
  };
  radial('shadow', 64, 32, [[0, 'rgba(0,0,0,0.55)'], [0.6, 'rgba(0,0,0,0.3)'], [1, 'rgba(0,0,0,0)']]);
  radial('glow', 128, 128, [[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(255,255,255,0.55)'], [1, 'rgba(255,255,255,0)']]);
  radial('spark', 16, 16, [[0, 'rgba(255,255,255,1)'], [0.5, 'rgba(255,255,255,0.7)'], [1, 'rgba(255,255,255,0)']]);
  radial('dot', 8, 8, [[0, 'rgba(255,255,255,1)'], [1, 'rgba(255,255,255,0.9)']]);
  if (!textures.exists('petal')) {
    const t = textures.createCanvas('petal', 12, 8)!; const c = t.getContext();
    c.fillStyle = '#ffd6e4'; c.beginPath(); c.ellipse(6, 4, 5, 3, 0.4, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ff9fbd'; c.beginPath(); c.ellipse(5, 4, 2.5, 1.5, 0.4, 0, Math.PI * 2); c.fill(); t.refresh();
  }
  if (!textures.exists('ring')) {
    const t = textures.createCanvas('ring', 128, 128)!; const c = t.getContext();
    c.strokeStyle = 'rgba(255,255,255,0.95)'; c.lineWidth = 5; c.beginPath(); c.arc(64, 64, 58, 0, Math.PI * 2); c.stroke();
    const g = c.createRadialGradient(64, 64, 20, 64, 64, 62); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,0.28)');
    c.fillStyle = g; c.beginPath(); c.arc(64, 64, 60, 0, Math.PI * 2); c.fill(); t.refresh();
  }
}

export const sheetOf = (key: string): SheetDef | undefined => MANIFEST.sheets[key];
