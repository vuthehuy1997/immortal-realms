// Renders a chapter map or a dungeon to a PPM image for eyeballing layouts:
//   node tools/map_preview.mjs chapter 3 out.ppm      |      node tools/map_preview.mjs dungeon <id> out.ppm
// Convert with: python3 -c "from PIL import Image; Image.open('out.ppm').save('out.png')"
import './ts-loader.mjs';
import { writeFileSync } from 'node:fs';

const world = await import(new URL('../src/core/world.ts', import.meta.url).href);
const [, , mode, which, out = 'preview.ppm'] = process.argv;
const m = mode === 'dungeon' ? world.generateDungeonMap(which) : world.generateChapter(Number(which));
const PX = 4;
const COLOR = { grass: [106, 154, 74], grassDark: [66, 116, 64], moss: [78, 124, 84], path: [182, 146, 102], stone: [152, 154, 162], water: [50, 104, 152], sand: [208, 188, 134], snow: [226, 234, 244], ice: [150, 200, 226], ash: [96, 92, 98], lava: [220, 90, 30], cloud: [214, 208, 238], jade: [92, 164, 138], crimson: [124, 50, 58], clay: [194, 132, 86], basalt: [72, 68, 82], wall: [30, 26, 28], void: [14, 12, 36] };
const W = m.width * PX, H = m.height * PX, buf = Buffer.alloc(W * H * 3);
const put = (x, y, c) => { if (x < 0 || y < 0 || x >= W || y >= H) return; const o = (y * W + x) * 3; buf[o] = c[0]; buf[o + 1] = c[1]; buf[o + 2] = c[2]; };
for (let ty = 0; ty < m.height; ty++) for (let tx = 0; tx < m.width; tx++) {
  const i = ty * m.width + tx; let c = COLOR[m.ground[i]] ?? [255, 0, 255];
  const edge = tx + 1 < m.width && m.zone[i] !== m.zone[i + 1] || ty + 1 < m.height && m.zone[i] !== m.zone[i + m.width];
  if (m.blocked[i] && !['water', 'lava', 'wall', 'void'].includes(m.ground[i])) c = c.map((v) => v * 0.55);
  if (edge) c = c.map((v) => v * 0.7);
  for (let dy = 0; dy < PX; dy++) for (let dx = 0; dx < PX; dx++) put(tx * PX + dx, ty * PX + dy, c);
}
const dot = (wx, wy, c, r = 2) => { const x = Math.round((wx / 16) * PX), y = Math.round((wy / 16) * PX); for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) put(x + dx, y + dy, c); };
const BUILD = new Set(['palace', 'pagoda7', 'pavilion', 'tower', 'goldpaifang', 'goldgate', 'paifang', 'corridor']);
for (const p of m.props) { if (p.kind === 'array' || p.kind === 'lotuspond' || p.kind === 'lingzhi') continue; dot(p.x, p.y - 6, BUILD.has(p.kind) ? [240, 210, 90] : p.kind === 'moonwall' ? [120, 120, 255] : [20, 70, 30], 1); }
for (const h of m.herbs) dot(h.x, h.y, [255, 80, 220], 2);
for (const n of Object.values(m.npcs)) dot(n.x, n.y, [255, 255, 255], 3);
for (const b of Object.values(m.bossHomes)) dot(b.x, b.y, [255, 30, 30], 5);
dot(m.spawn.x, m.spawn.y, [0, 255, 255], 4);
dot(m.portal.x, m.portal.y, [80, 80, 255], 4);
if (m.portalNext) dot(m.portalNext.x, m.portalNext.y, [255, 140, 0], 4);
for (const e of Object.values(m.entrances ?? {})) dot(e.x, e.y, [0, 255, 120], 4);
writeFileSync(out, Buffer.concat([Buffer.from(`P6\n${W} ${H}\n255\n`), buf]));
console.log(`${out}: ${m.width}x${m.height} tiles, ${m.props.length} props, ${m.herbs.length} herbs`);
