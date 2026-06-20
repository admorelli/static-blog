import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
    },
  },
  test: {
    include: ['__tests__/**/*.test.ts'],
    globals: true,
    environment: 'node',
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    setupFiles: ['./__tests__/setup.ts'],
  },
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html'],
    include: [
      'app/**/*.{ts,tsx}',
      'lib/**/*.ts',
      'db/**/*.ts',
      'cli/**/*.ts',
      'scripts/**/*.ts',
    ],
    exclude: [
      '**/*.d.ts',
      '**/*.test.ts',
      '**/mcp-server.ts',
      '**/static-server.js',
      '**/_check-db.ts',
      '**/drizzle.config.ts',
      '**/next.config.ts',
      '**/eslint.config.mjs',
      '**/vitest.config.ts',
    ],
    thresholds: {
      lines: 10,
      branches: 20,
      functions: 10,
      statements: 10,
    },
  },
});
