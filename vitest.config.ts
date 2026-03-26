import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Solo i test del core – i test Angular di renderer si eseguono con `ng test`
    include: ["core/test/**/*.{spec,test}.ts"],
    exclude: ["node_modules", "dist", "renderer/**"],
    environment: "node",
    globals: true,
    setupFiles: ["./core/test/setupTests.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: [
        "core/**/impl/**/*.ts",
        "core/entity/**/*.ts",
        "core/dto/**/*.ts",
      ],
      exclude: ["**/*.d.ts"],
      reportsDirectory: "./coverage/core",
    },
  },
});
