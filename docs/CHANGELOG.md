
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
