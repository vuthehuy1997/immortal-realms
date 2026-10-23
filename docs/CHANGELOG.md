
## Round 3
- Enemy vision: 130° cone, sense radius, line of sight, turn rate, last-seen memory (3s), no attacks without sight, "!"/"?" cues, faint cone overlay; hits wake enemies.
- Perf: vignette moved from WebGL filter to CSS; antialias off. Fx strips repacked (<=4096px).
- Minimap enlarged with zone label, click opens world map. Audio motif fix; Esc works after volume slider.
- Recovery: out-of-combat HP regen (faster on array), death tax max(15,10%) capped at carried stones.
- Bosses: repeat-kill stones x0.3, no autosave in boss fights, variable windup (>=85% of nominal) and gaps.
- Balance: rusher windups longer, root tweaks (flame crit 5%, tide slow+mana, verdant 9% lifesteal), elites tougher, ruins tier 3.0.
- UI: quest objective overrides tutorial, objective arrow avoids HUD, locked-slot labels, NPC nameplate backplates, elite labels near player only, no zone banner in boss/death.
- QA round 3 fixes: HP regen reset on world (re)entry (R3-1), enemies struck from afar keep hunting (R3-2), 3s grace on entering the world (R3-3), death tax floor 5 (R3-4), clearer vision cone and '!' (R3-10), tighter minimap label vs quest panel (R3-6/9). Open: human playtest of ruins difficulty (R3-5), pack alerts/sneak bonus, 1024x600 panel clipping.

## Round 5
- Stealth: ambush bonus x1.5 on unaware enemies ("Ambush!"), pack alert (70-unit radius) when a packmate is struck.
- UI at 1024x600: world map labels clamped inside the frame, map hint moved to top, character panel stops above the hotbar, trade window narrower, objective line hidden during boss fights.
- Open: ruins/normal-mob difficulty needs a human playtest; NPC nameplates can sit behind the minimap at some resolutions.

## Round 6
- Side quests: "Toads in the Ledger" (Merchant Qiao), "Herbs for the Furnace" (Alchemist Yun), "Trial of Champions" (Elder Lin, elite kills). New `elite` objective type, `reward.stones`, traders offer quests alongside their shop (dialogue 'Browse wares'), generic objective/arrow for any giver/target zone. Old saves are migrated (missing quests added as inactive).

## Round 7
- Third boss: Jiao Dragon of the Mist Pool (Mistveil Marsh, new arena `world.pool` with willows/standing stones, road extended). Water kit (sweep, rain geysers, charge, orb ring, drowned-ghost summons), 7400 HP; unique drops Jiao Dragon Pearl (charm) and 60% Dragon-Scale Robe. Art reuses the existing `boss.jiaolong` sheets (same CC0 AI-generated pack, risk unchanged).
- Quest "The Dragon of the Mist Pool" from Elder Lin, offered after Trial of Champions (capstone). `BossDef` gains `zone` (minion zone) and `home: 'pool'`.
- Dialogue portraits are data (`NpcDef.portrait`): Merchant Qiao = peddler, Alchemist Yun = alchemist; merchant shop window uses the peddler too.
- Tests: boss move e2e for the dragon (5), kill/drop e2e, portrait e2e, unit tests for the quest chain/portraits/world pool reachability.
- Not verified: dragon balance by a human (stats are an estimate, ~Warden-tier), real-GPU performance.

## Round 8
- Fix: NPC nameplates and quest marks are hidden when they would sit behind the minimap (DOM widget over canvas); e2e `round8.spec.ts`.
- `npm run qc` now runs `design:check` (regenerates `design/`, fails on orphan/unobtainable/iconless content).
- Docs refreshed from the code: GDD, COMBAT_DESIGN, NPC_AI_DESIGN, CULTIVATION_SYSTEM, WORLD_DESIGN, TASKS (stale since the vertical slice).

## Round 9
- Save slots: 3 slots (slot 1 keeps the old key, so existing saves load), slot manager screen (Load / Export / Import / Delete with confirm), slot picker on character creation (default = first empty slot, warning when replacing). Pure logic in `src/core/slots.ts` (injectable storage, 8 unit tests); `src/game/storage.ts` is the thin localStorage wrapper.
- Automatic backup: each save keeps the previous valid save as `<slot>.bak`; a corrupted main file is restored from it ("restored from backup"); a corrupt file is never copied over a good backup.
- Export downloads the save JSON; import validates (version, checksum, schema) before writing and never touches the slot on refusal.
- Tests: updated corruption and "starting over" e2e (no backup / pick slot 1), new e2e for the full slot flow.
- Not verified: export/import through a real browser file dialog (e2e covers the logic; the download/upload buttons themselves were not driven), behaviour with localStorage blocked beyond the guarded fallbacks.

## Round 10
- `tools/license_scan.mjs` / `npm run license:check` (part of qc): offline scan of package-lock + installed package.json. 2 shipped packages (all MIT); 157 dev-only, 12 MPL-2.0 (lightningcss, build tool, not distributed). Report: docs/LICENSE_SCAN.md. Reads declared licences only, not LICENSE text.
- Gamepad support: `src/core/gamepad.ts` (pure mapping, 6 unit tests) feeds `KeyInput.pollGamepads()` so pads reuse the keyboard handlers. Left stick/d-pad move, A attack, B dash, X interact, Y meditate, LB/RB/LT/RT techniques 1-4, Back map, Start pause, stick clicks inventory/character. Potion hotkeys (F/G) have no pad button yet.
- e2e/gamepad.spec.ts drives a faked `navigator.getGamepads`; no physical controller was tried.
