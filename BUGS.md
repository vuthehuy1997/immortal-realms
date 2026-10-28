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

## Open / known limitations
- L-001 Enemies are not saved (respawn fresh on load); only player/quests/inventory/boss-defeated flag persist.
- L-002 Saves are client-side and editable; checksum only detects accidental corruption/naive edits (not security).
- L-003 All VFX and boss/wraith/brute art are placeholders (Kenney reuse / simple shapes).
- L-004 No audio, no touch/gamepad, only Chromium tested.
- L-005 Balance and feel unplaytested by a human.
- L-006 UI text is English only; no i18n layer yet.
