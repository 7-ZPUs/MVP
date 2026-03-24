import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Solo i test del core – i test Angular di renderer si eseguono con `ng test`
    include: ["core/test/**/*.{spec,test}.ts"],
    setupFiles: ["core/test/setup.ts"],
    exclude: ["node_modules", "dist", "renderer/**"],
    environment: "node",
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["core/**/impl/**/*.ts"],
      exclude: ["**/*.d.ts"],
      reportsDirectory: "./coverage/core",
    },
  },
});
