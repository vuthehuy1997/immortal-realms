# Decisions (ADR log)

## ADR-001 Engine: Phaser 4.2.1 + TypeScript + Vite — APPROVED by owner 2026-10-16
Options: Phaser 3.90 (final 3.x, MIT), **Phaser 4.2.1 (MIT, stable since 2026-04-10, chosen)**, PixiJS 8, Godot Web Export.
Why Phaser 4: vendor recommends it for new projects; TilemapGPULayer / SpriteGPULayer suit large maps and many entities; unified filters and `setLighting` suit VFX. Initial draft favoured 3.90 out of unfamiliarity; research (phaser.io 3-vs-4 and migration posts, npm release history) showed 4.x is stable.
Caveats: performance claims are vendor-sourced and NOT yet measured by us (task M0-4); fewer third-party examples; Mesh/Plane/Camera3D removed (not needed).
Rejected: PixiJS (we would build tilemap/input/scenes ourselves); Godot (large wasm, weaker web integration).
Mitigation: simulation isolated in `src/core`.

## ADR-001b TypeScript pinned to 6.0.3
typescript-eslint 8.71.2 peers `typescript <6.1`, so TS 7.x is not installable with lint. Revisit when typescript-eslint supports TS 7.

## ADR-002 Architecture: deterministic core sim separated from rendering. Fixed timestep, seeded RNG, data-driven content.
## ADR-003 Test stack: Vitest (logic), Playwright (browser e2e/perf smoke).
## ADR-004 Art source: free web assets — UPDATED 2026-10-17
Phase 1 used Kenney 16px packs as placeholders; the owner rejected the result ("simple and ugly, where are the martial arts/xianxia/graphics/animation").
Now: **willYEE Xianxia Pixel Pack (CC0)** — animated xianxia heroes/monsters/bosses, scenery, 27 spell effects, jade UI kit. Verified at source (see ASSET_LICENSE_AUDIT). Disclosed by the author as AI-generated (Gemini/Veo) — risk and mitigation recorded in the audit; owner decision required before commercial release.
Perspective: top-down 2.5D world with side-view sprites (mirrored by negative X scale), y-sorted scenery, tall props fade when they hide a character.
Ground is original and procedural (baked canvas texture: warped biome borders, flagstones, pebbles, ripples).
Spell FX are monochrome strips tinted by the character's Spirit Root colour (flame/tide/verdant) and drawn additively.

## ADR-005 Persistence: versioned JSON save in IndexedDB/localStorage with migrations.
