import type { PropKind } from './props';
import type { ZoneDef, ZoneId } from './zones';
import type { GroundKind } from '../core/world';
import { CONTENT } from './content';

/**
 * Caves and secret realms: small self-contained maps entered through a gate on a chapter map.
 * A cave is an organic cavern; a realm is a chain of chambers. Both end in a boss with a unique reward.
 * The dungeon id doubles as its pseudo-zone id (see `dungeonZone`), so tiers, moods and spawns reuse the zone system.
 */
export interface DungeonDef {
  id: string;
  name: string;
  chapter: number;
  kind: 'cave' | 'realm';
  /** one-line hook shown on the entrance prompt */
  blurb: string;
  /** entrance on the chapter map: tile + the zone it stands in (also where the player re-appears) */
  entrance: { x: number; y: number; zone: ZoneId };
  /** minimum character level to step inside */
  minLevel: number;
  /** recommended-level label shown in the banner */
  level: string;
  seed: number;
  size: { w: number; h: number };
  /** walkable floor and the colour of the impassable rock around it */
  floor: GroundKind;
  wall: 'wall' | 'void';
  /** scenery sprinkled over the floor: prop -> density per floor tile */
  scatter: { kind: PropKind; p: number }[];
  /** enemies spawned inside: type id -> count (every dungeon is denser than the open map) */
  spawns: Record<string, number>;
  mood: ZoneDef['mood'];
  tier: ZoneDef['tier'];
  propTint?: number;
  /** boss at the far end (its BossDef must carry `dungeon: id`) */
  boss: string;
  /** one-time reward for the first clear (xp / stones / items) */
  reward: { xp: number; stones: number; items: { id: string; count: number }[] };
  /** spirit herbs lying around */
  herbs: number;
  /** extra chambers for realms (3-6), pockets for caves (ignored) */
  rooms?: number;
}

export const DUNGEONS: Record<string, DungeonDef> = Object.fromEntries(CONTENT.flatMap((c) => c.dungeons).map((d) => [d.id, d]));
export const DUNGEON_IDS = Object.keys(DUNGEONS);
export const dungeonsOfChapter = (n: number): DungeonDef[] => Object.values(DUNGEONS).filter((d) => d.chapter === n);
export const dungeonOfBoss = (bossId: string): DungeonDef | undefined => Object.values(DUNGEONS).find((d) => d.boss === bossId);

/** The pseudo-zone a dungeon registers in `ZONES`. */
export const dungeonZone = (d: DungeonDef): ZoneDef => ({
  id: d.id, chapter: d.chapter, name: d.name, anchor: { x: Math.floor(d.size.w / 2), y: Math.floor(d.size.h / 2) }, level: d.level,
  spawns: d.spawns, mood: d.mood, tier: d.tier, propTint: d.propTint, dungeon: d.id,
});
