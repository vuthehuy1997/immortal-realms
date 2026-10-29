# BUGS

## Fixed (found by QC loop, 2026-10-16)
| ID | Bug | Found by | Fix |
|---|---|---|---|
| B-001 | Enemy velocity passed through `step()` (normalises) => enemies moved at 1 px/s | code review before first run | move by `vel*dt` directly |
| B-002 | Trees rendered half-height (2-tile sprites drawn as 1 tile) | screenshot review | draw top+bottom tiles |
| B-003 | HUD text invisible under camera zoom | screenshot review | moved HUD to DOM |
| B-004 | `showHud(false)` hid the whole UI container, including the main menu | screenshot/e2e | separate `#hudlayer` |
| B-005 | Phaser 4.2.1 keyboard plugin re-emits queued key events when several arrive in one frame: one tap of `I` could fire twice (panel opened then closed) | e2e flake + event trace | own DOM `KeyInput` (`src/game/input.ts`), Phaser keyboard disabled |
| B-006 | Level/realm label wrapped onto 2 lines at 1024px | screenshot review | wider bars, nowrap |
| B-007 | e2e relied on wall-clock; under CPU load game-time is slower (dt clamp) => false failures | repeat runs | `waitGame()` + serial workers |

## Fixed in Round 21 (QA report 6, 2026-10-29)
| ID | Bug | Fix |
|---|---|---|
| QA6-B1 | Character panel clipped at 1024x600/1280x720, no scroll cue | two-column layout on wide screens, visible scrollbars; e2e/round21.spec.ts |
| QA6-B2 | Damage numbers overlap each other and nameplates | `placeFloat` stacking + plate fade in fights; tests/floatStack.test.ts |
| QA6-B3 | Twin Daggers under half the swordsman's slot 1 | 1.0 -> 1.6 per dagger; tests/heroKits.test.ts |
| QA6-B4 | Ember Fan collapses to one target at close range | spread 0.9, separate bolt origins; e2e B4 |
| QA6-B5 | Heroes share VFX/icons | per-hero strip, tint, icon; tests + e2e B5 |
| QA6-B7 | `__rpg` ships in prod bundle | compiled out unless `VITE_E2E=1`; grep of dist/assets |
| QA6-B8 | Cloudhollow floor reads as void | flagstone seams, darker base |
| QA6-B6 | Objective bar stale after hook travel to ch5 | NOT FIXED (hook-induced, S4) |

## Round 22 (found and fixed while building boss identity and dungeon mechanics)
| ID | Bug | Fix |
|---|---|---|
| R22-1 | 13 of 19 dungeons had a gate-to-boss route a 3-tile body could not walk (3.4-4 wide tunnels, scatter and a closed boulder ring around the boss) | 7-wide spine kept free of props, boss ring leaves the arrival side open, `clearanceReach` test over all dungeons |
| R22-2 | New wall-hugging props cut brazier/plate switches off from the entrance (reachable only through the closed seal) | `safePlace` checks reachability with the seal closed and open, ring-run fast path |
| R22-3 | Ambush timer counted a wave as cleared on the very tick it spawned | a wave needs 1 s before "cleared" counts; unit test |
| R22-4 | Save validation capped hints at 40: the new tips could have made a long-playing save unloadable | cap 80, test that ~40 hints load |
| R22-5 | Pool visuals were pale grey rings that did not read as lava | dark base + saturated fill + bright core, ramp mix 1.0 for the Furnace Warden |

## Open / known limitations
- L-001 Enemies are not saved (respawn fresh on load); only player/quests/inventory/boss-defeated flag persist.
- L-002 Saves are client-side and editable; checksum only detects accidental corruption/naive edits (not security).
- L-003 All VFX and boss/wraith/brute art are placeholders (Kenney reuse / simple shapes).
- L-004 No audio, no touch/gamepad, only Chromium tested.
- L-005 Balance and feel unplaytested by a human.
- L-006 UI text is English only; no i18n layer yet.
- R23 fixed: QA7 F1 (seal lost on reload / stranded hero), F2-F6, F8-F11 (see docs/QA_REPORT_7.md "Resolution"). F7 reclassified: realm-0 hero artefact, not a data bug; still needs a human playtest.
- R23 open: no human has played the boss fights (feel of blade warning width, Mirage markers, tip queue timing); the realm gap itself (a player who never breaks through) is only hinted, not enforced.
- R23 pre-existing (also fails at 93ba040): e2e boss.spec 'ninetail move "teleport"' - the boss lands 115 px from the hero (test expects < 90). Not caused by round 23; not investigated.
