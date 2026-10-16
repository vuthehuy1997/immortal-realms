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
}

export const ZONES: Record<ZoneId, ZoneDef> = {
  village: { id: 'village', name: 'Azure Cloud Sect', anchor: { x: 40, y: 42 }, level: 'Safe', spawns: {}, mood: 'day' },
  bamboo: { id: 'bamboo', name: 'Whispering Bamboo Forest', anchor: { x: 13, y: 42 }, level: 'Lv 1-4', spawns: { wolf: 6, snake: 3, foxfire: 3, treant: 1 }, mood: 'day' },
  marsh: { id: 'marsh', name: 'Mistveil Marsh', anchor: { x: 40, y: 68 }, level: 'Lv 3-7', spawns: { toad: 4, waterghost: 3, ghost: 3, snake: 2 }, mood: 'mist' },
  grove: { id: 'grove', name: 'Peach Spirit Grove', anchor: { x: 30, y: 14 }, level: 'Lv 5-9', spawns: { peachspirit: 3, bat: 4, paperdoll: 3, swordspirit: 2, thunderbird: 1 }, mood: 'dusk' },
  ruins: { id: 'ruins', name: 'Broken Sword Ruins', anchor: { x: 68, y: 48 }, level: 'Lv 7-12', spawns: { skeleton: 4, jiangshi: 3, soldier: 3, golem: 2 }, mood: 'night' },
  lair: { id: 'lair', name: "Fallen Immortal's Court", anchor: { x: 66, y: 13 }, level: 'Boss', spawns: {}, mood: 'night' },
};

export const ZONE_IDS = Object.keys(ZONES) as ZoneId[];
