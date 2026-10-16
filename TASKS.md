# TASKS
Status: [x] done, [ ] todo. Format: ID — task (deps) — acceptance.
- [x] M0-1 Scaffold (—) — `npm run build` & `npm test` pass; preview serves HTTP 200.
- [x] M0-2 Playwright boot e2e — WebGL renderer, frames advance, no page errors (headless Chromium, SwiftShader).
- [x] M0-3 ESLint — `npm run lint` clean.
- [ ] M0-4 Phaser 4 perf spike (M0-2) — measure fps: large tilemap (GPU layer), ~200 sprites, particles; record numbers in docs.
- [ ] M0-5 Transitive license scan (license-checker) into ASSET_LICENSE_AUDIT.
- [x] M1-1 World + camera — 64x64 deterministic map (seeded), camera follows with integer zoom, bounds.
- [x] M1-2 Input + movement with tile collision (WASD/arrows, wall sliding) — unit + e2e tested.
- [ ] M2-1 Combat core (damage, cooldown, hp/mana) with unit tests.
- [ ] M2-2 Enemy FSM x3 types.
- [ ] M3-x Skills/VFX/boss; M4-x progression/cultivation; M5-x NPC/quest/inventory; M6-x save/load/menu/creation; M7-x polish/perf/security.
Placeholders to replace: BootScene text (src/game/BootScene.ts).

## Art tasks
- [x] ART-1 Kenney tilesheets loaded (pixelArt, integer zoom).
- [ ] ART-2 Original xianxia pass: recolor palette, add Eastern buildings/robes/banners, qi VFX (our own).
- [ ] ART-3 Pre-release art review: replace/commission anything inconsistent; re-verify all licenses.

Placeholders (M1): NPC wizard position/sprite in WorldScene; hero sprite = Kenney hero 85; world is procedural scatter, no authored zones yet; ground drawn as individual images (switch to Phaser tilemap/GPU layer under M0-4).
