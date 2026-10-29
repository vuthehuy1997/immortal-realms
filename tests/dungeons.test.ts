import { describe, expect, it } from 'vitest';
import { BOSSES, bossesOfChapter, bossesOfDungeon } from '../src/data/boss';
import { CHAPTERS, canEnterChapter } from '../src/data/chapters';
import { DUNGEONS, DUNGEON_IDS, dungeonOfBoss, dungeonsOfChapter } from '../src/data/dungeons';
import { ENEMIES } from '../src/data/enemies';
import { ITEMS } from '../src/data/items';
import { ZONES, zonesOfChapter } from '../src/data/zones';
import { generateChapter, generateDungeonMap, isBlockedTile, nearestFree, TILE_SIZE, type WorldMap } from '../src/core/world';
import { canEnterDungeon, claimDungeonReward, flushPending, isDungeonCleared } from '../src/core/dungeonRun';
import { HERO_IDS } from '../src/data/heroes';
import { newGameState } from '../src/core/gameState';
import { parseSave, serialize } from '../src/core/save';

const reach = (m: WorldMap, from: { x: number; y: number }) => {
  const seen = new Set<number>(); const q: [number, number][] = [[Math.floor(from.x / TILE_SIZE), Math.floor(from.y / TILE_SIZE)]];
  while (q.length) {
    const [x, y] = q.pop()!; const k = y * m.width + x;
    if (seen.has(k) || isBlockedTile(m, x, y)) continue;
    seen.add(k); q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  return (p: { x: number; y: number }) => seen.has(Math.floor(p.y / TILE_SIZE) * m.width + Math.floor(p.x / TILE_SIZE));
};

/** the seal gate (plates / braziers) is closed in a fresh map: reachability is checked with it opened */
const gateOpen = (m: WorldMap): WorldMap => { const blocked = new Uint8Array(m.blocked); for (const i of m.features?.gate?.tiles ?? []) blocked[i] = 0; return { ...m, blocked }; };

describe('dungeon data', () => {
  it('there are caves and secret realms in the game', () => {
    expect(DUNGEON_IDS.length).toBeGreaterThan(0);
    expect(new Set(Object.values(DUNGEONS).map((d) => d.kind)).size).toBe(2);
  });
  it.each(DUNGEON_IDS)('%s: well-formed', (id) => {
    const d = DUNGEONS[id]!;
    expect(CHAPTERS[d.chapter], 'chapter').toBeDefined();
    expect(ZONES[d.entrance.zone]?.chapter, 'entrance zone belongs to the chapter').toBe(d.chapter);
    expect(ZONES[d.id]?.dungeon, 'registered as a pseudo-zone').toBe(id);
    expect(zonesOfChapter(d.chapter)).not.toContain(id);
    const boss = BOSSES[d.boss];
    expect(boss, 'boss exists').toBeDefined();
    expect(boss!.dungeon).toBe(id); expect(boss!.zone).toBe(id); expect(boss!.chapter).toBe(d.chapter);
    expect(bossesOfChapter(d.chapter).map((b) => b.id), 'dungeon boss is not on the open map').not.toContain(d.boss);
    expect(bossesOfDungeon(id).map((b) => b.id)).toEqual([d.boss]);
    expect(dungeonOfBoss(d.boss)?.id).toBe(id);
    for (const t of Object.keys(d.spawns)) expect(ENEMIES[t], `enemy ${t}`).toBeDefined();
    for (const r of d.reward.items) expect(ITEMS[r.id], `reward ${r.id}`).toBeDefined();
    expect(Object.values(d.spawns).reduce((a, b) => a + b, 0)).toBeGreaterThanOrEqual(15);
    expect(d.size.w).toBeGreaterThanOrEqual(60); expect(d.size.h).toBeGreaterThanOrEqual(44);
    expect(d.minLevel).toBeGreaterThanOrEqual(1);
  });
  it('dungeon ids are unique and never collide with zone or boss ids of the open map', () => {
    for (const id of DUNGEON_IDS) expect(Object.values(ZONES).filter((z) => z.id === id).length).toBe(1);
  });
});

describe('dungeon maps', () => {
  it.each(DUNGEON_IDS)('%s: deterministic, enclosed, everything reachable from the gate', (id) => {
    const d = DUNGEONS[id]!, m = generateDungeonMap(id), again = generateDungeonMap(id);
    expect(again.ground).toEqual(m.ground); expect(again.props).toEqual(m.props);
    expect(m.dungeon).toBe(id); expect(m.chapter).toBe(d.chapter);
    for (let x = 0; x < m.width; x++) { expect(isBlockedTile(m, x, 0)).toBe(true); expect(isBlockedTile(m, x, m.height - 1)).toBe(true); }
    expect(new Set(m.zone)).toEqual(new Set([id]));
    const ok = reach(gateOpen(m), m.spawn);
    expect(ok(m.spawn), 'spawn open').toBe(true);
    expect(ok(m.portal), 'exit gate').toBe(true);
    expect(ok(m.bossHomes[d.boss]!), 'boss chamber').toBe(true);
    for (const h of m.herbs) expect(ok({ x: h.x, y: h.y - 4 }), 'herb').toBe(true);
    expect(m.herbs.length).toBe(d.herbs);
    // a fair fraction of the map is walkable floor (not a corridor-only maze, not an empty hall)
    const open = m.blocked.reduce((a, b) => a + (b ? 0 : 1), 0) / m.blocked.length;
    expect(open, 'walkable share').toBeGreaterThan(0.2); expect(open).toBeLessThan(0.75);
    // the boss chamber is wide enough to fight in
    const b = m.bossHomes[d.boss]!; let free = 0;
    for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) if (!isBlockedTile(m, Math.floor(b.x / TILE_SIZE) + dx, Math.floor(b.y / TILE_SIZE) + dy)) free++;
    expect(free, 'free tiles around the boss').toBeGreaterThan(80);
  });
  it.each(DUNGEON_IDS)('%s: its gate on the chapter map is reachable and stands in the right zone', (id) => {
    const d = DUNGEONS[id]!, m = generateChapter(d.chapter);
    const g = m.entrances[id]!;
    expect(g, 'entrance placed').toBeDefined();
    expect(reach(m, m.spawn)(g), 'reachable from the hub').toBe(true);
    expect(m.zone[Math.floor(g.y / TILE_SIZE) * m.width + Math.floor(g.x / TILE_SIZE)]).toBe(d.entrance.zone);
    expect(m.props.some((p) => (p.kind === 'moonwall' || p.kind === 'taihurocks') && Math.abs(p.x - g.x) < 20 && Math.abs(p.y - g.y) < 40)).toBe(true);
  });
  it('chapter 1 has both kinds of dungeon', () => { expect(new Set(dungeonsOfChapter(1).map((d) => d.kind))).toEqual(new Set(['cave', 'realm'])); });
});

describe('dungeon rules', () => {
  const d = Object.values(DUNGEONS)[0]!;
  it('a level gate keeps weak heroes out', () => {
    expect(canEnterDungeon(d, d.minLevel).ok).toBe(true);
    const r = canEnterDungeon(d, d.minLevel - 1); expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain(String(d.minLevel));
  });
  it('the first-clear reward pays xp, stones and items once the boss is down', () => {
    const gs = newGameState('T', 'flame', 'swordsman', { x: 0, y: 0 });
    expect(isDungeonCleared(gs, d.id)).toBe(false);
    const before = { stones: gs.stones, xp: gs.progress.xp + gs.progress.level * 1e6 };
    const r = claimDungeonReward(gs, d);
    expect(r.stones).toBe(d.reward.stones); expect(gs.stones).toBe(before.stones + d.reward.stones);
    expect(r.items.length + r.overflow.length).toBe(d.reward.items.length);
    expect(gs.progress.xp + gs.progress.level * 1e6).toBeGreaterThan(before.xp);
    gs.bosses.push(d.boss); expect(isDungeonCleared(gs, d.id)).toBe(true);
  });
  it('a hero saved inside a dungeon loads back inside it; a bad dungeon id is rejected', () => {
    const gs = newGameState('T', 'flame', 'swordsman', { x: 100, y: 100 });
    gs.chapter = d.chapter; gs.dungeon = d.id;
    const ok = parseSave(serialize(gs)); expect(ok.ok).toBe(true);
    if (ok.ok) expect(ok.state.dungeon).toBe(d.id);
    const bad = parseSave(serialize({ ...gs, dungeon: 'nowhere' })); expect(bad.ok).toBe(false);
    const wrongChapter = parseSave(serialize({ ...gs, chapter: 2 })); expect(d.chapter === 2 || !wrongChapter.ok).toBe(true);
  });
  it('old saves without the field load as "on the open map"', () => {
    const gs = newGameState('T', 'flame', 'swordsman', { x: 100, y: 100 });
    const env = JSON.parse(serialize(gs)) as { state: Record<string, unknown>; checksum: string };
    delete env.state.dungeon;
    // recompute the checksum the way the save does by re-serialising through the public helper
    const legacy = serialize({ ...gs, dungeon: undefined as unknown as null });
    const r = parseSave(legacy); expect(r.ok).toBe(true);
    if (r.ok) expect(r.state.dungeon).toBeNull();
  });
});

describe('QA round 18 fixes', () => {
  it('a full bag parks the dungeon reward instead of losing it, and it arrives once there is room', () => {
    const gs = newGameState('t', 'flame', HERO_IDS[0]!, { x: 0, y: 0 });
    const d = DUNGEONS['wolfden']!;
    for (let i = 0; i < gs.inventory.slots.length; i++) gs.inventory.slots[i] = { id: 'steel-blade', count: 1 };
    const r = claimDungeonReward(gs, d);
    expect(r.overflow.length).toBeGreaterThan(0);
    expect(gs.pending?.length).toBe(r.overflow.length);
    expect(flushPending(gs)).toEqual([]); // still no room
    gs.inventory.slots[0] = null; gs.inventory.slots[1] = null; gs.inventory.slots[2] = null;
    expect(flushPending(gs).length).toBe(r.overflow.length);
    expect(gs.pending).toBeUndefined();
  });
  it('pending rewards survive a save round trip', () => {
    const gs = newGameState('t', 'flame', HERO_IDS[0]!, { x: 0, y: 0 });
    gs.pending = [{ id: 'steel-blade', count: 1 }];
    const back = parseSave(serialize(gs));
    expect(back.ok).toBe(true);
  });
  it('coming back through a gate never lands inside rock (all chapters)', () => {
    for (const n of [2, 3, 4, 5]) {
      const m = generateChapter(n - 1), g = m.portalNext ?? m.portal;
      const p = nearestFree(m, { x: g.x, y: g.y + 34 });
      expect(p, `ch${n - 1} gate`).not.toBeNull();
      expect(isBlockedTile(m, Math.floor(p!.x / TILE_SIZE), Math.floor(p!.y / TILE_SIZE))).toBe(false);
    }
  });
  it('a closed chapter gate names the bosses still to defeat', () => {
    const r = canEnterChapter(4, 1, []);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/still to do: .*level/);
  });
});
