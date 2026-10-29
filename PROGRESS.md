# PROGRESS
## 2026-10-16 — M0 Scaffold
- Installed Node v24.22.0 (checksum-verified) to ~/.local/node.
- Scaffolded Phaser 3.90 + TS + Vite + Vitest. Build OK, 2 tests pass, preview HTTP 200.
- UNVERIFIED: actual in-browser rendering (no Playwright browser yet); lint not set up.
- Awaiting owner approval of ADR-001 and decision on art source (ADR-004).

## 2026-10-16 — M0 complete
- Switched to Phaser 4.2.1 (owner approved; ADR-001). TypeScript pinned 6.0.3 (typescript-eslint incompat with TS7).
- Verified: `npm run lint` clean; `npm run build` OK (bundle 1.38 MB, 358 KB gzip); `npm test` 2/2; `npm run test:e2e` 1/1 (WebGL renderer, frames advancing, no page errors).
- Note: sandbox HTTP proxy intercepts loopback; playwright.config.ts sets NO_PROXY.
- UNVERIFIED: real-GPU rendering (e2e uses SwiftShader software GL); Firefox/WebKit; performance numbers.
- Next: M0-4 perf spike, then M1 (tilemap/camera/movement).

## 2026-10-16 — Art source
- Owner chose free web art. Verified & imported Kenney Tiny Dungeon + Tiny Town (CC0) with License.txt and sha256. Style is Western-fantasy; xianxia identity needs original work (ART-2).

## 2026-10-16 — M1 World & movement
- Added core/rng, core/world (seeded generation, collision), data/tiles, WorldScene, DOM HUD.
- Verified: lint clean; build OK; unit 10/10; e2e 2/2 (boot, keyboard movement, stops at map border). Screenshot reviewed manually: ground, 2-tile trees, hero, NPC render correctly (SwiftShader).
- Found & fixed during review: trees drawn half-height; HUD text offscreen under camera zoom.
- UNVERIFIED: real-GPU perf (4096 ground images are individual sprites; M0-4 pending), gamepad/touch, window-resize behaviour, FPS numbers.
- Next: M0-4 perf spike (tilemap layer), then M2 combat core.

## 2026-10-16 — M2 Combat
- Added core/combat, core/enemyAI, core/hit, data/skills, data/enemies, HUD (DOM), combat in WorldScene, e2e combat tests.
- Verified: lint clean, build OK, unit 36/36, e2e 5/5; screenshot reviewed (burst ring, damage numbers, crit, bars, cooldown slots).
- Bug caught in review before running: enemy velocity was passed through step() (normalises) => would move at 1 px/s; fixed.
- Perf baseline: 60 FPS with ~6000 game objects in headless Chromium/SwiftShader (frame-capped; not a real-GPU number).
- UNVERIFIED: game feel/balance (never played by a human), real-GPU perf, touch/gamepad, boss, audio.
- Next: M3 boss + VFX polish, or M4 progression (XP/level) — owner choice.

## 2026-10-16 — Vertical slice feature-complete + QC loop
- Implemented all 15 slice requirements; `npm run qc` green: lint, typecheck, build, 89 unit tests, 38 e2e tests (190/190 on 5x repeat, serial).
- Dev->test loop found and fixed 7 bugs (BUGS.md), notably a Phaser 4.2.1 keyboard double-fire.
- UNVERIFIED: human feel/balance, art quality, real-GPU perf, non-Chromium browsers.

## 2026-10-29 - Round 21 (QA report 6 -> fixes and depth)
- Acted on docs/QA_REPORT_6.md: bugs B1-B5, B7, B8 fixed with regression tests; backlog items 1-4, 7 (aura/tint slice), 8, 10 (hooks out of prod) done; 5 (HP curve test, ch5 trim) and 6 (hubs 3-5 compositions) partly; 9 (Cloudhollow floor only) partly. Details and commits in the Resolution section of the report.
- Screenshots reviewed: character panel at 1280x720 and 1024x600, Heroine and Fan Scholar technique casts and hotbars, Cloudhollow floor, Obsidian Colossus arena, hubs of chapters 3, 4 and 5.
- UNVERIFIED: hand feel of the kits, audio, real-GPU fps, human boss playtest.

## 2026-10-29 - Round 22 boss identity and dungeon depth
- Goal: bosses and dungeons that look and play differently. 8 main bosses got a different base sprite, a luminance-gradient palette ramp (pure `core/palette.ts`, applied to the pack art at boot), satellites, sigils, phase/death fx and one mechanic each; 19 dungeons got 2-4 mechanics each plus wider routes and denser interiors. No new assets or dependencies.
- Pure cores with unit tests: `src/core/bossMech.ts`, `src/core/dungeonFeatures.ts`, `src/core/palette.ts`, burrow in `src/core/boss.ts`; data in `src/data/bossIdentity.ts` and `src/data/dungeonFeatures.ts`; rendering in `src/game/bossFight.ts`, `src/game/dungeonView.ts`.
- Found and fixed during the loop: pinched tunnels (13 of 19 failed even a 3-tile body), a prop ring that closed the boss chamber, dressing props that cut switches off from the entrance (now `safePlace`), a one-frame early 'cleared' in the ambush timer, hint list cap (40 -> 80).
- Screenshots reviewed (qc-artifacts/r22-*): Sovereign (ward + shards), Sand Wyrm (underground + eruption), Mirage Empress, Furnace Warden (pools warn/burn), Crane Lord (blade warning and active arms), Magistrate (pylons + links), closed and open seal gate, spike warning, poison mist, collapse crack/pit, ambush wave, interiors of wolfden, ember-mine, cloudhollow, scrollvault, abyss-ashmaw.
- UNVERIFIED: hand-played feel and balance of every new fight and room, audio, real-GPU fps.

## 2026-10-16 — Published
- Repo: https://github.com/vuthehuy1997/immortal-realms (public). Live: https://vuthehuy1997.github.io/immortal-realms/
- Deploy: `.github/workflows/pages.yml` (lint, typecheck, unit tests, build, then GitHub Pages) on every push to `main`. e2e (`npm run qc`) is local-only for now.
- Verified live: index HTTP 200; new game starts in headless Chromium, WebGL renderer, 8 enemies, 0 console errors, 0 failed requests.

## 2026-10-17 — Visual & gameplay overhaul
- Owner: game was "simple and ugly; where are martial arts, xianxia, graphics, animation". Rebuilt presentation around the CC0 Xianxia Pixel Pack (AI-generated per its author; risk logged).
- World 80x80, 6 zones, procedural ground, ~450 props, herb nodes, spirit array; 17 enemy types (+elites), new boss; hero looks (6); combo/dash/4 techniques with FX; skinned HUD; animated menus.
- Found & fixed via screenshots: tiled-looking ground (domain warp), hard-edged mist rectangles (soft blobs), tall bamboo hiding the hero (occluder fading), tint channel overflow, dialogue/inventory overlap at 1024px, first-fight shader hitch (warm-up).
- QC: lint, typecheck, build, 106 unit, 41 e2e green (software-GL Chromium).
- UNVERIFIED: audio (none), real-GPU perf, balance/feel by a human.

## 2026-10-17 (later) — audio, minimap, economy, second boss
- Added procedural audio engine (SFX + mood-following music), circular minimap, Merchant Qiao shop, Alchemist Yun furnace, weapon rarity + elite weapon drops, Nine-Tailed Fox boss + 3-step quest chain, save v3 (bosses list).
- QC: lint, typecheck, build, 118 unit, 51 e2e green. Screenshots reviewed: boss telegraph/boss bar, shop, minimap, den.
- Fixed via review: boss hidden by canopies (multi-point occlusion), inventory/quest/minimap overlaps (layout), toast/test text drift.
- UNVERIFIED: how the audio sounds, real-GPU perf, balance/feel by a human.

## 2026-10-17 — QA round 1 -> fixes
- Independent QA agent scored the build (see docs/QA_REPORT_1.md): strong visuals/UI, but thin, trivially easy game, AI, bosses, cultivation; found a quest softlock and a zombie save.
- Implemented fixes in worktree branch balance-pass, merged to main. QC: lint, typecheck, build, 187 unit, 80 e2e green (software-GL Chromium).
- Self-found bug during the loop: separation/home steering was computed but not applied (movement used the old velocity) - caught while rewriting, covered by e2e 'a pack spreads out'.
- UNVERIFIED: real-GPU perf, audio by ear, whether the new difficulty is FUN (needs a human or QA round 2).

## 2026-10-26 - Round 18 world expansion
- Framework (me) + four parallel authoring agents (ch3, ch4, ch5, ch1+ch2) merged. QC: lint, typecheck, design:check ok, license:check, build, 913 unit tests, e2e 133 passed / 2 failed (both also fail on the pre-R18 build under the same machine load).
- Screenshots reviewed (tour): hubs, zones, caves, realms and bosses of every chapter; fixed ground black patches (sync-bake on teleport), brick-looking cliff/cave rock (natural rock texture), gate collision in dungeons, forced set pieces being filled by scatter.
- UNVERIFIED: human playthrough/balance, boss fight feel in new chapters, real-GPU perf, audio.


## 2026-10-27 - Round 19 QA of the new world -> fixes
- Two independent QA agents tested d3f3aa8 (world/quests/visuals and dungeons/saves). Structure clean; fixed bag-full reward loss (`gs.pending`), back-gate landing in rock (`nearestFree`), ch3-5 quest XP overshoot, vague gate messages, monsters at dungeon gates, XP bar at max level, death text; denser cave/realm dressing. See docs/CHANGELOG.md "Round 19".
- UNVERIFIED: hand-played boss fights and quest flow in ch3-5, real-GPU fps, audio, props on water/void on screen. Art is still placeholder (recycled boss sprites, dark cave walls).

## 2026-10-28 - Round 20 depth pass 1 (after project review)
- Review conclusion: breadth outran depth (ch3-5 art recycled, no human playtest, heroes differed by passive only). Decision: stop adding chapters; deepen.
- Fixed `npm run lint` (720 errors came from ESLint scanning `.claude/worktrees`). Added per-hero technique kits.
- QC: lint clean, tsc clean, build OK, 923 unit tests pass; e2e herokits (3) + tower (5) pass; screenshot qc-artifacts/hero-kit-fan.png reviewed (Ember Fan visible, long hotbar names shortened). Full e2e suite NOT re-run this round.
- UNVERIFIED: hand-played feel of kits, balance, real-GPU perf, audio.

## 2026-10-29 - Round 23 (QA 7 fixes, boss/dungeon polish)
- Fixed from docs/QA_REPORT_7.md: seal state persists (validated save field + stranding guard), blade wheel follows the boss with visible warnings, Mirage real-one marker, tips queued and toasts moved off the hero, no props on void/water/lava, ambush wave cap, NPC out of Sand Wyrm arena, pit rescue outside patch, mobile boss bar. F7 (boss lethality) analysed from data: the QA hero was realm 0 at Lv 50; intended heroes take 5-20% hits; added tests and a realm-lag tip, no boss retune.
- Screenshots reviewed: sovereign and daodemon arena approaches (no void seen), Matron, Dao Demon wheel (hub on boss feet), Crane Lord warning band, Mirage gold ring, 390x844 boss bar.
- UNVERIFIED: hand-played feel, balance for players who skip breakthroughs, real-GPU fps, audio.
