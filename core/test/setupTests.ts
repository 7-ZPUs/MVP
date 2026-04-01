import "reflect-metadata";
import { afterEach } from "vitest";
import * as fs from "node:fs";

// Cleanup temporary directories after each test
afterEach(() => {
  const tmpDir = fs.mkdtempSync("/tmp/dip-test-");
  if (fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true });
  }
});