# QA Report 2 - Independent re-test of "Immortal Realms" (after the round-1 fixes)

Reviewer: same senior QA lead + game designer as round 1. Build: current `main`, `npm run build`, `vite preview` on 127.0.0.1:4180 (bundle `index-DrNbeKrT.js`). Chromium + SwiftShader software GL (~35 fps; all timings are GAME time from `window.__rpg.state().now`). Nothing under src/, e2e/, tests/, public/ was touched; scripts live in the session scratchpad; screenshots are in `qc-artifacts/qa2/` (gitignored).

Method and honest caveats:
- Fights were driven by a bot that uses REAL keyboard (WASD, Shift, 1-4, F) and REAL mouse (aim + click) input. Hooks (`__rpg`) were used only to set level/gear/position, spawn enemies, force boss moves, and (in the economy run) a free heal. The bot is a competent but not human player: it clicks at ~10 Hz, dashes at the end of a boss windup, spams skills, drinks at 35-40% HP.
- Enemy fights used the NATURAL zone spawns (so the zone tier multipliers are real). Elite and boss tests used hooks to place them.
- "Smart" policy = dash on windup + skills + potions. "Stand" policy = stand still and mash melee.
- Anything I could not measure is marked UNVERIFIED.

---------------------------------------------------------------------

## 1. Scorecard (1-10), round 1 -> round 2

| Area | R1 | R2 | What moved and why |
|---|---|---|---|
| Onboarding | 4 | 7 | Objective line with 4 forced steps (move/attack/dash/talk), gold edge arrow, minimap ring, NPC nameplates, NPCs visible at spawn, quest tracker + journal (J) + world map (Tab). Held back by arrow/banner overlaps and a tutorial line that blocks the quest line until every step is done (N-9, N-10). |
| Combat feel | 6 | 7 | Fights now have stakes: a rusher windup you can see, casters that circle, Shift actually matters, potions have a cooldown. Wolf/snake/bat windups (0.15-0.22 s) are shorter than human reaction (N-6). |
| Enemy AI | 3 | 7 | Stuck-behind-scenery fixed, stacking fixed, casters strafe, leash+regen works, elites carry traits. Remaining: elites are still pushovers at their zone's level (N-8). |
| Boss design | 3 | 7 | 5-14 s fights became 23-47 s for an optimal bot, with 6 distinct telegraphed moves per boss and per-phase kits. Shift-at-end-of-windup trivialises slam/sweep/charge (N-5); still short for a "boss". |
| Progression / economy | 3 | 6 | Real curve (L1-12 in ~11 min, potions needed from the grove on), armour+charm slots, technique points, pill-gated realms, 10% death tax. Weak spots: no out-of-combat HP recovery (N-3), boss reload-farm (N-4), roots unbalanced (N-7). |
| Depth / content | 3 | 4 | Systems added (gear slots, techniques, root passives, elite traits, journal) but the content is unchanged: same map, same 3 quests, same 16 mobs, 2 bosses. |
| Art consistency | 7 | 7 | Unchanged (NPCs still reuse hero sprites; nameplates now readable except over the white lotus bowls). |
| Animation | 6 | 6 | Not re-examined in depth; strike/windup states exist. UNVERIFIED frame-by-frame. |
| VFX | 6 | 7 | Telegraphs are the best new VFX: slam circle, sweep cone, charge lane, rain circles, volatile blast ring all readable. Hit-splash is smaller. Zone banner still draws over boss fights and the death screen (N-12). |
| UI / UX | 7 | 7 | Hotbar icons fixed, death screen, journal, map, volume slider, technique panel: big gain. Offsets: new overlaps (arrow over objective/stones counter, locked-slot label collision, clipped character panel text at 1024x600, volume slider traps keyboard focus). |
| Audio design | 5 | 5 | Zone tonic/motif, volume slider, SFX pitch jitter added (code read; cannot judge by ear). But a motif bug throws an uncaught exception every ~120 ms in affected zones (N-1). |
| Performance | 7 | 7 | 36 enemies + skill spam: avg 36 ms/frame, p95 50-67 ms (software GL), idle empty 27 ms. Object counts flat across 5 death/respawn cycles (696 children, 110 tweens, 303 textures, 47 MB heap each time). |
| Stability | 6 | 7 | Softlock and zombie save fixed and verified. New: uncaught AudioParam exception (N-1), Esc dead after touching the volume slider (N-2). |

Overall: round 1 was "pretty but trivial". Round 2 is a real small ARPG slice: it has tension, a readable boss language and a believable level curve. The remaining weaknesses are systemic (no healing outside potions, one-button boss solutions, thin content) rather than blocking bugs.

---------------------------------------------------------------------

## 2. Round-1 S1/S2 findings re-verified

| R1 item | Status | Evidence |
|---|---|---|
| S1-1 quest softlock (boss killed before quest) | FIXED | Declined the fox offer, killed the fox, then accepted: dialogue showed "Slay the Nine-Tailed Fox Spirit: 1/1 / Claim reward"; chain continued to the Immortal offer; steel blade, qi pill, potions delivered. |
| S2-1 save-while-dead zombie | FIXED | Die -> F5 -> Continue: dead:false, hp 160/160, at village spawn. Die -> "Main menu" -> Continue: same. Stones -10% applied once. |
| S2-2 bosses are pushovers | MOSTLY FIXED | Section 3.3: Fox 23 s (L6, steel blade, dash policy, 90 of 172 HP lost, 0 potions); Immortal 47 s (L10, saber+robe, 215 of 250 HP lost, 3 potions). Standing still, both kill the bot (Fox at 14% boss HP left, Immortal at 69%). |
| S2-3 trivially easy / zone bands meaningless | FIXED, with a steep top end | Section 3.1/3.2. L1 in ruins/grove is deadly (thunderbird, jiangshi killed the L1 bot); bamboo/marsh are gentle at their levels. |
| S2-4 cultivation is a 25 s chore | PARTIALLY | Qi I->II fill: 16 s on the array (R1 3.3 s); II->III: 53 s (R1 8 s); off-array 3 qi/s. Now also needs level 5/10 and a Foundation Pill; failure costs the pill, half the qi and 25% HP (observed 148 -> 111) and 40% of attempts fail. Still safe, cheap and in the village. Kills add qi (about 8 qi per elite wolf; 64 qi after 8 kills) so fighting alone fills Qi I in ~15 kills. |
| S2-5 stuck on scenery / stacking | FIXED | Wolf behind the lotus bowl reaches the player at all 3 offsets (R1: held at 38 px for 10 s). 6 wolves spawned 3 px apart: min pair distance 11.4 px, 0 pairs under 4 px (R1: 0.0 px, 10 pairs). |
| S2-6 no melee telegraph / turret casters | MOSTLY FIXED | Wolf states: attack -> strike (0.21 s) -> attack. Ghost/thunderbird/foxfire circle (y-spread 33-39 px, distance 69-124) and fire volleys. Windups of 0.15-0.22 s are too short to react to (N-6). |
| S2-7 progression falls off | PARTIALLY | Armour+charm slots, 5 new items, technique points (7 free at L8), elite loot tables, merchant stock 10 items. No new zones/quests; the whole game is still about 11 min of grind plus bosses. |
| S2-8 blank skill icons | FIXED | `18-hotbar-l1.png`: all four icons render; locked ones are dimmed with "Lv N". |
| S2-9 onboarding gaps | FIXED (minor overlaps) | `04-tut-talk.png`: objective line, edge arrow, nameplates; NPCs on screen at spawn; minimap ring at the objective (`21-1024-map.png`). |
| R1 S3-1 death presentation | FIXED | `11-death.png`: dim, "Defeated", stone-loss text, Respawn/Main menu. |
| R1 S3-9 journal/map | ADDED | `08-journal.png`, `09-map.png`. |
| R1 S4-3 WebGL warnings | STILL PRESENT | 8x `texImage2D: width or height out of range` at every load. |

---------------------------------------------------------------------

## 3. Difficulty re-measurement (real-input bot)

### 3.1 Normal enemies by zone (natural spawns; time-to-kill in game seconds, HP lost, potions)
Max HP: L1 100, L3 124, L4 136, L5 148-160, L7 172-184, L10 238-250, L12 ~270. Gear is stated per row.

| Zone / level / gear | Enemy | TTK | HP lost | Notes |
|---|---|---|---|---|
| Bamboo L1, no weapon, stand | wolf | 13.5, 6.9 | 0, 27 | 160 HP wolf; a stand-and-mash L1 hero needs ~10 s per wolf |
| Bamboo L1 smart | wolf x3 / foxfire | 4.4-7.5 / 5.0 | 0-18 / 0 | levels up mid-run (2 wolves = L2) |
| Bamboo L4, iron sword | wolf x3, snake x2 | 0.8-4.2, 1.7-1.9 | 0-16, 0-8 | skills one-shot-ish wolves; no threat |
| Marsh L3, iron sword | toad x3 | 5.7-7.4 | 12-22 | 384 HP toads |
| Marsh L7, steel+cloth robe | toad/ghost/waterghost/snake | 2.1-8.5 | 0-28 | comfortable |
| Grove L5, iron sword | peach spirit | 3.6, 5.5 | 38, 59 (25-40%) | volleys hurt |
| Grove L5 | bat x2 | 3.5, 4.6 | 30, 48 | |
| Grove L5 | sword spirit / thunderbird | 9.4 / 10.0 | 40 / 107 | thunderbird needed a potion |
| Ruins L7, steel blade | skeleton x2 | 4.2, 11.7 | 0, 42 | |
| Ruins L7 | jiangshi x2 | 28.0, 19.8 | 175, 222 | 2-3 potions each; the bot lost more HP than it has |
| Ruins L7 | soldier x2 / golem | 11.9, 11.8 / 20.5 | 20, 0 / 224 | the golem KILLED the bot (1 potion used) |
| Ruins L12, spirit saber+sect robe | skeleton | 2.2, 21.7 | 0, 56 | |
| Ruins L12 | jiangshi x2 / soldier x2 | 9.2, 8.9 / 24.9, 8.8 | 32, 21 / 111, 21 | |
| Ruins L12 | golem | 21.2 | 128 | best weapon, still a 21 s slog |
| UNDER-LEVELLED, L1 no gear | marsh toad | 28.9 | 110 | 2 potions |
| L1 | grove peach spirit / bat | 12.2 / 8.9 | 179 / 32 | 2 + 1 potions |
| L1 | grove thunderbird | 15.9 | 204 | **killed the hero** |
| L1 | ruins skeleton / jiangshi | 30.7 / 26.9 | 186 / 164 | 4 potions / **killed the hero** |
| L1 (other marsh mobs) | waterghost/ghost/snake | 3.7-4.5 | 0-6 | the marsh is only partly dangerous |

Reading: the world is no longer trivial. Under-levelled play in the grove/ruins is genuinely dangerous and the recommended levels are about right for the bamboo/marsh/grove. The ruins are tuned too hard for their stated "Lv 7-12": at L7 with a steel blade a jiangshi costs 175-222 HP and a golem is lethal, and at L12 with the best weapon a golem is still a 21 s fight. Without armour the L7 ruins are a potion sink, not a challenge (N-8).

### 3.2 Level pacing, economy, potions (continuous hunt run L1 -> L12, iron sword, bot teleports from kill to kill, free heal hook when below 60% HP)

| Stage | Game time | Kills | Dmg taken | Stones | Potions used |
|---|---|---|---|---|---|
| Bamboo L1 -> L4 | 59 s | 10 | 192 | +35 | 2 |
| Marsh L4 -> L7 | 227 s | 21 | 396 | +144 | 4 |
| Grove L7 -> L9 | 102 s | 15 | 658 | +133 | 4 |
| Ruins L9 -> L12 | 264 s | 15 | 1330 | +308 | 4 |
| Total | 651 s (~11 min) | 61 | 2576 | +650 | 14 |

- XP per kill (tier x xp): wolf 12, toad 32, peach spirit 56, skeleton 80, golem 192. Kills per level: about 2 wolves (L1), 5-7 marsh kills, 6-8 grove kills, 5-6 ruins kills. Pace is brisk; the first 4 levels take about 1 minute of fighting (plus walking, which the bot skips).
- The bot needed an emergency heal 12 times beyond its 14 potions (the HP hook). A real player at the ruins would have drunk about 25 potions (300 stones, half of all income) or died. That is healthy pressure, but see N-3: there is no other way to heal.
- Stones: about 20 per ruins kill, 2-9 elsewhere. Prices: potion 12, Foundation Pill 150 (or 25 + 3 herbs), robes 50/170, pendant 140, ring 150, blades 60/180. Income roughly matches one gear piece per 15-25 ruins kills; the best gear (spirit silk 520, mantle 1100, saber, jade blade) is boss/elite-drop only so stones have no endgame sink beyond potions (UNVERIFIED past L12).
- Deaths: 0 in the hunt run (the free heal hid them), 3 deliberate under-level deaths in 3.1.

### 3.3 Bosses (6 distinct moves each, 3 phases)
Boss HP 2400 (Fox, def 6) / 6600 (Immortal, def 9).

| Boss / level / gear / policy | Result | Time | HP lost / max | Potions | Moves seen |
|---|---|---|---|---|---|
| Fox L6, steel blade, dash on windup end | killed | 23.4 s | 90 / 172 | 0 | sweep 5, rain 2, teleport 2, charge, summon, ring |
| Fox L6, iron sword, stand + melee only | died | 38.9 s | 412 taken / 160 | 7 | boss left at 332 HP (14%) |
| Immortal L10, spirit saber + sect robe, dash | killed | 47.1 s | 215 / 250 | 3 | sweep 10, slam 7, rain 5, summon, teleport, ring |
| Immortal L10, same gear, stand | died | 32.2 s | 486 taken / 238 | 7 | stuck in phase 1: slam 7, sweep 6 (270+216 dmg), boss at 69% |

Round 1: 5-14 s, 29-90 damage. The bosses now demand dodging, and standing in place is punished heavily.

Telegraph/dodge test (each move forced, 3 trials: stand, Shift timed at windup end, walk away at windup start; HP lost):

| Move | Stand | Shift late-windup | Walk away |
|---|---|---|---|
| Fox sweep (0.6 s) | 44 | **0** | 20 |
| Fox charge (0.7 s) | 24 | **0** | 24 |
| Fox rain | 39 | 35 | 0 |
| Fox teleport-behind | 42 | 20 | 0 |
| Fox ring | 31 | 31 | 0 |
| Immortal slam (0.9 s) | 81 | **0** | 45 |
| Immortal sweep (0.75 s) | 36 | **0** | 0 |
| Immortal rain | 63 | 45 | 63 |
| Immortal teleport | 39 | 36 | 0 |
| Immortal ring | 57 | 45 | 57 |

(Summon rows omitted: damage there is leftover bolts from the previous trial; the test is noisy for delayed-damage moves because my timer lines Shift up with the windup, not with the rain delay or bolt arrival. Treat the rain/teleport/ring columns as indicative only. UNVERIFIED for humans.)

Fairness: every move shows its area before it lands (`t-warden-slam.png`, `t-ninetail-charge.png`, `t-warden-rain.png`); windups 0.6-0.9 s are readable; rain gives a further 1 s. I found no unfair boss death. The Shift i-frame window (0.3 s) matches the end of the windup exactly, so slam/sweep/charge have a one-button answer (N-5).

### 3.4 Roots (L5, no weapon, 256 HP toad, melee only)
- Flame: TTK 6.9 s, 0 damage taken, burn visible on 89 samples.
- Tide: TTK 13.5 s, 16 damage taken, slow on 129 samples (about half the damage output of Flame).
- Verdant: TTK 8.3 s, 0 damage taken, 14 HP healed over the whole fight (a 100-HP hero heals ~5% of its max).
Passives work; balance does not (N-7). Tide's mana advantage with skills is UNVERIFIED.

### 3.5 Elites (marsh tier, L6, steel blade, wolf elites)
Affixes seen in 24 spawns: swift 11, vampiric 8, warded (shield) 3, volatile 2. TTK 5.1-9.7 s, 0-12 damage taken. Traits work (label "Swift Spirit Wolf", shield text, volatile orange blast ring `15-elite-explosive.png`) but at their zone's level elites are not a threat (N-8). Stacking elite name labels with HP bars clutter crowded fights (`11-death.png`).

### 3.6 Fun / degenerate-strategy check
- Tension: good in grove/ruins and in both bosses; bamboo and marsh at the right level are intentionally soft.
- Variety of decisions: dash timing, skill rotation vs mana, potion timing, which zone to farm, elite affixes. Casters are still best handled by closing in.
- Safe spots: scenery block fixed. Casters circle; leash makes enemies walk home and regen (verified: a lured treant lost aggro in ~3 s, returned to its home). Boss leash at 360 px resets the fight (not exploited; UNVERIFIED whether a prop can still block ring bolts or charges completely).
- Dash spam: 1.1 s cooldown vs 0.3 s i-frames; fine. Stun-lock: lotus burst 1 s stun at 7 s cooldown; fine.
- "Standing on the array": only for qi, and only in the village; no combat exposure.
- Degenerate: Shift at windup end beats half the boss kit (N-5); death is a cheap full heal that also resets the world (N-3); reload-at-boss farm (N-4).
- Unfair deaths: none observed from bosses; the L1 thunderbird/jiangshi deaths are fair, signposted by the zone banner ("Lv 5-9").

---------------------------------------------------------------------

## 4. New systems exercised end to end (real input unless stated)

| System | Result |
|---|---|
| Tutorial (move -> attack -> dash -> talk) | Works; objective text changes per action; arrow + minimap ring present. See N-9/N-10 for overlaps and blocking. |
| Quest chain pests -> fox -> immortal | Works through dialogue; chained offers; rewards delivered (iron sword + 3 potions; steel blade + 2 qi pills + 3 potions). Immortal turn-in was verified only to the offer; the kill reward path was not run to completion (UNVERIFIED). |
| Journal (J) | Shows 3 quests, status, rewards, objectives; locked quests labelled. |
| World map (Tab) | Works with zone labels, quest ring, enemy dots (spoils the hunt). The map overflows its frame slightly at the bottom (bits of water outside the border) and its hint text overlaps the hotbar at 1024x600. |
| Shop / alchemy / Foundation Pill | Buy and sell lists render and fit at 1024x600 and 1920x1080. Pill: 150 stones or 3 herbs + 25 stones. Breakthrough verified: L1 -> "foundation too shallow", qi not full message, 60% chance, backlash costs 25% HP and the pill. |
| Armour / charm equip | Equip panel with Weapon/Armor/Charm slots works through real clicks (bag click equips). |
| Technique upgrades | Character panel "Techniques" with + buttons and point counter (7 points at L8). Works; upgrade effect (x1.18/level, -6% cooldown) not combat-tested (UNVERIFIED). |
| Save / load | Quit while dead, reload while dead, save mid-boss + reload: all consistent (boss returns at full HP, player still standing next to it, autoengaged). |
| Death screen | 10% stones; world fully resets on respawn (enemies, herbs, boss HP). 5 consecutive deaths during boss telegraphs with 3 elites alive: no leftover bolts, no leftover telegraph graphics, no elite labels beyond the 2 natural ones; scene children 696 -> 696, tweens 110 -> 110, textures 303 -> 303, heap 47 MB each cycle. |
| Root passives | Verified (3.4). |
| Elite traits | Verified (3.5). |
| Volume slider | Works (gain follows, persisted as `ir-vol`) but see N-2. |
| Console | 8x WebGL `texImage2D` warnings at load (unfixed) and the AudioParam exception (N-1). Nothing else in about 40 minutes of automated play. |

---------------------------------------------------------------------

## 5. New findings (ranked)

No S1 blockers found.

### S2 (none)

### S3
**N-1. Uncaught `AudioParam` exception from the music scheduler (new).**
Evidence: `PAGEERROR Failed to set the 'value' property on 'AudioParam': The provided float value is non-finite` at `pluck <- playStep <- schedule`; 3-20 per run in grove/ruins/boss runs (8 in one grove duel set, 20 in the L12 ruins set). Cause (code read, `src/game/audio.ts` `setZone`): `this.motif` entries are `(h >> 8) % n` where `h` is an unsigned 32-bit integer; `h >> 8` is a SIGNED shift, so entries can be negative, then `scale[deg % scale.length]` is `undefined` -> NaN frequency. Because the exception is thrown before `nextTime`/`step` advance, the scheduler retries the same step every 120 ms and throws again until `Math.random()` happens to skip the motif, so the music stutters/stalls in the affected zones.
Repro: play any zone whose motif contains a negative entry (seen in grove, ruins, bamboo-boss runs); open the console.
Fix: use `>>> 8`, or `Math.abs`, clamp `deg`, and wrap `playStep` in try/catch so one bad note cannot freeze the loop. Add a unit test over every zone's motif.

**N-2. Esc and all hotkeys are dead after touching the volume slider.**
Evidence: paused, clicked the slider: `document.activeElement` = INPUT, two Esc presses left the pause menu open; only clicking "Resume" resumed (`input.ts` ignores keys whose target is INPUT).
Repro: Esc, click the slider, Esc.
Fix: blur the slider on `change`/`pointerup`/`keydown` Escape (or let Escape through even when the target is a range input).

**N-3. No way to recover HP except potions, level-up or dying.**
Evidence: code (`WorldScene.simulate`) has mana regen only; meditation, village and array give no healing; the hunt run needed 12 emergency heals beyond 14 potions. Death gives a full heal and resets everything for 10% of stones (3 stones at 30).
Impact: the loop "fight -> drink -> go back to the merchant" is OK in the ruins but punishing in the grove at L5 for a player without potions (the quest gives 3, the merchant sells at 12), and dying is the cheapest full heal. At 500 stones dying costs 50 (4 potions).
Fix: slow out-of-combat HP regen (e.g. 1%/s after 8 s without damage), or a "rest" bonus on the array, or a village healing pad; make the death tax scale (10% + a floor of 15 stones) and keep boss HP across death for a minute.

**N-4. Boss farm loop by reloading (and free repeat stones).**
Evidence: killed the Fox, saved at the den, reloaded: the Fox is back at 2400 HP and the hero spawns on the saved position next to it; the second kill paid +58 stones (full stone range, XP 30%) and no unique drop. Bosses only return on scene restart (death or reload) - there is no in-session respawn, contrary to the change note.
Impact: the Immortal pays 90-140 stones per ~50 s, better than ruins mobs (~20 stones per kill), at the cost of an F5.
Fix: scale repeat stones like XP (30%), add a respawn timer or a shrine ("Trial of the Fox") with a daily-style cooldown, and do not save within boss range.

**N-5. One answer to half the boss kit.**
Evidence: Section 3.3 table: Shift at the end of the windup took 0 damage from sweep, slam and charge across both bosses (and the bot never failed it over 24 dashes in the Immortal kill). Moves with a delay or an area-denial shape (rain, teleport-behind, ring) are the real tests.
Fix: add one or two moves that Shift cannot pass (a lingering hazard, a two-hit combo, a feint with delay variance), give boss moves randomised windup length +-0.15 s, or make dash cost mana/stamina.

**N-6. Rusher windups are shorter than human reaction.**
Evidence: wolf `attack -> strike@0.52 -> attack@0.73` (0.21 s); snake 0.20, bat 0.15, paper doll 0.25; data in `src/data/enemies.ts` (`strikeWindup`). The 0.55 s post-hit i-frames are the actual defence.
Fix: wolves/snakes 0.35 s, bats 0.3 s, plus an audio/colour cue; keep the short windup only for swarm fodder.

**N-7. Spirit roots are not balanced.**
Evidence: Section 3.4: Flame 6.9 s vs Verdant 8.3 s vs Tide 13.5 s on the same toad; Verdant life-steal heals 14 HP per fight.
Fix: raise Tide's slow/mana advantage (e.g. skill damage +, mana refund on kill) or give it a real active niche; raise Verdant life-steal to 8-10% and add damage reduction; reduce Flame's crit bonus.

**N-8. Elites are trivial and the ruins are over-tuned.**
Evidence: elite wolf (528 HP, marsh tier) killed in 5-10 s for 0-12 damage at L6; ruins L7 jiangshi 175-222 damage per kill, golem killed the bot, L12 golem 21 s.
Fix: elites: +40% damage, a signature telegraphed move (charge, summon), and a stationary bounty spawn; ruins: raise reward or lower HP tier (3.4 -> 3.0) or drop golem HP at the tier; give the ruins their own sink (armour at the merchant, not only drops).

**N-9. Edge arrow collides with HUD.**
Evidence: `04-tut-talk.png` (arrow over the "OBJECTIVE" label), `15-elite-explosive.png` (arrow over the stones counter "13117"), `1024x600-chr.png` (arrow covers the quest name and its distance label "12").
Fix: clamp the arrow to a safe rectangle that excludes the objective banner and top-left HUD, or draw it inside the minimap ring only.

**N-10. Tutorial can hide the quest direction.**
Evidence: after accepting "Wolves of the Bamboo" at tut=0/1 the objective line still read "Attack: click or press Space" (`07-accepted` state); only after dash + talk does the line switch to the quest. A player who never dashes would not get the quest objective or arrow.
Fix: show the quest objective as soon as a quest is active; keep tutorial steps as one-time toasts.

### S4
- N-11. UI layout at 1024x600: the character panel's last paragraph (breakthrough rules) is clipped at the panel bottom; the shop touches the hotbar; the world map overflows its frame slightly and its hint overlaps the hotbar (`1024x600-chr.png`, `21-1024-map.png`).
- N-12. Zone banner ("Peach Spirit Grove", "Fallen Immortal's Court") draws over the boss bar area, the boss itself and the "Defeated" panel; a second toast "You have fallen - press R" duplicates the panel (`t-warden-slam.png`, `11-death.png`).
- N-13. Locked hotbar slots: the skill name overlaps the "Lv N" label (slot 4 "Ten Thousand Swords" over "Lv 7", `18-hotbar-l1.png`).
- N-14. NPC nameplates are unreadable over the white lotus bowls ("Merchant Qiao . Shop", "Alchemist Yun . Alchemy", `01-spawn.png`).
- N-15. Death resets herbs and bosses (free herbs after a death, free boss heal).
- N-16. The 8 WebGL warnings from R1 S4-3 are still there.
- N-17. Elite name labels plus HP bars clutter dense fights.
- N-18. The `setHp(99999)` test hook leaves an out-of-range HP bar ("99999 / 208"); hook-only, no player path found. (Not a bug; noted so nobody files it.)

---------------------------------------------------------------------

## 6. What works well (do not break)
- Combat language: strike/windup tint, slam circle, sweep cone, charge lane, delayed rain circles, volatile blast ring, "Dodge" popup; all readable at 3x zoom.
- Boss pacing: three phases with distinct kits and visible escalation, summons, enrage toasts; 30-50 s of real tension.
- Under-levelled danger: the world clearly says "Lv 5-9" and punishes you if you ignore it.
- Enemy AI: separation, detours around scenery, leash with regen, circling casters. No stuck farm spots found.
- Progression glue: levelling in 2-8 kills per level, kills feed qi, technique points per level and realm, armour and charm slots, elite affixes with loot tables.
- UX: death panel, journal, map, volume slider, integer zoom (3 at 720p, 4 at 1080p), shop and alchemy panels that fit down to 1024x600.
- Robust saves (zombie fixed, boss reload consistent) and clean scene lifecycle (flat counts over repeated deaths).

## 7. Next biggest improvements by player impact
1. Healing and recovery design (N-3): regen/rest/village heal, then re-tune potion price and the death tax.
2. New content: second quest line and a new zone or dungeon (the same 3 quests and 1280 px map are now the weakest link); a repeatable trial (boss rush or tower) with caps (N-4).
3. Boss variety (N-5): at least one anti-dash move per boss and a longer final phase; an arena hazard.
4. Fix the audio exception and focus trap (N-1, N-2) - small, cheap, visible.
5. Ruins/elite tuning pass (N-8) and rebalance roots (N-7) with a proper test matrix per root.
6. UI polish (N-9..N-14): arrow clamp, banners off boss fights, panel scroll at 1024x600, nameplate backplates.
7. A long-run human playtest of reaction windups (N-6) and real-GPU performance (UNVERIFIED).

## 8. UNVERIFIED
Real-GPU performance; audio by ear; foot sliding; Firefox/Safari; humans' dodge success rates; Immortal quest turn-in reward path; technique upgrade damage in combat; Tide's mana value; arena props blocking boss charge/ring (safe-spot check); gameplay beyond L12; long memory soak beyond ~11 minutes (the 5-cycle death test and the 11-minute hunt run showed no growth).

## 9. Evidence index (`qc-artifacts/qa2/`)
`01-spawn`, `04-tut-talk`, `08-journal`, `09-map`, `11-death`, `12-reload-boss`, `13-med-full`, `14-after-bt`, `15-elite-*`, `16-perf-crowd`, `18-hotbar-l1`, `19-arrow-far`, `t-*` (boss telegraphs), `boss-*-end`, `1024x600-*` and `1920x1080-*` (inv/chr/shop/alch/journal/map/pause), `20-1024-boss-hud`, `21-1024-map`, `22-1024-chr-boss`, `23-1024-death`.
