# Chapters (multi-map progression) — design, round 11

Owner feedback: "too basic, small map, split into several maps/stages, story, more characters, more depth."
This is a programme, not one round. Phase 1 (this round) builds the framework and the first new map; later phases deepen it.

## Phases
| Phase | Scope | Status |
|---|---|---|
| 1 | Chapter framework: per-chapter maps, zones, NPCs, quests, bosses; gated portal between chapters; save field `chapter`; prologue + chapter intro story pages; Chapter 2 map "The Sundered Sky" (112x96, 5 zones, hub, 3 bosses, 5 quests, new gear) | this round |
| 2 | Chapter 3+ maps, more realms (Foundation Establishment), trial tower, reputation | planned |
| 3 | Distinct martial arts per hero (class kits), companions (the 3 non-playable pack heroes), sect/crafting | planned |

## Story (original)
Prologue — The Azure Cloud Sect's founder sealed the Heavenly Fissure with three guardian seals: a sword immortal, a fox spirit and a mist dragon. The seals have rotted; the guardians went feral. The player, a new disciple, puts all three to rest (Chapter 1: *The Broken Seals*).
Chapter 2 — *The Sundered Sky*: with the guardians gone the Fissure tears open. Its edge, the Skyfall Outpost, is held by Commander Shen. Beyond lie the Whitefrost Pass, the Crystal Hollow and the Ashen Barrow; at the summit the Sundered Sovereign, the sealed thing the guardians were bred to hold back, waits.

## Data model
- `src/data/chapters.ts`: `ChapterDef { id, name, subtitle, story[], hub zone, zones[], bosses[], gate? }`; `canEnterChapter(gs, n)`.
- `src/data/maps.ts`: declarative `MapDef` for generated chapters (size, hub, zone anchors, roads, ground layers, scatter, boss arenas, NPC tiles, portal tile). Chapter 1 keeps its hand-tuned generator (`generateWorld`) so existing tests are untouched.
- `src/core/mapgen.ts`: `generateFromDef(def)` -> `WorldMap` (same shape as chapter 1, plus `bossHomes`, `portal`, `chapter`).
- `WorldMap.bossHomes[bossId]` replaces the `lair/den/pool` switch; `lair/den/pool` stay for chapter 1 landmarks (and e2e hooks).
- `GameState.chapter` (default 1; older saves are migrated on load). Position is per current chapter.

## Art honesty
No new art source is available offline (pack zip is not committed). Chapter 2 reuses the pack's sprites with colour tints (frost wolf, crystal golem, ...) and new procedural ground (snow, ice, ash). The Chapter 2 bosses reuse mob/boss sprites at larger scale or tinted: labelled PLACEHOLDER in `src/data/boss.ts`, to replace before release.
