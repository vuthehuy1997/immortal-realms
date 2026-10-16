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
export function initMinimap(w: WorldMap): void {
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
  c.width = 156; c.height = 156;
  ctx = c.getContext('2d')!;
}

export interface MinimapFrame {
  player: { x: number; y: number }; facing: { x: number; y: number };
  enemies: { x: number; y: number; elite: boolean }[]; bosses: { x: number; y: number }[];
  npcs: { x: number; y: number }[]; herbs: { x: number; y: number }[];
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
  ctx.restore();
  // player arrow
  const a = Math.atan2(f.facing.y, f.facing.x);
  ctx.save(); ctx.translate(S / 2, S / 2); ctx.rotate(a);
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-4, 4); ctx.lineTo(-2, 0); ctx.lineTo(-4, -4); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  void view;
}

export function removeMinimap(): void { document.getElementById('minimap')?.remove(); ctx = null; base = null; world = null; }
