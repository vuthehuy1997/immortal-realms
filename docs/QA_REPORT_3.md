# QA Report 3 - independent QA/design review of commit c2e62aa (rounds 1-11)

Note: this file replaces an older "QA Report 3" that covered commit b1fe6a9; the old text is in git history (`git log -- docs/QA_REPORT_3.md`).

Reviewer: independent QA lead / game designer (did not write the game). No source, test or asset file was modified. Scratch scripts and screenshots: `/tmp/claude-464201200/-data-yuu-ai-data-yuu-self-immortal-realms/fb77f4ce-5dc1-4887-ba8e-13a6200c5f82/scratchpad/qa/` (called `qa/` below).

## 0. Method and honesty limits

- VERIFIED = I ran it (Playwright, Chromium + SwiftShader, `vite preview` on :4199, build of c2e62aa; `npm test` = 21 files / 272 tests pass).
- INFERRED = read from `src/data/*` / `src/core/*` and computed by script (`qa/calc.cjs`, `qa/calc2.cjs`), not observed in play.
- The machine ran at load average 20-45, so the game simulated only 0.6-0.9 game-seconds per wall second. All durations below are GAME seconds (`__rpg.state().now`). fps is not reported (meaningless under this load).
- My "player" is a bot: real WASD keys for movement, hook calls (`__rpg.attack/cast`) with perfect aim, dash on boss windup (max 1/s), potion at <45% HP. It spams all 4 techniques. Better aim than a human but no kiting/positioning intelligence, so treat numbers as a rough band.
- I did NOT fight Nine-Tail Fox, Jiao Dragon or the three Ch2 bosses (time/CPU), nor read the story pages (auto-skipped under automation), nor hear audio (headless). Those parts are INFERRED or marked UNVERIFIED.
- Zero page errors and zero console errors/warnings across every session I ran (VERIFIED, `errs` empty in all logs).

## 1. Executive summary

Top 5 problems
1. **Chapter 2 is mechanically trivial and the economy is hollow once you have the free quest gear.** Quests hand out the Froststeel Blade and Frost Mail, and the Outpost shop sells the very same two items for 1500/1400 stones, so the shop is redundant. At L12 with that kit, Whitefrost/Crystal mobs died in 0.5-4.8 s and cost 0-24 HP of 352. Stones arrive at 20-45 per kill while a Greater Vitality Draught costs 40. (kills VERIFIED; stone rates INFERRED)
2. **Difficulty is a cliff at the first boss and flat afterwards.** Fallen Sword Immortal (6600 HP) vs L9 with full Chapter 1 shop gear (226 HP) and 10 potions: bot died at 58 s with the boss at 6% HP, 601 damage taken, all 10 potions used (VERIFIED, one run). Yet Nine-Tail Fox is only 2400 HP and Ch2 mobs fall over. Potions heal a flat 40 HP (18% of 226 HP, ~11% at L12) on a 2.5 s cooldown; they cannot scale.
3. **Mana is a dead system in sustained fights.** The bot held 6-15 of 82 mana for the whole boss fight; techniques 2-4 (the martial arts the owner wants) are unavailable after the opening burst, so the fight collapses to the 3-hit combo. (VERIFIED in log; a human would ration, but income is only 3/s regen.)
4. **Visual repetition between chapters.** The Ch2 hub is the Ch1 hub (same lotus bowls, pavilions, NPC layout) with a frost tint; the final boss "Sundered Sovereign" is the Warden sprite tinted blue at 2.5x HP; Ch2 mobs are tinted Ch1 mobs (frost wolves read near-black navy, not frosty); Whitefrost ground has tan "mud" blotches under the snow. Declared PLACEHOLDER in the repo, but the owner explicitly rejected "technically passing but plain".
5. **Touch/mobile layout is not shippable:** sound button overlaps the Quest button at 844x390; portrait (390x844) is broken (minimap covers the objective, buttons cover the skill bar). The e2e overlap check missed it because the sound button is outside `#hudlayer`. (VERIFIED, screenshots)

Top 5 opportunities
1. Percentage/charge healing flask plus mana refund on hit (S, fixes problems 2 and 3 together).
2. A build-choice layer (boon/insight picks at level-up and boss kills, Hades-style) so levels 10-20 are not just +HP/+ATK (M).
3. Boss poise/stagger plus a perfect-dodge reward: telegraphs already exist and read well; give skilled play a payoff (M).
4. A stone sink and replay loop: sect upgrade shop, trial tower / endless rift reusing existing enemies (S-M each).
5. Rebalance the level curve: bosses+quests alone reach ~L10 in Ch1 and the L20 cap in Ch2, so normal-mob grinding is pointless late (S, data only).

## 2. Scorecard (1-10)

| Area | Score | Justification |
|---|---|---|
| Combat | 6 | Readable telegraphs (red arcs, windup states), 3-hit combo + dash + 4 techniques, good hit feedback; but mana starvation, no poise or dodge reward, trash mobs trivial. Only 1 boss fight actually run. |
| Progression / economy | 4 | XP curve quick; quest/boss XP alone hits the gate level (Ch1) and the cap (Ch2); stones have no sink after ~L10; potions do not scale; free quest gear nullifies the Ch2 shop. |
| Content depth | 6 | 6 hero looks (cosmetic only), 3 roots, 4 techniques, ~28 mobs, 6 bosses, 13 quests, 2 maps. Wide but shallow: no build choices, no loot affixes, one shared kit. |
| Visuals | 7 | Ch1 is genuinely rich (a1_spawn.png, boss_warden_0.png). Ch2 drops to recolours, ground blotches and a cloned hub. |
| UI / UX | 6 | Clear HUD, objective bar, boss bar, banners; but mobile layout bugs, nameplate clipped by the minimap, dense help text. |
| Story | 5 | Prologue and chapter pages and NPC dialogue exist; premise generic; UNVERIFIED in play (pages skipped by automation). |
| Performance | n/a | Cannot judge (SwiftShader at load 20-45). No console errors; maps load in seconds. |
| Stability | 8 | No page errors in ~12 sessions incl. chapter travel, rapid gate use, resize, touch toggle. |

## 3. Numbers I measured or computed

### 3.1 Level curve (INFERRED, `qa/calc.cjs`)
XP to next = 20 * L^1.5. Cumulative XP to reach level: L2 20, L3 77, L4 181, L5 341, L6 565, L7 859, L8 1229, L9 1682, L10 2222, L12 3584, L15 6400, L20 13427.

| Zone | avg XP/kill | kills for one level at zone's mid level |
|---|---|---|
| Bamboo (L1-4) | 14 | L1->2: 2; L3->4: 7 |
| Marsh (L3-7) | 30 | L5->6: 7 |
| Grove (L5-9) | 45 | L8->9: 10 |
| Ruins (L7-12) | 113 | L9->10: 5 |
| Frostpass (L10-14) | 95 | L11->12: 8 |
| Crystal (L12-16) | 203 | L13->14: 5 |
| Barrow (L13-18) | 225 | L15->16: 5 |

Quest/boss XP: Ch1 bosses 900+420+1100 = 2420 XP (more than the whole L10 requirement of 2222); Ch2 quests 8320 + bosses 6600 = 14920 XP, which alone exceeds the L10->L20 need (11205). So the L10 gate is automatic once the three guardians are dead, and the cap is reached through Ch2 story content with no grinding; XP then stops accumulating (`addXp` zeroes it at max level).

### 3.2 Combat (VERIFIED, bot, game seconds)
| Situation | Result |
|---|---|
| L1, no gear, Spirit Wolf / Jade Serpent / Foxfire Wisp | TTK 3.2 s / 1.1 s / 2.6 s; 0 damage taken |
| L2 Elder Treant | TTK 28.6 s, 0 damage |
| L12 Ch2 kit (352 HP): Frost Wisp / Rime Serpent / Frost Wolf | 0.5 s / 3.2 s / 2.7 s; HP lost 0 / 13 / 0 |
| same, Crystal: Rime Bat / Shard Bird / Prism Ghost | 2.6 s / 4.8 s / 3.9 s; HP lost 10 / 24 / 0 |
| same, Barrow: Barrow Guard, Barrow Guard, Ash Soldier | 10.9 s / 25.7 s / 1.3 s; HP lost 0 / 183 (52%) / 0 |
| Fallen Sword Immortal, L9, steel blade + sect robe + jade pendant (226 HP), 10 Vitality Draughts | **Died at 58 s**, boss left 426/6600; phases at 0 / 18 / 39 s; 601 HP lost; 10 potions used; min HP 25; mana 6-15 of 82 all fight; bot DPS ~115 |

Takeaways: (a) Ch2 normal mobs are fodder except the Barrow Guard (~1444 HP, def 6); TTK spread 1.3 s to 26 s inside one zone is inconsistent; (b) the Warden is a real wall for a shop-geared L9 and the objective text does not warn; (c) one run, so a band, not a fact.

### 3.3 Economy (INFERRED from data; prices read from code)
- Vitality Draught 40 HP, 12 stones, stack 10, cooldown 2.5 s. Greater: 120 HP, 40 stones.
- Stones per kill (avg): Bamboo 2.4, Marsh 5.2, Grove 7.8, Ruins 20, Frostpass 20, Crystal 41, Barrow 45. Boss drops 55-420.
- Ch1 full kit (steel blade 180 + sect robe 170 + jade pendant 140) = 490 stones = ~25 Ruins kills.
- Ch2: Froststeel Blade (value 1500) and Frost Mail (1400) are quest rewards and also Outpost stock. Remaining sinks: Crystal Saber 2400 and Sovereign Blade 4000 (neither in shop stock; drops). At ~41 stones/kill the only sink is potions, which are rarely needed (3.2).
- Death costs a small stone tax and full-HP respawn; with regen and the array, grinding is nearly risk-free.

## 4. Play-test notes

VERIFIED
- Menu -> creation (6 looks, 3 roots, 3 save slots) is clear and attractive (qa/a1_create2.png). Hero choice is cosmetic: all heroes share techniques (`src/data/heroes.ts`). A missed hook: players expect the Monk and Twin-Blade to play differently.
- Spawn in the sect hub: strong first impression (a1_spawn.png). Locked techniques are shown with unlock levels (good teaser).
- Nameplate "Merchant Qiao - Shop" is partly under the minimap at 1280x720 and 844x390 despite the round 8 fix.
- Gate with unmet requirements: toast states exactly what is needed (c1_gate_refused.png). With requirements met, travel to Ch2 worked (HP preserved). Three rapid `useGate()` calls produced one clean trip (`traveling` guard).
- Ch2 arrival (c1_ch2_arrival.png): frost-tinted copy of the Ch1 hub. Objective bar still showed the attack tutorial text; my run skipped tutorial flags via hook, so a real player likely will not see it (UNVERIFIED).
- Whitefrost Pass (c1_ch2_frostpass.png): enemy vision cones are large yellow fans, informative but noisy with 5+ mobs; tan blotches in the snow; frost wolves near-black.
- Crystal Hollow (c1_ch2_crystal.png): the Colossus (teal golem) reads well, sweep arc clear, boss bar fine. The zone anchor sits inside the boss arena.
- Dialogue with two wolves adjacent: world pauses (hp 100 -> 100 over 6 s). No free hits, but also an exploit-free escape from any fight via shop/dialogue.
- Quest accept with a full 20/20 bag works; reward path shows an "inventory too full" toast per code (turn-in with full bag not driven: UNVERIFIED).
- Resize 844x390 -> 390x844 -> 1280x720 mid-game: no crash, simulation continued (qa/resize_back.png).

INFERRED
- Audio is fully procedural WebAudio (SFX + ambient music); not heard. No per-zone or boss track variety found in `audio.ts`.
- Story pages never exercised (skipped when `navigator.webdriver`).

## 5. Ranked bug / issue list

| # | Sev | Issue | Repro | Evidence |
|---|---|---|---|---|
| 1 | S3 | Touch 844x390: Sound button overlaps Quest button (label clipped "Ques"). In TASKS.md as known, unfixed; e2e overlap check misses it (button outside `#hudlayer`). | `/?touch=1`, viewport 844x390 | qa/touch844.png |
| 2 | S3 | Portrait 390x844 broken: minimap covers the objective bar, touch buttons overlap skill bar and potions. | resize to 390x844 with `?touch=1` | qa/touch_portrait.png |
| 3 | S3 | Warden wall at L9 + shop gear; flat 40 HP potions cannot sustain; no in-game "recommended level" hint. | qa/b2.cjs warden 1682 steel-blade,sect-robe,jade-pendant 8 | qa/warden.log (res=died, boss 426/6600) |
| 4 | S3 | Ch2 trivialised by free quest gear; Outpost shop duplicates rewards; stones have no sink. | equip Froststeel+Frost Mail at L12, kill Ch2 mobs | qa/c1.log; `src/data/quests.ts` L86, L102; `src/core/shop.ts` OUTPOST_STOCK |
| 5 | S3 | Ch2 art repetition (hub clone, Sovereign = tinted Warden, tinted mobs). Declared PLACEHOLDER. | enter Ch2 | qa/c1_ch2_arrival.png, qa/c1_ch2_frostpass.png |
| 6 | S3 | Quests+bosses reach the Ch1 gate level and the L20 cap without grinding; XP after cap silently discarded. | data | calc.cjs |
| 7 | S4 | Mana starvation (6-15/82 during whole boss fight). | boss fight | qa/warden.log |
| 8 | S4 | Mob TTK spread inside a zone (Ash Soldier 1.3 s vs Barrow Guard 10.9-25.7 s, 183 damage). | qa/c1.cjs | qa/c1.log |
| 9 | S4 | Merchant nameplate partly under the minimap (1280x720, 844x390). | new game | qa/a1_spawn.png, qa/touch844.png |
| 10 | S4 | Whitefrost ground blotches, near-black frost wolf tint, heavy vision cones. | teleport to frostpass anchor | qa/c1_ch2_frostpass.png |
| 11 | S4 | Elder Treant took 28.6 s at L2 with zero damage taken: sponge or stuck behind a prop; cause not investigated. UNVERIFIED. | spawn treant at L2 | b1 run output (not saved to file) |
| 12 | S4 | Test hooks `spawn`/`spawnElite` hardcode zone tiers ('bamboo'/'marsh'), so e2e never fights a Ch2-tier mob (test gap). | `installTestHooks` | source |
| 13 | S4 | Tutorial objective can outrank chapter objective text in Ch2 if tutorial flags are unset (hook-only). | skip tutorial, travel | qa/c1_ch2_arrival.png |
| 14 | S4 | Bot second-wolf fight timed out at 90 s at L1; likely my bot chasing respawned wolves. UNVERIFIED. | qa/b1.cjs | b1 run output |

No S1/S2 found in what I exercised. Not exercised: death + respawn inside Ch2 (code: `respawn()` uses the current chapter's spawn), save mid-travel (`travelTo` saves before restart), export/import via the real file dialog.

## 6. Benchmark-derived proposals (mechanics only; no IP, art or text)

Sources (standard web search, thin; supporting only): Hades dash/telegraph/boon discussions ([steam thread](https://steamcommunity.com/app/1145360/discussions/0/2442588190937355878), [Hades II action gameplay](https://astra.bearblog.dev/hades-ii-action-gameplay), [wiki: Unblockable](https://hades.fandom.com/wiki/Unblockable)); Vampire Survivors design essays ([Secret Sauce](https://jboger.substack.com/p/the-secret-sauce-of-vampire-survivors), [banish](https://gmdq.substack.com/p/vampire-survivors-banish-mechanic)): frequent small choices pace the run, tiny meta increments avoid grind; Tale of Immortal reviews ([GameGeeker](https://gamegeeker.com/games/tale-of-immortal-1468810/review?market=US)) praise breadth but score combat 5.7/10 and call the loop repetitive, which is exactly this project's risk. PoE/Torchlight affixes, Hollow Knight flask, soulslike poise and Genshin reactions are from my own design knowledge, not fetched.

Ranked by value/cost:

| # | Proposal | Value | Cost | How to build here | Risk |
|---|---|---|---|---|---|
| 1 | Healing flask with charges + percent heal (Hollow Knight/Estus style); potions become top-up | 5 | S | `src/core/recovery.ts`: `flask {charges, healPct}`; `GameState.flask` (additive save field); refill at array/NPC/boss kill; HUD slot F; tests in `tests/recovery.test.ts` | balance; save migration |
| 2 | Mana refund on hit/crit + technique cost pass | 5 | S | `src/core/combo.ts`/`hit.ts` `manaOnHit`; tune `src/data/skills.ts`; unit tests in `combo.test.ts` | spam too strong |
| 3 | Boon/insight picks (Hades boons + VS level-up choices): at L5/10/15 and boss kills pick 1 of 3 (combo applies burn, dash leaves blade line, crit after dash) | 5 | M | `src/data/boons.ts` `{id,rarity,effect}`; `src/core/boons.ts` pure `rollChoices(seed, owned)` and `applyBoons(stats, owned)`; `GameState.boons: string[]`; hooks in `deriveStats` and `hitEnemy`; picker in `src/ui/panels.ts` | balance explosion; UI work |
| 4 | Boss poise/stagger + perfect-dodge reward | 4 | M | `BossDef.poise`; `core/boss.ts` accumulates poise damage, enters `staggered` (reuse `recover` state) for ~2 s with x1.5 damage; perfect dash (dash within 0.15 s of a hit) gives short slow-mo + mana | boss retune; hit-stop interplay |
| 5 | Sect upgrade shop (VS-style meta): stones buy small permanent bonuses | 4 | S-M | `src/data/sect.ts` (tiers, cost curve), `core/sect.ts` `buyUpgrade(gs,id)`, `GameState.sect`, panel in `src/ui/trade.ts`. Fixes dead stone economy | keep increments small |
| 6 | Trial tower / endless rift with escalating waves | 4 | M | `src/core/waves.ts` pure generator (seed, floor); arena `MapDef` in `src/data/maps.ts`; reward table in data; floors scale via `scaledEnemy`; post-cap content | needs in-scene map transition path (see 7.3) |
| 7 | Per-hero technique kits (6 looks become 6 classes) | 5 | L | `SkillDef.heroes?`, `HeroDef.kit`, resolve in `core/skills.ts`; needs combat animations the pack lacks for 3 heroes | art-dependent; test matrix |
| 8 | Loot affixes (PoE/Torchlight-lite), 1-3 rolled on rare+ gear | 4 | M-L | `src/data/affixes.ts`; `core/loot.ts` `rollItem(seed, ilvl)`; inventory must move from id strings to item instances (largest cost); tooltip UI | biggest save/schema migration |
| 9 | Root reactions (Genshin-style pairs): burn + slow already exist (`rootEffect`, `tickBurn`) | 3 | M | `core/reactions.ts` pure table consumed in `core/hit.ts`; fx in `fx.ts` | readability |
| 10 | Cultivation insight events and wandering-sage encounters (breadth without copying) | 3 | M | `src/data/events.ts` weighted table + `core/events.ts`; dialogue UI exists | content volume |

Cheap and high impact outside mechanics: replace Ch2 hub and ground, give the Sovereign its own silhouette, and differentiate Ch2 mobs with affixes instead of tints only.

## 7. Code health (static review; `src/game/WorldScene.ts` 1322 lines, one class, ~60 methods)

Top refactor risks
1. **God class.** Input, combat resolution, enemy stepping, boss events, quest/dialogue/trade orchestration, chapter travel, HUD feed, FX and test hooks share one class. Boons, flask, tower each touch 4+ areas. Extract `CombatSystem` (hitEnemy/hitBoss/hurtPlayer/killEnemy/onKill), `EnemyDirector` (spawn/topUp/updateEnemy), `BossController`, `ChapterFlow` (useGate/travelTo/story) behind a small context interface.
2. **State duplication via push/pull.** `pc` (live combatant) vs `gs` (saved state) synchronised with `pushToState`/`pullFromState`/`mutate` at ~20 sites (e.g. lines 249-260, 357, 431-434, 795, 854, 963-966). A missed push silently loses HP/position; travel and respawn copy by hand.
3. **`scene.restart` as the transition mechanism** (`travelTo`, `respawn`): every listener/UI mount must be torn down manually (long shutdown list near line 208). A tower map or in-place respawn multiplies this.
4. **Chapter coupling.** `spawnEnemy(..., zone = 'bamboo')`, hooks defaulting to Ch1 zones, one `ZONES` record keyed by a `ZoneId` union with `chapter` filters, per-chapter stock constants in `shop.ts`. Chapter 3 means editing `ZoneId`, `ZONES`, `CHAPTERS`, `MapDef`, shop stock. Move stock/zones into `ChapterDef`.
5. **Inventory holds item ids as strings**, so loot affixes force a schema + save + UI rewrite; decide the item-instance shape before adding gear variety.
6. **Test hooks in the production bundle** (`__rpg.giveXp/setHp/defeatBoss/...` installed unconditionally): console cheating and larger attack surface. Gate behind a flag.
7. **Imperative DOM UI** (`src/ui/*.ts`, 787 lines) with ad hoc overlap logic (`underMinimap`); each panel re-solves layout, which is how the sound/Quest overlap survived.

Test gaps
- No test fights a Ch2-tier mob, Ch2 bosses beyond Corpse King, dies/respawns in Ch2, or saves/loads across a chapter change with active quests.
- Overlap check scans only `#hudlayer` children; no portrait test.
- No balance regression test. Combat is pure, so a headless fight sim in `src/core` (player level/kit vs boss) could assert duration and damage bands; my 3.2 numbers could seed it.
- e2e depends on game time under load (known flakiness); my bots ran at 0.6-0.9x speed.
- Story pages are skipped under `navigator.webdriver`; only `?story=1` exercises them.

## 8. Recommended order of work

Round A (balance and feel, mostly data): flask with charges/percent heal (P1); mana on hit and technique cost pass (P2); headless fight-sim test plus rebalance of Warden and Ch2 mobs/bosses; make Ch2 gear not free (rewards become materials/tokens or shop-only) and add stone sinks (P5); fix touch bugs 1-2 and nameplate clipping; show "Recommended Lv" on boss banners.

Round B (depth): boon/insight picks (P3); boss poise + perfect dodge (P4); root reactions (P9); fix the cap problem (raise cap with a Foundation Establishment realm or shift XP weight to mobs); play through the story pages with `?story=1`; begin extracting `CombatSystem` and `ChapterFlow`.

Round C (replay and identity): trial tower / rift (P6); Ch2 art pass (hub, ground, unique Sovereign, de-tinted mobs); one hero with a distinct kit (P7); decide the item-instance schema and then loot affixes (P8).
