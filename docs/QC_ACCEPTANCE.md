# QC Acceptance — Vertical Slice (derived from owner's Phase 2 list)

Gate: `npm run qc` (lint → typecheck → build → unit → e2e) must be green AND every row below ✅ with evidence.
Loop: implement → `npm run qc` → inspect screenshots (`qc-artifacts/`) → fix → repeat. Rows only turn ✅ with a passing automated test (unit/e2e) named here.
Limits (honest): automated QC cannot judge fun, balance, or art quality; those stay "owner playtest" items.

| # | Requirement | Acceptance criteria | Verified by | Status |
|---|---|---|---|---|
| 1 | Main menu | New Game / Continue (disabled w/o save) / works with keyboard+mouse | e2e menu | ⬜ |
| 2 | Character creation | Name (1-16 chars, validated) + 3 roots with different stats; starts game | unit character, e2e create | ⬜ |
| 3 | Small world map | Bounded map, collision, boss lair zone | unit world (done), e2e | ✅ M1 |
| 4 | Movement | WASD/arrows, wall slide, map bounds | unit+e2e movement | ✅ M1 |
| 5 | Combat zone | Enemies spawn and fight | e2e combat | ✅ M2 |
| 6 | 3 enemy types | rusher / caster / charger distinct behaviours | unit enemyAI | ✅ M2 |
| 7 | Boss w/ mechanics | ≥3 phases, telegraphed AoE, summons, enrage; killable; drops reward | unit boss, e2e boss | ⬜ |
| 8 | 3 skills | cost, cooldown, distinct shapes | unit combat, e2e | ✅ M2 |
| 9 | HP/mana/damage/cooldown | formulas + HUD | unit combat, e2e | ✅ M2 |
| 10 | XP & level up | XP curve, stat gain, full heal on level | unit progression, e2e | ⬜ |
| 11 | Cultivation | meditate→qi, breakthrough w/ chance & failure cost, realm stat bonus | unit cultivation, e2e | ⬜ |
| 12 | NPC dialogue + quest | dialogue reflects quest state; accept/progress/turn-in; reward granted; chain to boss quest | unit quest/dialogue, e2e | ⬜ |
| 13 | Inventory & items | add/stack/remove/use/equip, drops, UI panel | unit inventory, e2e | ⬜ |
| 14 | Save/load | roundtrip identical state; tamper/corrupt rejected; Continue restores | unit save, e2e reload | ⬜ |
| 15 | Responsive desktop UI | no overflow/overlap at 1024x600, 1280x720, 1920x1080 | e2e viewport + screenshots | ⬜ |

Non-functional: 0 page errors in all e2e; lint/typecheck clean; 60 FPS baseline smoke; no unverified assets (see ASSET_LICENSE_AUDIT).
