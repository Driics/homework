import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'test/**/*.test.ts', 'test/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/main.tsx', 'src/**/*.test.*', 'src/vite-env.d.ts'],
      thresholds: {
        lines: 80,
        functions: 85,
        branches: 75,
      },
    },
  },
});
