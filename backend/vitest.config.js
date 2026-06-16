import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    testTimeout: 30_000,
    pool: 'forks',
    maxWorkers: 1,      // run one test file at a time — prevents cross-file cleanup race
    minWorkers: 1,
    reporters: ['verbose'],
    sequence: { sequential: true },
  },
})
