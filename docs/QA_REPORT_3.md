# QA Report 3 - independent test of round 3 (commit b1fe6a9)

Build: `npm run build`, `vite preview` on 127.0.0.1:4190. Chromium + SwiftShader (the box was loaded, load average 20-30, so frame times are noisy; every duration below is GAME time from `__rpg.state().now`). Nothing under src/, tests/, e2e/ or public/ was modified. Scripts and screenshots live in `/tmp/claude-464201200/-data-yuu-ai-data-yuu-self-immortal-realms/fb77f4ce-5dc1-4887-ba8e-13a6200c5f82/scratchpad/qa4/` (called `qa4/` below).

Caveats: the fight bots use hook input (`__rpg.attack/cast/dash`, real WASD keyboard for movement) with perfect aim and a cast attempt every ~90 ms wall time, so they are stronger than a human and the balance numbers are lower bounds on difficulty. One QA-only runtime edit was made in the page (a 3x9 tile wall injected into `world.blocked`) to test line of sight, because the generated map has no thick walls. Anything not reproduced is marked UNVERIFIED.

## 1. Summary

| Severity | Count | IDs |
|---|---|---|
| S1 | 0 | |
| S2 | 1 | R3-1 |
| S3 | 4 | R3-2, R3-3, R3-4, R3-5 |
| S4 | 7 | R3-6 .. R3-12 |

Top finding: **R3-1, the round-3 out-of-combat regen (including the 5%/s array) stops working after any death/respawn, Save&Quit -> Continue or New Game in the same page session**, because `lastCombat` is never reset while `now` restarts at 0. The headline recovery feature of the round is dead exactly when the player needs it.

## 2. Scorecard

| Area | /10 | Note |
|---|---|---|
| Visuals | 8 | Art, telegraphs, boss, minimap all strong. Vision cone overlay is too faint to read, the `!` cue is small. |
| Combat feel | 7 | Boss telegraphs readable; elites now meaningful; bamboo/grove/ruins trivially easy for a skill-spam bot. |
| AI | 7 | Vision works as designed (cone, LOS, memory, wake on hit, no flicker). Exploits: long-range sniping, no pack alert, no sneak reward. |
| Progression / balance | 6 | L1->5 in 2.6-2.9 min with <=134 damage and 0 deaths for all roots; roots close; ruins very soft for the bot; regen bug breaks recovery. |
| UI / UX | 7 | Minimap, objective override, locked labels, banner suppression all verified; overlaps and 1024x600 clipping remain. |
| Stability | 9 | 0 console errors/warnings, 0 page errors in about 25 min of cumulative automated play, heap flat at 45 MB over 12 spawn/kill cycles. |

## 3. Findings

### S2

**R3-1. HP regen (normal and array) is dead after respawn / Continue / New Game until the old session time has elapsed.**
Cause (code): `WorldScene.lastCombat` is a class field initialised once; `create()` resets `this.now = 0` but not `lastCombat` (WorldScene.ts:136 vs :728). `hpRegenPerSec` gets `quiet = now - lastCombat`, which is negative after a restart, so it returns 0 until `now` catches up. `main.ts begin()` reuses the same Scene object, so every re-entry has this.
Repro: play 20-90 s, get into a fight (or die), die, press Respawn, `setHp(50)`, stand still 20 s.
Observed: fresh session 50 -> 67 HP in 20 s (1.2%/s as designed, starts after about 6-7.6 s). After death: `now`=1.03, `lastCombat`=92.7, HP stayed exactly 50.0 for 20 s. Standing ON the array after respawn: 30.0 for 12 s (expected +5/s after 2 s). After Save&Quit -> Continue (`now`=0.74, `lastCombat`=16.2): 30.0 for 15 s. The suppression lasts as long as the previous session had run (a 10-minute session means 10 minutes without regen).
Expected: regen resumes 6 s (array 2 s) after the last damage.
Fix: set `this.lastCombat = -99` in `create()`.
Evidence: `qa4/t5.mjs` and `qa4/regen2.mjs` outputs (numbers above).

### S3

**R3-2. Enemies hit from beyond 1.5x aggro range never chase: free ranged kills.**
Repro: spawn a wolf 172 px away facing away, cast Flying Sword (range 190) six times.
Observed: the wolf stayed `idle` at 178-182 px for all six hits and lost 160 -> 44 HP. A `!` shows on each hit, then the chase state drops straight back to idle because `updateEnemyAI` leaves chase when `dist > aggroRange*1.5` (165 for a wolf). The same wolf at 150 px chases normally (144 -> 77 -> 30 px). Rushers have aggro 90-110, so the flying sword (190) outranges them (snake/toad leash 135, treant 150).
Expected: a struck enemy (alertUntil) hunts at least to the attacker's last position.
Fix: skip the leash-drop while `now < alertUntil`, or use `max(aggro*1.5, 200)` when alerted.
Evidence: `qa4/snipe.log`.

**R3-3. Save & Quit / Continue next to an engaged boss at low HP.**
Repro: engage the Fox, `setHp(12)`, Esc -> Save & Quit to Menu -> Continue.
Observed: the hero returns 60 px from the Fox at 13 HP, boss already `engaged:true` at full 2400 HP. There is no grace period; the likely outcome is death plus the death tax (not run to completion: UNVERIFIED that it kills). Not a soft-lock (death respawns at the village) and not an exploit (the boss heals on reload).
Fix: on load, if a boss is within engage range, place the hero at the village or give a 3-5 s grace period.
Evidence: `qa4/save1.log`.

**R3-4. Death tax floor is 50% at the start of the game.**
`max(15, 10%)` on the starting 30 stones took 15 (`qa4/death.png`: "You lose 15 spirit stones"). The first death costs half of the player's wealth (more than a potion). Consider a floor of 5-8 below level 5, or min(15, 25% of stones).

**R3-5. Early and mid zones are very easy for a competent bot; ruins are far softer than in round 2.**
Numbers (bot, no gear unless noted, game time):
- L1 -> L5 in bamboo, natural spawns: Flame 158 s / 29 kills / 65 dmg; Tide 157 s / 29 kills / 69 dmg; Verdant 176 s / 24 kills / 134 dmg. 0 deaths, 0 potions. Roots are within 12% on time; Verdant takes about double the damage; Tide's slow/mana benefit is not visible in this metric.
- Grove at L5, 12 kills: 66-71 s, 37 dmg total. Marsh at L3 with all enemies alerted: 12 kills, 80 s, 49 dmg.
- Ruins at L7, 12 kills: 66 s, 21 dmg; with `alertAll` every loop: 70 s, 6 dmg. Round 2 measured 175-222 dmg per jiangshi at L7. Either ruins tier 3.0 plus longer rusher windups made them soft, or the hook bot out-aims the old mouse bot (UNVERIFIED which; a human playtest is needed).
- Elites (marsh-tier wolf/toad/ghost/skeleton, L6, 10 kills): 154 s, 324 dmg taken, about 15 s and 32 dmg each, 0 deaths. A real improvement over round 2 (5-10 s, 0-12 dmg).
Reading: the only content with stakes is elites and bosses; normal packs need no potions. Consider restoring some ruins pressure.

### S4

- **R3-6. Minimap zone label and the "Tab - world map" hint are overlapped by the quest tracker** (`qa4/ui2-1280x720-quest-arrow.png`, `qa4/ui2-1024x600-boss.png`: the label is cut by the tracker's top edge, the hint is hidden). Move the tracker about 20 px down.
- **R3-7. Character panel is still clipped at 1024x600** (`qa4/ui-1024x600-chr.png`): the last "Breakthrough needs..." paragraph runs into the hotbar. The shop panel also touches both screen edges and sits under the hotbar (`qa4/ui-1024x600-shop.png`). Needs `max-height` plus scroll.
- **R3-8. World map at 1024x600**: zone labels "Whispering Bamboo Forest" and "Broken Sword Ruins" overshoot the map frame; the hint line "World map - Tab or Esc to close" overlaps the hotbar (`qa4/ui-1024x600-map.png`). Enemy dots still spoil the hunt.
- **R3-9. NPC nameplates are hidden behind the minimap** at 1280x720 ("Merchant Qiao . Shop" is cut at "Sho", `qa4/ui-1280x720-spawn.png`). The backplates themselves read well.
- **R3-10. Vision cone overlay is barely visible** on bright ground (alpha 0.09/0.07 in `drawOverlays`) and only drawn for idle enemies (`qa4/ui2-1280x720-cones.png`). The `!` cue is small and low contrast. Stealth is readable mainly on dark terrain.
- **R3-11. Boss bar abuts the objective line** at 1024x600 (`qa4/ui2-1024x600-boss.png`), cosmetic.
- **R3-12. No reward for stealth, no pack alerts.** Unaware enemies can be approached to about 27 px and hit from 26-34 px without waking, but the first hit wakes them with no backstab bonus. A facing-away wolf 30-60 px behind a standing player never noticed it in 12 s (stealth works), and a player circling at 45 px never woke a wolf in 12 s. `alertEnemy` is only called from `hitEnemy`: striking one of 3 clustered wolves woke one other, one stayed idle after 2 s.

## 4. Verified working (round-3 claims)

| Claim | Result | Evidence |
|---|---|---|
| Vision: LOS blocks sight | PASS | Wolf facing the player across a 1-tile obstacle for 5 s: idle, 0 damage. Adjacent through the obstacle (32 px apart): idle 10 s, 0 damage. |
| 3 s memory, then give up and return home | PASS | Injected 3x9 wall: wolf, foxfire and swordspirit each stood at the wall in `chase` for 2.6-3.1 s, then `idle` and walked home; never attacked through the wall. `qa4/t4.mjs`. |
| Cone / sense radius | PASS | Facing-away wolf at 22 px noticed at 0.0 s; at 30, 40, 60 px never in 12 s; at 90 px noticed at 4.2 s (idle sway). |
| Chase ends beyond 1.5x aggro | PASS, with the side effect in R3-2 | Lure test: `idle` within 0.5 s of teleporting 250 px away (no `?`). |
| Wake on hit | PASS | `strikeEnemy` -> `chase` within 0.3 s with the `!` cue. |
| Sprite flip flicker | PASS | Player straddling the x axis 30 px above a chasing toad for 8 s: 1 flip in 236 samples. Idle wolf 20 s: 2 flips; orbiting caster 4 per 12 s; charger 4 per 12 s (windup/dash). |
| Charger mid-windup | PASS | Locked direction, no state breakage in the orbit test. |
| Burn DoT waking enemies | UNVERIFIED | Code read: `tickBurn` calls `applyDamage` directly, so DoT neither wakes nor alerts; the hit that applies burn does. |
| canSee cost | NO REGRESSION SEEN | Noisy (box load 26): idle 33 ms, 40 enemies 45-47 ms, 80 enemies 39-40 ms average frame; alerted and unaware the same. |
| Regen numbers (fresh session) | PASS | 1.2%/s after about 6-7.6 s (3.1 HP per 2.5 s at 100 max HP); array 5%/s (maxHp 147: 30 -> 120 in 12 s); village outside array 30 -> 62 in 18 s. |
| Regen abuse paths | NONE FOUND | UI pause, shop and dialogue stop `simulate` (no free time); dead state skips `updatePlayer`; meditation adds no HP regen (qi only). The array heals fully in about 14 s: a free full-heal station in the village (design note). |
| Death tax | PASS | min(stones, max(15, 10%)): 30 -> 15 observed. See R3-4 for the feel. |
| Boss windup >= 85% of nominal | PASS | 27 Fox telegraphs: charge nominal 0.70 s, observed 0.62-0.91 (ratio 0.89-1.30); sweep nominal 0.60, observed 0.53-0.78 (0.88-1.30). Only Fox sampled. |
| Repeat-kill stones x0.3 | PASS | Fox first kill +79 stones; repeats +24, +22, +24 (qi pill 50% only, no unique drop). |
| No autosave during boss fight | PASS | Control autosave fired within 33 s; with the Fox engaged for about 70 s the save string did not change. Boss kill writes a save containing `ninetail`. Death mid-boss saves with the tax and respawns in the village; the boss resets. |
| Minimap larger, zone label, click opens map, Tab | PASS | 165 px at 1024x600, 203 px at 1280x720, 255 px at 1920x1080; click -> `#wmap` shown; Tab toggles. |
| Objective line overrides tutorial | PASS | After accepting the first quest at tut=9 (dash step not done) the line read "Slay Spirit Wolves 0/4". |
| Objective arrow placement | PASS | Clamped clear of HUD in 3 captures (left edge, distance 29; bottom, 31, above the hotbar). |
| Locked skill labels | PASS | Slots show "Lv 2/4/7" cleanly (`qa4/ui-1280x720-spawn.png`). |
| Zone banner suppression | PASS | No banner during the engaged Fox (`qa4/ui2-1280x720-boss.png`) or on the death screen (`qa4/death.png`); it appears normally in the bamboo. |
| Elite label near player only | PASS | "Vampiric Spirit Wolf" label only on the close elite. |
| Console | PASS | 0 console errors/warnings and 0 pageerrors in every run; the 8 WebGL `texImage2D` warnings are gone; audio mute toggle did not throw; no AudioParam exception in grove/ruins/boss runs. |
| Memory | PASS | Heap 45 MB at start and after 12 cycles of 10-enemy spawn/kill; scene children 599 -> 604, tweens 111 -> 114, textures 308 -> 309. |
| Save/load round trip | PASS | Level, stones (333), potions (5), position, engaged boss restored exactly (see R3-3). |

## 5. Top 10 fixes (priority order)

1. R3-1: reset `lastCombat` (and any other class-field timers) in `create()`; add an e2e: die, respawn, wait, expect regen.
2. R3-2: keep alerted enemies hunting past 1.5x aggro (or give ranged hits a "searching" state).
3. R3-3: grace period or dormant boss on Continue near an engaged boss.
4. R3-5: re-check ruins difficulty with a human playtest; add a pressure source for normal mobs from L5 (pack alerts, more casters).
5. R3-12: add pack alert propagation and a sneak-attack bonus so the stealth system pays off.
6. R3-4: soften the 15-stone death floor early (or scale with level).
7. R3-10: raise cone overlay alpha to about 0.16 plus an edge line; bigger, outlined `!` and `?`.
8. R3-7/R3-8: scroll or max-height the character, shop and world-map panels at 1024x600; keep map labels inside the frame; lift the map hint above the hotbar.
9. R3-6/R3-9: separate the quest tracker from the minimap label; keep nameplates under the minimap layer or offset them.
10. Add an e2e for save mid-boss then Continue (R3-3) and a perf budget test with 80 alerted enemies on real GPU hardware (UNVERIFIED here).

## 6. UNVERIFIED

Real-GPU performance; audio by ear; human reaction to the longer rusher windups; Fallen Sword Immortal windup statistics (only the Fox was sampled); whether the R3-3 reload kills the hero; burn DoT waking; Tide's mana benefit; ruins difficulty for a human.

## 7. Evidence index (`qa4/`)

Scripts: `t2.mjs t3.mjs t4.mjs t5.mjs` (vision, regen), `snipe.mjs`, `flip.mjs`, `bot.mjs bot2.mjs bot3.mjs` (balance), `boss1.mjs boss2.mjs save1.mjs regen2.mjs perf.mjs perf2.mjs`, `ui.mjs ui2.mjs`. Screenshots: `ui-{1024x600,1280x720,1920x1080}-*.png`, `ui2-*-{dialogue,quest-arrow,cones,cones2,elite,boss}.png`, `death.png`, `wall.png`, `boss-fight.png`, `array.png`. Logs: `*.log`.
