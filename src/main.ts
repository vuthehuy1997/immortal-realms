import Phaser from 'phaser';
import './ui/ui.css';
import { newGameState, type GameState } from './core/gameState';
import { generateWorld } from './core/world';
import { BootScene } from './game/BootScene';
import { WorldScene, type GameHost } from './game/WorldScene';
import { hasSaveData, loadGame, loadSlotGame, saveNewGame, storage } from './game/storage';
import { allSlots, deleteSlot, exportSlot, firstEmptySlot, activeSlot, importToSlot } from './core/slots';
import { buildHud, showHud } from './ui/hud';
import { hideScreen, showCreation, showSlots, showLoading, showMainMenu } from './ui/menu';
import { installSkin } from './ui/skin';
import { audio } from './game/audio';

const WORLD_SEED = 20261016;

const game = new Phaser.Game({
  type: Phaser.WEBGL,
  parent: 'game',
  backgroundColor: '#0b0d14',
  scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
  render: { antialias: false, powerPreference: 'high-performance' }, // pixel art: AA only costs fill-rate
  input: { windowEvents: false, keyboard: false }, // DOM UI clicks must not reach the canvas; keys handled in game/input.ts
  scene: [BootScene, WorldScene], // only the first scene starts automatically
});

const host: GameHost = { quitToMenu: () => { game.scene.stop('World'); showHud(false); mainMenu(); } };

function begin(gs: GameState): void {
  audio.startMusic();
  hideScreen();
  showHud(true);
  game.scene.start('World', { state: gs, host });
}

function mainMenu(error?: string): void {
  showMainMenu({
    hasSave: hasSaveData(),
    error,
    onNew: () => showCreation({
      onBack: () => mainMenu(), slots: allSlots(storage), defaultSlot: firstEmptySlot(storage) ?? activeSlot(storage),
      onStart: (name, root, hero, slot) => { const gs = newGameState(name, root, hero, generateWorld(WORLD_SEED).spawn); saveNewGame(gs, slot); begin(gs); },
    }),
    onContinue: () => {
      const r = loadGame();
      if (r.ok) begin(r.state); else mainMenu(`Could not load save: ${r.error}`);
    },
    onSlots: () => slotsMenu(),
  });
}

function slotsMenu(message?: string): void {
  showSlots({
    slots: allSlots(storage), message,
    onBack: () => mainMenu(),
    onLoad: (slot) => { const r = loadSlotGame(slot); if (r.ok) begin(r.state); else slotsMenu(`Could not load slot ${slot}: ${r.error}`); },
    onDelete: (slot) => { deleteSlot(storage, slot); slotsMenu(`Slot ${slot} deleted.`); },
    onExport: (slot) => {
      const text = exportSlot(storage, slot); if (!text) return;
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' })); a.download = `immortal-realms-slot${slot}.json`; a.click(); URL.revokeObjectURL(a.href);
      slotsMenu(`Slot ${slot} exported.`);
    },
    onImport: (slot, text) => { const r = importToSlot(storage, slot, text); slotsMenu(r.ok ? `Imported into slot ${slot}.` : `Import refused: ${r.error}`); },
  });
}

const loading = showLoading();
game.events.on('load-progress', (p: number) => loading.set(p));
game.events.once('assets-ready', () => {
  installSkin(); buildHud(); showHud(false); mainMenu();
  const btn = document.createElement('button');
  btn.id = 'btn-audio'; btn.title = 'Sound (N)'; btn.textContent = '♪'; btn.className = audio.muted ? 'off' : '';
  btn.onclick = () => { audio.setMuted(!audio.muted); btn.classList.toggle('off', audio.muted); };
  document.getElementById('ui')!.appendChild(btn);
});
document.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('button') && !(e.target as HTMLElement).closest('#btn-audio')) { audio.ensure(); audio.sfx('click'); if (document.getElementById('screen')) audio.startMusic(); } }, true);

// Test hook for e2e verification only.
(window as unknown as { __game: Phaser.Game }).__game = game;
