import type { Vec2 } from './movement';
import { TILE_SIZE } from './world';

/**
 * Dungeon mechanics (round 22). Rooms are more than walk-fight-boss: cyclic traps (spike / fire / poison mist), pressure plates or timed
 * braziers that open a seal gate on the way to the boss, collapsing floor, and timed ambush waves. Everything here is pure and deterministic:
 * `layoutFeatures` decides WHERE (from the carved map, seeded), `tickFeatures` decides WHAT HAPPENS (from the hero's position and the clock).
 * The scene (`src/game/dungeonView.ts`) only draws and applies the events. Content: `src/data/dungeonFeatures.ts`.
 */
export type TrapStyle = 'spike' | 'fire' | 'mist';
export type FeatureDef =
  /** `fields` clusters on the route; each holds `per` traps (spike / fire: single tiles, mist: one big cloud). Cycle: idle, warn, active. `pct` = share of max HP per hit */
  | { kind: 'traps'; style: TrapStyle; fields: number; per: number; period: number; warn: number; active: number; pct: number }
  /** step on every plate (latched) to open the seal gate */
  | { kind: 'plates'; count: number }
  /** light every brazier (walk beside it) within `litFor` seconds of the first to open the seal gate */
  | { kind: 'braziers'; count: number; litFor: number }
  /** crumbling floor discs on the route: crack for 1 s, pit for `pit` s; a spirit-stone cache sits in the middle */
  | { kind: 'collapse'; patches: number; pit: number; cache: number; fall: number }
  /** stepping into the rune circle starts `waves` waves of `per` foes `gap` s apart; clearing them pays `xp` / `stones` */
  | { kind: 'ambush'; waves: number; per: number; gap: number; xp: number; stones: number };
export type FeatureKind = FeatureDef['kind'];

export interface Trap { id: number; style: TrapStyle; at: Vec2; radius: number; offset: number; period: number; warn: number; active: number; pct: number }
export interface Patch { id: number; tiles: { x: number; y: number }[]; centre: Vec2; pit: number; fall: number; cache: number }
export interface Ambush { at: Vec2; radius: number; runes: Vec2[]; waves: number; per: number; gap: number; xp: number; stones: number }
export interface FeatureLayout {
  traps: Trap[];
  plates: Vec2[];
  braziers: Vec2[]; litFor: number;
  /** tile indices of the seal gate (blocked until opened); `by` says what opens it */
  gate: { tiles: number[]; by: 'plates' | 'braziers' } | null;
  patches: Patch[];
  ambush: Ambush | null;
}

export const PLATE_RADIUS = 14;
export const BRAZIER_RADIUS = 22;
export const CRACK_TIME = 1.0;
export const AMBUSH_TRIGGER = 48; // 3 tiles
export const TRAP_HIT_COOLDOWN = 0.6;
/** The timer may start the next ambush wave only while at most this many of the previous wave still live, so waves can never pile up (round 23, QA 7 F9). */
export const ambushLiveCap = (per: number): number => Math.ceil(per / 2);

export interface Grid { w: number; h: number; blocked: Uint8Array }
export const emptyLayout = (): FeatureLayout => ({ traps: [], plates: [], braziers: [], litFor: 0, gate: null, patches: [], ambush: null });

/** 4-connected walking distance (tiles) from `from` over open tiles; -1 = unreachable. */
export function distanceField(g: Grid, from: Vec2): Int32Array {
  const dist = new Int32Array(g.w * g.h).fill(-1), q: number[] = [];
  const s = Math.floor(from.y) * g.w + Math.floor(from.x);
  if (g.blocked[s]) return dist;
  dist[s] = 0; q.push(s);
  for (let head = 0; head < q.length; head++) {
    const i = q[head]!, x = i % g.w, y = (i - x) / g.w;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = x + dx, ny = y + dy, j = ny * g.w + nx;
      if (nx < 0 || ny < 0 || nx >= g.w || ny >= g.h || g.blocked[j] || dist[j] !== -1) continue;
      dist[j] = dist[i]! + 1; q.push(j);
    }
  }
  return dist;
}

const tileCentre = (x: number, y: number): Vec2 => ({ x: (x + 0.5) * TILE_SIZE, y: (y + 0.5) * TILE_SIZE });

/**
 * Decides where every feature of `feats` goes. `spine` is the carved gate-to-boss route (tile coordinates), `occ` receives a mark on every tile a
 * feature uses so scenery stays off it. Same seed, same layout.
 */
export function layoutFeatures(feats: FeatureDef[], g: Grid, entrance: Vec2, boss: Vec2, spine: Vec2[], rng: () => number, occ: Uint8Array): FeatureLayout {
  const out = emptyLayout();
  if (!feats.length) return out;
  const dist = distanceField(g, entrance), at = (x: number, y: number) => y * g.w + x;
  const bossD = dist[at(Math.floor(boss.x), Math.floor(boss.y))]!;
  const open = (x: number, y: number) => x >= 0 && y >= 0 && x < g.w && y < g.h && !g.blocked[at(x, y)];
  const clearDisc = (cx: number, cy: number, r: number): boolean => {
    for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx++) if (Math.hypot(dx, dy) <= r && (!open(cx + dx, cy + dy) || occ[at(cx + dx, cy + dy)])) return false;
    return true;
  };
  const mark = (cx: number, cy: number, r: number) => { for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx++) if (Math.hypot(dx, dy) <= r && cx + dx >= 0 && cy + dy >= 0 && cx + dx < g.w && cy + dy < g.h) occ[at(cx + dx, cy + dy)] = 1; };
  const spineAt = (f: number): Vec2 => spine[Math.max(0, Math.min(spine.length - 1, Math.round(f * (spine.length - 1))))] ?? entrance;
  const nearSpine = (x: number, y: number): number => { let best = Infinity; for (let i = 0; i < spine.length; i += 3) best = Math.min(best, Math.hypot(spine[i]!.x - x, spine[i]!.y - y)); return best; };
  const spineDist = new Map<number, number>();
  void spineDist;

  // ---- the seal gate (plates or braziers): the thinnest cut of the walking-distance field, midway to the boss ----
  const gateFeat = feats.find((f) => f.kind === 'plates' || f.kind === 'braziers');
  let gateD = -1;
  if (gateFeat) {
    const lo = Math.max(18, Math.floor(bossD * 0.4)), hi = Math.min(bossD - 14, Math.floor(bossD * 0.72));
    const counts = new Map<number, number>();
    for (let i = 0; i < dist.length; i++) { const d = dist[i]!; if (d >= lo && d <= hi + 1) counts.set(d, (counts.get(d) ?? 0) + 1); }
    let best = Infinity;
    for (let d = lo; d <= hi; d++) {
      const c = (counts.get(d) ?? 0) + (counts.get(d + 1) ?? 0);
      let before = 0; for (let i = 0; i < dist.length; i++) if (dist[i]! >= 0 && dist[i]! < d) before++;
      if (c < best && before >= 160) { best = c; gateD = d; }
    }
    if (gateD > 0) {
      const tiles: number[] = [];
      for (let i = 0; i < dist.length; i++) if (dist[i] === gateD || dist[i] === gateD + 1) { tiles.push(i); occ[i] = 1; }
      out.gate = { tiles, by: gateFeat.kind === 'plates' ? 'plates' : 'braziers' };
      for (const i of tiles) mark(i % g.w, Math.floor(i / g.w), 1.5);
    }
  }
  const before = (x: number, y: number, margin: number) => gateD < 0 || (dist[at(x, y)]! >= 0 && dist[at(x, y)]! <= gateD - margin);

  for (const f of feats) {
    if (f.kind === 'plates' && gateD > 0) {
      const cand: Vec2[] = [];
      for (let y = 2; y < g.h - 2; y++) for (let x = 2; x < g.w - 2; x++) if (dist[at(x, y)]! >= 12 && Math.hypot(x - entrance.x, y - entrance.y) >= 10 && before(x, y, 4) && clearDisc(x, y, 1.5)) cand.push({ x, y });
      const picked: Vec2[] = [];
      while (picked.length < f.count && cand.length) {
        let bi = 0, bs = -Infinity;
        for (let i = 0; i < cand.length; i += 2) {
          const c = cand[i]!, md = picked.length ? Math.min(...picked.map((p) => Math.hypot(p.x - c.x, p.y - c.y))) : 20 + rng();
          const s = Math.min(md, 14) + Math.min(nearSpine(c.x, c.y), 8) * 0.4 + rng() * 2; // spread out, a little off the main line
          if (s > bs && md >= 8) { bs = s; bi = i; }
        }
        if (bs === -Infinity) break;
        const c = cand[bi]!; picked.push(c); mark(c.x, c.y, 2.5);
      }
      out.plates = picked.map((p) => tileCentre(p.x, p.y));
    } else if (f.kind === 'braziers' && gateD > 0) {
      out.litFor = f.litFor;
      const cand: Vec2[] = [];
      for (let y = 2; y < g.h - 2; y++) for (let x = 2; x < g.w - 2; x++) if (dist[at(x, y)]! >= 12 && before(x, y, 4) && clearDisc(x, y, 1.5)) cand.push({ x, y });
      // a loop the hero can run inside `litFor`: a hub tile and the candidates within a radius of it
      const hubs = cand.filter((_, i) => i % 5 === 0);
      let chosen: Vec2[] = [];
      for (let attempt = 0; attempt < 60 && chosen.length < f.count && hubs.length; attempt++) {
        const hub = hubs[Math.floor(rng() * hubs.length)]!, near = cand.filter((c) => Math.hypot(c.x - hub.x, c.y - hub.y) <= 11), pick: Vec2[] = [];
        for (const c of near.sort(() => rng() - 0.5)) if (pick.every((p) => Math.hypot(p.x - c.x, p.y - c.y) >= 5)) { pick.push(c); if (pick.length === f.count) break; }
        if (pick.length > chosen.length) chosen = pick;
      }
      for (const c of chosen) mark(c.x, c.y, 2.5);
      out.braziers = chosen.map((p) => tileCentre(p.x, p.y));
    } else if (f.kind === 'collapse') {
      for (let k = 0; k < f.patches; k++) {
        const frac = 0.22 + (0.56 * (k + 0.5)) / f.patches;
        for (let tries = 0; tries < 30; tries++) {
          const c = spineAt(frac + (tries % 2 ? 1 : -1) * Math.floor(tries / 2) * 0.02), cx = Math.round(c.x), cy = Math.round(c.y);
          if (!clearDisc(cx, cy, 2.6)) continue;
          if (out.gate && out.gate.tiles.some((i) => Math.hypot((i % g.w) - cx, Math.floor(i / g.w) - cy) < 5)) continue;
          const tiles: { x: number; y: number }[] = [];
          for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if (Math.hypot(dx, dy) <= 2.5) tiles.push({ x: cx + dx, y: cy + dy });
          out.patches.push({ id: out.patches.length + 1, tiles, centre: tileCentre(cx, cy), pit: f.pit, fall: f.fall, cache: f.cache });
          mark(cx, cy, 3.5); break;
        }
      }
    } else if (f.kind === 'ambush') {
      const found: { at: Vec2 | null } = { at: null }; let bestS = -Infinity;
      for (const r of [5.5, 4.5, 3.8]) {
        for (let y = 5; y < g.h - 5; y++) for (let x = 5; x < g.w - 5; x++) {
          const d = dist[at(x, y)]!;
          if (d < bossD * 0.2 || d > bossD * 0.85 || !clearDisc(x, y, r) || Math.hypot(x - boss.x, y - boss.y) < 16) continue;
          const s = rng() * 3 - Math.abs(d - bossD * 0.5) * 0.05; if (s > bestS) { bestS = s; found.at = { x, y }; }
        }
        if (found.at) break;
      }
      const best = found.at;
      if (best) {
        const runes = [0, 1, 2, 3].map((k) => { const a = (k / 4) * Math.PI * 2 + Math.PI / 4; return tileCentre(Math.round(best.x + Math.cos(a) * 4.5), Math.round(best.y + Math.sin(a) * 4.5)); });
        out.ambush = { at: tileCentre(best.x, best.y), radius: AMBUSH_TRIGGER, runes, waves: f.waves, per: f.per, gap: f.gap, xp: f.xp, stones: f.stones };
        mark(best.x, best.y, 6);
      }
    } else if (f.kind === 'traps') {
      for (let k = 0; k < f.fields; k++) {
        const frac = 0.18 + (0.64 * (k + 0.5)) / f.fields;
        let centre: Vec2 | null = null;
        for (let tries = 0; tries < 14 && !centre; tries++) {
          const c = spineAt(frac + (tries % 2 ? 1 : -1) * Math.floor(tries / 2) * 0.025), cx = Math.round(c.x), cy = Math.round(c.y);
          if (open(cx, cy) && clearDisc(cx, cy, f.style === 'mist' ? 3 : 2) && dist[at(cx, cy)]! > 10 && Math.hypot(cx - boss.x, cy - boss.y) > 12 && (!out.gate || !out.gate.tiles.some((i) => Math.hypot((i % g.w) - cx, Math.floor(i / g.w) - cy) < 4))) centre = { x: cx, y: cy };
        }
        if (!centre) continue;
        const radius = f.style === 'mist' ? 3.4 * TILE_SIZE : 13;
        const pts: Vec2[] = f.style === 'mist' ? [centre] : [];
        for (let tries = 0; f.style !== 'mist' && pts.length < f.per && tries < 40; tries++) {
          const a = rng() * Math.PI * 2, r = rng() * 3, p = { x: Math.round(centre.x + Math.cos(a) * r), y: Math.round(centre.y + Math.sin(a) * r) };
          if (open(p.x, p.y) && !occ[at(p.x, p.y)] && pts.every((q) => Math.hypot(q.x - p.x, q.y - p.y) >= 1.9)) pts.push(p);
        }
        pts.forEach((p, i) => out.traps.push({
          id: out.traps.length + 1, style: f.style, at: tileCentre(p.x, p.y), radius, period: f.period, warn: f.warn, active: f.active, pct: f.pct,
          offset: f.style === 'mist' ? rng() * f.period : (i / Math.max(1, pts.length)) * f.period, // spikes ripple one after the other
        }));
        for (const p of pts) mark(p.x, p.y, f.style === 'mist' ? 2 : 1);
      }
    }
  }
  return out;
}

/* ------------------------------ runtime ------------------------------ */
export type TrapPhase = 'idle' | 'warn' | 'active';
/** Where in its cycle a trap is at `clock` seconds. The cycle ends with warn then active. */
export function trapPhase(t: Pick<Trap, 'offset' | 'period' | 'warn' | 'active'>, clock: number): { phase: TrapPhase; cycle: number; left: number } {
  const x = clock + t.offset, cycle = Math.floor(x / t.period), p = x - cycle * t.period, idleEnd = t.period - t.warn - t.active;
  if (p < idleEnd) return { phase: 'idle', cycle, left: idleEnd - p };
  if (p < idleEnd + t.warn) return { phase: 'warn', cycle, left: idleEnd + t.warn - p };
  return { phase: 'active', cycle, left: t.period - p };
}

export type PatchTile = { state: 'solid' | 'cracking' | 'pit'; t: number };
export interface FeatureRuntime {
  clock: number;
  trapHit: Map<number, { cycle: number; tick: number }>;
  platesOn: boolean[];
  brazierLeft: number[]; brazierDone: boolean;
  gateOpen: boolean;
  patches: PatchTile[][]; cacheTaken: boolean[];
  ambush: { state: 'idle' | 'running' | 'done'; wave: number; t: number };
}
export const newRuntime = (l: FeatureLayout): FeatureRuntime => ({
  clock: 0, trapHit: new Map(), platesOn: l.plates.map(() => false), brazierLeft: l.braziers.map(() => 0), brazierDone: false, gateOpen: !l.gate,
  patches: l.patches.map((p) => p.tiles.map(() => ({ state: 'solid' as const, t: 0 }))), cacheTaken: l.patches.map(() => false), ambush: { state: 'idle', wave: 0, t: 0 },
});

export type FeatureEvent =
  | { type: 'trapHit'; id: number; style: TrapStyle; pct: number; at: Vec2 }
  | { type: 'plate'; index: number; left: number }
  | { type: 'brazier'; index: number; lit: number; of: number }
  | { type: 'brazierOut'; index: number }
  | { type: 'gateOpen'; by: 'plates' | 'braziers' }
  | { type: 'crack'; patch: number; tile: number }
  | { type: 'pit'; patch: number; tile: number }
  | { type: 'regrow'; patch: number; tile: number }
  | { type: 'fall'; patch: number; pct: number }
  | { type: 'cache'; patch: number; stones: number; at: Vec2 }
  | { type: 'ambushStart' }
  | { type: 'ambushWave'; wave: number; count: number; at: Vec2[] }
  | { type: 'ambushDone'; xp: number; stones: number };

const d2 = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.y - b.y);

/** Advances every mechanic. `hero` is in world units; `ambushAlive` = how many ambush foes still live (the scene counts them). */
export function tickFeatures(rt: FeatureRuntime, l: FeatureLayout, hero: Vec2, dt: number, ambushAlive: number): FeatureEvent[] {
  const ev: FeatureEvent[] = [];
  rt.clock += dt;
  for (const t of l.traps) {
    const ph = trapPhase(t, rt.clock);
    if (ph.phase !== 'active' || d2(hero, t.at) > t.radius) continue;
    const seen = rt.trapHit.get(t.id);
    if (t.style === 'mist') { // continuous: a tick every TRAP_HIT_COOLDOWN while inside the active cloud
      if (!seen || rt.clock - seen.tick >= TRAP_HIT_COOLDOWN) { rt.trapHit.set(t.id, { cycle: ph.cycle, tick: rt.clock }); ev.push({ type: 'trapHit', id: t.id, style: t.style, pct: t.pct, at: t.at }); }
    } else if (!seen || seen.cycle !== ph.cycle) { rt.trapHit.set(t.id, { cycle: ph.cycle, tick: rt.clock }); ev.push({ type: 'trapHit', id: t.id, style: t.style, pct: t.pct, at: t.at }); }
  }
  if (!rt.gateOpen && l.gate) {
    if (l.gate.by === 'plates') {
      l.plates.forEach((p, i) => { if (!rt.platesOn[i] && d2(hero, p) <= PLATE_RADIUS) { rt.platesOn[i] = true; ev.push({ type: 'plate', index: i, left: rt.platesOn.filter((x) => !x).length }); } });
      if (l.plates.length && rt.platesOn.every(Boolean)) { rt.gateOpen = true; ev.push({ type: 'gateOpen', by: 'plates' }); }
    } else {
      l.braziers.forEach((b, i) => {
        if (rt.brazierLeft[i]! > 0) { rt.brazierLeft[i]! -= dt; if (rt.brazierLeft[i]! <= 0) { rt.brazierLeft[i] = 0; ev.push({ type: 'brazierOut', index: i }); } }
        if (d2(hero, b) <= BRAZIER_RADIUS && rt.brazierLeft[i]! <= 0) { rt.brazierLeft[i] = l.litFor; ev.push({ type: 'brazier', index: i, lit: rt.brazierLeft.filter((x) => x > 0).length, of: l.braziers.length }); }
        else if (d2(hero, b) <= BRAZIER_RADIUS) rt.brazierLeft[i] = l.litFor; // standing beside it keeps it burning
      });
      if (l.braziers.length && rt.brazierLeft.every((x) => x > 0)) { rt.gateOpen = true; ev.push({ type: 'gateOpen', by: 'braziers' }); }
    }
  }
  l.patches.forEach((p, pi) => {
    const tiles = rt.patches[pi]!;
    p.tiles.forEach((tt, ti) => {
      const s = tiles[ti]!, c = tileCentre(tt.x, tt.y), near = d2(hero, c) <= TILE_SIZE * 1.1;
      if (s.state === 'solid' && near) { s.state = 'cracking'; s.t = CRACK_TIME; ev.push({ type: 'crack', patch: p.id, tile: ti }); }
      else if (s.state === 'cracking') { s.t -= dt; if (s.t <= 0) { s.state = 'pit'; s.t = p.pit; ev.push({ type: 'pit', patch: p.id, tile: ti }); } }
      else if (s.state === 'pit') { s.t -= dt; if (s.t <= 0) { s.state = 'solid'; s.t = 0; ev.push({ type: 'regrow', patch: p.id, tile: ti }); } }
    });
    if (!rt.cacheTaken[pi] && d2(hero, p.centre) <= 12) { rt.cacheTaken[pi] = true; ev.push({ type: 'cache', patch: p.id, stones: p.cache, at: p.centre }); }
  });
  if (l.ambush) {
    const a = l.ambush, am = rt.ambush;
    if (am.state === 'idle' && d2(hero, a.at) <= a.radius) { am.state = 'running'; am.wave = 0; am.t = 0; ev.push({ type: 'ambushStart' }); }
    if (am.state === 'running') {
      am.t -= dt;
      const waveDone = am.wave > 0 && ambushAlive === 0 && am.t <= a.gap - 1; // a wave needs a second to arrive before 'cleared' counts
      if (am.wave < a.waves && ((am.t <= 0 && ambushAlive <= ambushLiveCap(a.per)) || waveDone)) { am.wave++; am.t = a.gap; ev.push({ type: 'ambushWave', wave: am.wave, count: a.per, at: a.runes }); }
      else if (am.wave >= a.waves && ambushAlive === 0 && am.t <= a.gap - 0.5) { am.state = 'done'; ev.push({ type: 'ambushDone', xp: a.xp, stones: a.stones }); }
    }
  }
  return ev;
}

/** Is the hero standing over a pit? Returns the patch id (the scene then drops them: `fall`). */
export function pitUnder(rt: FeatureRuntime, l: FeatureLayout, hero: Vec2): Patch | null {
  const tx = Math.floor(hero.x / TILE_SIZE), ty = Math.floor(hero.y / TILE_SIZE);
  for (let pi = 0; pi < l.patches.length; pi++) {
    const p = l.patches[pi]!, i = p.tiles.findIndex((t) => t.x === tx && t.y === ty);
    if (i >= 0 && rt.patches[pi]![i]!.state === 'pit') return p;
  }
  return null;
}

/** Length of the shortest tour through the points starting from the first (nearest neighbour), in world units: the brazier puzzle must be runnable. */
export function tourLength(pts: Vec2[]): number {
  if (pts.length < 2) return 0;
  const left = pts.slice(1); let cur = pts[0]!, len = 0;
  while (left.length) { let bi = 0; for (let i = 1; i < left.length; i++) if (d2(cur, left[i]!) < d2(cur, left[bi]!)) bi = i; len += d2(cur, left[bi]!); cur = left.splice(bi, 1)[0]!; }
  return len;
}

/* ------------------------------ persistence (round 23) ------------------------------ */
/** The part of a dungeon's mechanics that must survive save + reload: a solved seal, taken caches and a finished ambush. Traps, pits and an ambush in progress restart. */
export interface SealSave { id: string; gate: boolean; plates: boolean[]; cache: boolean[]; ambushDone: boolean }

export function exportSeal(id: string, rt: FeatureRuntime): SealSave {
  return { id, gate: rt.gateOpen, plates: [...rt.platesOn], cache: [...rt.cacheTaken], ambushDone: rt.ambush.state === 'done' };
}

/** Strict shape check of a stored seal (never trust a save). `dungeon` is the dungeon id the save says the hero is in. */
export function validSealSave(v: unknown, dungeon: string | null): v is SealSave {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return false;
  const o = v as Record<string, unknown>, bools = (a: unknown): boolean => Array.isArray(a) && a.length <= 16 && a.every((x) => typeof x === 'boolean');
  return typeof o.id === 'string' && o.id === dungeon && typeof o.gate === 'boolean' && bools(o.plates) && bools(o.cache) && typeof o.ambushDone === 'boolean';
}

/** Applies a stored seal to a fresh runtime. Returns false (and changes nothing) when it does not fit this layout. Gate tiles are NOT unblocked here: the view does that. */
export function restoreSeal(rt: FeatureRuntime, l: FeatureLayout, s: SealSave): boolean {
  if (s.plates.length !== l.plates.length || s.cache.length !== l.patches.length) return false;
  if (s.gate && !l.gate) return false;
  rt.gateOpen = s.gate || !l.gate;
  rt.platesOn = rt.gateOpen && l.gate?.by === 'plates' ? l.plates.map(() => true) : [...s.plates];
  if (rt.gateOpen && l.gate?.by === 'braziers') rt.brazierLeft.fill(1);
  rt.cacheTaken = [...s.cache];
  if (s.ambushDone && l.ambush) rt.ambush = { state: 'done', wave: l.ambush.waves, t: 0 };
  return true;
}

/**
 * Is `hero` (world units) cut off from `entrance` (world units) by the closed seal? `blocked` already contains the closed gate tiles.
 * True means the hero stands on the far side of an unsolved gate (or inside it): the scene must rescue them.
 */
export function isStranded(g: Grid, entrance: Vec2, hero: Vec2): boolean {
  const dist = distanceField(g, { x: entrance.x / TILE_SIZE, y: entrance.y / TILE_SIZE });
  const hx = Math.floor(hero.x / TILE_SIZE), hy = Math.floor(hero.y / TILE_SIZE);
  if (hx < 0 || hy < 0 || hx >= g.w || hy >= g.h) return true;
  return dist[hy * g.w + hx] === -1;
}
