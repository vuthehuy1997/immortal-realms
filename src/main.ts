import Phaser from 'phaser';
import { BootScene } from './game/BootScene';

const game = new Phaser.Game({
  type: Phaser.WEBGL,
  parent: 'game',
  backgroundColor: '#0b0d14',
  scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
  scene: [BootScene],
});

// Test hook for e2e verification only.
(window as unknown as { __game: Phaser.Game }).__game = game;
