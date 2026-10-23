
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
