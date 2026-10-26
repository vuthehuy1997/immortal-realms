import Phaser from 'phaser';
import type { ZoneId } from '../core/world';
import { ZONES } from '../data/zones';

const MOOD_TINT: Record<string, number> = { day: 0xffffff, mist: 0xcfe3ee, dusk: 0xffd9b8, night: 0x9fb2dc, frost: 0xd6ecff };

/** Drifting petals, fireflies, mist banks and a mood colour overlay that follows the zone the player is in. */
export class Ambient {
  private petals: Phaser.GameObjects.Particles.ParticleEmitter;
  private flies: Phaser.GameObjects.Particles.ParticleEmitter;
  private overlay: Phaser.GameObjects.Rectangle;
  private mist: Phaser.GameObjects.Image[] = [];
  private petalZone = new Phaser.Geom.Rectangle(0, 0, 10, 10);
  private flyZone = new Phaser.Geom.Rectangle(0, 0, 10, 10);
  private tint = new Phaser.Display.Color(255, 255, 255);
  private target = new Phaser.Display.Color(255, 255, 255);

  private worldW: number;

  constructor(private scene: Phaser.Scene, worldW: number, worldH: number) {
    this.worldW = worldW;
    this.petals = scene.add.particles(0, 0, 'petal', {
      lifespan: 7000, speedX: { min: 10, max: 40 }, speedY: { min: 12, max: 30 }, rotate: { start: 0, end: 360 },
      scale: { min: 0.5, max: 0.9 }, alpha: { start: 0.9, end: 0.2 }, frequency: 420, quantity: 1,
    }).setDepth(9e4);
    this.flies = scene.add.particles(0, 0, 'glow', {
      lifespan: 4200, speed: { min: 2, max: 10 }, scale: { start: 0.05, end: 0.0 }, alpha: { start: 0, end: 0.9, ease: 'sine.inOut' },
      tint: 0xd9ff7a, blendMode: 'ADD', frequency: 260, quantity: 1,
    }).setDepth(9e4).stop();
    this.petals.addEmitZone({ type: 'random', source: this.petalZone, quantity: 1 });
    this.flies.addEmitZone({ type: 'random', source: this.flyZone, quantity: 1 });
    this.overlay = scene.add.rectangle(0, 0, 10, 10, 0xffffff).setOrigin(0).setScrollFactor(0).setDepth(9.5e5).setBlendMode(Phaser.BlendModes.MULTIPLY);
    for (let i = 0; i < 22; i++) {
      const m = scene.add.image(Math.random() * worldW, 80 + Math.random() * (worldH - 160), 'glow')
        .setTint(0xdfeaf2).setDisplaySize(180 + Math.random() * 160, 60 + Math.random() * 40).setAlpha(0).setDepth(8e4);
      this.mist.push(m);
    }
  }

  update(dtSec: number, zone: ZoneId): void {
    const cam = this.scene.cameras.main, v = cam.worldView;
    this.petals.setPosition(v.x - 20, v.y - 12);
    this.petalZone.setSize(v.width + 40, 10);
    const fireflies = zone === 'marsh' || zone === 'grove' || zone === 'lair';
    if (fireflies) this.flies.start(); else this.flies.stop();
    this.flies.setPosition(v.x, v.y);
    this.flyZone.setSize(v.width, v.height);
    this.petals.frequency = zone === 'grove' || zone === 'village' ? 260 : 900;
    // mood overlay
    const mood = ZONES[zone]!.mood;
    const t = Phaser.Display.Color.IntegerToColor(MOOD_TINT[mood]!);
    this.target.setTo(t.red, t.green, t.blue);
    const k = Math.min(1, dtSec * 1.2);
    this.tint.setTo(this.tint.red + (this.target.red - this.tint.red) * k, this.tint.green + (this.target.green - this.tint.green) * k, this.tint.blue + (this.target.blue - this.tint.blue) * k);
    this.overlay.setFillStyle(this.tint.color).setSize(cam.width + 4, cam.height + 4);
    // drifting mist banks (visible mostly in marsh/lair)
    const mistAlpha = zone === 'marsh' ? 0.3 : zone === 'lair' ? 0.22 : 0.03;
    for (const m of this.mist) {
      m.x += 5 * dtSec; if (m.x > this.worldW + 200) m.x = -200;
      m.setAlpha(m.alpha + (mistAlpha - m.alpha) * Math.min(1, dtSec));
    }
  }
}
