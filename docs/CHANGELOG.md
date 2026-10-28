
## Round 19 (independent QA of the Round 18 world)
Two independent QA agents (world/quests/visuals; dungeons/saves) tested HEAD d3f3aa8. Reachability, spawn placement, quest completability (72 quests, static), gates, old-save migration and all 19 dungeons came back clean. Fixed:
- **Data loss**: a first-clear dungeon reward no longer vanishes when the bag is full; it is parked in `GameState.pending` and handed over (toast) as soon as a slot frees up. Saves validate/round-trip it.
- **Back gate** from ch4->ch3 (and any chapter) landed in rock and fell back to the hub: `nearestFree` now finds a free spot beside the gate.
- **Quest XP overshoot**: ch3/4/5 quest XP cut to ~40% of each chapter's level span (8.9k / 17.6k / 36.2k, was 34k / 46k / 85k) so zones stay relevant after half the quests.
- Chapter gate messages name the missing bosses and the level still needed.
- Dungeons never open with a monster at the gate (initial spawns >= 240px away); caves get boulders set in the rock face and realms ~3x more floating islands; death text says you wake outside the cave; XP bar shows "max level" at 50.
- Tests: 4 new unit tests (`tests/dungeons.test.ts`).
- Known, not fixed: boss art recycled (19 of ~34 bosses reuse 3 sprites), cave walls still dark smudges, ch2 snow zones near-identical, single cave/realm generator, props on water/void unverified on screen, boss fights at minimum level not hand-played.

## Round 18 (world expansion: "map too small, no depth")
- **Five chapters, 6-8 zones each** (45 open-map zones in total): ch1 144x124 (8 zones), ch2 144x124 (7), ch3 The Ember Wastes 160x132 (8), ch4 The Jade Heavens 164x136 (8, floating terraces over void chasms), ch5 The Crimson Abyss 176x144 (8, finale: Dao Demon of Tribulation, 330000 HP). Chapter maps are 2-3x larger than before.
- **Caves and secret realms**: 19 dungeons (>= 3 per chapter, >= 2 caves and >= 1 realm each). Gate on the chapter map, level gate, own enemies/boss/tint, one-time first-clear reward (XP, stones, items), save-safe (reload inside), dying wakes you outside the gate. Caves are cellular caverns, realms are chains of chambers over the void.
- **Content modules** (`src/data/content/*`): a chapter is one data file merged into the registries (zones, enemies, bosses, quests, NPCs, items, drops, shops, recipe books, dungeons, map). `ZoneId` is a string. Authoring spec: `docs/CONTENT_GUIDE.md`; tools: `tools/map_preview.mjs`, `tools/balance_report.mjs`.
- Totals now: 100+ enemy types, 30+ bosses, 60+ quests, 36+ NPCs (several standing out in the wild), gear ladder for ch3-5 (`content/gear.ts`), per-chapter shops and alchemy books.
- Level cap 30 -> 50; realms Golden Core (28), Nascent Soul (38), Spirit Severing (46); Dao Insight ranks 10 -> 15; Trial Rift bands reach the chapter 3-5 zones.
- Engine: ground painted in lazily baked 32x32-tile chunks (no 4096px limit), occluder grid, far idle foes dormant, rivers/lava/void chasms with causeway roads, sealed-pocket removal, per-map world map cache, two gates per chapter (back / onward).
- Tests: `tests/worldScale.test.ts` (the depth bar), `tests/balanceWorld.test.ts` (every zone/dungeon/boss of ch3+), `tests/dungeons.test.ts`, `tests/ch3-content.test.ts`, `tests/ch12-content.test.ts`, `e2e/dungeons.spec.ts`, `e2e/worldtour.spec.ts` (loads every chapter, zone and dungeon, screenshots to qc-artifacts/tour-*).
- Old saves: positions that are now inside walls fall back to the hub spawn.

## Round 3
- Enemy vision: 130° cone, sense radius, line of sight, turn rate, last-seen memory (3s), no attacks without sight, "!"/"?" cues, faint cone overlay; hits wake enemies.
- Perf: vignette moved from WebGL filter to CSS; antialias off. Fx strips repacked (<=4096px).
- Minimap enlarged with zone label, click opens world map. Audio motif fix; Esc works after volume slider.
- Recovery: out-of-combat HP regen (faster on array), death tax max(15,10%) capped at carried stones.
- Bosses: repeat-kill stones x0.3, no autosave in boss fights, variable windup (>=85% of nominal) and gaps.
- Balance: rusher windups longer, root tweaks (flame crit 5%, tide slow+mana, verdant 9% lifesteal), elites tougher, ruins tier 3.0.
- UI: quest objective overrides tutorial, objective arrow avoids HUD, locked-slot labels, NPC nameplate backplates, elite labels near player only, no zone banner in boss/death.
- QA round 3 fixes: HP regen reset on world (re)entry (R3-1), enemies struck from afar keep hunting (R3-2), 3s grace on entering the world (R3-3), death tax floor 5 (R3-4), clearer vision cone and '!' (R3-10), tighter minimap label vs quest panel (R3-6/9). Open: human playtest of ruins difficulty (R3-5), pack alerts/sneak bonus, 1024x600 panel clipping.

## Round 5
- Stealth: ambush bonus x1.5 on unaware enemies ("Ambush!"), pack alert (70-unit radius) when a packmate is struck.
- UI at 1024x600: world map labels clamped inside the frame, map hint moved to top, character panel stops above the hotbar, trade window narrower, objective line hidden during boss fights.
- Open: ruins/normal-mob difficulty needs a human playtest; NPC nameplates can sit behind the minimap at some resolutions.

## Round 6
- Side quests: "Toads in the Ledger" (Merchant Qiao), "Herbs for the Furnace" (Alchemist Yun), "Trial of Champions" (Elder Lin, elite kills). New `elite` objective type, `reward.stones`, traders offer quests alongside their shop (dialogue 'Browse wares'), generic objective/arrow for any giver/target zone. Old saves are migrated (missing quests added as inactive).

## Round 7
- Third boss: Jiao Dragon of the Mist Pool (Mistveil Marsh, new arena `world.pool` with willows/standing stones, road extended). Water kit (sweep, rain geysers, charge, orb ring, drowned-ghost summons), 7400 HP; unique drops Jiao Dragon Pearl (charm) and 60% Dragon-Scale Robe. Art reuses the existing `boss.jiaolong` sheets (same CC0 AI-generated pack, risk unchanged).
- Quest "The Dragon of the Mist Pool" from Elder Lin, offered after Trial of Champions (capstone). `BossDef` gains `zone` (minion zone) and `home: 'pool'`.
- Dialogue portraits are data (`NpcDef.portrait`): Merchant Qiao = peddler, Alchemist Yun = alchemist; merchant shop window uses the peddler too.
- Tests: boss move e2e for the dragon (5), kill/drop e2e, portrait e2e, unit tests for the quest chain/portraits/world pool reachability.
- Not verified: dragon balance by a human (stats are an estimate, ~Warden-tier), real-GPU performance.

## Round 8
- Fix: NPC nameplates and quest marks are hidden when they would sit behind the minimap (DOM widget over canvas); e2e `round8.spec.ts`.
- `npm run qc` now runs `design:check` (regenerates `design/`, fails on orphan/unobtainable/iconless content).
- Docs refreshed from the code: GDD, COMBAT_DESIGN, NPC_AI_DESIGN, CULTIVATION_SYSTEM, WORLD_DESIGN, TASKS (stale since the vertical slice).

## Round 9
- Save slots: 3 slots (slot 1 keeps the old key, so existing saves load), slot manager screen (Load / Export / Import / Delete with confirm), slot picker on character creation (default = first empty slot, warning when replacing). Pure logic in `src/core/slots.ts` (injectable storage, 8 unit tests); `src/game/storage.ts` is the thin localStorage wrapper.
- Automatic backup: each save keeps the previous valid save as `<slot>.bak`; a corrupted main file is restored from it ("restored from backup"); a corrupt file is never copied over a good backup.
- Export downloads the save JSON; import validates (version, checksum, schema) before writing and never touches the slot on refusal.
- Tests: updated corruption and "starting over" e2e (no backup / pick slot 1), new e2e for the full slot flow.
- Not verified: export/import through a real browser file dialog (e2e covers the logic; the download/upload buttons themselves were not driven), behaviour with localStorage blocked beyond the guarded fallbacks.

## Round 10
- `tools/license_scan.mjs` / `npm run license:check` (part of qc): offline scan of package-lock + installed package.json. 2 shipped packages (all MIT); 157 dev-only, 12 MPL-2.0 (lightningcss, build tool, not distributed). Report: docs/LICENSE_SCAN.md. Reads declared licences only, not LICENSE text.
- Gamepad support: `src/core/gamepad.ts` (pure mapping, 6 unit tests) feeds `KeyInput.pollGamepads()` so pads reuse the keyboard handlers. Left stick/d-pad move, A attack, B dash, X interact, Y meditate, LB/RB/LT/RT techniques 1-4, Back map, Start pause, stick clicks inventory/character. Potion hotkeys (F/G) have no pad button yet.
- e2e/gamepad.spec.ts drives a faked `navigator.getGamepads`; no physical controller was tried.

### Round 11 (owner: "too basic, small map, split into maps/stages, story, more characters, more depth")
- Touch controls: on-screen joystick + buttons when the primary pointer is coarse (or `?touch=1`); skill slots tappable. e2e/touch.spec.ts.
- **Chapters**: `src/data/chapters.ts` (story pages, gate), `src/data/maps.ts` (declarative map defs), `src/core/mapgen.ts`, `generateChapter(n)`. `WorldMap` gained `chapter`, `bossHomes`, `portal`; chapter 1 keeps its generator and gains a Sky Gate.
- **Chapter 2 "The Sundered Sky"**: 112x96 map (1.4x chapter 1), zones Skyfall Outpost / Whitefrost Pass / Crystal Hollow / Ashen Barrow / Sundered Sky Summit; 4 NPCs (Commander Shen, Quartermaster Gu with his own shop, Herbalist Mo, Hermit Wen); 6 quests; bosses Corpse King, Crystal Colossus, Sundered Sovereign; 11 enemies; 9 items (Lv10+ gear and greater draughts); procedural snow/ice/ash ground, frost-tinted scenery, tinted reused sprites (`EnemyDef.tint`, `BossDef.tint`, `Actor.setBaseTint`, mob->boss animation fallback).
- Gate: level 10 and all three chapter 1 guardians; a return gate leads home. Travel saves and restarts the scene.
- Story: prologue and chapter intro pages (`src/ui/story.ts`), shown once (`GameState.story`). Automation (navigator.webdriver) skips them unless `?story=1`.
- Save: `chapter` and `story` fields, additive migration (older saves = chapter 1, prologue seen). SAVE_VERSION unchanged.
- Quest log grouped by chapter; objectives/NPC marks respect the current chapter; trade window takes name/portrait/stock from the NPC.
- Design export: chapters catalog + per-chapter world maps; `design:check` still green. License scan unchanged.
- Tests: tests/chapters.test.ts (24), e2e/chapters.spec.ts (6): gate refusal/open, ch2 content, persistence + return gate, NPC shop, Corpse King kill, story pages.
- Honest limits: ch2 art is reused/recoloured (PLACEHOLDER), balance untuned, no new playable heroes (the pack's other hero sprites lack combat animations), no companions yet.

## Round 17 (leftovers from QA reports 4-5)
- Dao Insight (`src/data/insight.ts`, `upgradeInsight`): Body Tempering (+3% HP), Sword Intent (+2% attack, +0.4% crit), Spirit Sea (+4% mana, +0.3 regen) per rank, 10 ranks each, paid from the same skill-point pool as techniques (only 16 technique ranks existed, so points used to pile up). Saved in `GameState.insight` (additive migration, validated against the point pool).
- Small viewports: below 700 px wide or 480 px tall the minimap shrinks, the control hint and quest tracker hide, the skill bar scales and the objective moves clear of the minimap (verified with 360x640 and 640x360 screenshots, plus a bounding-box test).
- NPC nameplates and elite labels render at 4x text resolution (they were blurry at game zoom); props fade over enemies slightly wider.
- Boon picker: arrow keys / D-pad move focus, E / Space / pad A takes the card.
- `window.__rpg` and `window.__game` are installed only when `navigator.webdriver` is set or the URL has `?debug=1` (test hooks no longer reachable in a normal session).
- Refactor: Trial Rift extracted to `src/game/rift.ts` behind a small `RiftHost` interface (WorldScene 1505 -> 1465 lines).
- Tests: tests/insight.test.ts (4), e2e/round6.spec.ts (4).

## Round 16 (independent QA report 5 -> new-player experience)
- Toast manager: identical messages merge into one with a x2/x3 count, at most 4 visible (QA: spamming F/G stacked ~20 toasts over the screen).
- One-time tips, remembered in the save (`hints`): low-health flask, spare technique points, perfect dodge on first boss engagement, poise on first stagger, quest log key. Automated browsers skip them unless `?tips=1`.
- E (and Space) confirm the first dialogue option; Q opens the quest log like J; the control hint is larger.
- NPC nameplates hide when any part of the label would sit under the minimap (QA: merchant label clipped, third report running).
- Boon cards show an Offence/Defence/Utility tag with a glyph and accent colour; the character panel states the hero trait's effect; the Rift keeper states the rules and a recommended level.
- Tests: tests/roundE.test.ts (3), e2e/round5.spec.ts (4).

## Round 15 (independent QA report 4 -> fixes)
- Lifesteal capped at 5% (hero trait + boons) and now heals on damage actually dealt (not shield or overkill); technique cost reduction capped at 50%.
- Boon pool 15 -> 20 with behaviour boons: Storm Technique / Steady Hand (technique damage), Lotus Echo (cheaper techniques), Heart Seeker (+30% vs foes under 30% HP), Afterimage Step (perfect dodge refreshes the dash). Picker: reroll for 75 stones (R), owned-boon list, dialog role; a pick with nothing left to take becomes 150 stones with a message instead of vanishing.
- Hero traits: Fan Scholar +15% technique damage; Twin-Blade's perfect dodge refreshes the dash.
- Trial Rift: kills pay 35% XP (stones unchanged), no death-stone tax inside the rift, guardian floors have as many foes as the floor before them.
- Sovereign (final boss) HP 16500 -> 21000 (QA: a no-boon L20 bot killed it in 32 s). Hero trait text on the creation cards is larger.
- Loading a slot that had to fall back to its backup copy now says so.
- Tests: tests/roundD.test.ts (6), e2e/boons.spec.ts +2.

## Round 14 (QA report 3 round C, part: replay and identity)
- Trial Rift (`src/core/tower.ts`, glue in WorldScene): talk to Keeper Ming (Azure Cloud Sect) or Keeper Ren (Skyfall Outpost) to start. Endless floors drawn from eight difficulty bands (zone rosters and tiers), a guardian every 5th floor, stats climbing +6% HP / +4% attack per floor. Rewards pay only for floors beyond your record (stones, Qi pills every 5th, a Foundation Pill and a boon pick every 10th) so low floors cannot be farmed for them; a cleared floor heals 20% and refills mana. Falling, leaving, or straying 420 px away ends the run. `GameState.towerBest` (additive save migration).
- Hero signature passives (`HeroDef.trait`): Sword Heart Focus (crit, mana on hit), Crimson Gale (dash, attack), Scholar Reserve (mana), Iron Discipline (HP, defence, poise), Road-Worn Edge (attack, lifesteal), Storm Steps (mana on hit, perfect-dodge time). Shown on the creation screen and the character panel; they flow through the same mods as boons.
- Not done from round C: loot affixes (needs per-item instances in the save), distinct technique kits, WorldScene extraction.
- Tests: tests/tower.test.ts (11), e2e/tower.spec.ts (4).

## Round 13 (QA report 3 round B: depth)
- Boons (`src/data/boons.ts`, `src/core/boons.ts`): 15 permanent build choices (stat mods, mana on hit, lifesteal, dash cooldown, flask heal, poise, perfect-dodge rewards). One pick of three at every 5th level and on each boss's first defeat; picks bank until spent. `GameState.boons/boonPicks` (additive save migration: older heroes are credited with the picks they already earned). Chooser overlay `src/ui/boons.ts` (keys 1-3 or click); it opens after a fight, never mid-combat. Automated browsers skip the auto popup unless `?boons=1`.
- Boss poise: `BossDef.poise` (fraction of max HP, default 12%). Enough damage staggers a boss out of a wind-up for 2.2 s with x1.5 damage taken; 11 s of immunity afterwards, charges cannot be interrupted, poise drains when you stop attacking.
- Perfect dodge: being hit while dash-invulnerable (once per 1.2 s) gives +8 mana, a 3 s x1.25 damage buff and a brief slow-motion.
- Level cap 20 -> 30; new realm Foundation Establishment (breakthrough at level 20, stat x1.65).
- Tests: tests/boons.test.ts, tests/poise.test.ts, e2e/boons.spec.ts (6, including a real dash through a boss slam).

## Round 12 (independent QA report 3 -> "balance and feel")
Source: docs/QA_REPORT_3.md (subagent play-test + benchmark against other games; one boss fight and a handful of mob fights measured, so numbers are a band, not a fact).
- **Spirit flask** (`src/core/sustain.ts`): 3 charges healing 35% max HP (scales with level, unlike the flat 40 HP draught), refilled by 5 kills each, fully at the hub, on respawn and on breakthrough. F drinks the flask first, then bag potions. HUD shows `charges+potions`. Saved (`GameState.flask`, migrated).
- **Mana from hits**: a sword swing that connects returns 3 mana (6 on the finisher), so techniques stay usable in long fights.
- **Chapter 2 economy**: Froststeel Blade and Frost Mail are no longer free quest rewards (quests now pay stones and draughts; the outpost shop sells the gear at 1400-1500). Quest/boss XP trimmed so chapter 1 no longer auto-levels to the gate and chapter 2 does not exceed the cap.
- **Balance**: chapter 2 zone tiers raised; Frost Wisp/Crystal Golem/Barrow Guard/Corpse King retuned; Nine-Tail Fox 2400 -> 3200 HP; chapter 1 boss XP lowered. `tests/balance2.test.ts` encodes the targets (TTK, damage taken, boss length) as regression tests.
- **Touch layout**: sound button moved on touch, portrait layout (390x844) fixed; e2e overlap test for portrait (the old overlap check missed elements outside `#hudlayer`).
- Tests: tests/sustain.test.ts, tests/balance2.test.ts, e2e/sustain.spec.ts, portrait test in e2e/touch.spec.ts.
- Not done (report proposals for later rounds): boons, boss poise, trial tower, per-hero kits, loot affixes, WorldScene refactor, chapter 2 art, level cap > 20.

## Round 20
- Per-hero technique kits: Crimson Swordswoman (Ember Fan 3-bolt fan, Phoenix Burst), Fan Scholar (Ink Needle, Gale Fan, Lotus Whirlpool pulls + heals), Staff Monk (Diamond Palm stun + heal), Saber Wanderer (Blade Qi Cleave, Earthsplitter, Falling Blades), Twin-Blade (Twin Daggers, Cross Crescent). Azure Swordsman keeps the base kit. Slot ids/unlock levels/saves unchanged.
- `npm run lint` no longer scans `.claude/**`.
