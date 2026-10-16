import { defineConfig } from 'vitest/config';

export default defineConfig({
  build: { chunkSizeWarningLimit: 1500 },
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
});
