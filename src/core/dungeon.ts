import type { DungeonDef } from '../data/dungeons';
import type { PropKind } from '../data/props';
import { createRng } from './rng';
import type { Vec2 } from './movement';
import { BORDER, createPlacer, sealPockets } from './mapgen';
import { TILE_SIZE, tileToWorld, type GroundKind, type PropInst, type WorldMap } from './world';

type Rng = () => number;

/**
 * Tunnel widths (tiles). Round 22: the old 3.4-4 wide tunnels pinned big bodies (a boss body needs a 3-tile-wide lane, an elite plus the hero more);
 * the main route is now at least `SPINE_WIDTH`, and `tests/dungeons.test.ts` proves a body with 5 tiles of clearance can walk gate to boss in every dungeon.
 */
export const SPINE_WIDTH = 7;
export const SIDE_WIDTH = 5;
/** the guaranteed route stays free of props this far (tiles) either side */
const ROUTE_CLEAR = 3;

/** Shortest open 4-connected route between two tiles (null if cut off). */
function routeBetween(w: number, h: number, blocked: Uint8Array, a: Vec2, b: Vec2): number[] | null {
  const start = Math.floor(a.y) * w + Math.floor(a.x), goal = Math.floor(b.y) * w + Math.floor(b.x);
  const prev = new Int32Array(w * h).fill(-2); prev[start] = -1;
  const q = [start];
  for (let head = 0; head < q.length; head++) {
    const i = q[head]!;
    if (i === goal) { const out: number[] = []; for (let k = i; k !== -1; k = prev[k]!) out.push(k); return out.reverse(); }
    const x = i % w, y = (i - x) / w;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = x + dx, ny = y + dy, j = ny * w + nx;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h || blocked[j] || prev[j] !== -2) continue;
      prev[j] = i; q.push(j);
    }
  }
  return null;
}

const carveCircle = (open: Uint8Array, w: number, h: number, cx: number, cy: number, r: number): void => {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
    if (x > 1 && y > 1 && x < w - 2 && y < h - 2 && Math.hypot(x - cx, y - cy) <= r) open[y * w + x] = 1;
  }
};

/** A wandering tunnel `width` tiles wide from a to b: it drifts sideways but always makes progress. */
function carveTunnel(open: Uint8Array, w: number, h: number, a: Vec2, b: Vec2, width: number, rng: Rng): void {
  let { x, y } = a;
  const steps = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) * 2.2);
  for (let i = 0; i < steps && Math.hypot(b.x - x, b.y - y) > 1.5; i++) {
    const dx = b.x - x, dy = b.y - y, d = Math.hypot(dx, dy);
    x += (dx / d) * 0.6 + (rng() - 0.5) * 0.9;
    y += (dy / d) * 0.6 + (rng() - 0.5) * 0.9;
    carveCircle(open, w, h, x, y, width / 2);
  }
  carveCircle(open, w, h, b.x, b.y, width / 2);
}

function carveCave(def: DungeonDef, rng: Rng, open: Uint8Array, entrance: Vec2, boss: Vec2): void {
  const { w, h } = def.size;
  for (let y = 3; y < h - 3; y++) for (let x = 3; x < w - 3; x++) if (rng() < 0.46) open[y * w + x] = 1;
  for (let pass = 0; pass < 5; pass++) {
    const next = new Uint8Array(open);
    for (let y = 2; y < h - 2; y++) for (let x = 2; x < w - 2; x++) {
      let c = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) c += open[(y + dy) * w + x + dx]!;
      next[y * w + x] = c >= 5 ? 1 : 0;
    }
    open.set(next);
  }
  // guaranteed spine from the gate to the boss chamber, plus a few side caverns
  const mid: Vec2 = { x: (entrance.x + boss.x) / 2, y: h / 2 + (rng() - 0.5) * h * 0.5 };
  carveTunnel(open, w, h, entrance, mid, SPINE_WIDTH, rng);
  carveTunnel(open, w, h, mid, boss, SPINE_WIDTH, rng);
  for (let k = 0; k < 4; k++) {
    const c: Vec2 = { x: 12 + rng() * (w - 24), y: 8 + rng() * (h - 16) };
    carveCircle(open, w, h, c.x, c.y, 4 + rng() * 3);
    carveTunnel(open, w, h, c, mid, SIDE_WIDTH, rng);
  }
  carveCircle(open, w, h, entrance.x + 1, entrance.y, 5.5);
  carveCircle(open, w, h, boss.x, boss.y, 9.5);
}

/** Chain of chambers joined by straight corridors; returns each chamber's centre. */
function carveRealm(def: DungeonDef, rng: Rng, open: Uint8Array, entrance: Vec2, boss: Vec2): Vec2[] {
  const { w, h } = def.size;
  const count = Math.max(3, def.rooms ?? 4);
  const centres: Vec2[] = [entrance];
  for (let i = 1; i < count - 1; i++) {
    centres.push({ x: entrance.x + ((boss.x - entrance.x) * i) / (count - 1), y: 14 + rng() * (h - 28) });
  }
  centres.push(boss);
  centres.forEach((c, i) => {
    const last = i === centres.length - 1;
    const rx = last ? 11 : 6 + rng() * 3, ry = last ? 11 : 6 + rng() * 3;
    for (let y = Math.floor(c.y - ry); y <= Math.ceil(c.y + ry); y++) for (let x = Math.floor(c.x - rx); x <= Math.ceil(c.x + rx); x++) {
      // rounded rectangle: soft corners without becoming a plain circle
      const nx = Math.abs(x - c.x) / rx, ny = Math.abs(y - c.y) / ry;
      if (x > 1 && y > 1 && x < w - 2 && y < h - 2 && Math.pow(nx, 4) + Math.pow(ny, 4) <= 1) open[y * w + x] = 1;
    }
  });
  for (let i = 0; i < centres.length - 1; i++) {
    const a = centres[i]!, b = centres[i + 1]!;
    const corner: Vec2 = { x: b.x, y: a.y };
    carveTunnel(open, w, h, a, corner, SPINE_WIDTH, rng);
    carveTunnel(open, w, h, corner, b, SPINE_WIDTH, rng);
  }
  return centres;
}

/**
 * Deterministic map of a cave or secret realm. Walls are impassable ground (`wall` rock or `void`), the gate at the west end
 * is both the way out and the player's spawn, the boss waits in the biggest chamber at the east end.
 */
export function generateDungeon(def: DungeonDef): WorldMap {
  const { w, h } = def.size;
  const rng = createRng(def.seed);
  const open = new Uint8Array(w * h);
  const entranceT: Vec2 = { x: 7, y: Math.floor(h / 2) };
  const bossT: Vec2 = { x: w - 13, y: Math.floor(h / 2) + Math.round((rng() - 0.5) * 8) };
  const chambers: Vec2[] = [];
  if (def.kind === 'cave') carveCave(def, rng, open, entranceT, bossT);
  else chambers.push(...carveRealm(def, rng, open, entranceT, bossT));

  const ground: GroundKind[] = new Array<GroundKind>(w * h).fill(def.wall);
  const blocked = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) { if (open[i]) ground[i] = def.floor; else blocked[i] = 1; }
  // never wall in the player: everything that cannot be reached from the gate becomes rock
  sealPockets(w, h, blocked, ground, entranceT, def.wall);
  // floor accents so large chambers are not one flat colour
  const accent = createRng(def.seed ^ 0x51ed);
  for (let i = 0; i < w * h; i++) if (ground[i] === def.floor && accent() < 0.05) ground[i] = def.floor === 'stone' ? 'basalt' : def.floor;

  const props: PropInst[] = [];
  const { place, occ, at, reserved } = createPlacer(w, h, blocked, props);
  // the gate-to-boss route keeps a clear lane: no scatter, pillar or boulder may narrow it
  const route = routeBetween(w, h, blocked, entranceT, bossT) ?? [];
  for (const i of route) { const x = i % w, y = (i - x) / w; for (let dy = -ROUTE_CLEAR; dy <= ROUTE_CLEAR; dy++) for (let dx = -ROUTE_CLEAR; dx <= ROUTE_CLEAR; dx++) { const tx = x + dx, ty = y + dy; if (tx >= 0 && ty >= 0 && tx < w && ty < h) reserved[ty * w + tx] = 1; } }
  const gate = tileToWorld({ x: entranceT.x - 3, y: entranceT.y + 1 });
  // exit gate stands in the rock behind the spawn; the array under it is where E works
  props.push({ kind: 'moonwall', x: gate.x, y: gate.y }); // set into the cavern wall: scenery only, so it never walls in the spawn
  props.push({ kind: 'array', x: gate.x, y: gate.y + 2 });
  const bossW = tileToWorld(bossT);
  props.push({ kind: 'array', x: bossW.x, y: bossW.y + 8 });

  // pillars around the boss chamber so the fight has cover to play with
  for (let k = 0; k < 6; k++) {
    const ang = (k / 6) * Math.PI * 2 + 0.3;
    place(def.kind === 'cave' ? 'taihurocks' : 'standstone', Math.round(bossT.x + Math.cos(ang) * 6.5), Math.round(bossT.y + Math.sin(ang) * 6), { force: true, margin: 0 });
  }
  if (def.kind === 'realm') for (const c of chambers.slice(1, -1)) {
    place('lotusbowl', Math.round(c.x), Math.round(c.y), { margin: 2 });
    for (const [dx, dy] of [[-4, -3], [4, -3], [-4, 3], [4, 3]] as const) place('standstone', Math.round(c.x + dx), Math.round(c.y + dy), { margin: 0 });
  }
  for (const s of def.scatter) {
    for (let ty = BORDER; ty < h - BORDER; ty++) for (let tx = BORDER; tx < w - BORDER; tx++) {
      if (ground[at(tx, ty)] !== def.wall && Math.hypot(tx - entranceT.x, ty - entranceT.y) > 6 && Math.hypot(tx - bossT.x, ty - bossT.y) > 8 && rng() < s.p) place(s.kind, tx, ty, { margin: 1 });
    }
  }
  // dressing in the rock around the floor: purely visual, never blocks anything that is open
  if (def.kind === 'realm') {
    const far: PropKind[] = ['floatisle', 'floatisle', 'petals'];
    for (let k = 0; k < 40; k++) {
      const tx = BORDER + Math.floor(rng() * (w - 2 * BORDER)), ty = BORDER + Math.floor(rng() * (h - 2 * BORDER));
      if (ground[at(tx, ty)] === def.wall && !occ[at(tx, ty)]) props.push({ kind: far[k % far.length]!, x: (tx + 0.5) * TILE_SIZE, y: (ty + 1) * TILE_SIZE });
    }
  } else {
    // a cave's rock face: boulders and stalagmite-like rocks set two tiles inside the wall so the rim reads as stone, not a flat smudge
    const deep = (tx: number, ty: number): boolean => {
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (ground[at(tx + dx, ty + dy)] !== def.wall) return false;
      return true;
    };
    const rim: PropKind[] = ['taihurocks', 'rock', 'taihurocks'];
    for (let k = 0, tries = 0; k < 70 && tries < 4000; tries++) {
      const tx = BORDER + 2 + Math.floor(rng() * (w - 2 * BORDER - 4)), ty = BORDER + 2 + Math.floor(rng() * (h - 2 * BORDER - 4));
      if (!deep(tx, ty) || occ[at(tx, ty)]) continue;
      props.push({ kind: rim[k % rim.length]!, x: (tx + 0.5) * TILE_SIZE, y: (ty + 1) * TILE_SIZE }); k++;
    }
  }

  const herbs: Vec2[] = [];
  for (let k = 0, tries = 0; k < def.herbs && tries < 4000; tries++) {
    const tx = BORDER + Math.floor(rng() * (w - 2 * BORDER)), ty = BORDER + Math.floor(rng() * (h - 2 * BORDER));
    const i = at(tx, ty);
    if (blocked[i] || occ[i] || Math.hypot(tx - entranceT.x, ty - entranceT.y) < 6) continue;
    const p = { x: (tx + 0.5) * TILE_SIZE, y: (ty + 1) * TILE_SIZE - 2 };
    herbs.push(p); props.push({ kind: 'lingzhi', x: p.x, y: p.y }); occ[i] = 1; k++;
  }

  const spawn = tileToWorld({ x: entranceT.x + 1, y: entranceT.y });
  const centre = tileToWorld({ x: w / 2, y: h / 2 });
  return {
    chapter: def.chapter, dungeon: def.id, width: w, height: h, ground, zone: new Array<string>(w * h).fill(def.id), blocked, props, spawn,
    lair: bossW, den: bossW, pool: bossW, bossHomes: { [def.boss]: bossW }, portal: gate, entrances: {}, anchors: { [def.id]: centre }, npcs: {}, herbs,
    arrayPos: { x: spawn.x + 14, y: spawn.y },
  };
}
