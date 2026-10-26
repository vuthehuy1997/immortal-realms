# Content guide: authoring chapters, zones, caves and secret realms

Immortal Realms is data-driven. A chapter is **one data module** (`src/data/content/chN.ts`) plus nothing else: the engine
(`src/core`, `src/game`, `src/ui`) already knows how to generate its map, spawn its foes, run its quests, shops and dungeons.
**Authors do not edit engine code.** If the engine blocks you, stop and report exactly what is missing.

## 0. The target (what "done" means)

| | chapters | zones per chapter | dungeons per chapter | bosses per chapter | quests per chapter |
|---|---|---|---|---|---|
| goal | 5 | 6-8 (hub included) | >= 3 (>= 2 caves and >= 1 secret realm) | >= 3 on the open map + 1 per dungeon | >= 8 (main chain + side quests) |

Map size (tiles): chapter 1 is 144x124. Chapters 2-5 should be **at least 140x120** and chapter 5 can reach ~180x150.
Roads are long on purpose: exploring should take real time. Every zone must be visibly different (ground, scenery, tint, enemy roster).

Level curve (cap 50). Zone `level` labels are `'Lv a-b'` strings and drive the balance tests:

| chapter | name | levels | realm hint |
|---|---|---|---|
| 1 | The Broken Seals | 1-12 | Qi Condensation |
| 2 | The Sundered Sky | 10-20 | Foundation Establishment at 20 |
| 3 | The Ember Wastes | 18-28 | Golden Core at 28 |
| 4 | The Jade Heavens | 26-38 | Nascent Soul at 38 |
| 5 | The Crimson Abyss | 36-48 | Spirit Severing at 46 |

## 1. Story bible (original IP: never use names, text or art from other games)

The world is a cultivation realm. The Azure Cloud Sect sealed the Heavenly Fissure; the seals rot (chapter 1). The Fissure tears open
and a cold other-world pours through; the Sundered Sovereign is slain at the summit (chapter 2). Slaying it did not end the Fissure,
it only stopped the cold: the Fissure bled its other *heat* south and woke the buried Heavenly Furnace, the immortals' alchemy forge (chapter 3).
The furnace's smoke reaches the sky-realm where the fleeing immortals built their terraces; they have decided the mortal world is the cause (chapter 4).
Behind all of it is the Dao Demon of Tribulation, the thing every cultivator meets at the top of the Way (chapter 5, the finale).
Keep tone: serious xianxia, a little poetic; short plain English; no jokes that break the mood.

Each chapter needs: a hub (safe town with shop, alchemist, quest giver, optional lore NPC), a quest chain whose last quest is the chapter's final boss,
`story` pages (3-4 short pages shown on first arrival), and a `gate` (level + the previous chapter's open-map bosses).

## 2. Files you own and how a module is shaped

`src/data/content/chN.ts` exports `ChN: ChapterContent` (see `content/types.ts`). It is already listed in `content/index.ts`.

* chapters 3-5 define `chapter` (ChapterDef: id, name, subtitle, hub, gateName, story, gear, gate) and `map` (MapDef).
* chapter 1 and 2 modules only **extend** the existing chapter (no `chapter`/`map`; new zones, enemies, quests, dungeons...). Chapter 2 also
  needs a bigger map: edit `CHAPTER2_MAP` in `src/data/maps.ts` (and the chapter-2 zone anchors in `src/data/zones.ts`) *only for chapter 2*.
* Everything is merged into the registries by `content/index.ts`; use `import type` for registry types (value imports from registries cause import cycles).
  Ids must be unique across the whole game: prefix new ids with the chapter nickname (`ember-`, `jade-`, `abyss-`, ...).

Pieces (all in `ChapterContent`):

* `zones: ZoneDef[]` id, chapter, name, **anchor** (tile on the map), level `'Lv 18-22'` (`'Safe'` for hubs, `'Boss'` for boss courts),
  `spawns` (enemy id -> count; a 40x40 zone wants ~12-24 foes), `mood` (day|dusk|mist|night|frost, controls music and weather),
  `tier {hp, atk, xp}` (multiplies every foe of the zone), `propTint` (multiply colour for scenery).
* `enemies: EnemyDef[]` behaviours `rusher | caster | charger`; reuse sprites with `tint` (see section 4). **>= 8 new enemy types per chapter**, at least 3 casters and 2 chargers.
* `bosses: BossDef[]` each with a kit (`moves`) and phases; see `data/boss.ts`. Open-map bosses need an arena in `map.arenas` and a kill quest.
  Dungeon bosses set `dungeon: '<dungeon id>'` and `zone: '<dungeon id>'`.
* `quests` + `npcs` (QuestDef/NpcDef in `data/quests.ts`). Every NPC needs a portrait and a sprite from the manifest; `quests: [...]` lists the quests it gives.
  Every open-map boss needs a kill quest; quest `chapter` must equal the chapter.
* `items` (+ `icons`, `drops`, `eliteLoot`, `stocks`, `recipes`). New gear must be stronger than the previous chapter's best (see section 5).
* `dungeons: DungeonDef[]` (section 3).

## 3. Maps and dungeons

`MapDef` (see `data/maps.ts`, chapter 1 and 2 are examples): zones are a Voronoi of the zone anchors (use `zoneWeight` to resize), roads are polylines
(**every zone anchor must lie on a road end**, roads start at the hub), `rivers` carve water or lava (`liquid`), roads cross them as causeways,
`ground` per zone (base + noise layers), `scatter` rules per zone (prop kind, density; margin 0 for ground-hugging props), `arenas` for open-map bosses,
`hubProps`, `npcs` (tiles), `herbs`, `portal` (gate back; chapters 2+) and `portalNext` (gate onward), `extras` (hand-placed props, `force: true` for gateways).

Ground kinds: `grass grassDark moss path stone sand snow ice ash clay basalt jade crimson cloud` (walkable) and `water lava wall void` (blocking).
`stone` is dressed paving (plazas, arenas); use `basalt` for natural rock. `cloud` and `jade` suit sky chapters, `clay`/`sand` deserts, `crimson`/`ash` the abyss.

Dungeons (`DungeonDef`, `data/dungeons.ts`): `kind: 'cave'` (organic cavern, `floor` ground + `wall: 'wall'`) or `'realm'` (chain of chambers on
`wall: 'void'`, `rooms` 3-6). `entrance {x,y,zone}` is a tile on the chapter map (any open tile in that zone, the engine adds the spur road and the gate);
`minLevel`, `level` label, `size` (caves 70x56 to 90x64, realms 96x56 to 120x64), `scatter`, `spawns` (>= 18 foes, denser than the open map), `tier`, `boss`, `reward`, `herbs`.
The dungeon id is also its zone id. Give every dungeon its own atmosphere: different floor, tint, foes, boss.

Preview any map before trusting it:

```bash
node tools/map_preview.mjs chapter 3 /tmp/ch3.ppm && python3 -c "from PIL import Image; Image.open('/tmp/ch3.ppm').save('/tmp/ch3.png')"
node tools/map_preview.mjs dungeon <id> /tmp/d.ppm
```
Look at the PNG (red = boss, white = NPC, cyan = spawn, blue/orange = gates, green = dungeon gates, magenta = herbs). Fix cramped, empty or lopsided maps.

## 4. Art (there is no new art: reuse and tint, and label it)

Do **not** add image files. Sprites available (`src/data/manifest.generated.json`):

* mobs: `mob.bat mob.foxdemon mob.foxfire(+_v_green,_v_red) mob.ghost(+_v_crimson,_v_gold,_v_violet) mob.golem mob.jiangshi(+_v_purple,_v_red) mob.paperdoll mob.peachspirit mob.skeleton mob.snake mob.soldier mob.swordspirit(+_v_blood,_v_gold) mob.thunderbird mob.toad mob.treant mob.waterghost mob.wolf`
* boss sheets: `boss.fallenimmortal boss.jiaolong boss.ninetail` (mobs can also be enlarged as bosses, `scale` 0.8-1.2).
* NPC sprites: `hero.archer hero.fanscholar hero.heroine hero.monk hero.saber hero.spearman hero.staffbeggar hero.swordsman hero.twinblade`.
* portraits: abbot alchemist beggar blacksmith boatman bookboy child constable demonlord doctor drunkard elder fairy fortune general granny herbalist hermit hunter immortalboy innkeeper maid nun peddler princess scholar storyteller swordsman taoist teahouse (suffixes `_neutral`, `_happy`, ... check the manifest).
* props: pavilion stonebridge bamboo pine stairs paifang tower moonwall corridor taihurocks willow lingzhi orchid rock bambooshoot lotuspond petals goldpaifang palace jadebridge dragonpillar lotusthrone goldgate floatisle lotusbowl array standstone stonecircle peachtree pagoda7.
* item icons: `ui` keys `item_coin_string item_compass item_conch item_furnace item_ginseng item_gourd item_immortal_rope item_jade_slip item_lantern item_lingzhi item_peach item_pill_bottle item_spirit_stone item_talisman item_token`; `icon` keys `blade_01_00..05 dark_01_.. heavy_01_.. ranged_01_.. relic_01_.. relic_02_..`.

Variety comes from `tint` (multiply colour, see chapter 2's frost mobs), scale, behaviour, stats and move kits. Every recoloured or reused sprite is **PLACEHOLDER art**:
write `// PLACEHOLDER art:` above it (the owner will replace art later). Never claim the art is final.

## 5. Balance (tests enforce it)

`tests/balanceWorld.test.ts` checks every chapter >= 3 zone/dungeon/boss; run `node tools/balance_report.mjs <chapter>` to see the numbers and tune.
`ChapterDef.gear = { arrive, shop }` lists item ids: `arrive` = the previous chapter's best gear the hero walks in with, `shop` = what this chapter's shop sells.
Targets for a flame-root hero fighting with the sword combo at the middle of a zone's level band: a normal foe takes 3-16 s (bruisers up to 24 s), the hero dies
in > 12 s if standing still, one fight costs 3-65 % HP, one hit < 25 % HP; bosses: 40-300 s of pure damage (dungeon bosses >= 25 s), heaviest hit < 50 % HP.
Weapon attack must rise chapter by chapter (ch1 best +15, ch2 best +30; ch3 ~+45, ch4 ~+62, ch5 ~+80), armor defence similarly (ch2 best 28).
Quest XP: chapter 3's chain should give roughly one level of progress per major quest; use `xpToNext` in `core/progression.ts` as the yardstick.
Shop prices follow item `value`; `value` rises roughly 1.6x per chapter.

## 6. Verify before you hand over (run all, fix everything)

```bash
export PATH=$HOME/.local/node/current/bin:$PATH NO_PROXY=127.0.0.1,localhost
[ -e node_modules ] || ln -s /data/yuu/ai-data/yuu/self/ir-work/node_modules node_modules   # fresh worktrees have none
npx tsc --noEmit -p . && npx eslint src tests && npx vitest run     # unit + data-integrity tests (seconds)
npm run design && npm run design:check                             # regenerates design/ docs; must report "consistency: ok"
node tools/balance_report.mjs <chapter>                            # numbers look right
TOUR_CHAPTERS=<n> npx playwright test e2e/worldtour.spec.ts        # every zone + dungeon loads; screenshots in qc-artifacts/tour-*.png, LOOK AT THEM
```
Open at least: the hub, two other zones, one cave, one realm and one boss screenshot and fix what looks wrong (black patches, props in roads, unreadable zones).
Run `npm run design` for the consistency check, but **do not commit changes under `design/`** (`git checkout -- design` before committing; the owner regenerates it once at the end, otherwise parallel branches conflict).
Commit on your branch (`Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`), never commit credentials, do not push.
Report: what you built (counts), what is PLACEHOLDER, test results (real output), anything you could not verify.
