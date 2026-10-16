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

## Art assets (third-party, in `assets/third_party/`)
| Name | Source URL | Author | Version | License | Commercial | Attribution | Status | Evidence |
|---|---|---|---|---|---|---|---|---|
| Kenney Tiny Dungeon (16x16) | https://kenney.nl/assets/tiny-dungeon | Kenney | 1.0 (2022) | CC0 1.0 | Yes | Not required (credit "Kenney" optional; do not use Kenney logo) | Verified 2026-10-16 | kenney.nl/support quote "public domain licensed (CC0)... free to use, even in commercial projects"; bundled `License.txt` in `assets/third_party/kenney-tiny-dungeon/`; zip sha256 `c109438ab06f65fd80f9b2686a4cf9c7c11dc64444b47333ec71d602f8bb5fc7` |
| Kenney Tiny Town (16x16) | https://kenney.nl/assets/tiny-town | Kenney | 1.1 | CC0 1.0 | Yes | Same as above | Verified 2026-10-16 | bundled `License.txt` in `assets/third_party/kenney-tiny-town/`; zip sha256 `9768692dccff1d706408a5aedd6ca4f6cd1409506cbc84cb2f862919764be977` |

### Candidates found, NOT downloaded, NOT verified (do not use until verified from the download page)
- Puny World tileset (Shade, OpenGameArt, listed CC0), RPG Tileset by russpuppy (https://opengameart.org/content/rpg-tileset, page lists CC0), Adventure Awaits Pack 1.0 (IshtartPixels, "free for commercial"), OPP2017 Village (multi-license, confirm CC0 option).
- Rejected: Minimalist Chinese Temple tileset (CC-BY 3.0, attribution, side-view); LPC assets (CC-BY-SA share-alike risk) — not evaluated further.
- Caveat: OpenGameArt pages can be edited; re-check license at download time and store a snapshot.

TODO: transitive dependency scan (license-checker) before release. No art/audio assets used yet.
