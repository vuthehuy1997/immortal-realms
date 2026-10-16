# Test Plan
Vitest: movement, damage formulas, cooldowns, enemy FSM, progression, save/load roundtrip+migration, data schema validation. Playwright: boot, input, combat smoke, save/load in browser (Chromium; Firefox/WebKit later), frame-time perf smoke. Security: save tampering, CSP, dependency audit (`npm audit`). Anything not run is reported as UNVERIFIED.
