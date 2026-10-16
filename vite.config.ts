import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './', // relative asset paths so the build works under https://<user>.github.io/<repo>/
  build: { chunkSizeWarningLimit: 1500 },
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
});
