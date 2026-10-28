# TASKS
Status: [x] done, [ ] todo. Format: ID — task (deps) — acceptance.
- [x] M0-1 Scaffold (—) — `npm run build` & `npm test` pass; preview serves HTTP 200.
- [x] M0-2 Playwright boot e2e — WebGL renderer, frames advance, no page errors (headless Chromium, SwiftShader).
- [x] M0-3 ESLint — `npm run lint` clean.
- [ ] M0-4 Phaser 4 perf spike (M0-2) — measure fps: large tilemap (GPU layer), ~200 sprites, particles; record numbers in docs.
- [x] M0-5 Transitive license scan — `npm run license:check` (in qc), docs/LICENSE_SCAN.md.
- [x] M1-1 World + camera — 64x64 deterministic map (seeded), camera follows with integer zoom, bounds.
- [x] M1-2 Input + movement with tile collision (WASD/arrows, wall sliding) — unit + e2e tested.
- [x] M2-1 Combat core (damage, crit, cooldown, hp/mana, tryCast) — 12 unit tests.
- [x] M2-2 Enemy FSM: rusher (Moss Slime), caster (Wisp Wraith), charger with telegraphed windup (Stone Brute) — unit + e2e tested.
- [x] M2-3 Playable combat: 3 skills (slash arc / bolt / burst), mouse aim, HUD, damage numbers, hit flash.
- [ ] M0-4 follow-up: baseline 60 FPS @ ~6000 objects (software GL, capped). Real stress test + tilemap layer still TODO.
- [ ] M3-x VFX polish (hit-stop, shake, real particles), boss; M4-x progression/cultivation; M5-x NPC/quest/inventory; M6-x save/load/menu/creation; M7-x polish/perf/security.
Placeholders to replace: BootScene text (src/game/BootScene.ts).

## Art tasks
- [x] ART-1 Kenney tilesheets loaded (pixelArt, integer zoom).
- [ ] ART-2 Original xianxia pass: recolor palette, add Eastern buildings/robes/banners, qi VFX (our own).
- [ ] ART-3 Pre-release art review: replace/commission anything inconsistent; re-verify all licenses.

Placeholders (M1): NPC wizard position/sprite in WorldScene; hero sprite = Kenney hero 85; world is procedural scatter, no authored zones yet; ground drawn as individual images (switch to Phaser tilemap/GPU layer under M0-4).

Placeholders (M2): all combat VFX (white arc, green ring, circle bolts) = PLACEHOLDER; enemy sprites reuse Kenney Tiny Dungeon (wraith=ghost, brute=cyclops); skill names are working titles; balance numbers untuned; player has no XP->level yet (M4).

## Slice status (see docs/QC_ACCEPTANCE.md)
- [x] M3 boss Stone Warden (3 phases, telegraphed slam, summons, enrage ring, drops) — core+e2e tested; art/VFX placeholder
- [x] M4 progression (XP/levels) + cultivation (meditate, breakthrough w/ failure cost, realm bonuses)
- [x] M5 NPC dialogue + 2-quest chain; inventory (20 slots, stacks, use, equip, drops) with UI
- [x] M6 main menu, character creation (3 roots), pause, save/load (versioned, validated, checksum), autosave
- [x] M7 responsive DOM UI verified at 3 desktop viewports; QC loop (`npm run qc`)
- [ ] NEXT: owner playtest + tuning; real VFX/hit-stop/audio (ART-2/M3b); xianxia art pass; Firefox/WebKit; transitive license scan (M0-5); real-GPU perf (M0-4)

## 2026-10-17 visual overhaul (owner feedback)
- [x] ART-1/2 replaced placeholder art with CC0 Xianxia Pixel Pack (animated heroes/mobs/bosses/props/FX/UI)
- [x] Procedural ground, 80x80 world with 6 zones, roads, props with collision, occluder fading
- [x] Martial arts: combo, dash, 4 techniques, enemy roster (17 mobs + elites), new boss Fallen Sword Immortal
- [x] AUDIO-1 SFX + ambient music (procedural WebAudio, licence-free)
- [x] MAP-1 minimap (world map overlay still TODO)
- [x] ECON-1 merchant, ALCH-1 alchemy, LOOT-1 weapon tiers + rarity (more of the pack's 60 weapons can be added)
- [x] BOSS-2 Nine-Tailed Fox boss (den in the Peach Grove)
- [x] BOSS-3 Jiao Dragon (round 7)
- [ ] ART-3 replace/commission identity art before commercial release (AI provenance risk, see audit)
- [ ] M0-4 real-GPU perf measurement

## 2026-10-17 QA round 1 -> round 2 (done in worktree ir-work, merged to main)
- [x] All S1/S2 findings from docs/QA_REPORT_1.md; most S3 findings
- [ ] S4-3 trace the 8 WebGL texImage2D warnings on load
- [ ] S4-4 multiple save slots + backup; export/import save
- [ ] S3-4 sharper ground texture at 1080p
- [ ] More content: 3rd boss (Jiao Dragon), side quests, dungeon/trial tower, more realms
- [ ] Controller / touch support

## Rounds 3-8 (see docs/CHANGELOG.md; design snapshot in design/)
- [x] R3 vision AI, regen, death tax, boss tempo, balance, objective arrow
- [x] R4-5 QA fixes, ambush, pack alerts, 1024x600 UI
- [x] R6 side quests (toads, furnace, champions), elite objective, trader dialogue
- [x] R7 Jiao Dragon boss + capstone quest + unique drops, per-NPC portraits
- [x] R8 design/ export gate in qc, NPC nameplates hidden behind minimap, docs refreshed from the code
- [x] R9 save slots (3), backup recovery, export/import
- [x] R10 transitive licence scan (`npm run license:check`, docs/LICENSE_SCAN.md); gamepad support (standard mapping -> virtual keys)
- [x] R11 touch controls (joystick + buttons); chapters framework + Chapter 2 "The Sundered Sky" (112x96 map, 5 zones, 4 NPCs, 6 quests, 3 bosses, 11 enemies, 9 items, outpost shop), Sky Gate between chapters, prologue + chapter intro story pages, save field `chapter`
- [x] R12 QA report 3 round A: spirit flask, mana on hit, ch2 economy/balance + balance regression tests, touch portrait layout
- [x] R13 QA report 3 round B: 15 boons (pick 1 of 3 at every 5th level and on each boss's first defeat), boss poise/stagger (x1.5 damage window), perfect dodge (mana + damage buff + slow-mo), level cap 20->30 with a Foundation Establishment realm at level 20
- [x] R14 QA report 3 round C (part): Trial Rift endless tower (Keeper Ming / Keeper Ren, record-only rewards, guardians every 5th floor), per-hero signature passives (6 heroes), `src/core/tower.ts` pure state machine
- [x] R15 QA report 4 fixes: lifesteal cap 5% and heal-on-real-damage, 5 new behaviour boons (pool 20) + stone reroll + owned list + leftover picks become stones, Scholar/Twin-Blade traits with combat value, rift kills pay 35% XP / no death tax / guardian floors never smaller, Sovereign HP 16500->21000, save-restored-from-backup toast
- [x] R16 QA report 5 fixes: toast manager (merge duplicates, max 4), one-time tips (flask, technique points, perfect dodge, poise, quest log; saved in `GameState.hints`), E/Space confirm dialogue, Q opens quest log, NPC nameplates hide when any part is under the minimap, boon cards with category tag/glyph, trait effect on the character panel, Rift rules in the keeper dialogue, larger control hint
- [x] R17 QA report 5 leftovers: Dao Insight (3 tracks x 10 ranks) as a skill-point sink, small-viewport layout (360x640 portrait, short landscape), crisper nameplates/labels (text resolution 4), wider prop fade over enemies, boon picker usable from keyboard/gamepad (arrows + E/Space/A), test hooks (`__rpg`, `__game`) only under automation or `?debug=1`, Trial Rift logic extracted from WorldScene into `src/game/rift.ts` (1505 -> 1465 lines)
- [ ] Open from QA report 5: audio unverified (headless), painted set pieces vs tiny pixel heroes, WorldScene still ~1460 lines (boons/tips/combat remain inside)
- [ ] Open from QA report 4 (docs/QA_REPORT_4.md): behaviour-boon depth, tower arena + checkpoint, gamepad-only boon picking, perfect-dodge tutorial, __rpg hooks in prod bundle, WorldScene 1460+ lines, merchant nameplate under minimap
- [ ] PLACEHOLDER (R14): the Trial Keepers reuse the saber/twin-blade hero sprites; the rift has no arena of its own (fights happen beside the keeper in the hub); heroes differ by passives only, not by techniques
- [ ] Next from QA report 3: round B leftovers (root reactions, play the story pages with ?story=1); round C leftovers (loot affixes need per-item instances = save format change; distinct technique kits per hero; ch2 art; WorldScene extraction: tower logic still lives in WorldScene); old list: round C trial tower, ch2 art, one distinct hero kit, loot affixes; refactor WorldScene (pc/gs duplication)
- [ ] Depth roadmap (docs/CHAPTERS_DESIGN.md): Phase 2 chapter 3+, more realms, trial tower, reputation; Phase 3 per-hero martial arts, companions, sect/crafting
- [ ] PLACEHOLDER (R11): chapter 2 art is recoloured reuse of pack sprites (frost/crystal/ash mobs, Corpse King, Crystal Colossus, Sundered Sovereign); replace before release. Chapter 2 balance is untuned (no human playtest). Touch layout: Quest button overlaps the sound button.
- [ ] Open: human playtest of ruins/normal-mob difficulty and dragon balance; flaky e2e under load (killOne/combo/boss); real-GPU perf (M0-4); licence scan (M0-5); UI guide + overlap check; trial deploy path; trial tower; more realms; touch controls; controller menu navigation and right-stick aim; tested only with a faked pad, not a physical one
- [x] R18 world expansion: 5 chapters, 6-8 zones each, 19 caves/secret realms, maps 2-3x larger, content modules, level cap 50, chunked ground (see docs/CHANGELOG.md, docs/CONTENT_GUIDE.md)
- [ ] PLACEHOLDER (R18): ALL chapter 3-5 art is recoloured/enlarged reuse of the pack's mobs, bosses, NPC sprites, portraits, props and item icons (tints do not recolour green bosses well: the sand wyrm is still a green dragon); dungeon gates reuse moonwall/taihurocks. Replace before release.
- [ ] Unverified (R18): balance of chapters 3-5 is formula-checked only (no human playthrough); chapter quest chains were data-checked, not played; dungeon boss fights not played; perf of the 160-176 tile maps measured only under loaded software GL (perf smoke: new build 21 fps vs old build 24 fps in the same loaded run; both under the 30 fps bar)
- [ ] Known: e2e/boons.spec.ts:69 (real dash through a boss slam) and e2e/world.spec.ts:142 (fps) fail on the pre-R18 build too under current machine load (load average 30-60)
- [ ] Ideas: tower arena, loot affixes, distinct hero technique kits, dungeon-specific mechanics (traps, puzzles), cave wall art, set pieces for ch3-5 hubs

- [x] R19: QA round on the new world: bag-full dungeon reward kept in `pending`, back-gate landing, ch3-5 quest XP rebalanced, gate messages name bosses, no monsters at dungeon gates
- [ ] Open from R19 QA: boss art recycled (19 of ~34 bosses use 3 sprites), cave/realm interiors sparse with a single generator each, ch2 snow zones near-identical, grey brick floor reused in many zones, 14 of 19 dungeons have 3.4-4 wide tunnels that pin big bodies (radius 9), boss winnability at minLevel not hand-played, props on water/void unchecked on screen

- [x] R20 depth pass 1: lint ignores `.claude/**` (stale agent worktrees broke `npm run lint`); per-hero technique kits (`kitFor`/`setKit` in `src/data/skills.ts`): each hero re-skins the 4 slots (names, numbers) with twists: fans (heroine, twin-blade, scholar), pull + heal burst (scholar, monk)
- [ ] R20 open: kit art/FX are the shared pack strips tinted by root (no per-hero VFX); kit balance is formula-checked (sustained-damage band test) only, not hand-played; fan/pull/heal not yet covered by an e2e that counts bolts or HP; next depth steps: unique boss sprites + mechanics for ~8 main bosses, dungeon mechanics (traps/puzzles), loot affixes (save format change)

- [x] R21 QA report 6 fixes and depth (docs/CHANGELOG.md "Round 21"): B1 panel layout, B2 float stacking + plate fade, B3/B4 kit balance, B5 per-hero strips/tints/icons, B7 hooks out of prod bundle, B8 Cloudhollow floor, stun markers, boss aura + Obsidian Colossus contrast, ch5 boss HP trim + boss curve test, distinct hubs 3-5, keycap control hint
- [ ] R21 open (PLACEHOLDER): hero technique art is still the pack's strips recoloured per hero, no truly new VFX; ~19 boss sprites are still recycled (aura/tint only); dungeon interiors still use one generator per kind; hub art reuses the same pavilion/pagoda sprites in new layouts; B6 (objective bar after hook travel) not changed, hook-induced
- [ ] R21 unverified: hand feel of the retuned kits and ch1 boss at L5-8, human pass over the ch5 HP trim, audio, real-GPU fps, boon picker and toast cap not re-checked
- [ ] Next from QA report 6: unique sprites + mechanics for ~8 main bosses, dungeon mechanics (traps/puzzles), per-dungeon floor/wall variants, loot affixes (save format change), kit-aware tutorial tips (boon picker, perfect dodge, poise before first boss)
