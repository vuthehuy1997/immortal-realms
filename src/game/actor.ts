import Phaser from 'phaser';
import { sheetOf } from './assets';

const ANIM_FALLBACK: Record<string, string> = { attack_a: 'attack', attack_b: 'attack', special: 'attack' };

/** An animated character (hero / mob / boss) with a ground shadow. Facing is done with a negative X scale so the origin stays put. */
export class Actor {
  readonly sprite: Phaser.GameObjects.Sprite;
  readonly shadow: Phaser.GameObjects.Image;
  private current = '';
  private dir: 1 | -1 = 1;
  private flashTimer?: Phaser.Time.TimerEvent;
  private baseTint: number | null = null;

  constructor(private scene: Phaser.Scene, readonly prefix: string, x: number, y: number, readonly scale: number, shadowWidth = 22) {
    const first = sheetOf(`${prefix}.idle`);
    this.sprite = scene.add.sprite(x, y, `${prefix}.idle`);
    this.shadow = scene.add.image(x, y, 'shadow').setDepth(1).setAlpha(0.9);
    this.shadow.setDisplaySize(shadowWidth, shadowWidth * 0.45);
    if (first) this.sprite.setOrigin(first.ox, first.oy);
    this.applyScale();
    this.play('idle');
  }

  has(anim: string): boolean { return this.scene.anims.exists(`${this.prefix}.${anim}`); }
  get anim(): string { return this.current; }

  /**
   * Plays `anim`. A running animation is not restarted unless `force`. `duration` stretches the animation to fit that many seconds.
   */
  play(anim: string, opts: { force?: boolean; duration?: number } = {}): boolean {
    let key = `${this.prefix}.${anim}`;
    if (!this.scene.anims.exists(key) && ANIM_FALLBACK[anim]) { key = `${this.prefix}.${ANIM_FALLBACK[anim]}`; anim = ANIM_FALLBACK[anim]!; } // mob sprites reused as bosses only have attack/move
    if (!this.scene.anims.exists(key)) return false;
    if (this.current === anim && !opts.force && this.sprite.anims.isPlaying) return true;
    const def = sheetOf(key);
    this.current = anim;
    this.sprite.play(key, true);
    if (def) {
      this.sprite.setOrigin(def.ox, def.oy);
      this.sprite.anims.timeScale = opts.duration ? def.frames / def.fps / opts.duration : 1;
    }
    return true;
  }

  onComplete(cb: () => void): void { this.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, cb); }
  get playing(): boolean { return this.sprite.anims.isPlaying; }
  get progress(): number { return this.sprite.anims.getProgress(); }

  face(dir: 1 | -1): void { if (dir !== this.dir) { this.dir = dir; this.applyScale(); } }
  get facing(): 1 | -1 { return this.dir; }
  private applyScale(): void { this.sprite.setScale(this.scale * this.dir, this.scale); }

  setPos(x: number, y: number): void {
    this.sprite.setPosition(x, y).setDepth(y);
    this.shadow.setPosition(x, y - 1);
  }

  /** Permanent multiply tint (recoloured art); flashes restore it. */
  setBaseTint(color: number | null): void { this.baseTint = color; this.restoreTint(); }
  private restoreTint(): void { this.sprite.clearTint().setTintMode(Phaser.TintModes.MULTIPLY); if (this.baseTint !== null) this.sprite.setTint(this.baseTint); }

  /** Brief white flash (v4 tint FILL mode). */
  flash(ms = 90, color = 0xffffff): void {
    this.sprite.setTint(color).setTintMode(Phaser.TintModes.FILL);
    this.flashTimer?.remove(false);
    this.flashTimer = this.scene.time.delayedCall(ms, () => { if (this.sprite.active) this.restoreTint(); });
  }

  /** Sustained colour (e.g. telegraph); cleared with `untint`. */
  tint(color: number): void { this.sprite.setTint(color).setTintMode(Phaser.TintModes.MULTIPLY); }
  untint(): void { this.restoreTint(); }

  setAlpha(a: number): void { this.sprite.setAlpha(a); this.shadow.setAlpha(a * 0.9); }
  setVisible(v: boolean): void { this.sprite.setVisible(v); this.shadow.setVisible(v); }

  destroy(): void { this.flashTimer?.remove(false); this.sprite.destroy(); this.shadow.destroy(); }
}
