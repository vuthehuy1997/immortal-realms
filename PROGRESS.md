# PROGRESS
## 2026-10-16 — M0 Scaffold
- Installed Node v24.22.0 (checksum-verified) to ~/.local/node.
- Scaffolded Phaser 3.90 + TS + Vite + Vitest. Build OK, 2 tests pass, preview HTTP 200.
- UNVERIFIED: actual in-browser rendering (no Playwright browser yet); lint not set up.
- Awaiting owner approval of ADR-001 and decision on art source (ADR-004).

## 2026-10-16 — M0 complete
- Switched to Phaser 4.2.1 (owner approved; ADR-001). TypeScript pinned 6.0.3 (typescript-eslint incompat with TS7).
- Verified: `npm run lint` clean; `npm run build` OK (bundle 1.38 MB, 358 KB gzip); `npm test` 2/2; `npm run test:e2e` 1/1 (WebGL renderer, frames advancing, no page errors).
- Note: sandbox HTTP proxy intercepts loopback; playwright.config.ts sets NO_PROXY.
- UNVERIFIED: real-GPU rendering (e2e uses SwiftShader software GL); Firefox/WebKit; performance numbers.
- Next: M0-4 perf spike, then M1 (tilemap/camera/movement).
