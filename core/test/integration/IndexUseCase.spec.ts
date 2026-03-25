import { describe, it, expect } from "vitest";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { IndexDip } from "../../src/use-case/utils/indexing/impl/IndexDip";
import { XmlDipParser } from "../../src/repo/impl/utils/XmlDipParser";
import { FileSystemProvider } from "../../src/repo/impl/utils/FileSystemProvider";
import { LocalPackageReaderAdapter } from "../../src/repo/impl/LocalPackageReaderAdapter";
import { DipRepository } from "../../src/repo/impl/DipRepository";
import { DocumentClassRepository } from "../../src/repo/impl/DocumentClassRepository";
import { ProcessRepository } from "../../src/repo/impl/ProcessRepository";
import { DocumentRepository } from "../../src/repo/impl/DocumentRepository";
import { FileRepository } from "../../src/repo/impl/FileRepository";
import { DatabaseProvider } from "../../src/repo/impl/DatabaseProvider";
import { IntegrityStatusEnum } from "../../src/value-objects/IntegrityStatusEnum";

const REAL_DIP_PATH = path.resolve("core/test/resources/real_dip");
const DIP_INDEX_FILENAME_REGEX = /^DiPIndex\..+\.xml$/;

async function loadExpectedIndexCounts(dipPath: string): Promise<{
  documentClasses: number;
  processes: number;
  documents: number;
  files: number;
}> {
  const entries = await fs.readdir(dipPath, { withFileTypes: true });
  const filename = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((file) => DIP_INDEX_FILENAME_REGEX.test(file))
    .sort((a, b) => a.localeCompare(b))[0];

  if (!filename) {
    throw new Error(
      `DiP index file not found in '${dipPath}'. Expected format: DiPIndex.<uuid>.xml`,
    );
  }

  const parser = new XmlDipParser();
  const fileSystemProvider = new FileSystemProvider();
  const parsed = parser.parseDipIndex(
    await fileSystemProvider.readTextFile(path.join(dipPath, filename)),
  );

  return {
    documentClasses: parsed.documentClasses.length,
    processes: parsed.processes.length,
    documents: parsed.documents.length,
    files: parsed.files.length,
  };
}

describe("Index use-case integration tests", () => {
  it("should index a real DiP from read/parse into SQLite repositories", async () => {
    const expectedCounts = await loadExpectedIndexCounts(REAL_DIP_PATH);
    const packageReader = new LocalPackageReaderAdapter(
      new XmlDipParser(),
      new FileSystemProvider(),
    );

    const testHomeDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "dip-index-it-"),
    );
    const dbPath = path.join(testHomeDir, ".dip-viewer", "dip-viewer.db");

    let dbProvider: DatabaseProvider | null = null;
    try {
      dbProvider = new DatabaseProvider(dbPath);
      dbProvider.db.pragma("foreign_keys = OFF");

      const dipRepository = new DipRepository(dbProvider);
      const documentClassRepository = new DocumentClassRepository(dbProvider);
      const processRepository = new ProcessRepository(dbProvider);
      const documentRepository = new DocumentRepository(dbProvider);
      const fileRepository = new FileRepository(dbProvider);

      const useCase = new IndexDip(
        packageReader,
        dipRepository,
        documentClassRepository,
        processRepository,
        documentRepository,
        fileRepository,
      );

      const result = await useCase.execute(REAL_DIP_PATH);

      expect(result.success).toBe(true);

      const indexedDip = await packageReader.readDip(REAL_DIP_PATH);
      const persistedDip = dipRepository.getByUuid(indexedDip.getUuid());

      expect(persistedDip).not.toBeNull();
      expect(persistedDip?.getIntegrityStatus()).toBe(
        IntegrityStatusEnum.UNKNOWN,
      );

      expect(
        documentClassRepository.getByStatus(IntegrityStatusEnum.UNKNOWN),
      ).toHaveLength(expectedCounts.documentClasses);
      expect(
        processRepository.getByStatus(IntegrityStatusEnum.UNKNOWN),
      ).toHaveLength(expectedCounts.processes);
      expect(
        documentRepository.getByStatus(IntegrityStatusEnum.UNKNOWN),
      ).toHaveLength(expectedCounts.documents);
      expect(
        fileRepository.getByStatus(IntegrityStatusEnum.UNKNOWN),
      ).toHaveLength(expectedCounts.files);
    } finally {
      if (dbProvider) {
        dbProvider.db.close();
      }
      await fs.rm(testHomeDir, { recursive: true, force: true });
    }
  });
});
