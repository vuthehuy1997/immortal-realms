# Asset & Dependency License Registry
Columns: Name | Source URL | Author | Version | License | Commercial OK | Attribution | Status | Evidence

| Name | Source URL | Author | Version | License | Commercial | Attribution | Status | Evidence |
|---|---|---|---|---|---|---|---|---|
| phaser | https://www.npmjs.com/package/phaser | Phaser Studio Inc. | 4.2.1 | MIT | Yes | Keep license notice | Verified: registry metadata + `node_modules/phaser/LICENSE.md` (MIT, (c) 2026 Richard Davey, Phaser Studio Inc.) | `npm view phaser license`; LICENSE.md |
| vite | https://www.npmjs.com/package/vite | Vite team | 8.3.4 | MIT | Yes | Notice | Verified (registry) | npm view |
| vitest | https://www.npmjs.com/package/vitest | Vitest team | 5.0.5 | MIT | Yes | Notice | Verified (registry) | npm view |
| typescript | https://www.npmjs.com/package/typescript | Microsoft | 6.0.3 | Apache-2.0 | Yes | Notice | Verified (registry) | npm view |
| @playwright/test | https://www.npmjs.com/package/@playwright/test | Microsoft | 1.64.1 | Apache-2.0 | Yes | Notice | Verified (registry) | npm view |
| eslint, @eslint/js | https://www.npmjs.com/package/eslint | OpenJS Foundation | see package-lock | MIT | Yes | Notice | Verified (registry) | npm view |
| typescript-eslint | https://www.npmjs.com/package/typescript-eslint | typescript-eslint team | 8.71.2 | MIT | Yes | Notice | Verified (registry) | npm view |

## Art assets (third-party)
| Name | Source URL | Author | Version | License | Commercial | Attribution | Status | Evidence |
|---|---|---|---|---|---|---|---|---|
| **Xianxia Pixel Pack** (heroes, mobs, bosses, NPC portraits, props, spell FX, UI kit, icons) | https://willyee.itch.io/xianxia-pixel-pack | willYEE | 2.1 (released 2026-09-22) | CC0 1.0 Universal | Yes | Not required | Verified 2026-10-17 | itch.io page states "CC0 1.0 Universal, full text in LICENSE.txt"; bundled `LICENSE.txt` (copied to `public/assets/xp/LICENSE.txt`); README "License: CC0 1.0 ... Use it commercially, modify it, ship it, resell what you make with it. No credit required."; zip sha256 `76b73304cb3f961fc071b5cb4e15d9da9ab247c1e68bb98dd97211f5b50b2d8f` |

**Provenance risk (AI-generated art) — owner must accept before commercial release.** The pack's README and page state: "Every image in this pack was generated with Google Gemini from written text prompts, then cut, cleaned, aligned and assembled by hand"; character animations were produced from AI video (Google Veo) and cleaned frame by frame. The author dedicates the pack to CC0, but: (1) copyright protection for AI-generated material is uncertain in many jurisdictions, so we may be unable to stop others copying our art; (2) platform rules (e.g. Steam, app stores) may require AI-content disclosure; (3) we rely on the author's statement that no third-party artwork was used as input. Mitigation plan: keep an asset replacement list (docs/TASKS.md), disclose AI-assisted art in release notes/store pages, and commission or hand-make key identity art (hero, bosses, logo) before launch.

How the subset is built: `tools/build_assets.py <pack dir>` selects ~217 animation strips, 36 props, 35 fx strips, UI kit, icons, portraits and palette-quantises them into `public/assets/xp/` (about 5 MB). The source zip is not committed.

Round 22 (2026-10-29): no new files or dependencies. Boss palette ramps are derived in memory at boot from the strips above (`deriveBossLooks`, `src/core/palette.ts`); they are modifications of CC0 art, which the licence allows, and are never written to disk. Dungeon trap, gate, plate, brazier and pit visuals are drawn with canvas Graphics and the pack's fx strips.

Superseded (removed from the repo): Kenney Tiny Dungeon / Tiny Town (CC0). Registry rows kept in git history (commit f3767ba).

### Procedural / original assets
Ground textures, shadows, glows, petals and sparks are generated in code (`src/game/ground.ts`, `src/game/assets.ts`) — original, no licence needed.

### Candidates evaluated, not used
Puny World, RPG Tileset (russpuppy), Adventure Awaits, OPP2017 Village — unverified; Minimalist Chinese Temple (CC-BY 3.0, side-view); LPC (CC-BY-SA).

Transitive scan (M0-5): `npm run license:check`, report in docs/LICENSE_SCAN.md (2 shipped packages, all MIT; 12 dev-only lightningcss builds are MPL-2.0, build tool not distributed). No audio assets used (procedural).
