# QA Report 7 - Round 22 (boss identity + dungeon mechanics), HEAD 93ba040

Method: e2e-hook build (VITE_E2E=1, separate outDir) served with `vite preview`, Playwright Chromium (SwiftShader), real keyboard/mouse input (WASD, Shift, click, 1-4, F). Hooks were used only to reach arenas/dungeons, set level/HP, read state and (in "god" runs) refill HP. Machine load average was ~250, so frame rate and wall-clock feel are NOT judged. Scratch artefacts (scripts, logs, shots) are in `/tmp/claude-464201200/-data-yuu-ai-data-yuu-self-immortal-realms/fc5fc134-2233-45e3-b885-00429dd7c685/scratchpad/playtest2/` (shots in `shots/`). No tracked file was modified. Zero console/page errors in every session (boss fights, 19 dungeons, regression, three viewport sizes).

Labels: VERIFIED = observed in a run; INFERRED = from code reading or weak evidence. Severity S1 (blocker) to S4 (polish).

## Scorecard (1-10)
| Area | Score | Note |
|---|---|---|
| Boss identity | 7 | 8 mains look clearly different (orange Warden, giant ghost Matron, blue eagle, red swordsman, ward bubble); 9 others still recolours |
| Boss mechanics fairness | 6 | telegraphs mostly good; wind-blade wheel detached from boss, faint warn lines; chapter 4-5 boss damage brutal (pre-existing) |
| Dungeon variety | 7 | five mechanics, distinct palettes, gate puzzles work; floors still similar brick |
| Dungeon fairness / bugs | 7 | routes and gates solid; save/reload seal bug (F1) |
| Visuals | 6 | strong boss silhouettes; fx whiteouts, tips over the hero, black void with props at arena edges |
| UI/UX | 6 | tips do not overlap each other but cover the hero; 390x844 HUD collision |
| Stability | 8 | no errors, resets verified |
| Not judgeable headless | - | audio, real-GPU fps, human feel of dodge timing |

## Findings

**F1 (S2, VERIFIED) Saving after opening a seal gate then reloading re-seals the gate and can strand the hero.** Repro: enter s1-stormroost (hook), step on all 3 plates (gate opens), teleport/walk 90 px past the gate (610,440), save (`scene.save(true)`, same as autosave), reload, Continue. Result: dungeon still `s1-stormroost`, hero at (610,440), `gateOpen=false`, `plates=[false,false,false]`, objective "step on the 3 remaining plates", walking west stops at x=534 against the gate (blocked tile). The plates and the exit are on the other side, so only death or beating the boss recovers. Collapsed tiles and braziers are also not saved. Saving while standing inside the gate tile relocated the hero to the spawn (fine). Fix: persist gate-open/plates or restore the hero to the spawn when the saved position is beyond an unsolved gate. Files: `src/game/WorldScene.ts` (~l.177-214), `src/game/dungeonView.ts`, `src/core/save.ts`. Shot: `shots/dt-reload-beyond-gate.png`.

**F2 (S3, VERIFIED) Wind-blade / blade-wheel origin is frozen where the boss stood when the wheel started.** `tickMech` copies `c.self` into `beam.origin`; the boss keeps moving (Dao Demon even teleports). Crane Lord: the hub sits ~90 world px below the flying boss. Dao Demon: only a bare white dot with a beam, no boss near it. Readable as a hazard but looks like a bug. Files `src/core/bossMech.ts` (beam spawn), `src/game/bossFight.ts` (beam draw). Shots: `cranelord-mech-beam.png`, `abyss-daodemon-mech-beam.png`.

**F3 (S3, VERIFIED) Warning lines for the wind blades are 1.5 px, alpha 0.35-0.75 dark red on a dark floor**; in `cranelord-mech-beamwarn.png` they are barely visible and the hero is hidden in a white vortex. The active blades are very readable. Make the warning wedge/line wider and brighter.

**F4 (S3, VERIFIED) Mirage Empress "mirror images" moment is a screen-filling white-pink blob** (mirror_shatter fx, scale 0.45 on a huge boss) over the centre of the screen; decoys and the real boss are not distinguishable in that frame (`mirageempress-mech-decoys.png`). The real boss also teleports ~500 px away from the hero to its ring slot. The "decoys have no shadow" cue could not be judged in a still frame. INFERRED: shadow cue is too subtle; add a distinct marker.

**F5 (S3, VERIFIED) Toasts and tips stack at screen centre (y 238-330 at 720p) directly over the hero** for 7 s (tips) and several at once at boss phase changes (3 toasts in `abyss-daodemon-mech-ward.png`). They do not overlap each other (45 px spacing, tip text unique per id, shown once, `hints` persisted: ["points","dg-spike","dg-plates"]) but hide the fight. Tips need `?tips=1` under automation. Move to the top or the side. `src/ui/hud.ts`.

**F6 (S3, VERIFIED) Black void with props at arena edges.** Sovereign (ch2) and Dao Demon (ch5) arenas show rocks, willows and mushrooms floating on solid black below a hard ground edge (`sovereign-00-approach.png`, `abyss-daodemon-00-approach.png`). I teleported there via `home+(-150,+70)` (which in the sovereign case left the hero unable to walk: stuck at distance 194), so the area may be outside the walkable map, but the camera shows it. Clamp the camera or fill/skip props beyond the map border.

**F7 (S2, INFERRED) Chapters 4-5 bosses are extremely lethal for a geared level-top hero; this is not specific to R22.** A bot with real input (dash on windups, flask, technique casts, hazard avoidance from the real mechanic state) died 3 of 3 times against every boss tried at the chapter-top level with the chapter shop gear: Sovereign (L19, 436 HP), Furnace Warden (L28, 584), Sand Wyrm (L28, reached 17% before dying, the nearest to a win), Mirage Empress, Crane Lord (L37, 752 HP, dead in 15 s), Magistrate, Matron (L48, 994 HP), Dao Demon (330 attack, 260000 HP), and the mechanic-free baseline abyss-tyrant (3 of 3 deaths in under 40 s). Single hits take 30-45 percent of max HP. The bot is not a skilled human, so this is INFERRED, but the formula test in `tests/bossMech.test.ts` assumes perfect uptime and never checks time-to-kill against survivable hits. Needs a human playtest. No evidence either way that a given boss is unwinnable.

**F8 (S4, VERIFIED) NPC "Hunter Tarq" label stands inside the Sand Wyrm arena** and overlaps damage numbers (`sandwyrm-mech-hidden.png`).

**F9 (S3, VERIFIED/INFERRED) Ambush waves are timer-driven** (next wave after gap even if the previous is alive). In moonpalace my melee bot faced 28 enemies after 3 waves and was at 285/688 HP at wave 1; reward cleared state was not reached within 90 s (state stayed `running`, wave 3). The e2e covers the done path; fairness for a normal-level hero with a swarm is INFERRED to be harsh.

**F10 (S4, VERIFIED) 390x844 layout:** boss name/bar collides with the player name, HP and zone line, and with the minimap (`r-swordsman-390-fight.png`). 1024x600 character panel fine (`r-swordsman-1024-char.png`); no horizontal scroll at 1280x720, 1024x600, 390x844.

**F11 (S4, INFERRED) Pit regrow:** a fall puts the hero back on the last safe tile; that tile is 'solid' and can crack again (6 percent fall damage every 1.2 s) if the hero stays. Walking straight through a collapse patch (~2 s) never triggers a fall (VERIFIED: crossed ember-mine patch, 0 damage, cache +40 stones), so the collapse only punishes lingering.

## Verified OK (things I tried to break)
- All 19 dungeons: walking with real keys from spawn to every plate/brazier, gate opened every time (braziers needed one continuous run, worked), then to the boss without getting stuck; BFS on the post-gate map finds a route for a 2.6-tile-radius body in all of them (closed-gate route is correctly absent). No stuck, no unreachable switch.
- Traps: standing still on a fire trap costs exactly 55 HP (8 percent of 688) once per 3.6 s cycle; poison mist 21 HP (3 percent) per 0.6 s while inside the active cloud (11 hits, 252 HP in 16 s of standing); spikes warn visibly (red ring).
- Death in a dungeon: respawn outside, re-enter gives a fresh state (plates false). Exit mid-puzzle then re-enter: plates reset (by design).
- Hero death in a boss fight: boss HP back to full, wards/pools/pylons/decoys cleared (state peeked after respawn). Burrow: boss hidden, marker follows then locks (red ring clearly readable, `sandwyrm-mech-hidden.png`).
- Ward: raised at phase 2 (21000 boss, 1470 ward), broken by real attacks in ~8 s (stagger); expiry toast and heal worked. Pylons: 3 raised, destroyed one by one by the bot (about 25 s), boss damage thereafter normal. Leech wisps appear (2-3 live) and the fight proceeds. Illusions: 3 decoys at phase 2, repeat.
- Boss identity: Furnace Warden (orange armoured giant with lava pools, warn ring then fill), Matron (huge purple ghost), Crane Lord (dark eagle), Dao Demon (red swordsman, wide cone telegraph) are visually distinct side by side; Sovereign is a horizontal great sword in a blue shell (very large, 450 px, the ward bubble hides it).
- Regression ch1 (swordsman, fanscholar, 1280x720): objectives advance walk -> attack -> dash -> "Talk to Elder Lin"; 5-6 kills in 70 s of real input; no errors. FPS values (12-21) are meaningless at load 250; display-object count ~1600 in ch1.

## Not tested / limits
Full boss kills with real input were not achieved (F7), so late-phase mechanic play (Dao Demon ward + wheel together, burrow in phase 3 with minions) was only seen in the first seconds. God-mode runs for Magistrate/Mirage/Matron/Dao Demon were still in progress when this report was written. Audio, touch, gamepad, real-GPU performance: not judged.

## Prioritised backlog for the developer
1. Persist seal state or rescue the hero on reload beyond an unsolved gate (F1). S, small-medium. `WorldScene.ts`, `dungeonView.ts`, `core/save.ts`.
2. Human playtest plus a time-to-kill vs survivable-hits test for ch4-5 bosses (F7); likely retune boss atk/HP or hero HP. M. `tests/bossMech.test.ts`, `data/content/ch4.ts`, `ch5.ts`.
3. Attach the blade wheel to the boss (follow its position or freeze the boss while it spins) and draw a hub (F2). S. `bossMech.ts`, `bossFight.ts`.
4. Move toasts/tips off the hero and cap simultaneous toasts at phase changes (F5, F10). S. `ui/hud.ts`, CSS.
5. Make blade/pool warnings brighter and wider (F3). S. `bossFight.ts`.
6. Tone down the mirror_shatter fx and add a visible "real one" marker for Mirage (F4). S. `bossFight.ts`.
7. Camera clamp / no props beyond the map border at Sovereign and Dao Demon arenas (F6). S-M. `WorldScene.ts`, map gen.
8. Ambush: do not start wave N+1 until wave N is mostly dead, or cap live ambush foes (F9). S. `core/dungeonFeatures.ts`.
9. Mobile HUD layout for the boss bar (F10). S. `ui/hud.ts`, CSS.
10. Replace the 9 placeholder recolour bosses and add mechanics to the remaining cave bosses (TASKS R22 next). L.

## Resolution (Round 23, developer)
Commits: d9bae27 + fb69745 (F1), 82bf57a + 4ec0a5d (F2-F6, F8-F11), a178a01 (F7), plus the docs/snapshot commit that follows. Verification is in the final section of docs/CHANGELOG.md "Round 23" and PROGRESS.md.
| Finding | Status | Notes |
|---|---|---|
| F1 seal lost on reload | fixed | `seal` persisted in the save (validated, optional), `isStranded` guard opens the gate for stranded/old saves; unit tests over all gated dungeons + e2e reload beyond the gate (the first e2e draft used a 1e6 HP test pool that save validation correctly rejects) |
| F2 wheel origin | fixed | origin follows the boss every tick (unit test); hub + tether drawn |
| F3 warning lines | fixed | wide pulsing band + bright edges; screenshot reviewed (Crane Lord) |
| F4 Mirage blob / readability | fixed | blob removed, gold ring + chevron under the real boss, cyan rings under images; decoy motion/flicker not judged by hand |
| F5 toasts over the hero | fixed | top 14%, max 3, tips queued and 4.5 s; touch layout not hand-tested |
| F6 props on void | fixed | `standsOnLand` filter + test over 5 chapters and 19 dungeons. The reported black void was not reproduced in 10 screenshots of both arenas (probably the off-map teleport); the filter removed 100+ misplaced props (willows/orchids on water, petals on lava or void, rocks in vault voids) |
| F7 boss lethality | analysed, not retuned | QA hero was realm 0 at Lv 50 (x1.0 stats vs x3.2 intended): hits there are 2-3x larger. Intended hero: 5-20% per hit. Tests + a realm-lag tip. Needs a human playtest, especially for players who skip breakthroughs |
| F8 NPC in Sand Wyrm arena | fixed | Hunter Tarq moved to (76,111), 24 tiles away; test |
| F9 ambush stacking | fixed | live cap per wave, unit tests |
| F10 390x844 boss bar | fixed | screenshot reviewed; the audio button still overlaps the stone counter (pre-existing, S4) |
| F11 pit fairness | partly | rescue spot outside the patch; crossing is still free, lingering still costs (crack is telegraphed 1 s) |
| Backlog 10 recolour bosses | not done | out of scope for R23 |
| Matron / Dao Demon visuals | reviewed | Matron is a large soft purple sprite (readable, not pretty); Dao Demon wheel, ward and wisps fine |
