# TASKS
Status: [x] done, [ ] todo. Format: ID — task (deps) — acceptance.
- [x] M0-1 Scaffold (—) — `npm run build` & `npm test` pass; preview serves HTTP 200.
- [x] M0-2 Playwright boot e2e — WebGL renderer, frames advance, no page errors (headless Chromium, SwiftShader).
- [x] M0-3 ESLint — `npm run lint` clean.
- [ ] M0-4 Phaser 4 perf spike (M0-2) — measure fps: large tilemap (GPU layer), ~200 sprites, particles; record numbers in docs.
- [ ] M0-5 Transitive license scan (license-checker) into ASSET_LICENSE_AUDIT.
- [x] M1-1 World + camera — 64x64 deterministic map (seeded), camera follows with integer zoom, bounds.
- [x] M1-2 Input + movement with tile collision (WASD/arrows, wall sliding) — unit + e2e tested.
- [x] M2-1 Combat core (damage, crit, cooldown, hp/mana, tryCast) — 12 unit tests.
- [x] M2-2 Enemy FSM: rusher (Moss Slime), caster (Wisp Wraith), charger with telegraphed windup (Stone Brute) — unit + e2e tested.
- [x] M2-3 Playable combat: 3 skills (slash arc / bolt / burst), mouse aim, HUD, damage numbers, hit flash.
- [ ] M0-4 follow-up: baseline 60 FPS @ ~6000 objects (software GL, capped). Real stress test + tilemap layer still TODO.
- [ ] M3-x VFX polish (hit-stop, shake, real particles), boss; M4-x progression/cultivation; M5-x NPC/quest/inventory; M6-x save/load/menu/creation; M7-x polish/perf/security.
Placeholders to replace: BootScene text (src/game/BootScene.ts).

## Art tasks
- [x] ART-1 Kenney tilesheets loaded (pixelArt, integer zoom).
- [ ] ART-2 Original xianxia pass: recolor palette, add Eastern buildings/robes/banners, qi VFX (our own).
- [ ] ART-3 Pre-release art review: replace/commission anything inconsistent; re-verify all licenses.

Placeholders (M1): NPC wizard position/sprite in WorldScene; hero sprite = Kenney hero 85; world is procedural scatter, no authored zones yet; ground drawn as individual images (switch to Phaser tilemap/GPU layer under M0-4).

Placeholders (M2): all combat VFX (white arc, green ring, circle bolts) = PLACEHOLDER; enemy sprites reuse Kenney Tiny Dungeon (wraith=ghost, brute=cyclops); skill names are working titles; balance numbers untuned; player has no XP->level yet (M4).

## Slice status (see docs/QC_ACCEPTANCE.md)
- [x] M3 boss Stone Warden (3 phases, telegraphed slam, summons, enrage ring, drops) — core+e2e tested; art/VFX placeholder
- [x] M4 progression (XP/levels) + cultivation (meditate, breakthrough w/ failure cost, realm bonuses)
- [x] M5 NPC dialogue + 2-quest chain; inventory (20 slots, stacks, use, equip, drops) with UI
- [x] M6 main menu, character creation (3 roots), pause, save/load (versioned, validated, checksum), autosave
- [x] M7 responsive DOM UI verified at 3 desktop viewports; QC loop (`npm run qc`)
- [ ] NEXT: owner playtest + tuning; real VFX/hit-stop/audio (ART-2/M3b); xianxia art pass; Firefox/WebKit; transitive license scan (M0-5); real-GPU perf (M0-4)

## 2026-10-17 visual overhaul (owner feedback)
- [x] ART-1/2 replaced placeholder art with CC0 Xianxia Pixel Pack (animated heroes/mobs/bosses/props/FX/UI)
- [x] Procedural ground, 80x80 world with 6 zones, roads, props with collision, occluder fading
- [x] Martial arts: combo, dash, 4 techniques, enemy roster (17 mobs + elites), new boss Fallen Sword Immortal
- [x] AUDIO-1 SFX + ambient music (procedural WebAudio, licence-free)
- [x] MAP-1 minimap (world map overlay still TODO)
- [x] ECON-1 merchant, ALCH-1 alchemy, LOOT-1 weapon tiers + rarity (more of the pack's 60 weapons can be added)
- [x] BOSS-2 Nine-Tailed Fox boss (den in the Peach Grove)
- [x] BOSS-3 Jiao Dragon (round 7)
- [ ] ART-3 replace/commission identity art before commercial release (AI provenance risk, see audit)
- [ ] M0-4 real-GPU perf measurement

## 2026-10-17 QA round 1 -> round 2 (done in worktree ir-work, merged to main)
- [x] All S1/S2 findings from docs/QA_REPORT_1.md; most S3 findings
- [ ] S4-3 trace the 8 WebGL texImage2D warnings on load
- [ ] S4-4 multiple save slots + backup; export/import save
- [ ] S3-4 sharper ground texture at 1080p
- [ ] More content: 3rd boss (Jiao Dragon), side quests, dungeon/trial tower, more realms
- [ ] Controller / touch support

## Rounds 3-8 (see docs/CHANGELOG.md; design snapshot in design/)
- [x] R3 vision AI, regen, death tax, boss tempo, balance, objective arrow
- [x] R4-5 QA fixes, ambush, pack alerts, 1024x600 UI
- [x] R6 side quests (toads, furnace, champions), elite objective, trader dialogue
- [x] R7 Jiao Dragon boss + capstone quest + unique drops, per-NPC portraits
- [x] R8 design/ export gate in qc, NPC nameplates hidden behind minimap, docs refreshed from the code
- [x] R9 save slots (3), backup recovery, export/import
- [ ] Open: human playtest of ruins/normal-mob difficulty and dragon balance; flaky e2e under load (killOne/combo/boss); real-GPU perf (M0-4); licence scan (M0-5); UI guide + overlap check; trial deploy path; trial tower; more realms; controller/touch
