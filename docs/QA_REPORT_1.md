# QA Report 1 - Independent expert review of "Immortal Realms"

Reviewer role: senior game QA lead + game designer, first contact with the build.
Build tested: `main` as built locally (`npx vite build`, bundle `index-nT2ioZ27.js`, identical hash to the checked-in `dist/`), served by `vite preview` on 127.0.0.1:4180. Chromium headless + SwiftShader software GL (~35 fps, so all wall-clock numbers are slower than a real GPU; game-time numbers below are measured with `window.__rpg.state().now`).
Method: real keyboard/mouse input for feel/UI tests; `window.__rpg` hooks only to set up situations (level, teleport, spawn). Source was read to locate causes. Evidence screenshots are in `qc-artifacts/qa1/` (gitignored). Anything I could not verify is marked UNVERIFIED.

Test scripts live in the session scratchpad, not in the repo (nothing under src/, e2e/, tests/, public/ was touched).

---------------------------------------------------------------------

## 1. Scorecard (1-10)

| Area | Score | One-line justification |
|---|---|---|
| Onboarding | 4 | No objective pointer, Elder Lin is off-screen at spawn, no nameplates, no tutorial beyond a static key legend; quest tracker only appears after accepting. |
| Combat feel (moment to moment) | 6 | Combo has weight (hit-stop, lunge, knockback, shake, damage numbers); skills are readable. But there is zero pressure, so feel never gets tested. |
| Enemy AI | 3 | Rushers walk straight in and get stuck on any wide prop; casters are stationary turrets; enemies stack on one pixel; melee has no telegraph. |
| Boss design | 3 | Both bosses share one script (slam/summon/ring) and die in 5-14 s to a level-1 to level-5 character taking 29-90 damage total. |
| Progression / economy | 3 | A level-1 character can clear the whole map; all 3 cultivation realms are reachable in ~25 s of meditation at no risk; shop and stones have no sink after ~15 minutes. |
| Depth / content | 3 | 3 kill quests, 2 bosses, 16 mob types in one 80x80-tile (1280 px) map, 1 equipment slot, 3 realms. Far below "rich commercial xianxia ARPG". |
| Art consistency | 7 | One cohesive pixel-art pack (props, mobs, bosses, UI skin); mismatches are the blurry baked ground at high res, a few scale outliers and recycled hero sprites as NPCs. |
| Animation | 6 | Idle/walk/combo/dash/cast/hurt/death exist for all actors; flip handling is clean. Death presentation is almost invisible; foot sliding UNVERIFIED. |
| VFX | 6 | Good variety (arcs, rings, petals, mist, slam telegraphs); but white hit-splash blobs and boss debris hide the actors, and Ten Thousand Swords is underwhelming. |
| UI / UX | 7 | Genuinely attractive skinned HUD/shop/dialogue; marred by blank skill icons (bug), no quest log/skill/map panel, low-contrast labels in menus. |
| Audio design (read + `__audio` stats) | 5 | Everything is synthesised, mood-reactive, mutable and persistent; but the music is a random walk with no motif, SFX never vary, no ambience/spatialisation. Cannot judge by ear. |
| Performance | 7 | No leaks or per-zone slowdowns seen (flat scene object counts over 5 min), 36-41 fps in software GL everywhere; real-GPU numbers UNVERIFIED. |
| Stability | 6 | Strong save validation and no console errors, but one permanent quest softlock and one save-while-dead state corruption. |

Overall: a polished-looking vertical slice with a very thin, very easy game underneath. The owner's "simple and ugly" complaint is fixed on the visual side; it is now "pretty but trivial and short".

---------------------------------------------------------------------

## 2. Top findings (ranked)

Severity: S1 blocker/softlock/crash, S2 major gameplay or visual problem, S3 notable, S4 polish.

### S1-1. Permanent quest-chain softlock if a boss is killed before its quest is accepted
- What: Kill counts only register while a quest is `active` (`src/core/quest.ts` `onKill`). Bosses are never gated by the quest chain, and a defeated boss never respawns (`WorldScene.create`: `if (!isBossDefeated(...)) spawnBoss`). If the player kills the Nine-Tailed Fox (or the Fallen Sword Immortal) before accepting "The Fox of the Peach Grove" / "The Fallen Sword Immortal", the quest later shows "Slay the Nine-Tailed Fox Spirit 0/1" forever. `warden` requires `fox` turned in, so the whole chain and the intended ending are unreachable. Easy to trigger because the fox is trivially killable at level 1 (see S2-3) and the player has no signal that bosses are quest-bound.
- Evidence (measured via real dialogue + hooks): after turning in "pests" and clicking "Not now" on the fox offer, killed the fox, then accepted the quest: `quests = {pests: turnedIn, fox: active, warden: inactive}`, `bossesDefeated = ['ninetail']`, after `respawnNow()` the boss list is `['warden']` only, tracker says "0/1". Script output reproduced in session (softlock.mjs).
- Repro: new game; accept + finish "Wolves of the Bamboo"; on the fox offer choose "2. Not now."; walk to the Peach Grove den (north-west) and kill the fox; talk to Elder Lin and accept "The Fox of the Peach Grove"; it can never complete.
- Fix: in `registerKill` / quest accept, treat "kill boss X" objectives as satisfied if `gs.bosses.includes(X)` (check in `progressOf`/`isComplete` instead of a counter), and also complete retroactively on accept. Better: gate boss engagement/spawn on the quest being active, or make bosses re-spawnable for repeat farming (also fixes a missing end-game loop). Add a unit test: boss in `gs.bosses` before accept => quest completable.

### S2-1. Saving while dead produces a zombie save (0 HP, not dead, no way to know)
- What: `die()` calls `save(false)` with `gs.hp = 0`. Closing the tab on the death screen, or choosing Save / Save & Quit from the Esc menu while dead, writes `hp: 0`. `Continue` then loads a living-looking hero at the village spawn with 0 HP (`create()` only treats `gs.hp > 0` as "use saved pos"; `dead` is reset to false).
- Evidence: after `killPlayer()` the saved state is `hp 0, pos (648,792)`; after reload + Continue the HUD shows `HP 0 / 136`, `dead:false`. Screenshot `qc-artifacts/qa1/continue-after-death.png`, `death.png`.
- Repro: die, press F5 (or close tab), Continue.
- Fix: never persist `hp <= 0` (in `pushToState` or `save`, clamp to `max(1, ...)` or set to maxHp after death), and in `create()` treat `gs.hp <= 0` as "respawn at full health". Add an e2e: die -> reload -> Continue -> hp > 0.

### S2-2. Bosses are pushovers (the "multi-mechanic boss" is a 5-14 second event)
- Measured (bot: melee + skills 1-3, dash on slam windup; "stand" = stand and mash melee only):
  - Nine-Tailed Fox, Lv5 + iron sword: dead in 4.8 s, 29 damage taken, 0 potions.
  - Nine-Tailed Fox, Lv1, no weapon, stand-and-mash: dead in 14.3 s, 90 damage taken (of 100 HP), 1 potion.
  - Fallen Sword Immortal, Lv5 + iron sword: 8.6 s, 57 dmg. Lv7 + steel blade: 6.2 s, 33 dmg. Lv3 + iron sword stand-and-mash: 12.3 s, 78 dmg (of 124).
- Why: boss HP is 420/620 with `def` 4-6 against a hero doing 35-90 dps; the boss moves at 36-48 px/s vs 78 px/s for the hero; the slam is centered on the boss and only triggers within 90-100 px, so stepping out is enough; the ring projectiles (88 px/s, 8-12 of them) are slow and blocked by props; summons die in one hit.
- Fix (design): HP x4-6, multi-hit combos, attacks that are aimed at the player rather than centered on the boss (cone sweeps, line charges, delayed zones on the player position), per-phase new moves (not only added summons), arena hazards, a short "enrage timer", and distinct kits for the two bosses. See also S2-3 for the underlying power curve.

### S2-3. The whole game is trivially easy; zone level bands are meaningless
- Measured TTK (bot walks up with real keys and melees; no dash/potions): Lv1 hero kills foxfire 1.1 s, treant 2.4 s (hp lost 12), toad 1.0 s, jiangshi 1.3 s (11), golem 2.5-3.7 s (14-15 hp lost), thunderbird 0.8 s. Even at Lv1 the "Lv 7-12" ruins golem (130 HP, def 8) dies in 3.7 s and the Lv1 hero (100 HP) loses 15 HP.
- Whole-zone runs (45 s, naive melee bot): Lv1 in bamboo took 37 damage in 45 s (0.82 dps) while killing 5 mobs; the bot never needed a potion in any run. Potions were used 0 times in all my fights except one boss test.
- Mobs have static stats while the hero gains +2 atk/+12 hp per level, so the only enemy threat comes from stacking several at once, which AI stacking (S2-5) removes.
- Level 1->2 needs 20 XP; one golem is 48 XP; one elite is x3. Skill unlock levels (1/2/4/7) are reached in the first ~10 minutes.
- Fix: rebalance around player mistakes: higher enemy HP/def scaling by zone, attack telegraphs for rushers (S2-6), mob packs with roles (S2-4), reduce hero base damage or raise mob HP x2-3, remove/limit the 0.55 s post-hit i-frames, make mana matter, give potions a cooldown. Enforce level gates (damage reduction or HP penalty when under-levelled; zone entry gating via NPC/story).

### S2-4. Cultivation (the core xianxia fantasy) is a 25-second chore with no risk
- Measured with real keys: standing on the spirit array in the spawn plaza and pressing M fills Qi 0->100 in 3.3 s game time (rate 12/s x2.5 on array = 30/s). Breakthrough (B) at 60%: realm 1 reached on the first try; the second realm (qi 250) needed 8 s and 2 tries; third realm "highest in this build". Total ~25 s of game time to go Qi Condensation I->III, giving x1.35 stats (HP 100 -> 135, Lv1) permanently.
- Failure only costs half the qi (~4 s). No tribulation, no cooldown, no ingredient, no danger from interrupts (the array is in the safe plaza), qi pills also add 60 qi.
- Fix: make meditation slow (minutes), danger-coupled (spawn "heart demons"), require pills/herbs for breakthrough, add failure penalties (HP loss, stat debuff, cooldown), tie realms to level gates and to content (e.g. new skills/slots per realm), and add realm names beyond the first stage (Foundation Establishment etc.) even if locked.

### S2-5. Enemies get stuck on scenery (free-kill exploit) and stack on one pixel
- Stuck: enemies chase in a straight line with axis-separated collision (`moveWithCollision`) and no pathfinding/steering. Test: player north of the village lotus bowl (wide 3.6x1.2-tile collider), wolf spawned south. Result: the wolf stayed at distance 38 px for the full 10 s test (min dist 38, hurt = never), `ai: chase`, for player x offsets of 0, 6 and 20 px (it slides to the player's x and stays blocked). The hero's combo reaches 38-46 px, so the player can attack the helpless wolf: a risk-free farm spot at any pavilion, rock, palace, bowl, stone circle, pagoda. Screenshot `qc-artifacts/qa1/stuck-behind-bowl.png`.
- Stacking: 6 wolves spawned 6 px apart and left to chase for 3 s ended up with minimum pairwise distance 0.0 px and 10 pairs closer than 4 px (five of six on exactly one coordinate (740,708); `qc-artifacts/qa1/cluster.png`). Packs read as a single mob, damage numbers overlap, and area skills look pointless.
- Code: `src/game/WorldScene.ts` `updateEnemy` (no separation force), `src/core/world.ts` `moveWithCollision`.
- Fix: add a cheap separation steering (push apart when closer than radius sum), a wall-following fallback or grid A*/flow-field over `blocked`, and a "leash/give up" rule when stuck for >1.5 s (teleport back/evade). Make casters line-of-sight aware.

### S2-6. Enemy attack design: no melee telegraph, casters are turrets
- Melee: `updateEnemyAI` returns the `attack` intent on the same tick the enemy enters `attack` state with `attackCd <= 0`, and `updateEnemy` applies `hurtPlayer` immediately (WorldScene ~L788). Only chargers (treant, jiangshi, golem, sword spirit) have a windup. Rushers (wolf, snake, toad, ghosts, skeleton, soldier, bat, paper doll) cannot be dodged by reaction; the only defence is the hero's 0.55 s post-hit invulnerability.
- Casters (ghost, foxfire, peach spirit, thunderbird): measured over 10 s each, the ghost and thunderbird sat at exactly 82 px in state `attack` firing on cooldown; they never reposition, strafe, or kite. They only retreat if the player comes inside 0.6x preferredRange (48 px), at speed 40 vs the hero's 78 px/s, so closing in is trivial. Thunderbird's range (130) exceeds the camera's half-height (102 world px at 720p, see S3-4), so it can fire from off-screen (computed, not observed on a real screen).
- Fix: add a 0.25-0.4 s windup (anim + tint/ring) to every melee attack and make damage resolve at the strike frame; give casters strafing/retreat-when-pressed, multi-shot patterns, projectile speed variation, and some "pressure" roles (swarmers that surround, shield mobs, healers).

### S2-7. Progression and depth fall off a cliff after the first ~15 minutes
- Content inventory (from data): 3 quests (all "kill N" plus 2 herbs), 3 NPCs (1 quest giver), 2 bosses, 16 normal mobs, 4 skills, 1 equipment slot (weapon only, 9 items, 5 weapons), 3 realms, max level 20 (needs 13,427 XP; content stops at the "Lv 7-12" ruins; at Lv12 XP is 3,584 and nothing new unlocks).
- Gear is handed out: the quest gives an iron sword (+4), the fox drops the Foxfire Spirit Saber (+11), the Warden drops the Jade Blade (+15); the shop's best weapon is 180 stones; after buying consumables nothing uses stones (alchemy costs 3-8). No armour/accessories/skill upgrades/talents/crafting beyond three potion recipes.
- Bosses never respawn once beaten (S1-1), so there is no repeatable endgame challenge. The full game is plausibly 10-15 minutes (UNVERIFIED as a continuous run; boss fights measured at 5-14 s each).
- Fix: see Section 4 (missing features). Minimum viable: armour/accessory slots with set bonuses, skill upgrade/passive tree tied to realms, a repeatable boss/dungeon (sect trial tower), gating by realm, more varied quest types.

### S2-8. Skill icons 1-4 in the hotbar are blank
- Evidence: `qc-artifacts/qa1/hotbar-l8.png` (Lv8, all four unlocked): the four technique slots show empty dark squares with only the text label; icons for combo/dash/potions are fine. In every screenshot (e.g. `q-accepted.png`) slots 1-4 are blank.
- Cause: `src/ui/skin.ts` `fxIconStyle()` builds `background-image:url("...")` with double quotes and it is injected into `style="${...}"` in `src/ui/hud.ts` (slot template). The nested double quotes terminate the attribute, so the DOM style becomes `background-image:url(` (confirmed by dumping `getAttribute('style')`).
- Fix: use `url('...')` or `&quot;` in `fxIconStyle` (itemIconHtml already uses `&quot;`), or set `style.backgroundImage` via DOM after insertion like the other icons. Add a UI test that each `#slotN .ic` has a computed `background-image` != none.

### S2-9. Onboarding gaps (first minute)
- At spawn (648,792) the screen shows the south gate, lotus bowls and a guard; the Elder is ~190 px north and off-screen (view is 364x205 world px at 720p). The only hints are the bottom-left key legend and the prompt "Spirit array: press M to meditate". There is no "talk to Elder Lin" objective, no arrow, no minimap quest marker (minimap shows red enemy dots but no gold quest/NPC highlight), no nameplates over NPCs, no explanation of the three guards-looking NPCs (Elder is a staff peasant sprite, merchant a spearman, alchemist an archer). Screenshots `03-spawn-t1.png`, `04-spawn-t6.png`.
- The quest tracker appears only after accepting and gives no direction ("Slay Spirit Wolves 0/4" - where?). The intro text says "to the west", the HUD does not. Dash (Shift), potions (F/G), M/B are explained only by the tiny legend; nothing teaches i-frames or telegraph colours.
- Good: the yellow "!" over Elder Lin once visible, "Press E to talk to Elder Lin" prompt, chained dialogue after turn-in.
- Fix: a 5-step tutorial banner sequence (move, attack, dash, talk, gather), a gold arrow/marker on screen edge and minimap for the active objective, nameplates (or hover labels) for NPCs, and a one-time "Open map" hint. Start the player facing the Elder.

### S3-1. Death/respawn presentation and consequences
- Death shows a small text prompt ("You have fallen - press R to respawn") on the live world; the corpse ends as a faint dotted smudge (`death.png`), no dim, no stats, no penalty. Respawn is `scene.restart`, which also resets all enemies, herbs and both undefeated bosses to full health (an exploit: reset the boss mid-fight to skip its attacks, or reset the herb nodes for free herbs). Nothing is lost on death (no stones/xp/durability), so there is no tension.
- Fix: dim + "Defeated" panel with Respawn/Load options, brief corpse animation hold, a small cost (stones or qi), keep boss HP across death within the session or have the boss heal slowly.

### S3-2. Boss kits are identical and weak mechanically
- Fox and Immortal both use slam (centered on the boss, 56-62 px radius) / summon / projectile ring from `src/core/boss.ts`; only numbers differ. Phase 2 = summons added, phase 3 = ring + enrage (speed x1.35-1.4, cooldown x0.7). The slam is the only attack that forces movement and it is visible for 0.8-0.9 s from a boss that is slower than the player. No arena use, no add-priority decisions, no vulnerability windows.
- Evidence: `boss-ninetail-ph2.png`, `boss-warden-ph3.png`; slam telegraph in `z-lair.png`.
- Fix: bespoke patterns (fox: illusions/clones with one real, fire dashes, tail whip cones; immortal: sword-rain on a grid, teleport + backstab telegraph, parry-style opening), kit diversity per phase, boss-specific arenas.

### S3-3. VFX legibility problems
- Hit feedback flashes the whole enemy sprite as a solid white/orange silhouette plus a large white ink-splash sprite (`xf_ink_splash`, scale up to 0.2) that sits on the enemy. In `vfx-combo3.png` and `vfx2-moon.png` the target is a white blob for several frames and numbers overlap, so you cannot see what you hit. During the Warden phase 3 (`boss-warden-ph3.png`) black debris sprites from the slam cover the hero entirely; the purple glow makes boss and hero hard to separate.
- "Ten Thousand Swords" (the L7 ultimate) is a pale ring plus a single spark (`vfx2-rain.png`), visually weaker than the L2 wave; it does not read as thousands of swords.
- Positive: enemy windup tint (orange) and boss slam circle are clear.
- Fix: reduce splash scale/alpha, flash for 2 frames max, draw damage numbers above the head and cap overlaps; keep hero silhouette on top (depth) during boss FX; build a real sword-rain (many falling sword sprites with impact dust).

### S3-4. Camera zoom is non-integer and the ground is blurry; the view is tiny
- `applyZoom` = `clamp(scale.height / 205, 2, 6)`: 3.51 at 1280x720, 2.93 at 1024x600, 5.27 at 1920x1080 (measured via `cameras.main.zoom`). Pixel art at fractional zoom produces uneven pixels/shimmer while scrolling; the docs claim "integer zoom". At 1080p the baked ground texture is visibly blurry/smoothed next to crisp sprites (`res-1920x1080.png`, lower-right pond).
- The world-space view is always 205 px tall (12.8 tiles); a 1080p monitor sees the same area as 720p, just bigger. Thunderbird range 130 px and boss ring range 230 px extend beyond the visible half-height of 102 px.
- Fix: snap zoom to integers (or round to 0.5 steps with `roundPixels`), render the ground at the same texel density as sprites with `NEAREST` filtering, and widen the FOV on large screens (zoom 3 at 1080p).

### S3-5. NPC art and identity
- NPCs reuse playable hero sprites (`hero.staffbeggar` for Elder Lin whose portrait is a white-bearded elder, `hero.spearman` for the merchant, `hero.archer` for the alchemist). No nameplates, no idle behaviours, no schedule. The merchant and alchemist read as sect guards. `q-near-elder.png`, `q-dialogue.png`.
- Fix: dedicated NPC sprites or at least accessory/colour swaps, name labels on proximity, small idle loops.

### S3-6. Economy and itemisation are thin
- Prices: potion 12 stones; kill income per mob 1-9 stones (wolf avg 2, golem avg 9, boss 25-60, elites x3). Bronze Blade (+3) costs 60, Steel Blade (+7) 180, but the quest hands out the +4 iron sword in minute one. Boss weapons (+11 / +15) invalidate every shop weapon. Selling pays 40%, alchemy costs 3-8 stones + herbs. No armour, no rings, no upgrade sink, so stones accumulate uselessly after ~15 min.
- Potions: no cooldown, usable at full health (consumed and wasted), instant. 5 potions are never needed (see S2-3).
- Fix: recurring sinks (armour tiers, enchant/refine, pill recipes with quality, sect contribution shop), potion cooldown shared across potions, scarcer healing, gear scaling by zone.

### S3-7. Mana and skill economy has no tension; skill differentiation is shallow
- Free melee combo (3 hits/s, ~35 dps at Lv1) outclasses spells in practical terms; flying sword costs 8 mana with 1.4 s cooldown (1.5x), mana regen 3/s, mob TTK 1-4 s. With kills this fast nobody manages mana; mana potions drop but are never required. Skill 1-4 all feel like "more damage" variants (projectile, pierce wave, AoE stun, ground AoE). There is no combo-cancel, no skill modifier, no element interaction despite 3 spirit roots (the root only gives flat stats and tints VFX).
- Fix: make mana a gating resource (higher costs, qi regen from combat), add status effects tied to roots (burn/slow/root), skill cooldown overlays that show readiness, and allow skill upgrades.

### S3-8. Audio design (read from `src/game/audio.ts`; `__audio` stats verified)
- Verified: AudioContext `running`, SFX/notes counters advance (32 sfx, 52 notes in a short combat), mute persists (`ir-muted`), N and button toggle.
- Design issues: music is a single random walk over a pentatonic scale at a fixed tonic (D) with one pluck timbre, no motif/phrases, no per-zone themes beyond "mist" scale swap and tempo (calm 56/mist 48/danger 84/boss 100 bpm). Mood switches are instantaneous tempo changes because `mood` flips on `enemies.some(ai !== idle)`. SFX are fixed recipes with no pitch/volume randomisation (hit/slash repeat identically at 3 hits/s), no distance attenuation or panning, no mob voices/footsteps, no ambience (wind/water/insects), the `telegraph` SFX exists but is not obviously triggered for mob windups. The master volume has no UI.
- Fix: add 2-4 note-motif generators per zone, round-robin/pitch-jitter SFX, positional gain, ambience loops, a volume slider in the pause menu, boss-phase stingers.

### S3-9. No quest log, skill/ability panel, or world map
- Only the single active quest is shown in a tracker; no journal, no completed list, no map screen (only a circular minimap). The character panel lists stats but no skills, resists, or equipment slots; the inventory tooltip is a single text line at the bottom of the panel (`q-inv.png`). Clicking an item silently equips/consumes it (no confirm, no compare).
- Fix: quest journal (J), full map (Tab/M conflict resolved), character screen with equipment doll + skill list, hover tooltips with stat deltas.

### S3-10. Elites are cosmetic
- 10% chance, only for 5 mob types with recoloured sprites (measured 3/30 foxfire, 4/30 ghosts); 2.2x HP, 1.3x atk, 3x XP/stones, 35% chance to drop a zone weapon. No affixes, no names, no mini-health-bar emphasis beyond a gold bar.
- Fix: modifiers (vampiric, explosive, shielded), named elites, guaranteed telegraphed signature move.

### S4-1. Low-contrast text in menus and banners
- Main menu subtitle "A cultivation adventure" and creation labels ("Appearance", "Spirit Root (press 1-3)", "Name") are pale on the pale pagoda backdrop (`01-menu.png`, `02-create.png`). Zone banners (e.g. "Whispering Bamboo Forest") are semi-transparent over foliage and nearly invisible (`z-bamboo.png`).
- Fix: add a dark text shadow/plate behind labels and banners.

### S4-2. Scale/readability outliers
- Herb nodes (lingzhi, scale 0.13) are as tall as the hero (`soak-end.png`, `bamboo-clear.png`); the marsh toad is about hero-size; enemy HP bars are 18 px wide (tiny at zoom 3.5) and only appear after damage. Hero 0.3-0.34 scale vs mobs 0.3-0.42 scale gives uneven apparent sizes (wolf is bigger than the hero).
- Fix: unify a scale table; show enemy bars on hover/aggro; add a faint outline for heroes against dense bamboo (the hero was fully hidden behind wolf+treant in `z-bamboo.png`).

### S4-3. Console noise
- 8 WebGL warnings on load: `INVALID_VALUE: texImage2D: width or height out of range` (every run, no page errors otherwise). A texture is being created with 0 or oversized dimensions (suspect baked ground / dynamic textures). Harmless now but can mask real errors and may fail on stricter GPUs.
- Fix: log which texture key triggers it (`textures.on('addtexture')`) and guard zero-size creation.

### S4-4. Save system limits
- One slot, autosave every 30 s (nothing is written at new-game start, so closing the tab in the first 30 s keeps no character), no backup, no "delete save"; a tampered/corrupt save shows a clear error ("Save checksum mismatch (corrupted or edited).") but can only be replaced by starting over. New Game with an existing save does not warn that the old save will be overwritten on the next autosave.
- Good: validation is strict; garbage JSON and edited levels were both rejected cleanly.
- Fix: 3 slots + rolling backup, overwrite confirmation, "Export/Import save" for browser-clear safety.

### S4-5. Inventory/character panels do not pause the game
- Opening I or C keeps simulation running (measured game dt 0.99 s per wall second with the inventory open). Probably intended, but combined with click-to-use items it can cause accidental equip/consume mid-fight.
- Fix: optional "slow-time while panels open" or a confirmation toggle; document the behaviour.

### S4-6. Enemies near the shop area
- A Bone Soldier (ruins mob) is visible about 140 px from Merchant Qiao in `q-shop.png`; the spawn safe radius is only 130 px around the player spawn (`spotInZone`), while the merchant stands ~150 px away.
- Fix: exclude spawns within ~220 px of any NPC and make the "village" zone a hard no-spawn area.

### S4-7. Performance observations (software GL, treat as relative)
- Idle: 36.5-41 fps in all six zones, p95 33-50 ms; boss fights p95 50-67 ms, max 115-167 ms (spikes in phase changes / summons); load to menu 2.8 s, to in-game 3.7 s; JS bundle 1.5 MB, assets 5.9 MB. 5-minute soak: scene children flat (687-694), tweens flat (110-111), textures flat (302-303), no growth. (The soak bot got stuck on a marsh pond after one minute, so heap numbers are not meaningful; `performance.memory` was quantised at 47.4 MB. UNVERIFIED: long real-play memory.)
- Fix: profile on a real GPU; consider capping `fx.burst` counts and pooling `floatText` objects (each hit allocates a Text + tween).

### S4-8. Tooling note
- `npm run build` failed once at the start of my session with `TS6053: File '.../tests/zz_balance.test.ts' not found` (a file from a parallel session appeared and vanished); a later `tsc --noEmit` passed. Not a game bug, but `tsconfig` `include: ["tests"]` makes the build brittle against transient files; `qc` should run in a clean checkout.

### Not-a-bug / verified OK (so nobody wastes time)
- Blur with a held key: movement stops (input set is cleared on window blur).
- Spamming I/C/Esc/M/1/Space 30x: no errors, UI state consistent.
- Name field accepts digits without changing the Spirit Root; empty/HTML names are rejected with a clear message.
- Resizing the window mid-game (1280 -> 1024x600 -> 1920x1080 -> 800x500 -> back) re-zooms without errors.
- Dialogue pauses the world (game time stops); Esc closes dialogue/trade/panels in the right order.

---------------------------------------------------------------------

## 3. What works well (do not break)

- Visual cohesion: the CC0 pixel pack plus the jade-and-gold skinned UI gives a recognisable xianxia identity; village plaza with spirit array, dragon pillars and lotus bowls is the strongest screen (`z-village.png`). Bamboo forest density and the Peach Grove den with its glowing altar are good set pieces (`z-bamboo.png`, `boss-ninetail-ph2.png`).
- Zone mood system: tinted overlays, petals/fireflies/mist per zone, zone banner with level hint, circular minimap with elites and herbs.
- Combo feel: 3-hit chain with lunge, knockback, hit-stop on crit/finisher, camera shake, readable damage numbers and crit colour; dash with afterimage and a "Dodge" popup.
- Boss telegraphs: red slam circle with a clear windup, enrage tint, "calls its minions" and "is enraged" toasts, big boss bar.
- UI craft: shop/alchemy dialogs with portraits, rarity borders, affordability greying, chained quest dialogue after turn-in, Esc handling, responsive HUD at 1024x600 to 1920x1080.
- Robust save layer: version + checksum + schema validation; rejects garbage and tampering with friendly messages; atomic buy/craft/turn-in functions.
- Input layer: custom DOM `KeyInput` (no double-fire), blur-safe, ignores typing in inputs.
- Deterministic world generation and clean `core/` logic separated from Phaser (testable, as shown by the 89+ unit tests).
- Stable scene lifecycle: flat object/tween counts over 5 minutes, no leak symptoms, no console errors except the S4-3 warnings.

---------------------------------------------------------------------

## 4. Biggest missing features (ranked by expected player impact)

1. Real difficulty and encounter design: scaled enemy stats by zone, telegraphed attacks, role-based mob packs (tank/ranged/summoner), and boss fights that last 60-180 s with distinct patterns.
2. A meaningful cultivation loop: long meditation, tribulation/breakthrough events, realm-gated skills and stat jumps, pills and herbs as real ingredients, heart-demon/secret-realm risk.
3. Equipment depth: armour, boots, accessories, rarity affixes, refining/upgrading, set bonuses, loot that drops (not only handed out); then a real economy with sinks.
4. Skill progression: talent/skill-point tree, upgrades per technique, passive buffs, elemental synergies for the three spirit roots, combo cancels, ultimate with charge.
5. More world and quests: bigger map (current 1280x1280 px is crossed in ~16 s), side quests with varied objectives (escort, investigate, fetch, puzzle), NPC relationships, sect rank, faction reputation, dungeons/secret realms, day-night, weather.
6. Replayability: repeatable bosses, scaling "trial tower", difficulty modes, new game+, random events, bounty board.
7. Onboarding/UX: tutorial, objective markers, map screen, quest log, skill/equipment screens, tooltips with comparisons, controller support.
8. Audio and presentation: composed or at least motif-driven music per zone, ambience, voiced mob cues, boss stingers, a death/victory presentation, cutscene-style boss intros and quest turn-ins.
9. Social/meta features: more than one save slot, cloud/export save, achievements, codex (bestiary, herb book).
10. Mobile/gamepad and accessibility options (UI scale, colourblind-safe telegraphs, remappable keys).

---------------------------------------------------------------------

## 5. Evidence index (all under `qc-artifacts/qa1/`)
`01-menu.png`, `02-create.png`, `03-spawn-t1.png`, `04-spawn-t6.png`, `z-village|bamboo|marsh|grove|ruins|lair.png`, `q-near-elder.png`, `q-dialogue.png`, `q-accepted.png`, `q-inv.png`, `q-chr.png`, `q-shop.png`, `q-alch.png`, `q-pause.png`, `hotbar-l8.png`, `boss-ninetail-ph1..3.png`, `boss-warden-ph1..3.png`, `death.png`, `continue-after-death.png`, `stuck-behind-bowl.png`, `cluster.png`, `vfx-*.png`, `vfx2-*.png`, `res-1024x600.png`, `res-1920x1080.png`, `bamboo-clear.png`, `soak-end.png`, `med-full.png`, `breakthrough1.png`, `pause-saved.png`, `menu-error.png`.

UNVERIFIED items: real-GPU frame rate and hitching; foot-sliding quality (no frame-by-frame capture); how the audio actually sounds; Firefox/Safari behaviour; a continuous end-to-end playthrough time (estimated 10-15 minutes); balance of the three spirit roots against each other; touch/gamepad (none implemented).
