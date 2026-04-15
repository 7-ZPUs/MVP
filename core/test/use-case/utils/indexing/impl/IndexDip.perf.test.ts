import { DataMapper } from "../../../../../src/repo/impl/utils/DataMapper";
import * as path from "node:path";
import * as fs from "node:fs";
import * as os from "node:os";
import { describe, it, expect } from "vitest";
import { performance } from "node:perf_hooks";

import { IndexDipUC } from "../../../../../src/use-case/utils/indexing/impl/IndexDip";
import { XmlDipParser } from "../../../../../src/repo/impl/utils/XmlDipParser";
import { FileSystemPort } from "../../../../../src/repo/impl/utils/FileSystemProvider";
import { PackageReaderService } from "../../../../../src/services/impl/PackageReaderService";
import { DipPersistenceAdapter } from "../../../../../src/repo/impl/DipPersistenceAdapter";
import { DocumentClassPersistenceAdapter } from "../../../../../src/repo/impl/DocumentClassPersistenceAdapter";
import { ProcessPersistenceAdapter } from "../../../../../src/repo/impl/ProcessPersistenceAdapter";
import { DocumentPersistenceAdapter } from "../../../../../src/repo/impl/DocumentPersistenceAdapter";
import { FilePersistenceAdapter } from "../../../../../src/repo/impl/FilePersistenceAdapter";
import { DipDAO } from "../../../../../src/dao/DipDAO";
import { FileDAO } from "../../../../../src/dao/FileDAO";
import { DocumentDAO } from "../../../../../src/dao/DocumentDAO";
import { ProcessDAO } from "../../../../../src/dao/ProcessDAO";
import { DocumentClassDAO } from "../../../../../src/dao/DocumentClassDAO";
import Database from "better-sqlite3";
import { SqliteTransactionManager } from "../../../../../src/repo/impl/SqliteTransactionManager";
import { ISaveVectorPort } from "../../../../../src/repo/IVectorRepository";
import { IEmbeddingService } from "../../../../../src/services/IEmbeddingService";

const DEFAULT_REAL_DIP_PATH = "core/test/resources/real_dip_heavy";
const PROJECT_ROOT = path.resolve(__dirname, "../../../../../../");
const realDipPath = process.env.REAL_DIP_PATH ?? DEFAULT_REAL_DIP_PATH;
const runs = Number(process.env.PERF_RUNS ?? "1");
const runPerfTests = process.env.RUN_PERF_TESTS === "true";

function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.max(0, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index];
}

describe("IndexDip use-case performance", () => {
  // identifier: TU-F-Indexing-26
  // method_name: execute()
  // description: should measures end-to-end indexing performance on a real DiP
  // expected_value: matches asserted behavior: measures end-to-end indexing performance on a real DiP
  it("TU-F-Indexing-26: execute() should measures end-to-end indexing performance on a real DiP", async () => {
    if (!runPerfTests) {
      console.info(
        "[PERF] Skipped: set RUN_PERF_TESTS=true to enable performance execution.",
      );
      expect(true).toBe(true);
      return;
    }

    const fsProvider = new FileSystemPort();
    const dipPathExists = await fsProvider.fileExists(realDipPath);

    if (!dipPathExists) {
      console.info(
        `[PERF] Skipped: real DiP path not found at '${realDipPath}'. ` +
          "Set REAL_DIP_PATH to run this performance test.",
      );
      expect(true).toBe(true);
      return;
    }

    const absoluteDipPath = path.resolve(realDipPath);
    const durationsMs: number[] = [];

    for (let i = 0; i < runs; i += 1) {
      // Each run gets a fresh DB to simulate cold indexing
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "dip-perf-"));
      const dbPath = path.join(tmpDir, "dip-viewer.db");
      const db = new Database(dbPath);

      const schema = fs.readFileSync(
        path.join(PROJECT_ROOT, "db/schema.sql"),
        "utf-8",
      );
      db.exec(schema);

      const packageReader = new PackageReaderService(
        new XmlDipParser(),
        new FileSystemPort(),
        new DataMapper(),
      );
      const dipRepository = new DipPersistenceAdapter(new DipDAO(db));
      const documentClassRepository = new DocumentClassPersistenceAdapter(
        new DocumentClassDAO(db),
      );
      const processRepository = new ProcessPersistenceAdapter(
        new ProcessDAO(db),
      );
      const documentRepository = new DocumentPersistenceAdapter(
        new DocumentDAO(db),
      );
      const fileRepository = new FilePersistenceAdapter(new FileDAO(db));
      const vectorRepository: ISaveVectorPort = {
        saveVector: async () => {},
      };
      const embeddingService: IEmbeddingService = {
        generateDocumentEmbedding: async () => null,
        setEmbeddingConfiguration: () => {},
      };

      const useCase = new IndexDipUC(
        packageReader,
        dipRepository,
        documentClassRepository,
        processRepository,
        documentRepository,
        fileRepository,
        vectorRepository,
        embeddingService,
        new SqliteTransactionManager(db),
      );

      const start = performance.now();
      const result = await useCase.execute(absoluteDipPath);
      const end = performance.now();

      expect(result.success).toBe(true);
      durationsMs.push(end - start);

      // Cleanup
      db.close();
      if (i === runs - 1) {
        fs.copyFileSync(dbPath, path.join(PROJECT_ROOT, "perf-dip-viewer.db"));
      }
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }

    const avgMs =
      durationsMs.reduce((sum, value) => sum + value, 0) / durationsMs.length;
    const p95Ms = percentile(durationsMs, 95);
    const minMs = Math.min(...durationsMs);
    const maxMs = Math.max(...durationsMs);

    console.info("[PERF] IndexDip use-case (end-to-end)");
    console.info(`[PERF] path=${absoluteDipPath}`);
    console.info(`[PERF] runs=${runs}`);
    console.info(
      `[PERF] ms avg=${avgMs.toFixed(2)} p95=${p95Ms.toFixed(2)} min=${minMs.toFixed(2)} max=${maxMs.toFixed(2)}`,
    );

    expect(durationsMs).toHaveLength(runs);
  }, 600000);
});
