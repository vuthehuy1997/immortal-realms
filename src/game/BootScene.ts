import Phaser from 'phaser';

/** PLACEHOLDER scene (M0 scaffold): proves WebGL boot only. Replace in M1. */
export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  create(): void {
    this.add.text(24, 24, 'Immortal Realms — scaffold OK (placeholder)', { color: '#e8d9a8', fontSize: '20px' });
  }
}
