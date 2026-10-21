# design/ — every game entity, exported

Generated from the code, so it cannot drift: `npm run design` (or `npm run design:check`, which also fails on any consistency problem).

| Path | What |
|---|---|
| `index.html` | Open in a browser: searchable gallery of enemies, bosses, heroes, items, skills, NPCs, props, quests, zones with pictures |
| `catalog/*.md` | One readable page per area (tables + pictures): enemies, bosses, heroes/roots/realms, skills/combat constants, items/drops/shop/alchemy, quests/NPCs, zones/props/**world map**, art library, **consistency report** |
| `entities/*.json` | Machine-readable dump of the same data (+ derived values: scaled enemy stats per zone, item sources, boss quest links) |
| `images/` | Picture per entity (first idle frame, icon, portrait, fx frame), the rendered world map, and contact sheets of the whole art library |

## How to change the game (the update flow)

1. Edit the **source of truth**, never `design/`: `src/data/*.ts` (enemies, bosses, items, quests, zones, skills, props, icons) or the constants in `src/core/*`.
2. `npm run design` — regenerates this folder; read the git diff of `design/entities/*.json` to see exactly what your change did to the game (stats, drops, quest links).
3. `npm run design:check` — must report `consistency: ok` (no item without an icon or a source, no boss without a quest/drop, no NPC with a missing portrait or quest, no enemy that spawns nowhere).
4. Commit data change + regenerated `design/` together.

Adding a new entity: add the row in `src/data/…`, add its art key to `ITEM_ICON` / sprite name, run the two commands above. Art that must be produced goes through `tools/build_assets.py` and `docs/ASSET_LICENSE_AUDIT.md` first.

## What is *not* generated (hand-written design intent)

`docs/GDD.md`, `docs/DECISIONS.md` (ADRs), `docs/QC_ACCEPTANCE.md`. Those say *why*; this folder says *what is in the game now*.
