import Phaser from 'phaser';
import type { RootId } from '../data/roots';
import { MANIFEST } from './assets';

/** Element colour of each spirit root, used to tint the white-grey spell effects. */
export const ROOT_COLOR: Record<RootId, number> = { flame: 0xff8a3a, tide: 0x5ad0ff, verdant: 0x7be37b };
export const COLORS = { hurt: 0xff5555, heal: 0x7dffb0, mana: 0x6ab8ff, gold: 0xffd23f, boss: 0xff4030, wisp: 0xc77dff, white: 0xffffff, qi: 0x44ffcc };

export interface FxOpts { scale?: number; tint?: number; rot?: number; flipX?: boolean; depth?: number; blend?: 'add' | 'normal'; alpha?: number; speed?: number; loop?: boolean }

/** Spell/impact effects built from the monochrome fx strips plus particle bursts. */
export class Fx {
  private emitters = new Map<number, Phaser.GameObjects.Particles.ParticleEmitter>();
  constructor(private scene: Phaser.Scene) {}

  private make(key: string, x: number, y: number, o: FxOpts): Phaser.GameObjects.Sprite | Phaser.GameObjects.Image | null {
    const def = MANIFEST.fx[key];
    if (!def) return null;
    const tex = `fx.${key}`;
    const s = def.frames > 1 ? this.scene.add.sprite(x, y, tex) : this.scene.add.image(x, y, tex);
    s.setOrigin(def.ox, def.oy).setScale(o.scale ?? 0.3).setDepth(o.depth ?? y + 1).setRotation(o.rot ?? 0).setAlpha(o.alpha ?? 1);
    if (o.flipX) s.setScale(-(o.scale ?? 0.3), o.scale ?? 0.3);
    if (o.blend !== 'normal') s.setBlendMode(Phaser.BlendModes.ADD);
    if (o.tint !== undefined) s.setTint(o.tint);
    return s;
  }

  /** Plays an effect once and removes it. Returns the sprite so callers can follow/move it. */
  play(key: string, x: number, y: number, o: FxOpts = {}): Phaser.GameObjects.Sprite | null {
    const s = this.make(key, x, y, o);
    if (!s || !(s instanceof Phaser.GameObjects.Sprite)) { if (s) this.scene.tweens.add({ targets: s, alpha: 0, duration: 700, onComplete: () => s.destroy() }); return null; }
    s.anims.timeScale = o.speed ?? 1;
    if (o.loop) { s.play({ key: `fx.${key}`, repeat: -1 }); return s; }
    s.play(`fx.${key}`);
    s.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => s.destroy());
    return s;
  }

  private emitter(color: number): Phaser.GameObjects.Particles.ParticleEmitter {
    let e = this.emitters.get(color);
    if (!e) {
      e = this.scene.add.particles(0, 0, 'spark', {
        lifespan: { min: 220, max: 480 }, speed: { min: 40, max: 150 }, scale: { start: 0.7, end: 0 }, alpha: { start: 1, end: 0 },
        blendMode: 'ADD', tint: color, emitting: false, gravityY: 0,
      }).setDepth(1e5);
      this.emitters.set(color, e);
    }
    return e;
  }

  burst(x: number, y: number, color: number, count = 10): void { this.emitter(color).explode(count, x, y); }

  /** Expanding ring (shockwave). */
  ring(x: number, y: number, radius: number, color: number, ms = 320, depth = 5): void {
    const r = this.scene.add.image(x, y, 'ring').setTint(color).setBlendMode(Phaser.BlendModes.ADD).setDepth(depth).setDisplaySize(radius * 0.3, radius * 0.3).setAlpha(0.9);
    this.scene.tweens.add({ targets: r, displayWidth: radius * 2, displayHeight: radius * 2, alpha: 0, duration: ms, ease: 'quad.out', onComplete: () => r.destroy() });
  }

  /** Soft additive light blob that fades out. */
  flare(x: number, y: number, color: number, size = 40, ms = 260): void {
    const g = this.scene.add.image(x, y, 'glow').setTint(color).setBlendMode(Phaser.BlendModes.ADD).setDepth(1e5).setDisplaySize(size, size);
    this.scene.tweens.add({ targets: g, alpha: 0, displayWidth: size * 1.8, displayHeight: size * 1.8, duration: ms, onComplete: () => g.destroy() });
  }

  /** Ghost copy of a sprite that fades (dash afterimage). */
  afterimage(sprite: Phaser.GameObjects.Sprite, color: number, ms = 280): void {
    const g = this.scene.add.sprite(sprite.x, sprite.y, sprite.texture.key, sprite.frame.name).setOrigin(sprite.originX, sprite.originY)
      .setScale(sprite.scaleX, sprite.scaleY).setDepth(sprite.depth - 0.1).setTint(color).setAlpha(0.55).setBlendMode(Phaser.BlendModes.ADD);
    this.scene.tweens.add({ targets: g, alpha: 0, duration: ms, onComplete: () => g.destroy() });
  }

  shake(ms = 120, intensity = 0.004): void { this.scene.cameras.main.shake(ms, intensity); }
}
