# Repo, design flow and build flow: Immortal Realms vs GT-Garden

Compared on 2026-10-21 against `/data/yuu/ai-data/felix/GT-Garden` (read-only; its git refused to open under this user, so history/commit counts were not inspected). Facts below come from the file trees, README, `package.json`, `next-session-prompt.txt` and `docs/` of both repos. GT-Garden is a shared multiplayer town (Node server + SQLite + Phaser client, Docker deploy); Immortal Realms is a single-player browser RPG (static site on GitHub Pages). So not every difference is a defect; the last column says which ones matter.

## 1. Scale snapshot

| | GT-Garden | Immortal Realms |
|---|---|---|
| Code (non-test TS) | ~26.6k lines in `client/ server/ shared/ tools/` | ~4.6k lines in `src/` |
| Test files | 155 `*.test.ts`, colocated beside the code | 17 unit (`tests/`) + 13 e2e (`e2e/`) |
| Docs | 8 dated specs, 24 plans (+ backlogs, rulings, parts), ~23 research notes, `ui-guide.md` | 17 files in `docs/`; 10 of them are 2–10 line stubs (see 3.2) |
| Art | 479 files in `assets/`, built into `client/public/art` by scripts | 465 tracked files under `public/assets/xp`, built by `tools/build_assets.py` |
| Deploy | `deploy.sh` → Docker, trial deploy beside live, rollback tag `:previous` | push to `main` → GitHub Pages; no trial, no rollback step |

## 2. Repo structure

| Aspect | GT-Garden | Immortal Realms | Verdict |
|---|---|---|---|
| Top-level split | `client/` `server/` `shared/` `tools/` `assets/` `docs/` | `src/{core,data,game,ui}` `public/` `tools/` `tests/` `e2e/` `docs/` | Ours is right for a client-only game. The `core` (pure rules) / `data` / `game` (Phaser) / `ui` (DOM) split is the same idea as their `shared/`. Keep. |
| Tests | beside the code (`foo.ts` + `foo.test.ts`) | separate `tests/` + `e2e/` | Either works; ours is fine. Their tests also cover **tools** (art output, palette, contrast, deploy script, Dockerfile). Ours cover none of `tools/`. |
| Source art vs shipped art | `assets/` (source, licences, `CREDITS.md`) is separate from `client/public/art` (generated) | only the packed output is in the repo (`public/assets/xp`); the source pack and `manifest.generated.json` build step are in `tools/build_assets.py` | Gap: source art is not reproducibly in the repo; the licence evidence lives in docs, not next to the art (`LICENSE.txt` only). |
| Generated artefacts | `.gitignore`d (`dist/ data/ shots/`) | `dist/ qc-artifacts/ test-results/` ignored; `src/data/manifest.generated.json` and now `design/` are committed on purpose | Fine, but `design/` must be regenerated in the same commit as data changes (see 5). |
| Entity catalogue | `docs/research/fish-catalogue.md` (+ `tools/fish/catalogue-doc.ts` generating it, with a test) | **none until this change** → `design/` + `npm run design` | Closed by this change. GT-Garden's catalogue-doc generator is the model we copied. |
| Operations docs | README is an operator's manual (ports, backups, restore, outage, trial) | README is thin; ops = "push to main" | Not needed for static hosting, but a *deploy-verification* step is missing (no `gh`, live site never checked after push). |
| Agent/session continuity | `next-session-prompt.txt` (state + what to read + what NOT to raise), project memory, `.superpowers/` | `CLAUDE.md`, `AGENTS.md`, `TASKS.md`, `PROGRESS.md`, memory file | Ours is good; but TASKS/PROGRESS are stale (3.2). |

## 3. Design flow

GT-Garden runs the same loop for every step (written down in `next-session-prompt.txt`):

1. **Research** note in `docs/research/` with sources (one agent, compared against prior art).
2. **Brainstorm** with the owner; owner approves a design *before* any code.
3. **Mock-ups at real scale** in the real game before screens change (`docs/research/mockups/`).
4. **Spec** `docs/superpowers/specs/<date>-<topic>-design.md`.
5. **Plan** `plans/<date>-<topic>.md` split into parts, with a *backlog* (what was deliberately left, struck through when done) and *rulings* (owner decisions).
6. **Build** in a worktree/branch per step via subagent-driven development, with per-task review.
7. **Trial deploy** beside the live game, owner plays, then promote; keep a rollback image.

Immortal Realms actually ran: owner request → code → `npm run qc` + screenshots → independent QA agent report (`QA_REPORT_1..3`) → fix → push. That loop is real and found real bugs (regen after respawn, far-hit chase, missing icons, …), but it differs:

| Step | GT-Garden | Immortal Realms | Gap |
|---|---|---|---|
| Research with sources | yes, every step | only ASSET_LICENSE_AUDIT + ADRs 001–002; combat/AI/boss design had no research note | no benchmark evidence for balance/feel claims (CLAUDE.md rule 8) |
| Written design before build | spec per step | one slice-era GDD; vision AI, side quests, 3rd boss were designed in chat only | design intent for rounds 2–7 exists only in `CHANGELOG.md` and commit messages |
| Mock-up before UI change | yes | screenshots *after* the change | UI regressions (quest panel vs minimap) were found by e2e afterwards |
| Plan + backlog + rulings | yes | `TASKS.md` checklist + QA reports | open items are scattered (QA_REPORT_3 §open, CHANGELOG "Open:", memory) |
| Independent review | per-task subagent review | QA agent once per few rounds | OK; keep, and run it per milestone |
| Trial before live | yes | no (straight to Pages) | cannot try a build without publishing it |
| UI rules | `docs/ui-guide.md`, binding, with checklist + `npm run uicheck` / contrast tools | none; rules are in my head and e2e responsive tests | biggest design-system gap |

### 3.2 Stale or empty docs (found while comparing)

- `docs/GDD.md` still describes the vertical slice ("3 enemy types, 1 boss, 3 skills, 1 NPC") — the game has 16 enemies, 3 bosses, 4 techniques + combo + dash, 3 NPCs, 7 quests.
- `docs/COMBAT_DESIGN.md` still says "dodge-roll, 3 skills"; actual: Shift dash, 4 techniques, 3-hit combo, vision-based AI.
- `TASKS.md` lists M3–M7 as `[ ]` although they shipped; M0-4 (perf spike) and M0-5 (licence scan) really are still open.
- `ART_BIBLE`, `CULTIVATION_SYSTEM`, `NPC_AI_DESIGN`, `WORLD_DESIGN`, `TEST_PLAN` are 2-line stubs.
- Memory file `project-state-and-deploy.md` quotes old test counts and save v3.

## 4. Build / quality flow

| | GT-Garden | Immortal Realms |
|---|---|---|
| Gate | `npm test` (155 files), `typecheck` ×2, `uicheck`, `smoke`, `load` | `npm run qc` = lint + typecheck + build + unit + e2e (~18 min on a loaded box) |
| Visual QA | `shots/` scripts + UI audit docs, contrast tool, palette tests | Playwright screenshots in `qc-artifacts/`, reviewed by eye per round |
| Art pipeline | `tools/pack-art.ts`, scene/fish builders, **tests that check art output** | `build_assets.py` (no tests) |
| Docs generated from data | fish catalogue, guide page, glossary tests | `design/` (new) |
| Known flake handling | n/a seen | 3–4 recurring e2e flakes under load, root cause unknown |
| Perf | `load` tool | `fps ≥ 30` smoke test is environment-sensitive (fails on the shared box even at baseline) |

## 5. What to adopt, in priority order

1. **Keep `design/` fresh** (done now): `npm run design:check` — already caught two real defects (dragon items had no icon; fixed + regression test `tests/data.test.ts`). Next: run it inside `npm run qc` so a data change cannot land without regenerated `design/` (a `git diff --exit-code design/` step).
2. **Refresh the stale docs** (GDD, COMBAT_DESIGN, TASKS, memory) from `design/catalog` instead of by hand — 1 hour, removes the biggest honesty gap.
3. **Adopt spec → plan → backlog per round** for anything new: `docs/specs/<date>-<topic>.md`, `docs/plans/<date>-<topic>.md` + backlog list. Fold `QA_REPORT_*` open items into one `BACKLOG.md`.
4. **UI guide + checklist** (`docs/UI_GUIDE.md`: zones of the screen, tokens, key map, minimum resolutions 1024×600/1280×720) and a `uicheck` that renders each panel at those sizes and fails on overlap — this is what repeatedly broke (minimap/quest/objective/nameplates).
5. **Mock-up before UI change** at real scale (screenshot with the proposed layout) — GT-Garden's rule; cheap for us because the game is already running in Playwright.
6. **Trial deploy**: publish a branch build to a second Pages path (or `gh-pages` preview) before `main`; add a post-push check that the live URL serves the new build id.
7. **Test the tools**: unit tests for `build_assets.py` output (every manifest url exists, no sheet >4096 px) and for `export_design.mjs` (no problems).
8. **Source-art provenance** next to the art (`assets/CREDITS.md` like theirs) with the pack's licence text and the record that it is AI-generated CC0 (known risk).

Not worth copying: Docker/SQLite/backup/outage runbooks, server-side tests, per-account data — they belong to a hosted multiplayer game.
