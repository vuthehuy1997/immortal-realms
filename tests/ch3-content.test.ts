import { describe, expect, it } from 'vitest';
import { CH3 } from '../src/data/content/ch3';
import { BOSSES, bossesOfChapter } from '../src/data/boss';
import { ITEMS, DROPS } from '../src/data/items';
import { STOCKS } from '../src/core/shop';
import { RECIPE_BOOKS } from '../src/core/alchemy';
import { NPCS, QUESTS } from '../src/data/quests';

describe('chapter 3 content module (The Ember Wastes)', () => {
  it('has a large, multi-zone map', () => {
    const m = CH3.map!;
    expect(m.width).toBeGreaterThanOrEqual(150); expect(m.height).toBeGreaterThanOrEqual(128);
    expect(CH3.zones.length).toBeGreaterThanOrEqual(7);
    expect(m.zones).toEqual(CH3.zones.map((z) => z.id));
    expect(m.liquid).toBe('lava');
    expect(m.portal && m.portalNext).toBeTruthy();
  });
  it('has enough foes with mixed behaviours', () => {
    expect(CH3.enemies.length).toBeGreaterThanOrEqual(9);
    expect(CH3.enemies.filter((e) => e.behavior === 'caster').length).toBeGreaterThanOrEqual(3);
    expect(CH3.enemies.filter((e) => e.behavior === 'charger').length).toBeGreaterThanOrEqual(2);
  });
  it('has three open-map bosses and one boss per dungeon, with three phases of moves', () => {
    expect(bossesOfChapter(3).map((b) => b.id).sort()).toEqual(['furnacewarden', 'mirageempress', 'sandwyrm']);
    for (const b of CH3.bosses) { expect(b.kit.length).toBe(3); for (const phase of b.kit) for (const mv of phase) expect(b.moves[mv], `${b.id} ${mv}`).toBeDefined(); }
    expect(CH3.dungeons.length).toBeGreaterThanOrEqual(3);
    expect(CH3.dungeons.filter((d) => d.kind === 'cave').length).toBeGreaterThanOrEqual(2);
    expect(CH3.dungeons.filter((d) => d.kind === 'realm').length).toBeGreaterThanOrEqual(1);
    expect(new Set(CH3.dungeons.map((d) => d.entrance.zone)).size).toBe(CH3.dungeons.length);
  });
  it('the main chain ends with the Furnace Warden and the best gear drops from the right bosses', () => {
    expect(QUESTS['ember-furnace']!.objectives[0]).toMatchObject({ type: 'kill', target: 'furnacewarden' });
    expect(DROPS.furnacewarden).toEqual(expect.arrayContaining([{ item: 'furnace-saber', chance: 1 }, { item: 'furnace-seal', chance: 1 }]));
    expect(DROPS.mirageempress).toEqual(expect.arrayContaining([{ item: 'furnace-robe', chance: 1 }]));
    expect(BOSSES.furnacewarden!.zone).toBe('furnace');
    expect(CH3.quests.length).toBeGreaterThanOrEqual(11);
  });
  it('has a shop, an alchemist and wild NPCs', () => {
    const own = Object.values(CH3.npcs);
    expect(own.length).toBeGreaterThanOrEqual(5);
    expect(own.some((n) => n.trade === 'shop' && n.stock === 'ember')).toBe(true);
    expect(own.some((n) => n.trade === 'alchemy' && n.recipes === 'ember')).toBe(true);
    expect(Object.keys(CH3.map!.npcs).sort()).toEqual(Object.keys(CH3.npcs).sort());
    expect(NPCS['trader-sahn']).toBeDefined();
  });
  it('the ember shop sells the chapter gear and every recipe makes a real item', () => {
    const stock = STOCKS.ember!.map((e) => e.id);
    expect(stock).toEqual(expect.arrayContaining(['ember-blade', 'ember-mail']));
    for (const r of RECIPE_BOOKS.ember!) expect(ITEMS[r.output], r.id).toBeDefined();
  });
  it('new gear never outranks the chapter ladder', () => {
    expect(ITEMS['ember-glassblade']!.weaponAtk!).toBeLessThan(ITEMS['furnace-saber']!.weaponAtk!);
    expect(ITEMS['ember-obsidian-plate']!.defBonus!).toBeLessThan(ITEMS['furnace-robe']!.defBonus!);
    expect(ITEMS['ember-obsidian-plate']!.hpBonus!).toBeLessThan(ITEMS['furnace-robe']!.hpBonus!);
    expect(ITEMS['ember-wyrm-scale']!.atkBonus!).toBeLessThan(ITEMS['furnace-seal']!.atkBonus!);
  });
});
