import type { ChapterDef } from '../chapters';
import type { DungeonDef } from '../dungeons';
import type { EnemyDef } from '../enemies';
import type { BossDef } from '../boss';
import type { ItemDef } from '../items';
import type { MapDef } from '../maps';
import type { NpcDef, QuestDef } from '../quests';
import type { ZoneDef } from '../zones';

/** A recipe offered by the chapter's alchemist (herbs + stones -> one item). */
export interface RecipeDef { id: string; name: string; output: string; herbs: number; stones: number; note: string }

/**
 * Everything one chapter adds to the game, in one data module. Registries (ZONES, ENEMIES, BOSSES, QUESTS, ...)
 * merge every module in `content/index.ts`, so adding a chapter never touches engine code.
 * Content modules must only `import type` from the data registries (no value imports) to avoid import cycles.
 */
export interface ChapterContent {
  /** the chapter definition itself (omit for modules that only extend an existing chapter) */
  chapter?: ChapterDef;
  /** the generated map (omit when extending a chapter that already has one) */
  map?: MapDef;
  zones: ZoneDef[];
  enemies: EnemyDef[];
  bosses: BossDef[];
  quests: QuestDef[];
  npcs: Record<string, NpcDef>;
  items: ItemDef[];
  /** item id -> icon in the pack (kind 'ui' or 'icon') */
  icons: Record<string, { kind: 'ui' | 'icon'; key: string }>;
  /** per enemy/boss id */
  drops: Record<string, { item: string; chance: number }[]>;
  /** per zone id: gear elites may drop */
  eliteLoot: Record<string, string[]>;
  /** shop stock by stock id (npc.stock) -> item ids */
  stocks: Record<string, string[]>;
  /** alchemy recipes by recipe-book id (npc.recipes) */
  recipes: Record<string, RecipeDef[]>;
  dungeons: DungeonDef[];
}

export const emptyContent = (): ChapterContent => ({ zones: [], enemies: [], bosses: [], quests: [], npcs: {}, items: [], icons: {}, drops: {}, eliteLoot: {}, stocks: {}, recipes: {}, dungeons: [] });
