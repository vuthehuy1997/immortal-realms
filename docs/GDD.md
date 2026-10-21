# Game Design Document — current build (round 8)
Numbers live in `design/` (generated from the code: `npm run design`); this file says what the game *is*. Setting and names are original (see WORLD_DESIGN.md).

## Loop
Create a cultivator (name, 6 looks, 3 spirit roots) → explore an 80×80 open world of 5 danger zones around the Azure Cloud Sect → fight with a 3-hit sword combo, dash and 4 techniques → gather herbs, loot, stones → level up, meditate and break through realms → follow the quest chain to three bosses.

## Content now (counts from `design/entities/_summary.json`)
- 16 enemy types in 3 behaviours (rusher / caster / charger) + elite variants with golden-name affixes.
- 3 telegraphed multi-phase bosses: Nine-Tailed Fox (Peach Grove), Fallen Sword Immortal (court), Jiao Dragon (Mistveil Marsh pool). Unique drops, repeatable for less.
- 7 quests: main chain pests → fox → warden → champions → jiaolong; side quests from the merchant (toads) and alchemist (herbs).
- 3 NPCs (quest giver, shop, alchemy), 19 items (potions, weapon/armor/charm tiers, quest herb), 4 techniques, 3 realms (Qi Condensation I–III), level cap 20.
- Systems: enemy vision (FOV cone + line of sight, memory, pack alerts, ambush ×1.5), HP regen out of combat, death tax, autosave (not in boss fights), save v4 with migration, minimap + world map, objective arrow, procedural audio.

## Pillars (PRODUCT_VISION.md)
Satisfying real-time combat, meaningful cultivation, a world that reacts (vision AI now; NPC goals later), data-driven content scale.

## Not built yet
Trial tower/dungeon, more realms (Foundation+), sects/NPC schedules, multiple save slots, controller/touch, more bosses.
