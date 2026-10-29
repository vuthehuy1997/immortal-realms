import type { DungeonDef } from '../data/dungeons';
import type { PropKind } from '../data/props';
import { createRng } from './rng';
import { DUNGEON_FEATURES } from '../data/dungeonFeatures';
import { layoutFeatures } from './dungeonFeatures';
import type { Vec2 } from './movement';
import { BORDER, createPlacer, sealPockets } from './mapgen';
import { createNoise, fbm } from './noise';
import { TILE_SIZE, tileToWorld, type GroundKind, type PropInst, type WorldMap } from './world';

type Rng = () => number;

/** Second and third floor colours per base floor: noise patches so a chamber is never one flat colour. */
const FLOOR_ACCENTS: Partial<Record<GroundKind, [GroundKind, GroundKind]>> = {
  stone: ['basalt', 'path'], basalt: ['stone', 'ash'], sand: ['path', 'clay'], moss: ['grassDark', 'stone'], ice: ['snow', 'stone'],
  ash: ['basalt', 'stone'], cloud: ['ice', 'snow'], jade: ['stone', 'moss'], crimson: ['clay', 'basalt'], clay: ['crimson', 'path'],
};

/**
 * Tunnel widths (tiles). Round 22: the old 3.4-4 wide tunnels pinned big bodies (a boss body needs a 3-tile-wide lane, an elite plus the hero more);
 * the main route is now at least `SPINE_WIDTH`, and `tests/dungeons.test.ts` proves a body with 5 tiles of clearance can walk gate to boss in every dungeon.
 */
export const SPINE_WIDTH = 7;
export const SIDE_WIDTH = 5;
/** the guaranteed route stays free of props this far (tiles) either side */
const ROUTE_CLEAR = 3;

const carveCircle = (open: Uint8Array, w: number, h: number, cx: number, cy: number, r: number): void => {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
    if (x > 1 && y > 1 && x < w - 2 && y < h - 2 && Math.hypot(x - cx, y - cy) <= r) open[y * w + x] = 1;
  }
};

/** A wandering tunnel `width` tiles wide from a to b: it drifts sideways but always makes progress. */
function carveTunnel(open: Uint8Array, w: number, h: number, a: Vec2, b: Vec2, width: number, rng: Rng, trail?: Vec2[]): void {
  let { x, y } = a;
  const steps = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) * 2.2);
  for (let i = 0; i < steps && Math.hypot(b.x - x, b.y - y) > 1.5; i++) {
    const dx = b.x - x, dy = b.y - y, d = Math.hypot(dx, dy);
    x += (dx / d) * 0.6 + (rng() - 0.5) * 0.9;
    y += (dy / d) * 0.6 + (rng() - 0.5) * 0.9;
    carveCircle(open, w, h, x, y, width / 2); trail?.push({ x, y });
  }
  carveCircle(open, w, h, b.x, b.y, width / 2); trail?.push({ ...b });
}

function carveCave(def: DungeonDef, rng: Rng, open: Uint8Array, entrance: Vec2, boss: Vec2, spine: Vec2[]): void {
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
  carveTunnel(open, w, h, entrance, mid, SPINE_WIDTH, rng, spine);
  carveTunnel(open, w, h, mid, boss, SPINE_WIDTH, rng, spine);
  for (let k = 0; k < 4; k++) {
    const c: Vec2 = { x: 12 + rng() * (w - 24), y: 8 + rng() * (h - 16) };
    carveCircle(open, w, h, c.x, c.y, 4 + rng() * 3);
    carveTunnel(open, w, h, c, mid, SIDE_WIDTH, rng);
  }
  carveCircle(open, w, h, entrance.x + 1, entrance.y, 5.5);
  carveCircle(open, w, h, boss.x, boss.y, 9.5);
}

/** Chain of chambers joined by straight corridors; returns each chamber's centre. */
function carveRealm(def: DungeonDef, rng: Rng, open: Uint8Array, entrance: Vec2, boss: Vec2, spine: Vec2[]): Vec2[] {
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
    carveTunnel(open, w, h, a, corner, SPINE_WIDTH, rng, spine);
    carveTunnel(open, w, h, corner, b, SPINE_WIDTH, rng, spine);
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
  const chambers: Vec2[] = [], spine: Vec2[] = [];
  if (def.kind === 'cave') carveCave(def, rng, open, entranceT, bossT, spine);
  else chambers.push(...carveRealm(def, rng, open, entranceT, bossT, spine));

  const ground: GroundKind[] = new Array<GroundKind>(w * h).fill(def.wall);
  const blocked = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) { if (open[i]) ground[i] = def.floor; else blocked[i] = 1; }
  // never wall in the player: everything that cannot be reached from the gate becomes rock
  sealPockets(w, h, blocked, ground, entranceT, def.wall);
  // floor accents so large chambers are not one flat colour
  const accent = createRng(def.seed ^ 0x51ed), tone = createNoise(def.seed ^ 0xacc0), pal = FLOOR_ACCENTS[def.floor];
  for (let i = 0; i < w * h; i++) {
    if (ground[i] !== def.floor) continue;
    if (pal) { const v = fbm(tone, (i % w) * 0.085, Math.floor(i / w) * 0.085, 3); if (v > 0.6) ground[i] = pal[0]; else if (v < 0.33) ground[i] = pal[1]; }
    if (ground[i] === def.floor && accent() < 0.05) ground[i] = def.floor === 'stone' ? 'basalt' : def.floor;
  }

  const props: PropInst[] = [];
  const { place, occ, at, reserved } = createPlacer(w, h, blocked, props);
  // mechanics first: they claim their tiles (and close the seal gate) before any scenery is placed
  const features = layoutFeatures(DUNGEON_FEATURES[def.id] ?? [], { w, h, blocked }, entranceT, bossT, spine, createRng(def.seed ^ 0xfea7), occ);
  for (const i of features.gate?.tiles ?? []) blocked[i] = 1;
  /**
   * Dressing must never cut the dungeon into pockets, with the seal gate closed (what you can reach before it) or open (the whole map).
   * Fast path: a footprint whose surrounding ring of tiles is one open run cannot disconnect anything; otherwise two flood fills decide.
   */
  const gateSet = new Set(features.gate?.tiles ?? []);
  const flood = (gateOpen: boolean): Uint8Array => {
    const seen = new Uint8Array(w * h), st = [Math.floor(entranceT.y) * w + Math.floor(entranceT.x)];
    seen[st[0]!] = 1;
    while (st.length) {
      const i = st.pop()!, x = i % w, y = (i - x) / w;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const nx = x + dx, ny = y + dy, j = ny * w + nx;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h || seen[j] || (blocked[j] && !(gateOpen && gateSet.has(j)))) continue;
        seen[j] = 1; st.push(j);
      }
    }
    return seen;
  };
  const ringRuns = (x0: number, y0: number, x1: number, y1: number, gateOpen: boolean): number => {
    const ring: number[] = [];
    for (let x = x0 - 1; x <= x1 + 1; x++) ring.push(x, y0 - 1);
    for (let y = y0; y <= y1 + 1; y++) ring.push(x1 + 1, y);
    for (let x = x1; x >= x0 - 1; x--) ring.push(x, y1 + 1);
    for (let y = y1; y >= y0; y--) ring.push(x0 - 1, y);
    const open = (k: number): boolean => { const x = ring[k * 2]!, y = ring[k * 2 + 1]!; if (x < 0 || y < 0 || x >= w || y >= h) return false; const i = y * w + x; return !blocked[i] || (gateOpen && gateSet.has(i)); };
    const n = ring.length / 2; let runs = 0;
    for (let k = 0; k < n; k++) if (open(k) && !open((k + n - 1) % n)) runs++;
    return runs;
  };
  /** `place`, undone when it would wall off any part of the dungeon */
  const safePlace = (kind: PropKind, tx: number, ty: number, opts: { force?: boolean; margin?: number } = {}): boolean => {
    const b0 = blocked.slice(), o0 = occ.slice(), n0 = props.length;
    if (!place(kind, tx, ty, opts)) return false;
    let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    for (let y = Math.max(0, ty - 8); y < Math.min(h, ty + 8); y++) for (let x = Math.max(0, tx - 8); x < Math.min(w, tx + 8); x++) if (blocked[y * w + x] && !b0[y * w + x]) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    if (x1 < 0) return true; // a prop with no footprint
    const safeLocally = ringRuns(x0, y0, x1, y1, false) <= 1 && ringRuns(x0, y0, x1, y1, true) <= 1;
    if (safeLocally) return true;
    const afterSealed = flood(false), afterWhole = flood(true);
    const before = { s: sealedBefore(b0, false), w: sealedBefore(b0, true) };
    for (let i = 0; i < w * h; i++) if (!blocked[i] && ((before.s[i] && !afterSealed[i]) || (before.w[i] && !afterWhole[i]))) { blocked.set(b0); occ.set(o0); props.length = n0; return false; }
    return true;
  };
  /** reachability of the map as it was (before the candidate prop) */
  const sealedBefore = (b0: Uint8Array, gateOpen: boolean): Uint8Array => {
    const keep = blocked.slice(); blocked.set(b0);
    const r = flood(gateOpen); blocked.set(keep);
    return r;
  };
  for (const c of spine) { const cx = Math.round(c.x), cy = Math.round(c.y); for (let dy = -ROUTE_CLEAR; dy <= ROUTE_CLEAR; dy++) for (let dx = -ROUTE_CLEAR; dx <= ROUTE_CLEAR; dx++) { const tx = cx + dx, ty = cy + dy; if (tx >= 0 && ty >= 0 && tx < w && ty < h) reserved[ty * w + tx] = 1; } }
  const gate = tileToWorld({ x: entranceT.x - 3, y: entranceT.y + 1 });
  // exit gate stands in the rock behind the spawn; the array under it is where E works
  props.push({ kind: 'moonwall', x: gate.x, y: gate.y }); // set into the cavern wall: scenery only, so it never walls in the spawn
  props.push({ kind: 'array', x: gate.x, y: gate.y + 2 });
  const bossW = tileToWorld(bossT);
  props.push({ kind: 'array', x: bossW.x, y: bossW.y + 8 });

  // pillars around the boss chamber so the fight has cover to play with; the west side (where the route arrives) stays open so the lane is never closed
  for (let k = 0; k < 8; k++) {
    const ang = (k / 8) * Math.PI * 2 + 0.4;
    if (Math.abs(Math.atan2(Math.sin(ang - Math.PI), Math.cos(ang - Math.PI))) < 1.25) continue; // within ~70 degrees of west
    safePlace(def.kind === 'cave' ? 'taihurocks' : 'standstone', Math.round(bossT.x + Math.cos(ang) * 7), Math.round(bossT.y + Math.sin(ang) * 6.5), { force: true, margin: 0 });
  }
  if (def.kind === 'realm') for (const c of chambers.slice(1, -1)) {
    safePlace('lotusbowl', Math.round(c.x), Math.round(c.y), { margin: 2 });
    for (const [dx, dy] of [[-4, -3], [4, -3], [-4, 3], [4, 3]] as const) safePlace('standstone', Math.round(c.x + dx), Math.round(c.y + dy), { margin: 0 });
  }
  for (const s of def.scatter) {
    for (let ty = BORDER; ty < h - BORDER; ty++) for (let tx = BORDER; tx < w - BORDER; tx++) {
      if (ground[at(tx, ty)] !== def.wall && Math.hypot(tx - entranceT.x, ty - entranceT.y) > 6 && Math.hypot(tx - bossT.x, ty - bossT.y) > 8 && rng() < s.p) safePlace(s.kind, tx, ty, { margin: 1 });
    }
  }
  // dressing in the rock around the floor: purely visual, never blocks anything that is open
  if (def.kind === 'realm') {
    const far: PropKind[] = ['floatisle', 'floatisle', 'petals'];
    for (let k = 0; k < 110; k++) {
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
    for (let k = 0, tries = 0; k < 170 && tries < 6000; tries++) {
      const tx = BORDER + 2 + Math.floor(rng() * (w - 2 * BORDER - 4)), ty = BORDER + 2 + Math.floor(rng() * (h - 2 * BORDER - 4));
      if (!deep(tx, ty) || occ[at(tx, ty)]) continue;
      props.push({ kind: rim[k % rim.length]!, x: (tx + 0.5) * TILE_SIZE, y: (ty + 1) * TILE_SIZE }); k++;
    }
  }

  // interior dressing (round 22): boulders hugging the walls and clusters on the floor, so chambers are furnished, not empty halls
  const vocab = [...new Set(def.scatter.map((x) => x.kind).filter((k) => k !== 'lingzhi'))];
  const wallish: PropKind[] = def.kind === 'cave' ? ['rock', 'rock', 'rock', 'taihurocks'] : ['standstone', 'stonecircle', 'standstone'];
  const cluster: PropKind[] = def.kind === 'cave' ? ['rock', 'rock', ...vocab] : ['petals', 'standstone', ...vocab];
  let floorTiles = 0; for (let i = 0; i < w * h; i++) if (!blocked[i]) floorTiles++;
  for (let ty = BORDER; ty < h - BORDER; ty++) for (let tx = BORDER; tx < w - BORDER; tx++) {
    if (blocked[at(tx, ty)] || reserved[at(tx, ty)] || occ[at(tx, ty)]) continue;
    const rim = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => ground[at(tx + dx!, ty + dy!)] === def.wall);
    if (rim && rng() < (def.kind === 'cave' ? 0.14 : 0.1) && Math.hypot(tx - bossT.x, ty - bossT.y) > 9 && Math.hypot(tx - entranceT.x, ty - entranceT.y) > 6) safePlace(wallish[Math.floor(rng() * wallish.length)]!, tx, ty, { margin: 0 });
  }
  for (let k = 0, tries = 0; k < Math.floor(floorTiles / 75) && tries < 3000; tries++) {
    const tx = BORDER + 2 + Math.floor(rng() * (w - 2 * BORDER - 4)), ty = BORDER + 2 + Math.floor(rng() * (h - 2 * BORDER - 4));
    if (blocked[at(tx, ty)] || reserved[at(tx, ty)] || occ[at(tx, ty)] || Math.hypot(tx - entranceT.x, ty - entranceT.y) < 7 || Math.hypot(tx - bossT.x, ty - bossT.y) < 10) continue;
    let placed = 0;
    for (let j = 0; j < 4; j++) { const a = rng() * Math.PI * 2, r = j ? 1.2 + rng() * 1.8 : 0; if (safePlace(cluster[Math.floor(rng() * cluster.length)]!, Math.round(tx + Math.cos(a) * r), Math.round(ty + Math.sin(a) * r), { margin: 0 })) placed++; }
    if (placed) k++;
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
    chapter: def.chapter, dungeon: def.id, width: w, height: h, ground, zone: new Array<string>(w * h).fill(def.id), blocked, props, spawn, features,
    lair: bossW, den: bossW, pool: bossW, bossHomes: { [def.boss]: bossW }, portal: gate, entrances: {}, anchors: { [def.id]: centre }, npcs: {}, herbs,
    arrayPos: { x: spawn.x + 14, y: spawn.y },
  };
}
