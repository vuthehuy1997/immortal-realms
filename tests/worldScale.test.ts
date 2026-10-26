import { describe, expect, it } from 'vitest';
import { BOSSES, bossesOfChapter } from '../src/data/boss';
import { CHAPTERS, CHAPTER_IDS } from '../src/data/chapters';
import { DUNGEONS, dungeonsOfChapter } from '../src/data/dungeons';
import { ENEMIES } from '../src/data/enemies';
import { GEAR } from '../src/data/content/gear';
import { DROPS, ITEMS } from '../src/data/items';
import { NPCS, QUESTS, npcsOfChapter, questsOfChapter } from '../src/data/quests';
import { ZONES, zonesOfChapter } from '../src/data/zones';
import { generateChapter } from '../src/core/world';
import { STOCKS } from '../src/core/shop';

/** The owner's bar for "depth": five chapters, 6-8 zones each, caves and secret realms, big maps. */
describe('the world is five chapters deep', () => {
  it('has chapters 1 to 5', () => { expect(CHAPTER_IDS).toEqual([1, 2, 3, 4, 5]); });
  it.each([1, 2, 3, 4, 5])('chapter %i: 6-8 zones, >= 3 dungeons (>= 2 caves, >= 1 realm), bosses, quests, wild NPCs, a big map', (n) => {
    const zones = zonesOfChapter(n);
    expect(zones.length, 'zones').toBeGreaterThanOrEqual(6); expect(zones.length).toBeLessThanOrEqual(8);
    const d = dungeonsOfChapter(n);
    expect(d.length, 'dungeons').toBeGreaterThanOrEqual(3);
    expect(d.filter((x) => x.kind === 'cave').length, 'caves').toBeGreaterThanOrEqual(2);
    expect(d.filter((x) => x.kind === 'realm').length, 'realms').toBeGreaterThanOrEqual(1);
    expect(bossesOfChapter(n).length, 'open-map bosses').toBeGreaterThanOrEqual(3);
    expect(questsOfChapter(n).length, 'quests').toBeGreaterThanOrEqual(8);
    const m = generateChapter(n);
    expect(m.width * m.height, 'map area').toBeGreaterThanOrEqual(n === 1 ? 17000 : 17000);
    const wild = npcsOfChapter(n).filter((id) => { const p = m.npcs[id]!; return Math.hypot(p.x - m.spawn.x, p.y - m.spawn.y) > 400; });
    expect(wild.length, 'NPCs out in the wild').toBeGreaterThanOrEqual(3);
    for (const z of zones) expect(ZONES[z]!.chapter).toBe(n);
  });
  it('chapters get bigger and the last chapter holds the finale', () => {
    const area = (n: number) => { const m = generateChapter(n); return m.width * m.height; };
    expect(area(5)).toBeGreaterThan(area(1) * 1.3);
    const last = bossesOfChapter(5).sort((a, b) => b.maxHp - a.maxHp)[0]!;
    expect(last.maxHp).toBeGreaterThan(Math.max(...bossesOfChapter(4).map((b) => b.maxHp)) * 2);
    expect(Object.keys(last.moves).length).toBeGreaterThanOrEqual(6);
  });
  it('totals: dozens of foes, bosses, quests and NPCs', () => {
    expect(Object.keys(ENEMIES).length).toBeGreaterThanOrEqual(100);
    expect(Object.keys(BOSSES).length).toBeGreaterThanOrEqual(30);
    expect(Object.keys(QUESTS).length).toBeGreaterThanOrEqual(60);
    expect(Object.keys(NPCS).length).toBeGreaterThanOrEqual(36);
    expect(Object.keys(DUNGEONS).length).toBeGreaterThanOrEqual(15);
  });
  it('every gear-ladder item can be found: dropped, sold or rewarded', () => {
    const obtainable = new Set<string>();
    for (const l of Object.values(DROPS)) for (const d of l) obtainable.add(d.item);
    for (const s of Object.values(STOCKS)) for (const e of s) obtainable.add(e.id);
    for (const q of Object.values(QUESTS)) for (const r of q.reward.items) obtainable.add(r.id);
    for (const d of Object.values(DUNGEONS)) for (const r of d.reward.items) obtainable.add(r.id);
    for (const i of GEAR.items) { expect(ITEMS[i.id], i.id).toBeDefined(); expect(obtainable.has(i.id), `${i.id} obtainable`).toBe(true); }
  });
  it('each chapter gate is reachable: gate bosses live in the previous chapter', () => {
    for (const n of CHAPTER_IDS.filter((c) => c > 1)) for (const b of CHAPTERS[n]!.gate?.bosses ?? []) expect(BOSSES[b]?.chapter, `${n}: ${b}`).toBe(n - 1);
  });
});
