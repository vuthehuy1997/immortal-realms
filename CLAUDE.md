# CLAUDE.md — Immortal Realms

Web cultivation RPG (original IP). Tale of Immortal is a *gameplay-depth benchmark only*.

## Session start (mandatory)
Read CLAUDE.md, TASKS.md, PROGRESS.md before working.

## Environment
- Node is installed at `~/.local/node/current/bin` (add to PATH if missing).
- Sandbox proxy breaks loopback: export `NO_PROXY=127.0.0.1,localhost` (set in playwright.config.ts). Never `pkill -f` patterns that match your own command line.
- Commands: `npm run lint` too; `npm run dev | build | typecheck | test | test:e2e`.

## Rules
1. Never copy code/art/characters/text from Tale of Immortal or any unverified source.
2. Every dependency/asset goes in `docs/ASSET_LICENSE_AUDIT.md` with license evidence BEFORE use. Unverified assets never ship.
3. Game rules live in `src/core` (pure TS, no Phaser imports, deterministic, unit-tested). `src/game` is rendering/input only.
4. Content is data-driven (`src/data/*`), validated by schema tests.
5. Never skip TypeScript/lint/test failures. Never claim done without running build+test and reporting output.
6. Placeholders must be labelled `PLACEHOLDER` in code and listed in TASKS.md for replacement.
7. One milestone at a time; update TASKS.md, PROGRESS.md, BUGS.md, CHANGELOG.md after each.
8. No claims of beating competitors without benchmark/playtest evidence.
