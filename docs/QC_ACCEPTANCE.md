# QC Acceptance — Vertical Slice (derived from owner's Phase 2 list)

Gate: `npm run qc` (lint → typecheck → build → unit → e2e) must be green AND every row below ✅ with evidence.
Loop: implement → `npm run qc` → inspect screenshots (`qc-artifacts/`) → fix → repeat. Rows only turn ✅ with a passing automated test (unit/e2e) named here.
Limits (honest): automated QC cannot judge fun, balance, or art quality; those stay "owner playtest" items.

| # | Requirement | Acceptance criteria | Verified by | Status |
|---|---|---|---|---|
| 1 | Main menu | New Game / Continue (disabled w/o save) / works with keyboard+mouse | e2e menu | ✅  |
| 2 | Character creation | Name (1-16 chars, validated) + 3 roots with different stats; starts game | unit character, e2e create | ✅  |
| 3 | Small world map | Bounded map, collision, boss lair zone | unit world (done), e2e | ✅ M1 |
| 4 | Movement | WASD/arrows, wall slide, map bounds | unit+e2e movement | ✅ M1 |
| 5 | Combat zone | Enemies spawn and fight | e2e combat | ✅ M2 |
| 6 | 3 enemy types | rusher / caster / charger distinct behaviours | unit enemyAI | ✅ M2 |
| 7 | Boss w/ mechanics | ≥3 phases, telegraphed AoE, summons, enrage; killable; drops reward | unit boss, e2e boss | ✅  |
| 8 | 3 skills | cost, cooldown, distinct shapes | unit combat, e2e | ✅ M2 |
| 9 | HP/mana/damage/cooldown | formulas + HUD | unit combat, e2e | ✅ M2 |
| 10 | XP & level up | XP curve, stat gain, full heal on level | unit progression, e2e | ✅  |
| 11 | Cultivation | meditate→qi, breakthrough w/ chance & failure cost, realm stat bonus | unit cultivation, e2e | ✅  |
| 12 | NPC dialogue + quest | dialogue reflects quest state; accept/progress/turn-in; reward granted; chain to boss quest | unit quest/dialogue, e2e | ✅  |
| 13 | Inventory & items | add/stack/remove/use/equip, drops, UI panel | unit inventory, e2e | ✅  |
| 14 | Save/load | roundtrip identical state; tamper/corrupt rejected; Continue restores | unit save, e2e reload | ✅  |
| 15 | Responsive desktop UI | no overflow/overlap at 1024x600, 1280x720, 1920x1080 | e2e viewport + screenshots | ✅  |

Non-functional: 0 page errors in all e2e; lint/typecheck clean; 60 FPS baseline smoke; no unverified assets (see ASSET_LICENSE_AUDIT).


## Run log
- 2026-10-16: `npm run qc` green: lint clean, typecheck clean, build OK, 89+ unit tests, 38 e2e tests (also 5x repeat = 190/190 with serial workers). Screenshots in `qc-artifacts/` (gitignored, regenerated each run).
- Bugs found & fixed by QC (see BUGS.md): HUD hid the menu; Phaser 4.2.1 keyboard queue replays events (double-toggled panels) -> own DOM KeyInput; level label wrapped at 1024px; tests relied on wall-clock instead of game time.
- Still NOT verified by automation: fun/feel/balance, art quality, real-GPU perf, Firefox/WebKit, touch/gamepad, audio (none yet), long sessions.

## Visual & feel gate (added after owner feedback 2026-10-17)
Automated tests cannot judge beauty. A milestone also needs screenshot review (`qc-artifacts/`, plus the zone/combat screenshots in the session log) against this list:
- [x] Characters, enemies and bosses are animated (idle/walk/attack/hurt/death) — hero idle/walk/3-hit combo/dash/cast, mobs idle/move/attack/hurt/death, boss telegraphs.
- [x] Martial-arts kit: 3-hit combo, dash with i-frames, 4 techniques (projectile, piercing wave, stunning burst, ground rain) with tinted spell FX, hit-stop, knockback, camera shake, damage numbers.
- [x] Xianxia identity: sect village with palace/pagoda/gates, bamboo forest, marsh, peach grove, ruins, boss court; zone banners; spirit array meditation; peach petals, fireflies, mist.
- [x] Skinned UI (jade/gold) with animated hero previews at character creation.
- [ ] Audio (SFX + music) — NOT done.
- [ ] Minimap / world map — NOT done.
- [ ] Merchant, alchemy, loot tiers, second boss — NOT done (merchant/alchemist NPCs stand in the village, no shop yet).
- [ ] Real-GPU performance — only software GL measured (~37 fps in the headless test machine).
