# QA Report 6 - hero kits, mid-game slice, UI (HEAD 8d43acc, round 20)

Independent playtester. Nothing under src/, e2e/, tests/ or tracked files changed; nothing committed. Scripts and ~100 screenshots: `/tmp/claude-464201200/-data-yuu-ai-data-yuu-self-immortal-realms/fc5fc134-2233-45e3-b885-00429dd7c685/scratchpad/playtest/` (`pt/` below). Build of 8d43acc, `vite preview` :4199, Playwright Chromium + SwiftShader, machine load average 35-60 (so everything was slow; fps not judged). VERIFIED = observed/measured this session; INFERRED = from code/reasoning. Limits: audio cannot be judged headless; my boss "fights" used a crude key bot, not human play; I did not play the quest chain by hand.

## 1. Scorecard (1-10)
| Area | Score | Reason |
|---|---|---|
| Onboarding | 5.5 | Strong menu/creation, objective bar, E/Space/Enter now advances dialogue. Systems still untaught; control hint is a 9 px paragraph |
| Combat feel | 6.5 | Telegraphs, damage numbers, hit flash read well; technique VFX are one generic yellow flash for every hero; number/nameplate overlap |
| Hero kits | 6 | Numbers and mechanics work (fan, pull, heal, stun, lifesteal) but identity is mostly numeric, VFX/icons shared, twinblade slot 1 weak |
| Boss design | 6.5 | Excellent telegraph shapes and HP bar; ch3-5 bosses are recoloured ch1 sprites and ch5 HP is 150k-330k |
| Dungeons | 5.5 | Cave rock reads dark/organic, boss arenas good; wide empty floors, low contrast bosses (Obsidian Colossus), recycled art |
| Progression | 6 | Level gates with clear message, Dao Insight now spends points; no human pacing evidence |
| Visuals | 7 | Hub/boss/menu art rich; hubs 3-5 are the same template recoloured |
| UI/UX | 6 | Panels cohesive; clipping at 1024x600, hotbar overlaps panels, nameplates cover combat |
| Audio | not judged | Headless Chromium has no audible output. No score |
| Stability | 8.5 | 0 console errors/warnings/pageerrors over every run; save/load round trip exact |

## 2. QA5 items: what is still true
- FIXED (VERIFIED): dialogue now accepts E/Space/Enter (pressing Space then E at Elder Lin set quest `pests` to active, `pt/sv_dialog.png`). Character panel now shows trait effect text (`pt/ui_a_char.png`). Skill points now have a sink (Dao Insight rows with +, `pt/ui_c_char.png`). Dungeon gate message is explicit ("Bone-Root Cavern is too dangerous for you yet: reach level 38", `pt/tour_abyss-bonecavern_in.png`).
- STILL TRUE (VERIFIED): `__rpg` hooks ship in the prod bundle (I used them on `vite preview`). Control hint is still a dense paragraph. Nameplates (heavy serif box) still sit over the minimap edge and over fights (`pt/ui_a_char.png`, `pt/k2_twinblade_0a.png`). Boon picker, perfect dodge, poise untaught (code check of tips: one 'dodge' tip fires only once a boss is engaged, `WorldScene.ts:994`).
- NOT RE-CHECKED: toast spam cap, boon picker.

## 3. First 10 minutes (swordsman, saber, fanscholar, monk, twinblade started via real UI; moves/attacks via real keys)
1. Menu and creation (`pt/menu_swordsman.png`, `pt/create_swordsman.png`): polished. All 6 heroes with trait text, 3 roots, slots. "Spirit Root (press 1-3)" has no permanent-choice warning. VERIFIED.
2. First frame (`pt/s1_start.png`): sect hub, zone card "Azure Cloud Sect", objective "Walk around with WASD", 3 NPC nameplates. Rich. Clutter: Alchemist Yun nameplate crowds the HP/mana bars at top-left. VERIFIED. The HUD also showed "Mistveil Marsh Lv 3-7" in page text for a moment (zone label from the previous map tile), cosmetic. INFERRED from innerText dump only.
3. Tutorial: Walk -> attack -> dash -> talk, in order; Space/Shift register on the next frame. VERIFIED. At L1 the Trial Rift keeper is still offered (no level hint). INFERRED unchanged from QA5.
4. First quest: Elder Lin dialogue is clear with numbered replies; Space accepted option 1. VERIFIED.
5. Level-ups: L1 -> L7 comes with a technique unlock per level (slots show "Lv 2/4/7" locks). VERIFIED (hotbar). Hand-feel of pacing NOT judged (XP hook-granted).

## 4. Hero techniques (VERIFIED, `pt/kit2.mjs`; L7, 6 golems at 49-97 px, `spawnUnaware`)
Per-hero numbers are damage to the nearest golem unless noted; "mana" is cost; screenshots `pt/k2_<hero>_<slot>a.png`.
| Technique | Observed | Verdict |
|---|---|---|
| Swordsman slot 1 Flying Sword | 195 to first, 71 to second (pierce 2); mana 3 | OK baseline |
| Swordsman slots 2-4 | wave hit all 6 (87-152); Lotus 120-208 + knockback (49->55, 64->71); Ten Thousand Swords 235-285 on all 6 | Rain is the best AoE at 37 mana; good |
| Heroine Ember Fan | 3 bolts, nearest took 115 (all bolts), flanks 28 each; mana 7 | Works, but at close range the fan collapses to single-target; total dmg (~170) below swordsman's one bolt+pierce (266). Weak. Spread 0.5 rad too narrow for 60 px groups |
| Heroine Phoenix Burst | up to 395 on center, stun, ~150 others; Scarlet Storm 278-365 | Strong; heroine best AoE |
| Fan Scholar Ink Needle | 184 first, 68 second, 0 mana net; (cost 6, regen 1.5) | Fine, mana-free spam is a good identity |
| Fan Scholar Gale Fan | two bolts, 238 on near enemy, 71-130 on others | Works; visibly a double wave |
| Fan Scholar Lotus Whirlpool (PULL) | enemies 49->27, 64->37, 64->38, 76->13 px; heal +10 HP (6% of 172); stunned | VERIFIED works. Pull range 82 misses far enemies (93/97 px untouched). `pt/k2_fanscholar_2a.png` shows "+10" heal number |
| Fan Scholar Starfall Ink | 264-421 on all 6, 30 mana | Strongest per mana across heroes |
| Monk Staff Shockwave | 234 first, 87 second | OK |
| Monk Diamond Palm | stun 1.6 s, 163-187 each, HP 60->80 (+10% of 198) | Works; heal reads in HP bar |
| Saber lifesteal/Blade Qi Cleave | enemies hit; HP 60->75 after wave (2% lifesteal x many hits) | Lifesteal stacks hard with multi-hit AoE; INFERRED balance risk at high level |
| Twinblade Twin Daggers | 85 first, 47 second (2 x 1.0 mult), mana 2 | Weakest slot-1 of all heroes (<half of swordsman). Fast cd 1.2 does not offset. Low drama |
| Twinblade Cross Crescent/Storm of Blades | 177 + 44 flanks; Storm 233-338 on all | fine |
Findings:
- All techniques do something and numbers match their data (VERIFIED). None is inert.
- Visual identity: every hero reuses the same yellow/white flash and lotus ring; the Fan Scholar's "ink" and Heroine's "ember" are not distinct from the swordsman's (`pt/k2_fanscholar_2a.png`, `pt/k2_heroine_0a.png`, `pt/k2_monk_3a.png`, `pt/k2_saber_3a.png`). The kits differ in numbers, not look. VERIFIED visually; cause INFERRED: `fx` is not overridden in `KITS` (`src/data/skills.ts`).
- Hotbar icons are shared too (same icon for Ember Fan and Flying Sword; `pt/k2_heroine_0a.png`). VERIFIED.
- Damage numbers overlap each other and NPC nameplates, so group hits read as "An23!4" noise (`pt/k2_twinblade_0a.png`, `pt/k2_fanscholar_2a.png`). VERIFIED.
- Pull/stun are not telegraphed on the enemy (no stun icon over stunned golems); only the "!" aggro mark. VERIFIED.

## 5. Mid-game slice
Chapter 1 boss (Nine-Tailed Fox Spirit, 3200 HP, L5 swordsman and twinblade bots, real keys + dash/skill-1 logic; `pt/boss1.mjs`, results in `pt/b_sw.txt`, `pt/b_tw.txt`):
- Both bots died (swordsman at 195 game-s, twinblade 202 game-s) with the boss still at 3200 (boss resets). A crude bot at L5 with no gear is not evidence of unfairness; the boss moveset cycles sweep-windup -> charge-windup -> charge every ~5.3 s, which is learnable. The bot's damage was ~370 in 32 s (~12 dps), mostly because the boss hovers at 56-62 px and my bot kept closing/dashing. VERIFIED data, INFERRED conclusion: needs a human playtest at the intended level.
- Telegraph readability: excellent. The charge lane is a red rectangle, slams are red circles (`pt/boss_swordsman_tele2.png`, `pt/tour_cloudhollow_boss.png`). One flaw: the lane/circle extends under the hotbar and the boss body is mostly under it when the player is at screen centre (`pt/boss_swordsman_tele2.png`). VERIFIED.
- Chapter 3-5 hubs (`pt/tour_ch3_hub.png`, `pt/tour_ch5_hub.png`): identical composition to the sect hub (two pagodas, two lotus basins, arch), recoloured. Reads as a copy. VERIFIED.
- Dungeons entered via `enterDungeon` (ember-burrow, ember-mine, cloudhollow; abyss and jademine tours failed because my own test left the player dead, so ch4 jademine/ch5 interiors were not inspected - my fault, not a game bug):
  - Glass-Worm Burrow (`pt/tour_ember-burrow_in.png`): organic cave, clear but very wide and sparse open floor, few props; a spirit array near the entrance. Enemies visible only at the right edge. "Narrow tunnel pinning big bodies" not observed here (INFERRED not exercised; no big body in tunnels met).
  - Glass-Worm Queen (`pt/tour_ember-burrow_boss.png`): a recoloured green snake sprite on top of a floor; the arena is the same stone spirit-array disc plus the same rock clusters used in every cave.
  - Cloudhollow (`pt/tour_cloudhollow_in.png`, `pt/tour_cloudhollow_boss.png`): floor is a flat white-lavender fog texture; rocks and ferns stand on it. It reads like void, so I cannot tell where walkable floor ends (the minimap shows the shape). Boss "Cloudwyrm of the Hollow" is the Jiao dragon art with a cyan whirl FX; HP 30000. VERIFIED, recycled art acknowledged in `src/data/content/ch5.ts:16` PLACEHOLDER comment (ch5 uses `boss.jiaolong`, `boss.ninetail`, `boss.fallenimmortal` with tints; ch3-4 INFERRED same).
  - Obsidian Colossus (`pt/tour_ember-mine_boss.png`): a near-black golem on a near-black floor, low contrast; the red slam circle is the only thing that reads. VERIFIED.
- Boss HP scale: ch1 3200-7400, ch3 17000-22000, ch4 30000, ch5 150000-330000 (`src/data/content/ch5.ts`). A 15x jump suggests untuned scaling; no player dps measured at that level. INFERRED.
- Level gates are clear and polite (toast text above). Dying inside a boss room via teleport: respawn outside, as designed. VERIFIED.

## 6. UI/UX (1280x720, 1024x600, 390x844)
- 1280x720 (`pt/ui_a_char.png`, `pt/ui_a_quest.png`): character panel is tall and cut off by the hotbar; Techniques and Dao Insight sections are only reachable by scrolling, which is not signalled. Quest journal's last rows go under the hotbar. VERIFIED.
- 1024x600 (`pt/ui_b_char.png`, `pt/ui_b_quest.png`): character panel clipped after "Ink Needle" row (the + button is half under the hotbar); quest panel overlaps the NPC nameplates, still readable. VERIFIED. This is where players with skill points get stuck.
- 390x844 portrait (`pt/ui_c_char.png`): panel fits fully and is readable; hotbar tiny (about 28 px icons) and the minimap/bars crowd the top, but no overlaps with the panel. Touch controls not tested.
- Quest journal lists all chapter 1 quests including locked ones with reward names (spoilers, no filter). Not a bug; a nicety.
- Pause menu offers Resume / Save Game / Save & Quit (`pt/sv_pause.png`).

## 7. Bugs
| # | Sev | Repro | Evidence |
|---|---|---|---|
| B1 | S3 | Character panel (C) at 1024x600 or 1280x720: Techniques/Dao Insight rows are covered by the hotbar and the panel has no visible scroll cue | `pt/ui_b_char.png`, `pt/ui_a_char.png` VERIFIED |
| B2 | S3 | Cast any AoE on a group while an NPC nameplate is near: damage numbers overlap each other and the nameplate; hard to read | `pt/k2_twinblade_0a.png` VERIFIED |
| B3 | S3 | Twinblade slot 1 "Twin Daggers" deals ~85+47 at L7 vs swordsman 195+71; kit feels underpowered | `pt/kit2.mjs` log VERIFIED |
| B4 | S3 | Heroine Ember Fan at <60 px range hits one target with 3 bolts (115) and flanks get 28: fan does not fan | log VERIFIED |
| B5 | S4 | Hero kits share identical VFX/icons; Fan Scholar "ink" and Heroine "ember" look like the swordsman's | `pt/k2_*` VERIFIED |
| B6 | S4 | Objective bar stays on "Attack: click or press Space" in a new chapter hub after hook travel to ch5 (tutorial flags carried while skipping) | `pt/tour_ch5_hub.png` VERIFIED but hook-induced; low value |
| B7 | S4 | Prod bundle ships `__rpg` debug hooks | used all session, VERIFIED |
| B8 | S4 | Cloudhollow floor texture reads as void; walkable extent unclear | `pt/tour_cloudhollow_in.png` VERIFIED |
Not found: console errors/warnings (0 across kit, boss, tour, UI at 3 sizes, save tests), softlocks, stuck states. Save/load: slot save from pause menu, reload page, Continue restores hero, level 7, 777 stones, chapter 2 zone, position (368,1772), HP, bag count exactly (`pt/rt.txt`, `pt/rt_loaded.png`). Hub safe zone: HP stable for 8 game-s (136 -> 136). VERIFIED.

## 8. Visual / feel gate (docs/QC_ACCEPTANCE.md)
- Rich xianxia: yes in menu, hubs, zone cards, boss art, telegraphs, ornate UI frames. Animated: heroes/bosses animate, boss FX (cyan whirl) good. VERIFIED by screenshots.
- Juicy: hit flash, big damage numbers, heal "+10", stun ring present. Missing: per-hero technique identity, stun/pull indicators, a pickup-to-HUD flourish.
- The owner's "plain but passing" risk now sits in chapters 3-5: same hub layout, same cave dressing, recoloured bosses. A new player reaching ch3 would feel the repetition.
- Audio: NOT JUDGED (headless).

## 9. Prioritised backlog (top 10)
1. **Distinct technique VFX/icons per hero** (why: kits differ only by numbers, B5; size M). Files: `src/data/skills.ts` (add `fx` to KITS), `src/data/manifest.generated.json`, `src/ui/hud.ts` (`SLOT_ICONS`), `src/game/WorldScene.ts` (spell spawn).
2. **Fix 1024x600/1280x720 panel clipping** (B1; size S). Files: `src/ui/panels.ts`, `src/ui/ui.css` (max-height above hotbar, visible scroll bar).
3. **Damage-number and nameplate layering** (B2; size S): stack/merge numbers per enemy, push NPC plates under combat text. Files: `src/game/WorldScene.ts` or damage-text module, `src/ui/ui.css`.
4. **Rebalance weak kits** (B3, B4; size S): twinblade Twin Daggers mult/cd, widen Ember Fan spread or add convergence; consider pull range for Whirlpool. Files: `src/data/skills.ts`, `tests/` kit assertions.
5. **Human-playtest + tune ch1 boss at L5-8, then ch3-5 HP curve** (boss HP 3.2k -> 330k; size M). Files: `src/data/boss.ts`, `src/data/content/ch3-5.ts`, `docs/COMBAT_DESIGN.md`.
6. **Unique ch3-5 hubs** (size M): vary layout/props/architecture per chapter. Files: `src/data/maps.ts`, `src/data/content/ch3.ts-ch5.ts`, `src/data/zones.ts`.
7. **Replace recycled boss art / raise contrast of dark bosses** (Obsidian Colossus; size L for art, S for outline/rim shader). Files: `src/data/content/ch3-5.ts` (`sprite`/`tint`), `design/images/`, `docs/ASSET_LICENSE_AUDIT.md`.
8. **Stun/pull status indicators on enemies** (size S). Files: `src/game/WorldScene.ts`, enemy render code.
9. **Dungeon interior pass: floor distinctness (Cloudhollow), density, boss arena variety** (size M). Files: `src/data/dungeons.ts`, `src/data/maps.ts`, `src/core/world.ts`.
10. **Strip or gate `__rpg` in prod, split WorldScene** (size S/M). Files: `src/game/WorldScene.ts` (hook install), `vite.config.ts`.

## 10. Screenshot index
Menu/create `pt/menu_*.png`, `pt/create_*.png`; first frame `pt/s1_start.png`; kits `pt/k2_<hero>_<slot>{a,b}.png` and `pt/kit_*`; boss `pt/boss_swordsman_tele{1,2,3}.png`, `pt/boss_swordsman_arrive.png`; tour `pt/tour_*.png`; UI `pt/ui_{a,b,c}_*.png`; save `pt/rt_*.png`, `pt/sv_*.png`.

## 11. Not verified
Audio; real-GPU fps; human boss fights; quest chain beyond accept; ch3-5 quests; jademine and abyss interiors (test artefact); touch/gamepad; Firefox/WebKit; toast spam; boon picker.

## 12. Resolution (Round 21, developer)
Commits: 1dc864e (panels, floats, kits, hooks), 043e520 (bosses, status, floor, hubs, hint, docs). Verification: lint clean, tsc clean, 932 unit tests, design:check ok, license:check, prod build; e2e run of round21, herokits, tower, chapters, dungeons, boss, responsive, worldtour: 50 passed, then responsive (2 caused by my wide panel opening with a dialogue) and the new stun test were fixed and re-run: 11 of 11 passed. Full e2e suite not re-run.
| Finding | Status | Notes |
|---|---|---|
| B1 panel clipping | fixed | 2-column character panel on wide screens (single column while a dialogue is open), visible scrollbars, journal above the hotbar; e2e round21 at 1280x720 and 1024x600 |
| B2 numbers/nameplates | fixed | `placeFloat` stacking (unit tested) + plates fade to 15% near awake hostiles. Fade verified by logic, not screenshot |
| B3 Twin Daggers | fixed | 1.6 per dagger, cd 1.3; unit assertion vs swordsman dps |
| B4 Ember Fan | fixed | spread 0.9, separate bolt origins; e2e hits all 3 close golems |
| B5 shared VFX/icons | partly | per-hero strip/tint/icon from existing licensed strips; no genuinely new VFX art |
| B6 stale objective | not done | hook-induced, S4 |
| B7 hooks in prod | fixed | compiled out unless VITE_E2E=1; grep of dist/assets: 0 matches |
| B8 Cloudhollow floor | fixed | flagstone seams, screenshot reviewed |
| Backlog 5 boss HP curve | partly | ch5 HP trimmed ~20%; curve test added; the ch1 boss at L5-8 still needs a human playtest |
| Backlog 6 hubs 3-5 | partly | new prop compositions (reviewed in screenshots); sprites are still the shared pavilion/pagoda set |
| Backlog 7 boss art/contrast | partly | aura + lighter tint for Obsidian Colossus; recycled sprites remain |
| Backlog 8 stun/pull markers | fixed | orbiting stars + `stunned` in test state |
| Backlog 9 dungeon pass | partly | Cloudhollow floor only; density/arena variety remain |
| Backlog 10 hooks / WorldScene split | partly | hooks done; WorldScene not split |
| Onboarding hint paragraph | fixed | keycap list; boon picker / perfect dodge teaching still open |
