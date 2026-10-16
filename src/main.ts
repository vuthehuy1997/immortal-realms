import Phaser from 'phaser';
import { WorldScene } from './game/WorldScene';

const game = new Phaser.Game({
  type: Phaser.WEBGL,
  parent: 'game',
  backgroundColor: '#0b0d14',
  scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
  pixelArt: true,
  scene: [WorldScene],
});

// Test hook for e2e verification only.
(window as unknown as { __game: Phaser.Game }).__game = game;
