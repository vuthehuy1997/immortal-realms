# Technical Architecture
- Stack: TypeScript (strict), Phaser 3.90 WebGL, Vite, Vitest, Playwright.
- `src/core`: pure deterministic logic (movement, combat/damage, cooldowns, stats, progression, cultivation, quests, inventory, save schema). No DOM/Phaser.
- `src/data`: JSON/TS data tables (skills, enemies, items, realms, quests, dialogues) + schema validation tests.
- `src/game`: Phaser scenes, entity views, VFX, input, UI.
- Loop: fixed-timestep sim (e.g. 60 Hz) decoupled from render; seeded RNG for reproducible tests.
- Entities: lightweight ECS-style components in core; views subscribe to state.
- Save: versioned schema, migration functions, checksum; IndexedDB.
- Performance budget: 60 fps desktop with ≤200 active entities; initial JS gzip target <600 KB excluding assets (Phaser alone is ~320 KB gz — budget to be reviewed).
- Security: no eval, CSP header, save-data validation on load, no secrets client-side.
