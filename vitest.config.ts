import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Solo i test del core – i test Angular di renderer si eseguono con `ng test`
    include: [
      "core/test/**/*.{spec,test}.ts",
      "shared/system_test/**/*.{spec,test}.ts",
    ],
    setupFiles: ["./core/test/setup.ts"],
    exclude: ["node_modules", "dist", "renderer/**"],
    environment: "node",
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: [
        "core/**/impl/**/*.ts",
        "core/src/dao/**/*.ts",
        "core/src/ipc/**/*.ts",
        "core/entity/**/*.ts",
        "core/dto/**/*.ts",
      ],
      exclude: ["**/*.d.ts", "core/src/models"],
      reportsDirectory: "./coverage/core",
    },
    testTimeout: 30_000, // per i test di integrazione con il modello
  },
});
