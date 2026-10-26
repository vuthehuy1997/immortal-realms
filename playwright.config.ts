import { defineConfig } from '@playwright/test';
process.env.NO_PROXY = '127.0.0.1,localhost'; // sandbox proxy would otherwise intercept the readiness probe
const PORT = Number(process.env.E2E_PORT ?? 4173); // parallel worktrees pick their own port

export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  workers: 1, // software-GL browsers compete for CPU; parallel runs distort game-time and the fps smoke test
  expect: { timeout: 10_000 },
  webServer: { command: `npm run build && npx vite preview --port ${PORT} --host 127.0.0.1`, url: `http://127.0.0.1:${PORT}`, reuseExistingServer: false, timeout: 120_000 },
  use: { baseURL: `http://127.0.0.1:${PORT}`, launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } },
});
