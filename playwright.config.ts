import { defineConfig } from '@playwright/test';
process.env.NO_PROXY = '127.0.0.1,localhost'; // sandbox proxy would otherwise intercept the readiness probe

export default defineConfig({
  testDir: 'e2e',
  webServer: { command: 'npm run build && npx vite preview --port 4173 --host 127.0.0.1', url: 'http://127.0.0.1:4173', reuseExistingServer: false, timeout: 120_000 },
  use: { baseURL: 'http://127.0.0.1:4173', launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } },
});
