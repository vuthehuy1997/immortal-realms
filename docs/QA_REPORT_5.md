# QA Report 5 - new-player experience and product quality (HEAD 121d428, round 15)

Reviewer: independent QA lead / designer. Nothing under src/, e2e/, tests/ changed; nothing pushed. Scripts and ~45 screenshots are in `/tmp/claude-464201200/-data-yuu-ai-data-yuu-self-immortal-realms/fb77f4ce-5dc1-4887-ba8e-13a6200c5f82/scratchpad/qa5/` (called `qa5/` below). Build: `npm run build` of 121d428, `vite preview` on :4175, Playwright Chromium + SwiftShader, machine load ~20. VERIFIED = observed/measured in that session; INFERRED = from code or reasoning.

## 1. QA4 findings: really fixed in Round 15?
| QA4 item | Status | Evidence |
|---|---|---|
| P2 lifesteal stack | FIXED in code per CHANGELOG (cap 5%, real damage) | not re-measured. INFERRED |
| P1 behaviour boons / reroll | PARTLY: 5 behaviour boons, reroll (R, 75 stones), owned-boon footer exist | picker seen in `qa5/25_boon.png` ("No boons yet", Reroll button). VERIFIED. The L5 offer was Qi Harvest / Steady Hand / Keen Eye = +2 mana, +8% technique damage, +6% crit: low drama |
| P3 finale too short | Sovereign HP 21000 | not fought. INFERRED |
| P5 silent .bak fallback | toast added | not re-tested. INFERRED |
| P6 char panel lacks trait effect / boons | NOT FIXED | `qa5/30_char.png`: still "Style: Iron Discipline", no effect text, no boon list, no perfect-dodge/poise info. VERIFIED |
| P7 pad cannot pick boon | not fixed (TASKS lists it open) | INFERRED |
| P8 perfect dodge/poise untaught | NOT FIXED | no hint text in src/ui; tutorial = walk/attack/dash/talk only (`src/game/WorldScene.ts:1017-1021`). VERIFIED (code) |
| Merchant nameplate under minimap | NOT FIXED (third report running) | "Merchant Qiao - Sho" clipped, `qa5/04_start.png`, `30_char.png`. VERIFIED |
| `__rpg` hooks in prod bundle | NOT FIXED | I drove the production build with them (`WorldScene.ts:1429`). VERIFIED |
| WorldScene size | 1463 -> 1478 lines | wc. VERIFIED |
| Ch2 recoloured art | still PLACEHOLDER (TASKS) | INFERRED |

## 2. Scorecard (1-10)
| Area | Score | One-line reason |
|---|---|---|
| Onboarding | 5 | Good objective bar, arrow, quest dialogue; newer systems never taught, first screen crowded |
| Combat feel | 7 | Hit flash, numbers, glow, slash arcs, boss telegraphs read well in screenshots (audio unjudged) |
| Progression / economy | 6 | Early pacing is quick (L2 within ~40 game-s, new technique per level); skill points pile up with nothing to spend on |
| Content depth | 6.5 | 6 bosses, 20 boons, tower, 2 chapters; heroes differ by passives only |
| Visuals | 7 | Menu, hub, zone banners, boss art, UI frames cohesive; style breaks listed in section 4 |
| UI / UX | 5.5 | Ornate frames good; boon picker, nameplates, toasts, hint text weak; toast-spam bug |
| Audio | 4 (guess) | procedural WebAudio exists (`src/game/audio.ts`); headless run cannot judge it |
| Stability / perf | 8 | 150 s random key/resize spam: 0 errors/warnings, heap 49 -> 54 MB |
| Replayability | 6 | Tower + boons + 6 heroes, little variance, no meta layer |

## 3. First 15 minutes as a new player (real keyboard/mouse; hooks only to skip grind)
1. **Menu** (`01_menu.png`): strong. Moonlit pagoda art, gold title, ornate buttons; Continue correctly greyed.
2. **Creation** (`03_create2.png`): 6 heroes and 3 roots on one screen, trait text now legible. Good. "Spirit Root (press 1-3)" is jargon, with no hint the choice is permanent. Hero titles ("Kiem Tu", "Nu Kiem Tien") and technique alt-names (`src/data/skills.ts:26-29`) are Vietnamese with no gloss: fine flavour, confusing for English players.
3. **First 10 s** (`04_start.png`): objective chain "Walk (WASD) -> Attack (Space) -> Dash (Shift) -> Talk to Elder Lin" works with real keys (verified via objective text). Problems: the hub shows 4 nameplates, a keeper, a golem prop and a 9-line grey control hint at ~9 px (bottom left) before the player moves; no arrow points to Elder Lin until all three tutorial steps are done.
4. **Elder Lin** (`11_dialog.png`): best moment of the game. Portrait, readable text, numbered replies. Catch: E and Space do NOT advance or dismiss the dialogue (still open after 6 E + 1 Space, `12_after_dialog.png`); only 1/2 work, and the world is paused while it is open.
5. **First fight** (wolves; `13_bamboo.png`, `14_fight_55/95.png`): zone banner is gorgeous; objective arrow and tracker clear; pickup toast, damage numbers, level-up and "Technique learned" toasts all fire. Crude key bot killed 3 wolves in ~41 game-s, min HP 46/100: fair. Readability issue: bamboo shoots/trees draw over a wolf's lower body (`14_fight_95.png`) and dense bamboo hides enemies.
6. **Level-ups and skill points**: objective bar says "4 skill points to spend (C)" at L5, "7" at L8, but the C panel exposes only 2 upgradable techniques (`30_char.png`). Points accumulate with little to spend them on. (XP was hook-granted for these, so real pacing may differ.)
7. **Shop** (`26_shop1.png`): clean, icons, rarity colours, sell column. No comparison against equipped gear; nothing tells a 30-stone player what to buy first.
8. **Boon picker** (`25_boon.png`): pops up at L5 over the hub. Plainest UI in the game: flat panel, no icons, no ornate frame, button in a different skin; first offer (+2 mana) is a weak "a path opens" moment; reroll costs 75 with 30 stones.
9. **Trial Rift** (`27_keeper.png`): offered at L1 by Keeper Ming with no level hint or rules; Ming reuses the saber hero sprite (PLACEHOLDER).
10. **First boss** (Fallen Sword Immortal, `35_boss_28.png`): great sprite, strong HP bar. My ungeared L11 monk bot died in 44 game-s (proves nothing about balance), but nowhere is the player told gear and potions matter.
Overall: hand-holding ends after the 3-step tutorial. Flask (F, "3+2" on the bar), poise, perfect dodge, boons, tower, gate and breakthrough have no first-time prompts.

## 4. Visual critique
- Strong: menu art, hub composition, zone title card, UI frames (consistent in HUD, dialogue, shop, bag), boss sprites, particles, sakura petals.
- Scale mixing: large detailed set pieces (pagodas, lotus basins, golden arch) next to small 0.34-scale pixel heroes make the hero read tiny and slightly pasted-on. AI-pack provenance risk remains (TASKS ART-3).
- Nameplates: heavy serif on a dark translucent box with a soft stroke; the least polished text in the game (`04_start.png`).
- Boon picker and world-map labels use a flat system-font style vs the ornate dialogue/shop skin.
- Ch2 tinted reuse, rift without arena, keepers reusing hero sprites (TASKS PLACEHOLDER; INFERRED for Ch2).
- vs a polished browser ARPG: no pickup-to-HUD loot flourish, control hint is a paragraph rather than key icons, no minimap legend.

## 5. Robustness (VERIFIED, `qa5/p6.cjs`)
- 150 s wall of random WASD + Space/1-4/Shift/F/G spam, Esc toggles, 5 resizes (800x500, 1920x1080, 360x640, 1280x720, 1024x600): 0 pageerrors, 0 console errors/warnings, JS heap 49 -> 54 MB (no leak signal), 4086 rAF frames (about 27 fps in SwiftShader at load 20; the game advanced 61 game-s in 150 s wall because dt is clamped; relative numbers only).
- Hidden tab simulated by overriding `document.hidden`: the game kept advancing. Real tab throttling untested; pause-on-blur appears absent (INFERRED).
- **BUG (VERIFIED)**: toast stack is unbounded and not de-duplicated. Spamming F/G at full HP / no mana stacked ~20 "No Clarity Draught." / "HP is already full." toasts across the screen (`40_resize_800.png`, `40_resize_360.png`). Needs a cap (3) and dedupe.
- 360x640 with a desktop pointer: minimap overlaps the objective and HUD bars, objective clipped (`40_resize_360.png`). 800x500 acceptable (objective wraps to 2 lines).
- Pressing Q did not open a quest log (`32_quest.png`); the control hint does not list the real key. Tab = world map works (`33_map.png`, clean).

## 6. Top 10 problems (prioritised)
1. **Newer systems untaught (VERIFIED, play + code)**: flask, boons, perfect dodge, poise, tower, gate, breakthrough have no first-time hints. Highest-value fix.
2. **Toast spam (VERIFIED, `40_resize_800.png`)**: unbounded stack hides the screen.
3. **Skill points pile up, little to spend them on (VERIFIED, L5=4, L8=7; `30_char.png`)**.
4. **Character panel hides trait effect, boons, dodge/poise info (VERIFIED, `30_char.png`)**; third report in a row.
5. **Merchant nameplate clipped under minimap (VERIFIED, `04_start.png`)**, unfixed since QA3; nameplate text also soft.
6. **Boon picker off-brand, weak first offer, unaffordable reroll (VERIFIED, `25_boon.png`)**.
7. **Dialogue ignores E/Space (VERIFIED, `12_after_dialog.png`)**.
8. **Tower offered at L1 with placeholder keeper art and no rules text (VERIFIED, `27_keeper.png`)**.
9. **Props occlude enemies; first-screen clutter; 9 px control hint (VERIFIED, `14_fight_95.png`, `04_start.png`)**.
10. **Prod bundle ships `__rpg` hooks; WorldScene 1478 lines (VERIFIED)**: cheat surface, maintainability.

## 7. Ten improvement proposals (ranked by value/effort)
| # | Idea | Effort | Benchmark (mechanic only) |
|---|---|---|---|
| 1 | Contextual first-time hint cards (one line + icon) on first low-HP (flask), first boss telegraph, first perfect dodge, first boon, first L10; persisted in a `tips` save field | S | Vampire Survivors: staged complexity, teach one thing at a time |
| 2 | Toast manager: cap 3, dedupe, merge repeats ("HP is already full x4") | S | general polish |
| 3 | Boon cards with rarity frame, icon, tags and a synergy line; curated first offer (one behaviour boon guaranteed), pity timer, cheaper first reroll | S-M | Hades boon cards, god tags |
| 4 | Meaningful skill points: per-technique branches (+pierce, +burn, -cooldown) chosen at ranks 3/5 so points never stall | M | Hollow Knight charm choices (few, each real); Hades aspects |
| 5 | Character sheet v2: trait effect, boon list, live buff timers, dodge/poise explainers | S | Diablo-like stat screens |
| 6 | Perfect-dodge feedback: ring flash, distinct audio sting, HUD buff icon with timer | S | Dead Cells (audio as a separate feedback channel); Hades dodge |
| 7 | Trial Rift with checkpoints every 5 floors, optional "heat" modifiers as a stone sink, unlocks per record | M | Hades Pact of Punishment; Dead Cells biome runs |
| 8 | Sect meta-upgrades bought with stones (alchemy yield, shop discount, flask charge, extra reroll) | M | Vampire Survivors meta shop |
| 9 | Dialogue accepts E/Space/Enter for the default reply, shows key legend; optional "skip tutorial" | S | polish |
| 10 | Enemy readability rule: elites get one visible affix icon + warning line; trash silhouette/colour-coded by threat; fade props over enemies | M | Vampire Survivors enemy readability |

Research note: WebSearch returned mostly mirror sites and fan guides. The benchmark points are well-known mechanics (Hades boon/reroll, Vampire Survivors evolutions + staged unlocks + meta shop, Dead Cells audio feedback, Hollow Knight notch limits). Treat them as inspiration, not verified citations. Tale of Immortal returned nothing usable. Useful pages seen: jboger.substack.com (Vampire Survivors), game-wisdom.com (Dead Cells), hollowknight.wiki/w/Charm_Notches.

## 8. What I could not verify
- Audio: headless Chromium has no real output; I only saw that WebAudio exists. Mix, volume, fatigue, stings unjudged.
- Human feel and balance: fights were a crude key bot with partly hook-granted XP; the Warden death at L11 without gear is not evidence. Perfect dodge, poise, flask in real fights not re-measured; tower, chapter 2, other bosses, gate not played this round.
- Touch and gamepad not re-run; pad boon picking remains INFERRED broken.
- Real-GPU fps, real tab throttling, Firefox/WebKit, screen readers, reduced motion (no setting found by grep).
- QA4 fixes marked INFERRED (lifesteal cap, Sovereign HP, backup toast) were checked via CHANGELOG/code only.
