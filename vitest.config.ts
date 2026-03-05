import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Target only main-process code; exclude renderer code
    include: ['src/**/*.{spec,test}.ts'],
    exclude: ['node_modules', 'dist', 'renderer/**/*'],
    environment: 'node',
    globals: true,
  },
});
