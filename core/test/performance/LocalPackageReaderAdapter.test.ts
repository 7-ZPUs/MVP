import * as path from "node:path";
import { describe, it, expect } from "vitest";
import { performance } from "node:perf_hooks";
import { LocalPackageReaderAdapter } from "../../src/repo/impl/LocalPackageReaderAdapter";
import { XmlDipParser } from "../../src/repo/impl/utils/XmlDipParser";
import { FileSystemProvider } from "../../src/repo/impl/utils/FileSystemProvider";

const DEFAULT_REAL_DIP_PATH = "core/test/resources/real_dip";
const realDipPath = process.env.REAL_DIP_PATH ?? DEFAULT_REAL_DIP_PATH;
const runs = Number(process.env.COLD_PERF_RUNS ?? "5");

async function consume<T>(generator: AsyncGenerator<T>): Promise<number> {
  let count = 0;
  for await (const _ of generator) {
    count += 1;
  }
  return count;
}

function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.max(0, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index];
}

describe("LocalPackageReaderAdapter cold performance", () => {
  it("measures cold read performance on a real DiP", async () => {
    const fsProvider = new FileSystemProvider();
    const dipPathExists = await fsProvider.fileExists(realDipPath);

    if (!dipPathExists) {
      console.info(
        `[COLD-PERF] Skipped: real DiP path not found at '${realDipPath}'. ` +
          "Set REAL_DIP_PATH to run this performance test.",
      );
      expect(true).toBe(true);
      return;
    }

    const absoluteDipPath = path.resolve(realDipPath);
    const durationsMs: number[] = [];
    let lastDocumentsCount = 0;
    let lastFilesCount = 0;

    for (let i = 0; i < runs; i += 1) {
      const adapter = new LocalPackageReaderAdapter(
        new XmlDipParser(),
        new FileSystemProvider(),
      );

      const start = performance.now();
      await adapter.readDip(absoluteDipPath);
      lastDocumentsCount = await consume(
        adapter.readDocuments(absoluteDipPath),
      );
      lastFilesCount = await consume(adapter.readFiles(absoluteDipPath));
      const end = performance.now();

      durationsMs.push(end - start);
    }

    const avgMs =
      durationsMs.reduce((sum, value) => sum + value, 0) / durationsMs.length;
    const p95Ms = percentile(durationsMs, 95);
    const minMs = Math.min(...durationsMs);
    const maxMs = Math.max(...durationsMs);

    console.info("[COLD-PERF] LocalPackageReaderAdapter");
    console.info(`[COLD-PERF] path=${absoluteDipPath}`);
    console.info(`[COLD-PERF] runs=${runs}`);
    console.info(
      `[COLD-PERF] documents=${lastDocumentsCount} files=${lastFilesCount}`,
    );
    console.info(
      `[COLD-PERF] ms avg=${avgMs.toFixed(2)} p95=${p95Ms.toFixed(2)} min=${minMs.toFixed(2)} max=${maxMs.toFixed(2)}`,
    );

    expect(lastDocumentsCount).toBeGreaterThan(0);
    expect(lastFilesCount).toBeGreaterThan(0);
    expect(durationsMs).toHaveLength(runs);
  });
});
