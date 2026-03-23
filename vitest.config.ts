import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['workflow/__tests__/**/*.test.ts'],
    environment: 'node',
  },
  resolve: {
    alias: {
      '@/': new URL('./', import.meta.url).pathname,
    },
  },
})
