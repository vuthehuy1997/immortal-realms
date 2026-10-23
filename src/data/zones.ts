export type ZoneId = 'village' | 'bamboo' | 'marsh' | 'ruins' | 'grove' | 'lair' | 'outpost' | 'frostpass' | 'crystal' | 'barrow' | 'summit';

export interface ZoneDef {
  id: ZoneId;
  /** chapter (map) this zone belongs to */
  chapter: number;
  name: string;
  /** anchor in tiles (centre of the zone / end of its road) */
  anchor: { x: number; y: number };
  /** recommended character level, shown in the zone banner */
  level: string;
  /** enemies spawned in this zone: type id -> count */
  spawns: Record<string, number>;
  mood: 'day' | 'dusk' | 'mist' | 'night' | 'frost';
  /** stat multipliers applied to every enemy that spawns here (the zone's danger level) */
  tier: { hp: number; atk: number; xp: number };
  /** multiply-tint for the scenery inside the zone (frosted pines, ashen stones, ...) */
  propTint?: number;
}

export const ZONES: Record<ZoneId, ZoneDef> = {
  village: { id: 'village', chapter: 1, name: 'Azure Cloud Sect', anchor: { x: 40, y: 42 }, level: 'Safe', spawns: {}, mood: 'day', tier: { hp: 1, atk: 1, xp: 1 } },
  bamboo: { id: 'bamboo', chapter: 1, name: 'Whispering Bamboo Forest', anchor: { x: 13, y: 42 }, level: 'Lv 1-4', spawns: { wolf: 6, snake: 3, foxfire: 3, treant: 1 }, mood: 'day', tier: { hp: 1, atk: 1.2, xp: 1 } },
  marsh: { id: 'marsh', chapter: 1, name: 'Mistveil Marsh', anchor: { x: 40, y: 68 }, level: 'Lv 3-7', spawns: { toad: 4, waterghost: 3, ghost: 3, snake: 2 }, mood: 'mist', tier: { hp: 1.5, atk: 1.5, xp: 1.8 } },
  grove: { id: 'grove', chapter: 1, name: 'Peach Spirit Grove', anchor: { x: 30, y: 14 }, level: 'Lv 5-9', spawns: { peachspirit: 3, bat: 4, paperdoll: 3, swordspirit: 2, thunderbird: 1 }, mood: 'dusk', tier: { hp: 2.3, atk: 1.9, xp: 2.8 } },
  ruins: { id: 'ruins', chapter: 1, name: 'Broken Sword Ruins', anchor: { x: 68, y: 48 }, level: 'Lv 7-12', spawns: { skeleton: 4, jiangshi: 3, soldier: 3, golem: 2 }, mood: 'night', tier: { hp: 3.0, atk: 2.4, xp: 4 } },
  lair: { id: 'lair', chapter: 1, name: "Fallen Immortal's Court", anchor: { x: 66, y: 13 }, level: 'Boss', spawns: {}, mood: 'night', tier: { hp: 3.0, atk: 2.4, xp: 4 } },
  // Chapter 2: The Sundered Sky (anchors are tiles on the 112x96 chapter map)
  outpost: { propTint: 0xdce8f8, id: 'outpost', chapter: 2, name: 'Skyfall Outpost', anchor: { x: 18, y: 80 }, level: 'Safe', spawns: {}, mood: 'frost', tier: { hp: 1, atk: 1, xp: 1 } },
  frostpass: { propTint: 0xb4d0ee, id: 'frostpass', chapter: 2, name: 'Whitefrost Pass', anchor: { x: 52, y: 68 }, level: 'Lv 10-14', spawns: { frostwolf: 6, icesnake: 3, frostwisp: 3, rimebat: 4, snowtreant: 1 }, mood: 'frost', tier: { hp: 3.4, atk: 2.7, xp: 4.6 } },
  crystal: { propTint: 0x9ee0ff, id: 'crystal', chapter: 2, name: 'Crystal Hollow', anchor: { x: 90, y: 62 }, level: 'Lv 12-16', spawns: { crystalgolem: 3, prismghost: 3, shardbird: 2, frostwisp: 2, rimebat: 3 }, mood: 'frost', tier: { hp: 3.9, atk: 3.0, xp: 5.6 } },
  barrow: { propTint: 0x8c88a2, id: 'barrow', chapter: 2, name: 'Ashen Barrow', anchor: { x: 26, y: 36 }, level: 'Lv 13-18', spawns: { ashskeleton: 5, bloodjiangshi: 3, ashguard: 4, prismghost: 2 }, mood: 'night', tier: { hp: 4.3, atk: 3.3, xp: 6.4 } },
  summit: { propTint: 0xaab8e0, id: 'summit', chapter: 2, name: 'Sundered Sky Summit', anchor: { x: 84, y: 16 }, level: 'Boss', spawns: {}, mood: 'night', tier: { hp: 4.6, atk: 3.5, xp: 7 } },
};

export const ZONE_IDS = Object.keys(ZONES) as ZoneId[];
export const zonesOfChapter = (chapter: number): ZoneId[] => ZONE_IDS.filter((z) => ZONES[z].chapter === chapter);
