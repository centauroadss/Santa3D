import { defineConfig } from 'vitest/config';
import path from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname) },
  },
  test: {
    globals: true,
    // Cada test puede sobreescribir con la directiva `// @vitest-environment jsdom`
    environment: 'node',
    testTimeout: 30_000,
    coverage: {
      reporter: ['text', 'html'],
      include: ['lib/copa2026/**', 'components/copa2026/**', 'app/api/**'],
    },
  },
});
