import { describe, expect, it } from 'vitest';
import MANIFEST from '../src/data/manifest.generated.json';
import { BOSSES, bossesOfChapter } from '../src/data/boss';
import { CHAPTERS, CHAPTER_IDS, canEnterChapter } from '../src/data/chapters';
import { ENEMIES } from '../src/data/enemies';
import { ITEMS } from '../src/data/items';
import { NPCS, QUESTS, npcsOfChapter, questsOfChapter } from '../src/data/quests';
import { ZONES, zonesOfChapter } from '../src/data/zones';
import { generateChapter, generateWorld, isBlockedTile, TILE_SIZE, zoneAt, type WorldMap } from '../src/core/world';
import { newGameState } from '../src/core/gameState';
import { parseSave, serialize, checksum } from '../src/core/save';
import { OUTPOST_STOCK, buy } from '../src/core/shop';

const reach = (m: WorldMap) => {
  const seen = new Set<number>(); const q: [number, number][] = [[Math.floor(m.spawn.x / TILE_SIZE), Math.floor(m.spawn.y / TILE_SIZE)]];
  while (q.length) {
    const [x, y] = q.pop()!; const k = y * m.width + x;
    if (seen.has(k) || isBlockedTile(m, x, y)) continue;
    seen.add(k); q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  return (p: { x: number; y: number }) => seen.has(Math.floor(p.y / TILE_SIZE) * m.width + Math.floor(p.x / TILE_SIZE));
};

describe('chapter maps', () => {
  const maps: [number, WorldMap][] = CHAPTER_IDS.map((n) => [n, generateChapter(n, 20261016)]);
  it.each(maps)('chapter %i: deterministic, right zones, hub at spawn', (n, m) => {
    const again = generateChapter(n, 20261016);
    expect(again.ground).toEqual(m.ground); expect(again.props).toEqual(m.props);
    expect(m.chapter).toBe(n);
    expect(new Set(m.zone)).toEqual(new Set(zonesOfChapter(n)));
    expect(zoneAt(m, m.spawn)).toBe(CHAPTERS[n]!.hub);
    for (const z of zonesOfChapter(n)) expect(zoneAt(m, { x: (ZONES[z].anchor.x + 0.5) * TILE_SIZE, y: (ZONES[z].anchor.y + 0.5) * TILE_SIZE }), z).toBe(z);
  });
  it.each(maps)('chapter %i: everything the player needs is reachable from the spawn', (n, m) => {
    const ok = reach(m);
    for (const z of zonesOfChapter(n)) expect(ok(m.anchors[z]!), `zone ${z}`).toBe(true);
    for (const id of npcsOfChapter(n)) { expect(m.npcs[id], `npc ${id} placed`).toBeDefined(); expect(ok(m.npcs[id]!), `npc ${id}`).toBe(true); }
    for (const b of bossesOfChapter(n)) { expect(m.bossHomes[b.id], `home of ${b.id}`).toBeDefined(); expect(ok(m.bossHomes[b.id]!), `arena of ${b.id}`).toBe(true); }
    expect(ok(m.portal), 'portal').toBe(true);
    expect(ok(m.arrayPos), 'meditation array').toBe(true);
    expect(m.herbs.length).toBeGreaterThanOrEqual(10);
    for (const h of m.herbs) expect(ok(h)).toBe(true);
  });
  it.each(maps)('chapter %i: a gate prop stands at the portal', (_n, m) => {
    expect(m.props.some((p) => p.kind === 'moonwall' && Math.abs(p.x - m.portal.x) < 20 && Math.abs(p.y - m.portal.y) < 40)).toBe(true);
  });
  it('the Sky Gate exists on several chapter 1 seeds', () => {
    for (const seed of [1, 2, 3, 20261016]) { const m = generateWorld(seed); expect(m.props.some((p) => p.kind === 'moonwall' && Math.abs(p.x - m.portal.x) < 20), `seed ${seed}`).toBe(true); }
  });
  it('chapter 2 is substantially larger than chapter 1', () => {
    expect(generateChapter(2, 1).width * generateChapter(2, 1).height).toBeGreaterThan(generateChapter(1, 1).width * generateChapter(1, 1).height * 1.3);
  });
  it('unknown chapters throw', () => { expect(() => generateChapter(99, 1)).toThrow(); });
});

describe('chapter data is consistent', () => {
  it('every zone belongs to a chapter and its spawns exist', () => {
    for (const z of Object.values(ZONES)) { expect(CHAPTERS[z.chapter], z.id).toBeDefined(); for (const t of Object.keys(z.spawns)) expect(ENEMIES[t], `${z.id}: ${t}`).toBeDefined(); }
    for (const c of Object.values(CHAPTERS)) expect(ZONES[c.hub].chapter).toBe(c.id);
  });
  it('every boss has a chapter, a zone of that chapter, a manifest sprite and spawnable minions', () => {
    for (const b of Object.values(BOSSES)) {
      expect(ZONES[b.zone].chapter, b.id).toBe(b.chapter);
      expect(MANIFEST.sheets[`${b.sprite}.idle` as keyof typeof MANIFEST.sheets], `${b.id} sprite`).toBeDefined();
      const m = b.moves.summon?.minionType; if (m) expect(ENEMIES[m], `${b.id} minion`).toBeDefined();
    }
    for (const n of CHAPTER_IDS) expect(bossesOfChapter(n).length).toBeGreaterThanOrEqual(1);
  });
  it('every enemy sprite and tint is valid', () => {
    for (const e of Object.values(ENEMIES)) { expect(MANIFEST.sheets[`${e.sprite}.idle` as keyof typeof MANIFEST.sheets], e.id).toBeDefined(); if (e.tint !== undefined) expect(e.tint).toBeGreaterThan(0); }
  });
  it('every NPC lives in a chapter, has art and its quests exist in that chapter', () => {
    for (const [id, n] of Object.entries(NPCS)) {
      const ch = n.chapter ?? 1;
      expect(CHAPTERS[ch], id).toBeDefined();
      expect(MANIFEST.portraits[n.portrait as keyof typeof MANIFEST.portraits], `${id} portrait`).toBeDefined();
      expect(MANIFEST.sheets[`${n.sprite}.idle` as keyof typeof MANIFEST.sheets], `${id} sprite`).toBeDefined();
      for (const q of n.quests) { expect(QUESTS[q], `${id}: ${q}`).toBeDefined(); expect(QUESTS[q]!.chapter ?? 1, `${q} chapter`).toBe(ch); expect(QUESTS[q]!.giver).toBe(id); }
    }
  });
  it('every quest has a giver who offers it, valid prerequisites, targets, rewards', () => {
    for (const q of Object.values(QUESTS)) {
      expect(NPCS[q.giver]?.quests, q.id).toContain(q.id);
      if (q.requires) { expect(QUESTS[q.requires], q.id).toBeDefined(); expect(QUESTS[q.requires]!.chapter ?? 1).toBeLessThanOrEqual(q.chapter ?? 1); }
      for (const o of q.objectives) if (o.type === 'kill') {
        const isBoss = o.target in BOSSES, isMob = o.target in ENEMIES;
        expect(isBoss || isMob, `${q.id}: ${o.target}`).toBe(true);
        if (isBoss) expect(BOSSES[o.target]!.chapter).toBe(q.chapter ?? 1);
        else expect(zonesOfChapter(q.chapter ?? 1).some((z) => o.target in ZONES[z].spawns), `${q.id}: ${o.target} spawns in chapter`).toBe(true);
      }
      for (const r of q.reward.items) expect(ITEMS[r.id], `${q.id}: ${r.id}`).toBeDefined();
    }
    for (const n of CHAPTER_IDS) expect(questsOfChapter(n).length).toBeGreaterThanOrEqual(3);
  });
  it('every chapter has a boss-kill quest for each of its bosses', () => {
    for (const n of CHAPTER_IDS) for (const b of bossesOfChapter(n)) expect(questsOfChapter(n).some((q) => q.objectives.some((o) => o.type === 'kill' && o.target === b.id)), b.id).toBe(true);
  });
  it('quest chains within a chapter are acyclic', () => {
    for (const q of Object.values(QUESTS)) { let c: string | undefined = q.id; for (let i = 0; i < 30 && c; i++) c = QUESTS[c]!.requires; expect(c).toBeUndefined(); }
  });
  it('story pages exist for every chapter', () => { for (const c of Object.values(CHAPTERS)) { expect(c.story.length).toBeGreaterThanOrEqual(3); for (const p of c.story) expect(p.length).toBeGreaterThan(30); } });
  it('outpost stock only holds real items and chapter-2 power outranks chapter-1 gear', () => {
    for (const e of OUTPOST_STOCK) expect(ITEMS[e.id]).toBeDefined();
    expect(ITEMS['froststeel-blade']!.weaponAtk!).toBeGreaterThan(ITEMS['jade-sword']!.weaponAtk!);
    expect(ITEMS['sovereign-blade']!.weaponAtk!).toBeGreaterThan(ITEMS['crystal-saber']!.weaponAtk!);
    expect(ITEMS['crystal-robe']!.defBonus!).toBeGreaterThan(ITEMS['immortal-mantle']!.defBonus!);
  });
  it('the outpost shop sells outpost goods and the sect shop does not', () => {
    const gs = newGameState('T', 'flame', 'swordsman', { x: 0, y: 0 }); gs.stones = 99999;
    expect(buy(gs, 'frost-mail', 1, 'outpost')).toEqual({ ok: true });
    expect(buy(gs, 'frost-mail', 1, 'sect')).toEqual({ ok: false, reason: 'unknown' });
  });
});

describe('chapter gate', () => {
  it('chapter 1 is always open; chapter 2 needs level and all three guardians', () => {
    expect(canEnterChapter(1, 1, []).ok).toBe(true);
    const three = ['warden', 'ninetail', 'jiaolong'];
    expect(canEnterChapter(2, 20, []).ok).toBe(false);
    expect(canEnterChapter(2, 20, ['warden', 'ninetail']).ok).toBe(false);
    expect(canEnterChapter(2, 9, three).ok).toBe(false);
    expect(canEnterChapter(2, 10, three).ok).toBe(true);
    expect(canEnterChapter(99, 20, three).ok).toBe(false);
  });
  it('a failed gate explains what is needed', () => {
    const r = canEnterChapter(2, 1, []);
    expect(r.ok === false && /guardians/i.test(r.reason)).toBe(true);
  });
});

describe('chapter in saves', () => {
  const gs = () => newGameState('Walker', 'flame', 'swordsman', { x: 10, y: 10 });
  it('new games start in chapter 1 with no story seen; round-trips', () => {
    const g = gs(); expect(g.chapter).toBe(1); expect(g.story).toEqual([]);
    g.chapter = 2; g.story = [1, 2];
    const r = parseSave(serialize(g)); expect(r.ok && r.state.chapter).toBe(2); expect(r.ok && r.state.story).toEqual([1, 2]);
  });
  it('older saves without chapter fields load as chapter 1 with the prologue already seen', () => {
    const g = gs() as unknown as Record<string, unknown>; delete g.chapter; delete g.story;
    const body = JSON.stringify(g);
    const text = JSON.stringify({ version: 4, savedAt: 1, checksum: checksum(body), state: g });
    const r = parseSave(text); expect(r.ok).toBe(true);
    if (r.ok) { expect(r.state.chapter).toBe(1); expect(r.state.story).toEqual([1]); }
  });
  it('rejects unknown chapters and bad story flags', () => {
    const g = gs(); g.chapter = 7; expect(parseSave(serialize(g)).ok).toBe(false);
    const h = gs(); (h as unknown as { story: unknown }).story = ['x']; expect(parseSave(serialize(h)).ok).toBe(false);
  });
});
