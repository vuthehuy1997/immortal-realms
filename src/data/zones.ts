export type ZoneId = 'village' | 'bamboo' | 'marsh' | 'ruins' | 'grove' | 'lair';

export interface ZoneDef {
  id: ZoneId;
  name: string;
  /** anchor in tiles (centre of the zone / end of its road) */
  anchor: { x: number; y: number };
  /** recommended character level, shown in the zone banner */
  level: string;
  /** enemies spawned in this zone: type id -> count */
  spawns: Record<string, number>;
  mood: 'day' | 'dusk' | 'mist' | 'night';
  /** stat multipliers applied to every enemy that spawns here (the zone's danger level) */
  tier: { hp: number; atk: number; xp: number };
}

export const ZONES: Record<ZoneId, ZoneDef> = {
  village: { id: 'village', name: 'Azure Cloud Sect', anchor: { x: 40, y: 42 }, level: 'Safe', spawns: {}, mood: 'day', tier: { hp: 1, atk: 1, xp: 1 } },
  bamboo: { id: 'bamboo', name: 'Whispering Bamboo Forest', anchor: { x: 13, y: 42 }, level: 'Lv 1-4', spawns: { wolf: 6, snake: 3, foxfire: 3, treant: 1 }, mood: 'day', tier: { hp: 1, atk: 1.2, xp: 1 } },
  marsh: { id: 'marsh', name: 'Mistveil Marsh', anchor: { x: 40, y: 68 }, level: 'Lv 3-7', spawns: { toad: 4, waterghost: 3, ghost: 3, snake: 2 }, mood: 'mist', tier: { hp: 1.5, atk: 1.5, xp: 1.8 } },
  grove: { id: 'grove', name: 'Peach Spirit Grove', anchor: { x: 30, y: 14 }, level: 'Lv 5-9', spawns: { peachspirit: 3, bat: 4, paperdoll: 3, swordspirit: 2, thunderbird: 1 }, mood: 'dusk', tier: { hp: 2.3, atk: 1.9, xp: 2.8 } },
  ruins: { id: 'ruins', name: 'Broken Sword Ruins', anchor: { x: 68, y: 48 }, level: 'Lv 7-12', spawns: { skeleton: 4, jiangshi: 3, soldier: 3, golem: 2 }, mood: 'night', tier: { hp: 3.0, atk: 2.4, xp: 4 } },
  lair: { id: 'lair', name: "Fallen Immortal's Court", anchor: { x: 66, y: 13 }, level: 'Boss', spawns: {}, mood: 'night', tier: { hp: 3.0, atk: 2.4, xp: 4 } },
};

export const ZONE_IDS = Object.keys(ZONES) as ZoneId[];
