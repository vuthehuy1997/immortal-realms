import Phaser from 'phaser';
import { applyTextureFilters, makeHelperTextures, queueAssets, registerAnimations } from './assets';

/** Loads every asset once and reports progress to the DOM loading bar. */
export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload(): void {
    queueAssets(this.load);
    this.load.on('progress', (p: number) => this.game.events.emit('load-progress', p));
  }

  create(): void {
    makeHelperTextures(this.textures);
    applyTextureFilters(this.textures);
    registerAnimations(this.anims);
    this.game.events.emit('assets-ready');
    this.scene.stop();
  }
}
