import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/main.ts', 'src/**/*.test.ts'],
      thresholds: {
        lines: 85,
        functions: 90,
        branches: 80,
        'src/telegram/**': { lines: 95, functions: 95, branches: 90 },
        'src/session/**': { lines: 95, functions: 95, branches: 90 },
        'src/plugins/initDataAuth.ts': { lines: 95, functions: 95, branches: 90 },
      },
    },
  },
});
