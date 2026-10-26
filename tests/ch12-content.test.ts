import { describe, expect, it } from 'vitest';
import { scaledEnemy } from '../src/core/balance';
import { deriveStats } from '../src/core/character';
import { COMBO } from '../src/core/combo';
import { generateChapter, isBlockedTile, TILE_SIZE, zoneAt, type WorldMap } from '../src/core/world';
import { BOSSES, bossesOfChapter } from '../src/data/boss';
import { CHAPTERS, canEnterChapter } from '../src/data/chapters';
import { CH1 } from '../src/data/content/ch1';
import { CH2 } from '../src/data/content/ch2';
import { DUNGEONS, dungeonsOfChapter } from '../src/data/dungeons';
import { ENEMIES } from '../src/data/enemies';
import { ITEMS } from '../src/data/items';
import { ITEM_ICON } from '../src/data/icons';
import { CHAPTER1_MAP, CHAPTER2_MAP } from '../src/data/maps';
import { NPCS, QUESTS, questsOfChapter } from '../src/data/quests';
import { ZONES, zonesOfChapter, type ZoneDef } from '../src/data/zones';

/** Targets of docs/CONTENT_GUIDE.md for chapters 1 and 2, plus fight balance for every zone and dungeon those chapters add. */
describe('chapter 1 depth', () => {
  it('meets the content targets', () => {
    expect(CHAPTER1_MAP.width).toBeGreaterThanOrEqual(144); expect(CHAPTER1_MAP.height).toBeGreaterThanOrEqual(124);
    expect(zonesOfChapter(1).length).toBeGreaterThanOrEqual(8);
    const ds = dungeonsOfChapter(1);
    expect(ds.length).toBeGreaterThanOrEqual(3);
    expect(ds.filter((d) => d.kind === 'cave').length).toBeGreaterThanOrEqual(2);
    expect(ds.filter((d) => d.kind === 'realm').length).toBeGreaterThanOrEqual(1);
    expect(CH1.enemies.length).toBeGreaterThanOrEqual(4);
    expect(CH1.enemies.filter((e) => e.behavior === 'caster').length).toBeGreaterThanOrEqual(2);
    expect(CH1.enemies.filter((e) => e.behavior === 'charger').length).toBeGreaterThanOrEqual(2);
    expect(questsOfChapter(1).length).toBeGreaterThanOrEqual(8);
    expect(bossesOfChapter(1).length).toBeGreaterThanOrEqual(3);
  });
  it('has at least three NPCs standing out in the wild, each with a quest', () => {
    const wild = Object.keys(CH1.npcs).filter((id) => zoneAtTile(generateChapter(1), CHAPTER1_MAP.npcs[id]!) !== 'village');
    expect(wild.length).toBeGreaterThanOrEqual(3);
    for (const id of wild) expect(NPCS[id]!.quests.length, id).toBeGreaterThan(0);
  });
});

describe('chapter 2 depth', () => {
  it('meets the content targets', () => {
    expect(CHAPTER2_MAP.width).toBeGreaterThanOrEqual(144); expect(CHAPTER2_MAP.height).toBeGreaterThanOrEqual(124);
    expect(zonesOfChapter(2).length).toBeGreaterThanOrEqual(7);
    expect(CHAPTER2_MAP.portal).toBeDefined(); expect(CHAPTER2_MAP.portalNext).toBeDefined();
    const ds = dungeonsOfChapter(2);
    expect(ds.length).toBeGreaterThanOrEqual(3);
    expect(ds.filter((d) => d.kind === 'cave').length).toBeGreaterThanOrEqual(2);
    expect(ds.filter((d) => d.kind === 'realm').length).toBeGreaterThanOrEqual(1);
    expect(CH2.enemies.length).toBeGreaterThanOrEqual(5);
    expect(questsOfChapter(2).length).toBeGreaterThanOrEqual(8);
    for (const id of ['corpseking', 'crystalcolossus', 'sovereign']) expect(bossesOfChapter(2).map((b) => b.id)).toContain(id);
  });
  it('has at least three NPCs standing out in the wild, each with a quest', () => {
    const wild = Object.keys(CH2.npcs);
    expect(wild.length).toBeGreaterThanOrEqual(3);
    const m = generateChapter(2);
    for (const id of wild) { expect(NPCS[id]!.quests.length, id).toBeGreaterThan(0); expect(zoneAtTile(m, CHAPTER2_MAP.npcs[id]!), id).not.toBe('outpost'); }
  });
  it('the gate onward is placed and chapter 2 still needs the three guardians (dungeon bosses never block it)', () => {
    const m = generateChapter(2); expect(m.portalNext).toBeDefined();
    expect(canEnterChapter(2, 10, ['warden', 'ninetail', 'jiaolong']).ok).toBe(true);
    if (CHAPTERS[3]) for (const b of CHAPTERS[3].gate?.bosses ?? bossesOfChapter(2).map((x) => x.id)) expect(BOSSES[b]?.dungeon, b).toBeUndefined();
  });
});

describe('new content is internally consistent', () => {
  const content = [CH1, CH2];
  it('every new quest reward, drop, elite loot, dungeon reward and icon refers to a real item', () => {
    for (const c of content) {
      for (const q of c.quests) for (const r of q.reward.items) expect(ITEMS[r.id], `${q.id}: ${r.id}`).toBeDefined();
      for (const [id, ds] of Object.entries(c.drops)) { expect(ENEMIES[id] ?? BOSSES[id], `drop owner ${id}`).toBeDefined(); for (const d of ds) expect(ITEMS[d.item], `${id}: ${d.item}`).toBeDefined(); }
      for (const [z, l] of Object.entries(c.eliteLoot)) { expect(ZONES[z], z).toBeDefined(); for (const i of l) expect(ITEMS[i], `${z}: ${i}`).toBeDefined(); }
      for (const d of c.dungeons) for (const r of d.reward.items) expect(ITEMS[r.id], `${d.id}: ${r.id}`).toBeDefined();
      for (const i of c.items) expect(ITEM_ICON[i.id], `icon of ${i.id}`).toBeDefined();
    }
  });
  it('new ids are unique across the game and every new quest has a giver who stands somewhere on the map', () => {
    const ids = [...CH1.items, ...CH2.items].map((i) => i.id); expect(new Set(ids).size).toBe(ids.length);
    const eids = [...CH1.enemies, ...CH2.enemies].map((e) => e.id); expect(new Set(eids).size).toBe(eids.length);
    for (const c of content) for (const q of c.quests) {
      const m = generateChapter(q.chapter ?? 1); expect(m.npcs[q.giver], `${q.id} giver ${q.giver} placed`).toBeDefined();
    }
  });
  it('new gear stays below each chapter\'s best items', () => {
    for (const i of CH1.items) { expect(i.weaponAtk ?? 0, i.id).toBeLessThan(ITEMS['jade-sword']!.weaponAtk! + 1); expect(i.defBonus ?? 0, i.id).toBeLessThanOrEqual(ITEMS['immortal-mantle']!.defBonus!); }
    for (const i of CH2.items) { expect(i.weaponAtk ?? 0, i.id).toBeLessThan(ITEMS['sovereign-blade']!.weaponAtk!); expect(i.defBonus ?? 0, i.id).toBeLessThanOrEqual(ITEMS['crystal-robe']!.defBonus!); expect(i.manaBonus ?? 0, i.id).toBeLessThanOrEqual(ITEMS['sky-seal']!.manaBonus!); }
  });
  it('every new zone and dungeon is mapped, populated and reachable from the hub', () => {
    for (const n of [1, 2]) {
      const m = generateChapter(n), ok = reach(m);
      for (const z of zonesOfChapter(n)) expect(ok(m.anchors[z]!), z).toBe(true);
      for (const d of dungeonsOfChapter(n)) expect(ok(m.entrances[d.id]!), d.id).toBe(true);
    }
  });
});

// ---- balance ----
const realmAt = (level: number) => (level >= 20 ? 3 : level >= 10 ? 2 : level >= 5 ? 1 : 0);
const stats = (level: number, gear: Parameters<typeof deriveStats>[3]) => deriveStats('flame', level, realmAt(level), gear);
const crit = (s: ReturnType<typeof stats>) => 1 + s.critChance * (s.critMult - 1);
const cycle = COMBO.reduce((a, h) => a + h.recover, 0);
const comboDps = (s: ReturnType<typeof stats>, def: number) => COMBO.reduce((a, h) => a + Math.max(1, s.atk * h.mult - def * 0.5) * crit(s), 0) / cycle;
const enemyDps = (atk: number, cd: number, def: number) => Math.max(1, atk - def * 0.5) / cd;
const band = (z: ZoneDef): [number, number] => { const m = /Lv (\d+)-(\d+)/.exec(z.level)!; return [Number(m[1]), Number(m[2])]; };
const fightZones = (n: number): ZoneDef[] => [...zonesOfChapter(n).map((z) => ZONES[z]!), ...dungeonsOfChapter(n).map((d) => ZONES[d.id]!)].filter((z) => Object.keys(z.spawns).length > 0);

describe('chapter 1 fights (new zones and caves, no gear: the first-time hero)', () => {
  for (const z of fightZones(1)) {
    const [lo, hi] = band(z), level = Math.round((lo + hi) / 2);
    for (const id of Object.keys(z.spawns)) {
      it(`${z.id}/${id} at level ${level}`, () => {
        const def = ENEMIES[id]!, sc = scaledEnemy(def, z.id), p = stats(level, null);
        const ttk = sc.maxHp / comboDps(p, sc.def), dps = enemyDps(sc.atk, def.attackCooldown, p.def), pct = (dps / p.maxHp) * 100;
        expect(ttk, `ttk ${ttk.toFixed(1)}s`).toBeGreaterThanOrEqual(def.behavior === 'caster' ? 1.2 : 2.0); expect(ttk).toBeLessThanOrEqual(def.maxHp >= 100 ? 16 : 9);
        expect(pct, `% hp per s ${pct.toFixed(1)}`).toBeGreaterThanOrEqual(1.5); expect(pct).toBeLessThanOrEqual(11);
        expect(Math.max(1, sc.atk - p.def * 0.5) / p.maxHp, 'one hit').toBeLessThan(0.2);
      });
    }
  }
  it('zones get tougher along the road out from the sect', () => {
    const t = (z: string) => ZONES[z]!.tier;
    expect(t('lake').hp).toBeGreaterThan(t('bamboo').hp); expect(t('marsh').hp).toBeGreaterThan(t('lake').hp); expect(t('cliffs').hp).toBeGreaterThan(t('grove').hp - 0.1);
    for (const d of dungeonsOfChapter(1)) expect(d.tier.hp, d.id).toBeGreaterThan(ZONES[d.entrance.zone]!.tier.hp - 0.01);
  });
  it('dungeon bosses are long phased fights that do not one-shot', () => {
    for (const d of dungeonsOfChapter(1)) {
      const b = BOSSES[d.boss]!, top = band(ZONES[d.id]!)[1], s = stats(top, null), ttk = b.maxHp / comboDps(s, b.def);
      expect(ttk, `${b.id} ttk ${ttk.toFixed(0)}s at L${top}`).toBeGreaterThan(25); expect(ttk).toBeLessThan(300);
      expect(b.atk * 1.9 - s.def * 0.5, `${b.id} heaviest hit`).toBeLessThan(s.maxHp * 0.45);
    }
  });
});

const CH1_BEST = CHAPTERS[2]!.gear.arrive, CH2_SHOP = CHAPTERS[2]!.gear.shop;
describe('chapter 2 fights (every zone and dungeon, arriving with chapter 1 gear)', () => {
  for (const z of fightZones(2)) {
    const [lo, hi] = band(z), level = Math.round((lo + hi) / 2);
    for (const id of Object.keys(z.spawns)) {
      it(`${z.id}/${id} at level ${level}`, () => {
        const def = ENEMIES[id]!, sc = scaledEnemy(def, z.id), old = stats(level, CH1_BEST), shop = stats(level, CH2_SHOP);
        const ttkOld = sc.maxHp / comboDps(old, sc.def), ttkShop = sc.maxHp / comboDps(shop, sc.def);
        expect(ttkOld, `ttk with ch1 gear ${ttkOld.toFixed(1)}s`).toBeGreaterThan(3); expect(ttkOld).toBeLessThan(def.maxHp >= 100 ? 24 : 16);
        expect(ttkShop).toBeGreaterThan(2);
        const dps = enemyDps(sc.atk, def.attackCooldown, old.def);
        expect(old.maxHp / dps, `time to kill the hero ${(old.maxHp / dps).toFixed(0)}s`).toBeGreaterThan(12);
        expect(dps * ttkOld, 'a fight costs HP').toBeGreaterThan(old.maxHp * 0.03); expect(dps * ttkOld, 'but not most of it').toBeLessThan(old.maxHp * 0.6);
        expect(Math.max(1, sc.atk - old.def * 0.5) / old.maxHp, 'one hit').toBeLessThan(0.25);
      });
    }
  }
  it('the new zones sit between the pass and the barrow in danger, and above chapter 1', () => {
    const t = (z: string) => ZONES[z]!.tier.hp;
    expect(t('tundra')).toBeGreaterThan(t('frostpass')); expect(t('glaciermaw')).toBeGreaterThan(t('crystal')); expect(t('glaciermaw')).toBeLessThan(t('barrow') + 0.01);
    for (const z of ['tundra', 'glaciermaw']) expect(t(z)).toBeGreaterThan(ZONES.ruins!.tier.hp);
  });
  it('dungeon bosses are long phased fights that do not one-shot (shop gear at the top of their band)', () => {
    for (const d of dungeonsOfChapter(2)) {
      const b = BOSSES[d.boss]!, top = band(ZONES[d.id]!)[1], s = stats(top, CH2_SHOP), ttk = b.maxHp / comboDps(s, b.def);
      expect(ttk, `${b.id} ttk ${ttk.toFixed(0)}s at L${top}`).toBeGreaterThan(25); expect(ttk).toBeLessThan(300);
      expect(b.atk * 1.9 - s.def * 0.5, `${b.id} heaviest hit`).toBeLessThan(s.maxHp * 0.5);
      expect(b.atk, `${b.id} is a real threat`).toBeGreaterThan(s.maxHp * 0.06);
      expect(b.maxHp, b.id).toBeGreaterThan(BOSSES.jiaolong!.maxHp);
    }
  });
  it('every dungeon spawns foes denser than the open map', () => {
    for (const n of [1, 2]) for (const d of dungeonsOfChapter(n)) expect(Object.values(d.spawns).reduce((a, b) => a + b, 0), d.id).toBeGreaterThanOrEqual(18);
    expect(Object.keys(DUNGEONS).length).toBeGreaterThanOrEqual(7);
  });
});

describe('quest chains of the new content', () => {
  it('every new quest has an acyclic chain that ends at a quest of its own chapter, and every wild boss quest names a boss of that chapter', () => {
    for (const q of [...CH1.quests, ...CH2.quests]) {
      expect(q.chapter ?? 1).toBe(NPCS[q.giver]!.chapter ?? 1);
      let c: string | undefined = q.id; for (let i = 0; i < 20 && c; i++) c = QUESTS[c]!.requires; expect(c, q.id).toBeUndefined();
    }
    for (const d of [...dungeonsOfChapter(1), ...dungeonsOfChapter(2)].filter((x) => x.id.startsWith('s'))) expect(questsOfChapter(d.chapter).some((q) => q.objectives.some((o) => o.type === 'kill' && o.target === d.boss)), `${d.id} has a quest for its boss`).toBe(true);
  });
});

function reach(m: WorldMap) {
  const seen = new Set<number>(); const q: [number, number][] = [[Math.floor(m.spawn.x / TILE_SIZE), Math.floor(m.spawn.y / TILE_SIZE)]];
  while (q.length) {
    const [x, y] = q.pop()!; const k = y * m.width + x;
    if (seen.has(k) || isBlockedTile(m, x, y)) continue;
    seen.add(k); q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  return (p: { x: number; y: number }) => seen.has(Math.floor(p.y / TILE_SIZE) * m.width + Math.floor(p.x / TILE_SIZE));
}
function zoneAtTile(m: WorldMap, t: { x: number; y: number }) { return zoneAt(m, { x: (t.x + 0.5) * TILE_SIZE, y: (t.y + 0.5) * TILE_SIZE }); }
