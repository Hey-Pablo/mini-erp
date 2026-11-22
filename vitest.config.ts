import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    alias: {
      '@/shared': '/tmp/mini-erp/src/shared',
      '@/shared/api': '/tmp/mini-erp/src/shared/api',
      '@/shared/lib': '/tmp/mini-erp/src/shared/lib',
      '@/shared/ui': '/tmp/mini-erp/src/shared/ui',
      '@/shared/validators': '/tmp/mini-erp/src/shared/validators',
      '@/app': '/tmp/mini-erp/src/app',
      '@/modules': '/tmp/mini-erp/src/modules',
    },
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['src/**/*.d.ts', 'src/**/*.test.{ts,tsx}'],
    },
  },
});