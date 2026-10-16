import Phaser from 'phaser';
import './ui/ui.css';
import { newGameState, type GameState } from './core/gameState';
import { generateWorld } from './core/world';
import { BootScene } from './game/BootScene';
import { WorldScene, type GameHost } from './game/WorldScene';
import { hasSaveData, loadGame } from './game/storage';
import { buildHud, showHud } from './ui/hud';
import { hideScreen, showCreation, showLoading, showMainMenu } from './ui/menu';
import { installSkin } from './ui/skin';

const WORLD_SEED = 20261016;

const game = new Phaser.Game({
  type: Phaser.WEBGL,
  parent: 'game',
  backgroundColor: '#0b0d14',
  scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
  antialias: true,
  input: { windowEvents: false, keyboard: false }, // DOM UI clicks must not reach the canvas; keys handled in game/input.ts
  scene: [BootScene, WorldScene], // only the first scene starts automatically
});

const host: GameHost = { quitToMenu: () => { game.scene.stop('World'); showHud(false); mainMenu(); } };

function begin(gs: GameState): void {
  hideScreen();
  showHud(true);
  game.scene.start('World', { state: gs, host });
}

function mainMenu(error?: string): void {
  showMainMenu({
    hasSave: hasSaveData(),
    error,
    onNew: () => showCreation({
      onBack: () => mainMenu(),
      onStart: (name, root, hero) => begin(newGameState(name, root, hero, generateWorld(WORLD_SEED).spawn)),
    }),
    onContinue: () => {
      const r = loadGame();
      if (r.ok) begin(r.state); else mainMenu(`Could not load save: ${r.error}`);
    },
  });
}

const loading = showLoading();
game.events.on('load-progress', (p: number) => loading.set(p));
game.events.once('assets-ready', () => { installSkin(); buildHud(); showHud(false); mainMenu(); });

// Test hook for e2e verification only.
(window as unknown as { __game: Phaser.Game }).__game = game;
