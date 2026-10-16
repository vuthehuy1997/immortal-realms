# TASKS
Status: [x] done, [ ] todo. Format: ID — task (deps) — acceptance.
- [x] M0-1 Scaffold (—) — `npm run build` & `npm test` pass; preview serves HTTP 200.
- [x] M0-2 Playwright boot e2e — WebGL renderer, frames advance, no page errors (headless Chromium, SwiftShader).
- [x] M0-3 ESLint — `npm run lint` clean.
- [ ] M0-4 Phaser 4 perf spike (M0-2) — measure fps: large tilemap (GPU layer), ~200 sprites, particles; record numbers in docs.
- [ ] M0-5 Transitive license scan (license-checker) into ASSET_LICENSE_AUDIT.
- [ ] M1-1 Tilemap world + camera (M0) — player walks small map, camera follows.
- [ ] M1-2 Input + movement view using core/movement.
- [ ] M2-1 Combat core (damage, cooldown, hp/mana) with unit tests.
- [ ] M2-2 Enemy FSM x3 types.
- [ ] M3-x Skills/VFX/boss; M4-x progression/cultivation; M5-x NPC/quest/inventory; M6-x save/load/menu/creation; M7-x polish/perf/security.
Placeholders to replace: BootScene text (src/game/BootScene.ts).
