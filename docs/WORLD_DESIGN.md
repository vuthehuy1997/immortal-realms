# World — current build
Seeded 80×80-tile map (seed 20261016, 16 units per tile), generated in `src/core/world.ts`; picture: `design/images/world/map.png`.
Zones: Azure Cloud Sect (safe hub, elder / merchant / alchemist), Whispering Bamboo Forest (Lv 1-4, W), Mistveil Marsh (Lv 3-7, S; Jiao Dragon pool to the east), Peach Spirit Grove (Lv 5-9, NW; Nine-Tailed den), Broken Sword Ruins (Lv 7-12, E), Fallen Immortal's Court (boss, NE). Roads join the hub to each anchor; props carry collision rectangles (`src/data/props.ts`); herbs are gathering nodes. All names original. Open: authored landmarks, dungeons, day/night.

## Chapters (round 11)
The game is now a sequence of chapter maps (see `docs/CHAPTERS_DESIGN.md`, `design/catalog/chapters.md`).
- Chapter 1 *The Broken Seals*: the 80x80 sect world; the Sky Gate stands on the south edge of the sect (opens at level 10 with all three guardians defeated).
- Chapter 2 *The Sundered Sky*: 112x96. Hub Skyfall Outpost (SW). Road east to Whitefrost Pass, on to the Crystal Hollow (Crystal Colossus), then north to the Sundered Sky Summit (Sundered Sovereign). A second road leads north from the outpost to the Ashen Barrow (Corpse King). Hermit Wen lives just off the pass road.
- Maps for chapters >= 2 are declared in `src/data/maps.ts` and built by `src/core/mapgen.ts`; add a chapter by adding zones, a `MapDef`, a `ChapterDef`, NPCs/quests/bosses with `chapter`, and the unit tests (`tests/chapters.test.ts`) check reachability and data links automatically.
