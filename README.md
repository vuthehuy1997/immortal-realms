# Immortal Realms

Browser-based 2D cultivation RPG (TypeScript, Phaser 4, Vite). Work in progress: vertical slice.

**Play:** https://vuthehuy1997.github.io/immortal-realms/

## Develop
```
npm install
npm run dev        # local dev server
npm run qc         # lint + typecheck + build + unit tests + e2e (Playwright/Chromium)
```
Project docs live in `docs/`; working rules for AI agents in `CLAUDE.md`.

## Controls
WASD move · mouse aim · click/Space sword combo (3 hits) · 1-4 techniques (unlock by level) · Shift dash · F/G potions · E talk/gather · M meditate (faster on the spirit array) · B breakthrough · I bag · C character · Esc menu.

## Assets & licenses
Art: CC0 "Xianxia Pixel Pack" by willYEE (author states it is AI-generated). See `docs/ASSET_LICENSE_AUDIT.md` for evidence and risks. `tools/build_assets.py` rebuilds `public/assets/xp` from the pack. Game code license: not yet chosen by the owner.
