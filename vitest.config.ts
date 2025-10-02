import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.{test.ts,test.tsx}'],
    setupFiles: ['./tests/setup.ts'],
    environment: 'jsdom',
    globals: true,
    testTimeout: 30000
  }
});
