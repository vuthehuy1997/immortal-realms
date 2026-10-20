import type { WorldMap, GroundKind } from '../core/world';
import { TILE_SIZE } from '../core/world';
import { $ } from './dom';

const COLOR: Record<GroundKind, string> = { grass: '#6a9a4a', grassDark: '#427440', moss: '#4e7c54', path: '#b69262', stone: '#989aa2', water: '#326898', sand: '#d0bc86' };
const PX = 2; // minimap pixels per tile

let base: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let world: WorldMap | null = null;
let acc = 0;

/** Builds the (static) terrain image once per world and mounts the minimap canvas. */
export function initMinimap(w: WorldMap, onOpen: () => void = () => undefined): void {
  world = w;
  base = document.createElement('canvas'); base.width = w.width * PX; base.height = w.height * PX;
  const b = base.getContext('2d')!;
  for (let ty = 0; ty < w.height; ty++) for (let tx = 0; tx < w.width; tx++) {
    const i = ty * w.width + tx;
    b.fillStyle = w.blocked[i] && w.ground[i] !== 'water' ? '#26402a' : COLOR[w.ground[i]!];
    b.fillRect(tx * PX, ty * PX, PX, PX);
  }
  for (const p of w.props) if (['palace', 'pagoda7', 'pavilion', 'tower', 'goldpaifang', 'goldgate'].includes(p.kind)) { b.fillStyle = '#e9d27a'; b.fillRect((p.x / TILE_SIZE) * PX - 2, (p.y / TILE_SIZE) * PX - 2, 4, 3); }
  let c = document.getElementById('minimap') as HTMLCanvasElement | null;
  if (!c) { c = document.createElement('canvas'); c.id = 'minimap'; $('hudlayer').appendChild(c); }
  c.width = 156; c.height = 156; c.title = 'Click or press Tab for the world map'; c.onclick = onOpen;
  if (!document.getElementById('mmlabel')) { const l = document.createElement('div'); l.id = 'mmlabel'; l.innerHTML = '<b id="mmzone"></b><small>Tab · world map</small>'; $('hudlayer').appendChild(l); }
  ctx = c.getContext('2d')!;
}

export interface MinimapFrame {
  player: { x: number; y: number }; facing: { x: number; y: number };
  enemies: { x: number; y: number; elite: boolean }[]; bosses: { x: number; y: number }[];
  npcs: { x: number; y: number }[]; herbs: { x: number; y: number }[]; objective?: { x: number; y: number } | null;
}

/** Draws a 78-tile-wide window of the map centred on the player (throttled to ~8 fps). */
export function updateMinimap(f: MinimapFrame, dtSec: number): void {
  acc += dtSec; if (acc < 0.12 || !ctx || !base || !world) return; acc = 0;
  const S = 156, view = S / PX * TILE_SIZE; // world units covered
  const cx = f.player.x / TILE_SIZE * PX, cy = f.player.y / TILE_SIZE * PX;
  ctx.clearRect(0, 0, S, S);
  ctx.save(); ctx.beginPath(); ctx.arc(S / 2, S / 2, S / 2 - 2, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = '#0b0d14'; ctx.fillRect(0, 0, S, S);
  ctx.drawImage(base, S / 2 - cx, S / 2 - cy);
  const map = (x: number, y: number) => ({ x: S / 2 + (x - f.player.x) / TILE_SIZE * PX, y: S / 2 + (y - f.player.y) / TILE_SIZE * PX });
  const dot = (x: number, y: number, r: number, col: string) => { const p = map(x, y); if (Math.hypot(p.x - S / 2, p.y - S / 2) > S / 2 + 4) return; ctx!.fillStyle = col; ctx!.beginPath(); ctx!.arc(p.x, p.y, r, 0, Math.PI * 2); ctx!.fill(); };
  for (const h of f.herbs) dot(h.x, h.y, 1.6, '#ffe27a');
  for (const n of f.npcs) dot(n.x, n.y, 2.6, '#ffffff');
  for (const e of f.enemies) dot(e.x, e.y, e.elite ? 2.6 : 1.8, e.elite ? '#ffb02e' : '#ff5a4a');
  for (const b of f.bosses) dot(b.x, b.y, 4, '#d01010');
  if (f.objective) { // gold ring; pinned to the rim when off the visible window
    const p = map(f.objective.x, f.objective.y), dx = p.x - S / 2, dy = p.y - S / 2, d = Math.hypot(dx, dy), lim = S / 2 - 8;
    const q = d > lim ? { x: S / 2 + (dx / d) * lim, y: S / 2 + (dy / d) * lim } : p;
    ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(q.x, q.y, 5, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
  // player arrow
  const a = Math.atan2(f.facing.y, f.facing.x);
  ctx.save(); ctx.translate(S / 2, S / 2); ctx.rotate(a);
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-4, 4); ctx.lineTo(-2, 0); ctx.lineTo(-4, -4); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  void view;
}

export function setMinimapZone(name: string, level: string): void { const z = document.getElementById('mmzone'); if (z) z.textContent = `${name} · ${level}`; }

export function removeMinimap(): void { document.getElementById('minimap')?.remove(); document.getElementById('mmlabel')?.remove(); ctx = null; base = null; world = null; }

// ---- full-screen world map (Tab) ----
const WM_PX = 6;
let wmBase: HTMLCanvasElement | null = null;
export const isWorldMapOpen = (): boolean => !!document.getElementById('wmap');
export function closeWorldMap(): void { document.getElementById('wmap')?.remove(); }

export function toggleWorldMap(w: WorldMap): void {
  if (isWorldMapOpen()) { closeWorldMap(); return; }
  if (!wmBase || wmBase.width !== w.width * WM_PX) {
    wmBase = document.createElement('canvas'); wmBase.width = w.width * WM_PX; wmBase.height = w.height * WM_PX;
    const b = wmBase.getContext('2d')!;
    for (let ty = 0; ty < w.height; ty++) for (let tx = 0; tx < w.width; tx++) {
      const i = ty * w.width + tx; b.fillStyle = w.blocked[i] && w.ground[i] !== 'water' ? '#26402a' : COLOR[w.ground[i]!]; b.fillRect(tx * WM_PX, ty * WM_PX, WM_PX, WM_PX);
    }
  }
  const box = document.createElement('div'); box.id = 'wmap';
  const c = document.createElement('canvas'); c.width = wmBase.width; c.height = wmBase.height; c.id = 'wmapcanvas'; box.appendChild(c);
  const hint = document.createElement('div'); hint.className = 'hint'; hint.textContent = 'World map — Tab or Esc to close'; box.appendChild(hint);
  $('ui').appendChild(box);
}

export interface WorldMapFrame extends MinimapFrame { zones: { name: string; x: number; y: number }[]; objective: { x: number; y: number } | null }
export function updateWorldMap(f: WorldMapFrame): void {
  const c = document.getElementById('wmapcanvas') as HTMLCanvasElement | null;
  if (!c || !wmBase) return;
  const g = c.getContext('2d')!, k = WM_PX / TILE_SIZE;
  g.drawImage(wmBase, 0, 0);
  const dot = (x: number, y: number, r: number, col: string) => { g.fillStyle = col; g.beginPath(); g.arc(x * k, y * k, r, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#000'; g.lineWidth = 1; g.stroke(); };
  g.font = 'bold 13px Georgia, serif'; g.textAlign = 'center';
  for (const z of f.zones) { // keep every label inside the frame
    const hw = g.measureText(z.name).width / 2 + 4, lx = Math.max(hw, Math.min(c.width - hw, z.x * k)), ly = z.y * k;
    g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(lx - hw, ly - 12, hw * 2, 17);
    g.fillStyle = '#ffe9a8'; g.fillText(z.name, lx, ly);
  }
  for (const h of f.herbs) dot(h.x, h.y, 2.5, '#ffe27a');
  for (const n of f.npcs) dot(n.x, n.y, 4, '#ffffff');
  for (const e of f.enemies) dot(e.x, e.y, e.elite ? 3.5 : 2.5, e.elite ? '#ffb02e' : '#ff5a4a');
  for (const b of f.bosses) dot(b.x, b.y, 6, '#d01010');
  if (f.objective) { g.strokeStyle = '#ffd23f'; g.lineWidth = 3; g.beginPath(); g.arc(f.objective.x * k, f.objective.y * k, 11, 0, Math.PI * 2); g.stroke(); }
  g.save(); g.translate(f.player.x * k, f.player.y * k); g.rotate(Math.atan2(f.facing.y, f.facing.x));
  g.fillStyle = '#fff'; g.strokeStyle = '#000'; g.lineWidth = 2; g.beginPath(); g.moveTo(9, 0); g.lineTo(-6, 6); g.lineTo(-3, 0); g.lineTo(-6, -6); g.closePath(); g.fill(); g.stroke(); g.restore();
}
