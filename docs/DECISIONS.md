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
## ADR-004 Art source: free CC0/commercial-OK assets from the web — APPROVED by owner 2026-10-16
Slice art base: Kenney Tiny Dungeon + Tiny Town (16x16, CC0), verified (see ASSET_LICENSE_AUDIT).
Known trade-offs (honest): packs are Western-fantasy pixel style, not xianxia; free packs rarely match each other, so mixing sources risks an inconsistent look. This does not meet "HD-pixel, unified, xianxia" for release.
Plan: use Kenney for the vertical slice; recolor/extend with original tiles (e.g. Eastern roofs, robes, sect banners, qi VFX we draw/shader ourselves); keep a per-asset replacement list; reassess commissioned or original art before commercial release.
Rule: every new asset gets a registry row + license file copy + sha256 before use.

## ADR-005 Persistence: versioned JSON save in IndexedDB/localStorage with migrations.
