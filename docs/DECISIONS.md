# Decisions (ADR log)

## ADR-001 Engine: Phaser 3.90 + TypeScript + Vite — PROPOSED (needs owner approval)
Options evaluated:
- **Phaser 3.90 (MIT)**: mature 2D WebGL, tilemaps, cameras, particles, arcade physics, large ecosystem. Chosen.
- **Phaser 4.x (MIT, npm latest 4.2.1)**: newer renderer; rejected for now to avoid API/ecosystem risk; revisit after slice.
- **PixiJS 8 (MIT)**: faster renderer but we would build scenes, input, tilemap, audio ourselves.
- **Godot Web Export**: strong tooling, but large wasm bundle, weaker web integration/debuggability, SharedArrayBuffer/COOP-COEP hosting constraints.
Rationale: fastest path to a playable, testable slice; WebGL; permissive license.
Mitigation: simulation isolated in `src/core` so the renderer can be swapped.

## ADR-002 Architecture: deterministic core sim separated from rendering. Fixed timestep, seeded RNG, data-driven content.
## ADR-003 Test stack: Vitest (logic), Playwright (browser e2e/perf smoke).
## ADR-004 Art direction: original HD-pixel fantasy-xianxia; art must be self-made/AI-generated-with-verified-terms or CC0/commercial-licensed. Pending owner choice of art source.
## ADR-005 Persistence: versioned JSON save in IndexedDB/localStorage with migrations.
