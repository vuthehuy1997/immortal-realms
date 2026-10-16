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
## ADR-004 Art direction: original HD-pixel fantasy-xianxia; art must be self-made/AI-generated-with-verified-terms or CC0/commercial-licensed. Pending owner choice of art source.
## ADR-005 Persistence: versioned JSON save in IndexedDB/localStorage with migrations.
