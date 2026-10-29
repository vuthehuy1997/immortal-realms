import { describe, expect, it } from 'vitest';
import { clearanceReach } from '../src/core/mapgen';
import { distanceField, newRuntime, pitUnder, tickFeatures, tourLength, trapPhase, CRACK_TIME, PLATE_RADIUS, emptyLayout, type FeatureEvent, type FeatureLayout } from '../src/core/dungeonFeatures';
import { generateDungeonMap, isBlockedTile, TILE_SIZE, type WorldMap } from '../src/core/world';
import { DUNGEONS, DUNGEON_IDS } from '../src/data/dungeons';
import { DUNGEON_FEATURES, featureKinds } from '../src/data/dungeonFeatures';
import { ENEMIES } from '../src/data/enemies';
import { BOSSES } from '../src/data/boss';

const P = (x: number, y: number) => ({ x, y });
const run = (l: FeatureLayout, rt = newRuntime(l), hero = P(-999, -999), secs = 1, dt = 0.05, alive = 0): { rt: ReturnType<typeof newRuntime>; ev: FeatureEvent[] } => {
  const ev: FeatureEvent[] = [];
  for (let t = 0; t < secs; t += dt) ev.push(...tickFeatures(rt, l, hero, dt, alive));
  return { rt, ev };
};

describe('trap cycle', () => {
  const trap = { offset: 0, period: 4, warn: 1, active: 0.5 };
  it('idle, then warn, then active, every period', () => {
    expect(trapPhase(trap, 0).phase).toBe('idle'); expect(trapPhase(trap, 2.4).phase).toBe('idle');
    expect(trapPhase(trap, 2.6).phase).toBe('warn'); expect(trapPhase(trap, 3.6).phase).toBe('active');
    expect(trapPhase(trap, 4.1).phase).toBe('idle'); expect(trapPhase(trap, 4.1).cycle).toBe(1);
  });
  it('offset shifts the rhythm; warn always precedes active by at least `warn` seconds', () => {
    expect(trapPhase({ ...trap, offset: 3.2 }, 0).phase).toBe('warn');
    const firstOf = (cycle: number, ph: string): number => { for (let c = cycle * 4; c < cycle * 4 + 4; c += 0.01) if (trapPhase(trap, c).phase === ph) return c; return -1; };
    for (let cy = 0; cy < 3; cy++) expect(firstOf(cy, 'active') - firstOf(cy, 'warn')).toBeGreaterThanOrEqual(0.99);
  });
  it('spike hits once per cycle, mist ticks while you stand in it, and neither hits a hero outside the radius', () => {
    const l = { ...emptyLayout(), traps: [{ id: 1, style: 'spike' as const, at: P(0, 0), radius: 13, ...trap, pct: 0.07 }, { id: 2, style: 'mist' as const, at: P(100, 0), radius: 50, offset: 0, period: 4, warn: 1, active: 2.5, pct: 0.03 }] };
    const a = run(l, undefined, P(0, 0), 12);
    expect(a.ev.filter((e) => e.type === 'trapHit' && e.id === 1)).toHaveLength(3);
    const b = run(l, undefined, P(100, 0), 4);
    expect(b.ev.filter((e) => e.type === 'trapHit' && e.id === 2).length).toBeGreaterThanOrEqual(3);
    expect(run(l, undefined, P(300, 0), 12).ev.filter((e) => e.type === 'trapHit')).toHaveLength(0);
  });
});

describe('plates, braziers and the gate', () => {
  const base = { ...emptyLayout(), gate: { tiles: [1, 2], by: 'plates' as const }, plates: [P(0, 0), P(100, 0)] };
  it('plates latch; the gate opens only when every plate was pressed', () => {
    const rt = newRuntime(base);
    expect(rt.gateOpen).toBe(false);
    const a = run(base, rt, P(0, 0), 0.2);
    expect(a.ev.some((e) => e.type === 'plate' && e.left === 1)).toBe(true);
    expect(rt.gateOpen).toBe(false);
    run(base, rt, P(200, 0), 1); expect(rt.platesOn[0]).toBe(true); // stays pressed after stepping off
    const c = run(base, rt, P(100, PLATE_RADIUS - 1), 0.2);
    expect(c.ev.some((e) => e.type === 'gateOpen')).toBe(true); expect(rt.gateOpen).toBe(true);
  });
  const br = { ...emptyLayout(), gate: { tiles: [1], by: 'braziers' as const }, braziers: [P(0, 0), P(60, 0), P(120, 0)], litFor: 5 };
  it('braziers burn for litFor seconds; all burning at once opens the gate; too slow and they go out', () => {
    const slow = newRuntime(br); run(br, slow, P(0, 0), 0.1);
    const out = run(br, slow, P(500, 0), 6); expect(out.ev.some((e) => e.type === 'brazierOut')).toBe(true);
    run(br, slow, P(60, 0), 0.1); expect(slow.gateOpen).toBe(false);
    const fast = newRuntime(br);
    run(br, fast, P(0, 0), 0.1); run(br, fast, P(60, 0), 0.1); const e = run(br, fast, P(120, 0), 0.1);
    expect(e.ev.some((x) => x.type === 'gateOpen')).toBe(true);
  });
  it('a layout with no gate starts open', () => { expect(newRuntime(emptyLayout()).gateOpen).toBe(true); });
});

describe('collapsing floor', () => {
  const tiles = [{ x: 5, y: 5 }, { x: 6, y: 5 }];
  const l = { ...emptyLayout(), patches: [{ id: 1, tiles, centre: P(5.5 * TILE_SIZE, 5.5 * TILE_SIZE), pit: 4, fall: 0.06, cache: 30 }] };
  it('cracks when stood next to, becomes a pit after the crack time, regrows after the pit time', () => {
    const rt = newRuntime(l), hero = P(5.5 * TILE_SIZE, 5.5 * TILE_SIZE);
    const a = run(l, rt, hero, 0.1); expect(a.ev.some((e) => e.type === 'crack')).toBe(true);
    expect(pitUnder(rt, l, hero)).toBeNull(); // cracked, not yet a pit: telegraphed
    run(l, rt, hero, CRACK_TIME + 0.1); expect(pitUnder(rt, l, hero)?.id).toBe(1);
    const far = run(l, rt, P(0, 0), 4.2); expect(far.ev.some((e) => e.type === 'regrow')).toBe(true); expect(pitUnder(rt, l, hero)).toBeNull();
  });
  it('the cache pays once', () => {
    const rt = newRuntime(l), c = l.patches[0]!.centre;
    expect(run(l, rt, c, 0.2).ev.filter((e) => e.type === 'cache')).toHaveLength(1);
    expect(run(l, rt, c, 1).ev.filter((e) => e.type === 'cache')).toHaveLength(0);
  });
});

describe('ambush waves', () => {
  const l = { ...emptyLayout(), ambush: { at: P(0, 0), radius: 48, runes: [P(10, 0), P(0, 10)], waves: 3, per: 4, gap: 10, xp: 0, stones: 60 } };
  it('triggers on approach, sends waves on a timer or when the last wave is cleared, pays at the end', () => {
    const rt = newRuntime(l);
    expect(run(l, rt, P(500, 0), 5).ev).toHaveLength(0);
    const a = run(l, rt, P(0, 0), 0.2, 0.05, 0);
    expect(a.ev.map((e) => e.type)).toEqual(['ambushStart', 'ambushWave']);
    const b = run(l, rt, P(0, 0), 3, 0.05, 4); expect(b.ev.filter((e) => e.type === 'ambushWave')).toHaveLength(0); // wave still alive, timer not up
    run(l, rt, P(0, 0), 0.0001, 0.05, 4);
    run(l, rt, P(0, 0), 1.2, 0.05, 4); // wave 1 arrives
    const c = run(l, rt, P(0, 0), 0.2, 0.05, 0); expect(c.ev.filter((e) => e.type === 'ambushWave')).toHaveLength(1); // cleared early: next wave at once
    const d = run(l, rt, P(0, 0), 11, 0.05, 2); expect(d.ev.filter((e) => e.type === 'ambushWave')).toHaveLength(1); // timer
    expect(rt.ambush.wave).toBe(3);
    const e = run(l, rt, P(0, 0), 2, 0.05, 0);
    expect(e.ev.some((x) => x.type === 'ambushDone')).toBe(true); expect(rt.ambush.state).toBe('done');
    expect(run(l, rt, P(0, 0), 20, 0.05, 0).ev).toHaveLength(0);
  });
});

/* ------------- every dungeon's layout ------------- */
const openGate = (m: WorldMap): WorldMap => { const blocked = new Uint8Array(m.blocked); for (const i of m.features?.gate?.tiles ?? []) blocked[i] = 0; return { ...m, blocked }; };
const tileOf = (p: { x: number; y: number }) => ({ x: Math.floor(p.x / TILE_SIZE), y: Math.floor(p.y / TILE_SIZE) });

describe('dungeon data: features', () => {
  it('every dungeon has mechanics beyond the boss: at least 2 features, a distinct combination each, and all five kinds are in use', () => {
    const combos = new Set<string>(); const used = new Map<string, number>();
    for (const id of DUNGEON_IDS) {
      const f = DUNGEON_FEATURES[id]!; expect(f, `${id} has features`).toBeDefined(); expect(f.length, id).toBeGreaterThanOrEqual(2);
      expect(f.filter((x) => x.kind === 'plates' || x.kind === 'braziers').length, `${id}: at most one seal gate`).toBeLessThanOrEqual(1);
      combos.add(f.map((x) => (x.kind === 'traps' ? `traps:${x.style}` : x.kind) + ':' + ('count' in x ? x.count : 'fields' in x ? x.fields : 'patches' in x ? x.patches : 'waves' in x ? x.waves : '')).sort().join('|'));
      for (const k of featureKinds(id)) used.set(k, (used.get(k) ?? 0) + 1);
    }
    expect(combos.size, 'distinct identity per dungeon').toBe(DUNGEON_IDS.length);
    for (const k of ['traps', 'plates', 'braziers', 'collapse', 'ambush']) expect(used.get(k) ?? 0, `${k} used`).toBeGreaterThanOrEqual(4);
    for (const id of Object.keys(DUNGEON_FEATURES)) expect(DUNGEONS[id], `${id} is a dungeon`).toBeDefined();
  });
  it('damage numbers are survivable: no single trap hit above 12% of max HP, a mist cloud at most 25% over its active window', () => {
    for (const f of Object.values(DUNGEON_FEATURES).flat()) {
      if (f.kind === 'traps') {
        expect(f.pct).toBeLessThanOrEqual(0.12); expect(f.warn, 'telegraph').toBeGreaterThanOrEqual(0.9);
        if (f.style === 'mist') expect(f.pct * Math.ceil(f.active / 0.6)).toBeLessThanOrEqual(0.25);
        expect(f.period - f.warn - f.active, 'a calm gap each cycle').toBeGreaterThanOrEqual(1.2);
      }
      if (f.kind === 'collapse') expect(f.fall).toBeLessThanOrEqual(0.1);
    }
  });
});

describe.each(DUNGEON_IDS)('dungeon %s: mechanics layout', (id) => {
  const d = DUNGEONS[id]!, m = generateDungeonMap(id), L = m.features!, feats = DUNGEON_FEATURES[id]!;
  const g = { w: m.width, h: m.height, blocked: m.blocked };
  it('is deterministic and places every feature it declares', () => {
    expect(generateDungeonMap(id).features).toEqual(L);
    for (const f of feats) {
      if (f.kind === 'traps') expect(L.traps.filter((t) => t.style === f.style).length, 'traps').toBeGreaterThan(0);
      if (f.kind === 'plates') expect(L.plates.length, 'plates').toBe(f.count);
      if (f.kind === 'braziers') expect(L.braziers.length, 'braziers').toBe(f.count);
      if (f.kind === 'collapse') expect(L.patches.length, 'collapse patches').toBe(f.patches);
      if (f.kind === 'ambush') expect(L.ambush, 'ambush room').not.toBeNull();
    }
    expect(!!L.gate).toBe(feats.some((f) => f.kind === 'plates' || f.kind === 'braziers'));
  });
  it('the seal gate really seals the boss away, plates / braziers lie on the gate-gate side, and opening it restores the way', () => {
    if (!L.gate) return;
    const boss = tileOf(m.bossHomes[d.boss]!), spawn = tileOf(m.spawn);
    const closed = distanceField(g, spawn);
    expect(closed[boss.y * m.width + boss.x], 'boss cut off while the gate is closed').toBe(-1);
    const open = openGate(m);
    expect(distanceField({ w: m.width, h: m.height, blocked: open.blocked }, spawn)[boss.y * m.width + boss.x], 'boss reachable once opened').toBeGreaterThan(0);
    for (const p of [...L.plates, ...L.braziers]) { const t = tileOf(p); expect(closed[t.y * m.width + t.x], 'switch reachable before the gate').toBeGreaterThan(0); }
    expect(L.gate.tiles.length, 'a narrow seal, not a wall of rock').toBeLessThan(60);
  });
  it('brazier loops can be run inside the burn time (at 60% of walking speed)', () => {
    if (L.braziers.length) expect(tourLength(L.braziers) / (78 * 0.6), 'seconds to light them all').toBeLessThan(L.litFor);
  });
  it('plates are far apart (a real walk) and not on the spawn', () => {
    for (const p of L.plates) expect(Math.hypot(p.x - m.spawn.x, p.y - m.spawn.y)).toBeGreaterThan(8.5 * TILE_SIZE);
    for (let i = 0; i < L.plates.length; i++) for (let j = i + 1; j < L.plates.length; j++) expect(Math.hypot(L.plates[i]!.x - L.plates[j]!.x, L.plates[i]!.y - L.plates[j]!.y)).toBeGreaterThan(7 * TILE_SIZE);
  });
  it('trap and patch tiles are open floor; no two features overlap; the boss chamber stays free of them', () => {
    const b = m.bossHomes[d.boss]!;
    for (const t of L.traps) { const c = tileOf(t.at); expect(isBlockedTile(m, c.x, c.y), `trap ${t.id} on floor`).toBe(false); expect(Math.hypot(t.at.x - b.x, t.at.y - b.y)).toBeGreaterThan(10 * TILE_SIZE); }
    for (const p of L.patches) { const c = tileOf(p.centre); expect(isBlockedTile(m, c.x, c.y)).toBe(false); expect(p.tiles.length).toBeGreaterThanOrEqual(15); }
    const spots = [...L.traps.map((t) => t.at), ...L.patches.map((p) => p.centre), ...L.plates, ...L.braziers];
    for (let i = 0; i < spots.length; i++) for (let j = i + 1; j < spots.length; j++) expect(Math.hypot(spots[i]!.x - spots[j]!.x, spots[i]!.y - spots[j]!.y), 'features keep apart').toBeGreaterThan(TILE_SIZE * 1.5);
  });
  it('the ambush ring is open ground wide enough to fight in, and its runes are open floor', () => {
    if (!L.ambush) return;
    const a = tileOf(L.ambush.at); let free = 0;
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) if (!isBlockedTile(m, a.x + dx, a.y + dy)) free++;
    expect(free).toBeGreaterThan(70);
    for (const r of L.ambush.runes) { const t = tileOf(r); expect(isBlockedTile(m, t.x, t.y)).toBe(false); }
    const types = Object.keys(d.spawns).filter((t) => ENEMIES[t]); expect(types.length).toBeGreaterThan(0);
  });
  it('a big body (5 tiles of clearance) can walk from the gate to the boss chamber (gate open): no pinching tunnels', () => {
    const open = openGate(m), boss = BOSSES[d.boss]!;
    expect(clearanceReach(open, m.spawn, m.bossHomes[d.boss]!, 2), `${id} boss radius ${boss.radius}`).toBe(true);
    expect(boss.radius - 4, 'boss body fits a 5-wide lane').toBeLessThanOrEqual(2.5 * TILE_SIZE);
  });
});
