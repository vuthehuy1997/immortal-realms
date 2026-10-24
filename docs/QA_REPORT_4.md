# QA Report 4 - independent QA/design review of commit 948e46c (rounds 12-14)

Reviewer: independent QA lead / game designer. No file under src/, e2e/ or tests/ was modified; nothing pushed. Scratch scripts, logs and screenshots live in `/tmp/claude-464201200/-data-yuu-ai-data-yuu-self-immortal-realms/fb77f4ce-5dc1-4887-ba8e-13a6200c5f82/scratchpad/qa4/` (called `qa4/` below).

## 0. Method and limits

- VERIFIED = I ran or looked at it (Playwright Chromium + SwiftShader against a `vite build` of 948e46c served on :4199; throwaway vitest scripts that import `src/core` and `src/data`; screenshots I opened). INFERRED = read from code or computed from a model, not observed in play.
- Machine load average was 20-25, so the game ran slower than wall time. All durations are GAME seconds (`__rpg.state().now`). No fps claims.
- My bot is the QA3 bot (WASD keys, hook attacks with perfect aim, dash on windup, potion/flask at <45% HP, spams all 4 techniques). Every fight below is ONE run: a band, not a fact. Humans will be worse at aim and better at positioning.
- Zero page errors and zero console warnings/errors in every session (create, boon picker, tower, touch landscape and portrait, save-load matrix).
- Note: `window.__rpg` test hooks are still live in the production build (I drove a `vite build` output with them). QA3 asked for gating; not done.

## 1. Which QA3 findings are really fixed

| QA3 finding | Status | Evidence |
|---|---|---|
| #3 Warden wall at L9 + shop gear | FIXED | Same setup as QA3 (L9, steel blade, sect robe, jade pendant, 10 potions): QA3 died at 58 s with the boss at 6%. Now boss dies at 28.6 s, 159 HP lost of 238, min HP 67, 1 consumable used (`qa4/warden_new.log`). Possibly now too easy, see P3. VERIFIED |
| #7 Mana starvation | FIXED on paper | Model: all 4 techniques drain 15.4 mana/s if spammed, base income (3 regen + 3/3/6 per connecting swing) is ~13.9/s, i.e. ~90% uptime with zero boons. INFERRED (model, not bot-logged) |
| #1/#2 Touch overlaps, portrait | FIXED | `qa4/m_land_tower.png`, `m_port_boon.png`: sound button moved, HUD readable in 844x390 and 390x844. VERIFIED |
| #9 Merchant nameplate under minimap | NOT FIXED | "Merchant Qiao - Sho" still clipped at 1280x720 (`qa4/charpanel.png`, `hud.png`) and 844x390. VERIFIED |
| #4 Ch2 free gear / shop redundant | Changed per CHANGELOG (quests now pay stones/draughts) | Not re-played. INFERRED |
| #5/#10 Ch2 art repetition | NOT FIXED (PLACEHOLDER in TASKS) | Sovereign is still the tinted Warden sprite. Code/TASKS. INFERRED |
| #12 hooks hardcode Ch1 zones | not rechecked | - |
| Test hooks in prod bundle | NOT FIXED | VERIFIED (used them on a prod build) |
| WorldScene god class | WORSE | 1322 -> 1463 lines; tower, boon offering and perfect dodge were added inside it (`src/game/WorldScene.ts:709-790, 896-905`). VERIFIED (wc) |

## 2. Scorecard (1-10)

| Area | Score | Why |
|---|---|---|
| Combat | 6.5 | Flask + mana-on-hit fix the sustain loop; perfect dodge and poise exist but are shallow (P3, P8). Bosses die in ~30 s even at the final boss. Trash is still a stat check. |
| Progression / economy | 5.5 | Picks and 30-level cap added, but boons are flat +% (P1), lifesteal stacks (P2), tower kills pay full XP/stones (P4). L20-30 has no content except the tower. |
| Content depth | 6 | +15 boons, +6 passives, +tower, +1 realm. But 12 of 15 boons are owned by L30 so builds converge; heroes still share one kit. |
| Visuals | 6.5 | Hub/boon picker look good and consistent; tower has no arena (fights in the hub), keepers reuse hero sprites, Ch2 still recolours. |
| UI / UX | 6 | Boon picker is clean and keyboard/touch operable; but no owned-boon list, tiny trait text, no aria, pad cannot pick, silent save fallback. |
| Stability | 8 | No errors; save migration of legacy saves works; edge cases below are silent rather than crashy. |
| Replayability | 6 | Tower + boons add a loop; run-to-run variance is small (P1) and tower scaling is spiky (P4). |

## 3. Measurements

### 3.1 Boon and hero value (vitest script `qa4/b.sim.ts`, L20 reference: 706 HP, atk 108, def 63, crit 15%; combo DPS model, INFERRED)
| Boon / hero | DPS x | HP x | Note |
|---|---|---|---|
| dragon-vein (epic) | 1.119 | 1.079 | best single pick |
| sword-heart | 1.109 | - | common beats most rares |
| void-edge (epic) | 1.067 | - | |
| keen-eye | 1.040 | - | |
| iron-bone / jade-skin | - | 1.12 / def 1.14 | |
| deep-lake, flowing-qi, qi-harvest, ghost-blade | 1.000 | - | mana-only: near-dead because base mana already sustains the kit |
| blood-lotus 3% / heaven-sustain 2% lifesteal | - | - | see P2 |
| Hero: saber | 1.109 + 2% lifesteal | - | strictly best attacker |
| Hero: monk | 1.000 | 1.15 / def 1.127 | solid tank |
| Hero: heroine / swordsman | 1.06 / 1.054 | - | |
| Hero: fanscholar, twinblade | 1.000 | 1.000 | mana-only traits = no combat value |

All 15 boons + saber: DPS x1.53, HP x1.20, lifesteal 7%, crit 25% at x2.25. Offer rarity share over 5000 rolls: common 62%, rare 33%, epic 5%. Picks available by L30: 6 (levels) + 6 (bosses) = 12 of 15, plus one per tower record at floors 10/20/30.

### 3.2 Boss poise (INFERRED, model: poise max = 12% HP, stagger 2.2 s at x1.5, 9 s lockout)
Average DPS gain from staggering is only +4% to +9% for every boss at 100-350 DPS (Warden fill time 2.3-7.9 s). The mechanic's real value is cancelling a wind-up, not damage.

### 3.3 Real fights (bot, 1 run each)
| Fight | Result |
|---|---|
| Warden, L9, shop gear (238 max HP) | won in 28.6 s, 159 HP lost, min HP 67, phases at 0.1/9.2/19.3 s |
| Sundered Sovereign (final boss, 16,500 HP), L20 no breakthrough (493 HP), crystal saber+robe+sky seal, no boons, 8 greater draughts | won in 32 s, 530 HP lost (incl. 2 consumables), min HP 145, phases at 0.1/9.0/18.3 s (`qa4/sov.log`). Bot DPS ~500, far above the model; the final boss has the same length as the first. |

### 3.4 Trial Rift
In-game, hook-cleared floors 1-14 with a L12 Monk (`qa4/t1.cjs`): L12 -> L19 in 14 floors from kill XP alone (e.g. floor 4 +176 XP, floor 11 +382, level-ups on floors 7, 8, 10-14); kill stones 41-424 per floor versus a record reward of 28-160. Enemy HP at floor 10: elite golem 12,750, jiangshi 1,604, soldier 1,449 (versus bamboo wolf 160). Crude survival model (`qa4/tower.sim.ts`, 35% contact uptime, INFERRED): the L10 hero with Ch1 gear is already at 328% of max HP damage by floor 10; L20 with Ch2 gear crosses 100% around floor 15; L30 best gear around floor 17-21. Floor difficulty is NOT monotone: floor 26 (10 mobs, 83k total HP) is harder than floor 30 (8 mobs incl. guardian, 54k) because guardian floors use `max(3, count-2)` foes (`src/core/tower.ts:45`).

### 3.5 Save matrix (Playwright, localStorage edit + recomputed FNV checksum)
| Case | Result |
|---|---|
| legacy save without boons/boonPicks/towerBest/flask, level 7 | loads, 1 pick credited. VERIFIED |
| unknown boon id, duplicate boon, towerBest 1000, boonPicks 100, level 31 | save rejected; game silently loaded the OLDER `.bak` (level 1 instead of 7); no toast seen. VERIFIED (toast check was within ~1.5 s of load) |
| level 30 with all 15 boons owned and 3 banked picks, then `offerBoon()` | no picker; picks silently zeroed (`WorldScene.ts:769-770`). VERIFIED |
| realm 3 / qi 10 | loads fine. VERIFIED |

## 4. Top 8 problems (prioritised)

**P1 - Boons do not create builds (S2 design, VERIFIED by calculation).** `src/data/boons.ts`: 15 boons, 12 owned by L30, all pure stat multipliers. No behaviour changes (burn on combo, dash blade, stagger bombs). Six are near-dead (deep-lake, flowing-qi, qi-harvest, ghost-blade, breaking-wave and the mana half of heaven-sustain) because `MANA_ON_HIT` already makes all four techniques ~90% sustainable (3.4/3.1). A 3-offer can hold 3 duds ~5% of the time and the player cannot skip or reroll. Two players reach nearly the same character.

**P2 - Lifesteal is the one degenerate stack (INFERRED).** Saber trait 2% + blood-lotus 3% + heaven-sustain 2% = 7% (`aggregate` is purely additive, no cap). `leech()` (`WorldScene.ts:~696`) heals on `r.amount` before overkill and before shield absorption, and per target, so sword-rain (4 ticks) into a pack heals per enemy per tick. In the model, ~580 DPS gives ~41 HP/s, more than any boss out-damages me by (Warden: ~6 HP/s taken in my run). In the tower with 10+ foes it grows. Saber is also the best attacker (table 3.1), so "saber + 2 boons" is the dominant pick. Suggest cap at ~4%, heal on clamped damage, halve for AoE/DoT.

**P3 - Bosses are now short and the finale is not a finale (S3, VERIFIED, 1 run each).** Warden 28.6 s, Sovereign 32 s (16.5k HP) for a no-boon L20 bot. Poise adds only +4-9% DPS (3.2) so it does not lengthen or deepen fights. The QA3 wall is gone but the pendulum swung. The Sovereign is also the Warden sprite tinted. Needs per-boss HP/phase retune (final boss 2x HP or an extra phase) and a recorded target in `tests/balance2.test.ts` for Ch2 bosses.

**P4 - Tower is the best XP/stone farm and its curve is spiky (S3, VERIFIED + INFERRED).** The "record-only rewards" guard (`floorReward`) only covers the bonus; every kill still calls `registerKill` (`WorldScene.ts:830`) with `zone = plan.zone`, so XP and drops are unrestricted: L12 -> L19 in 14 floors, and L20-30 (24k XP, `src/core/progression.ts`) is realistically only reachable here. Quest kill counters and flask charges also tick. Elites roll up to 40% at floor 10+ with +180% HP, so a floor's difficulty varies several-fold on RNG; guardian floors are easier than their neighbours (3.4). No arena (fights in the hub beside shop, array and Qi pavilion), keepers use hero sprites (the screenshot `tower_f10.png` shows Ming looking like the Saber hero), death still costs spirit stones (`die()` -> `deathTax`) and the whole run (no checkpoint every 5 floors).

**P5 - Silent save fallback and boon-pick loss (S3, VERIFIED).** One invalid new field (even an unknown boon id after a future rename, `validBoons`) discards the whole current save and loads the older `.bak` without telling the player; progress since the last backup is lost. Separately, when the pool is exhausted `offerBoon()` zeroes `boonPicks` (tower floor 20/30 rewards and boss picks are then wasted without a message). Add a toast/dialog and drop unknown ids instead of rejecting.

**P6 - Information gaps in the new UI (S4, VERIFIED screenshots).** Boon picker shows no owned boons, no resulting stats, no "x of 15 collected". Character panel (`charpanel.png`) names the hero style ("Storm Steps") but not its effect, and lists no boons, no perfect-dodge or poise info. Hero trait text on creation is ~8 px on desktop and 6.4 px on touch (`m_land_create.png`), low contrast. Floor-clear and "Floor N" toasts sit on top of the Keeper nameplate.

**P7 - Accessibility of the new modal (S4, VERIFIED grep + keyboard test; pad INFERRED).** Keys 1-3, Tab and Enter work (verified: Tab then Enter picked `elixir-body`), first card is auto-focused. But `showBoonPicker` has no `role="dialog"`/`aria-modal`/label (the only aria in `src/ui` is on inventory slots), and the gamepad path maps buttons to internal handlers, not DOM key events (`src/core/gamepad.ts`), so a pad-only player is frozen by `uiPause` with nothing selectable. No reduced-motion option for shake/slow-mo (grep found none). Touch hint reads "Press 1-3 or click" on phones.

**P8 - Perfect dodge and poise are almost invisible mechanics (S4, VERIFIED 0 triggers in 20 s of spam dashing).** Perfect dodge requires the hit to land while still in range after the 62 px dash and inside the 0.3 s i-frames, so it only fires on boss AoE or charges (good: not farmable; my 2-wolf dash spam produced 0 buffs in 20 s). Payoff is +8 mana and x1.25 for 3 s; nothing teaches it (no tutorial text, no HUD buff icon seen). Two of the six hero traits and two boons only modify it. Players will not discover or value it.

## 5. Other notes (lower priority)
- Level-up fully restores HP/mana (`grantXp`), so sub-cap tower runs are partly self-healing at every level.
- `setHp(1e5)` test hook is not clamped: HUD showed "HP 100000 / 307" (hook only, not player facing).
- Boon offer RNG is seeded from kills/level/boons (`boonChoices`), changing as kills change, so "stable until one is taken" holds only while idle.
- L20 without breakthrough (needs a Foundation Pill, 60% base chance) has 493 HP vs 856 broken through: the realm is a hidden power gate worth surfacing in the objective text.

## 6. Next-step proposals (benchmarks used for mechanics only: Hades, Vampire Survivors, Diablo-likes, Tale of Immortal for breadth)

| # | Proposal | Effort | Why |
|---|---|---|---|
| 1 | Boon rework: add 6-8 behaviour boons (combo applies burn/slow, dash leaves a blade line, crit refunds cooldown, stagger bomb), 2 boon "slots" by theme (Hades style), tags for synergies, reroll/skip token, expand pool to ~30 (also replaces dead mana boons) | M | fixes P1; makes picks matter |
| 2 | Cap lifesteal (e.g. 4%), clamp to real damage, nerf AoE/DoT healing; give fanscholar/twinblade traits combat value (e.g. technique damage, perfect-dodge mana refund 15) | S | fixes P2, hero balance |
| 3 | Boss retune: finale 2x HP or 4th phase; poise should open a longer and bigger window (x1.8, 3 s) for final bosses; add test targets (length, damage taken) for the three Ch2 bosses | S-M | fixes P3 |
| 4 | Tower: tower kills pay reduced XP/stones (e.g. 25% above player level cap-relative), checkpoint every 5 floors, floors use fixed counts and elite caps so difficulty is monotone, arena map + distinct keeper art | M | fixes P4 |
| 5 | Save robustness: drop unknown boon ids, toast when falling back to `.bak`, toast on discarded picks, add "picks pending" counter in HUD | S | fixes P5 |
| 6 | Character panel: trait effect text, owned boons list with descriptions, picker footer "7/15 collected", bigger/contrasted trait text; aria-modal and label on picker; pad d-pad/A handling for the picker | S | fixes P6, P7 |
| 7 | Perfect dodge teaching: first-time hint, HUD buff icon with timer, bigger payoff (brief boss poise damage) and an optional reduced-motion toggle | S | fixes P8 |
| 8 | Sect meta-upgrades bought with stones, then daily-seeded tower modifiers (Hades heat style) | M-L | sink for stones, replay reasons |
| 9 | Distinct per-hero technique kits (still the biggest depth gap vs Tale of Immortal breadth) | L | art-dependent |
| 10 | Extract tower/boon/dodge out of `WorldScene` into `src/core` controllers; gate `__rpg` behind a build flag | M | stops the god-class growth (1463 lines) |

## 7. What I could not verify
- Human feel: all fights are a perfect-aim bot, single runs; a human may find the Warden hard again or the Sovereign even easier.
- Tower survivability is a crude model (35% uptime, 4 engaged foes max); I did not fight floors beyond 14 and cleared those floors with the test hook, so real damage taken per floor is unmeasured. The starting-hub arena side effects (shop pause, array healing during a run) were read in code, not played.
- Lifesteal and poise gain numbers are model estimates (DPS model 305 vs bot ~500), not measured in the browser.
- Boss fights other than Warden and Sovereign (Ninetail, Jiao, Corpse King, Colossus) and Chapter 2 mobs were not fought in this round.
- Boon picker on a physical controller and a real screen reader; reduced-motion; audio; story pages; fps (software GL under load).
- Silent `.bak` fallback: I saw level 1 loaded instead of level 7 and no toast within ~1.5 s; a later toast or banner is not ruled out.
