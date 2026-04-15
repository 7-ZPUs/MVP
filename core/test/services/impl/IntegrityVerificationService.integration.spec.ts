import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type Database from "better-sqlite3";

import { DipDAO } from "../../../src/dao/DipDAO";
import { DocumentClassDAO } from "../../../src/dao/DocumentClassDAO";
import { DocumentDAO } from "../../../src/dao/DocumentDAO";
import { FileDAO } from "../../../src/dao/FileDAO";
import { ProcessDAO } from "../../../src/dao/ProcessDAO";
import { Dip } from "../../../src/entity/Dip";
import { Document } from "../../../src/entity/Document";
import { DocumentClass } from "../../../src/entity/DocumentClass";
import { File } from "../../../src/entity/File";
import { Process } from "../../../src/entity/Process";
import { DipPersistenceAdapter } from "../../../src/repo/impl/DipPersistenceAdapter";
import { DocumentClassPersistenceAdapter } from "../../../src/repo/impl/DocumentClassPersistenceAdapter";
import { DocumentPersistenceAdapter } from "../../../src/repo/impl/DocumentPersistenceAdapter";
import { FilePersistenceAdapter } from "../../../src/repo/impl/FilePersistenceAdapter";
import { ProcessPersistenceAdapter } from "../../../src/repo/impl/ProcessPersistenceAdapter";
import { SqliteTransactionManager } from "../../../src/repo/impl/SqliteTransactionManager";
import { IntegrityVerificationService } from "../../../src/services/impl/IntegrityVerificationService";
import type { IHashingService } from "../../../src/services/IHashingService";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";
import { Metadata, MetadataType } from "../../../src/value-objects/Metadata";
import { createTestDb } from "../../dao/helpers/testDb";

function buildMetadata(label: string): Metadata {
  return new Metadata(
    "root",
    [new Metadata("label", label, MetadataType.STRING)],
    MetadataType.COMPOSITE,
  );
}

type Repositories = {
  dipRepo: DipPersistenceAdapter;
  documentClassRepo: DocumentClassPersistenceAdapter;
  processRepo: ProcessPersistenceAdapter;
  documentRepo: DocumentPersistenceAdapter;
  fileRepo: FilePersistenceAdapter;
};

function buildSystem(db: Database.Database, hashingService: IHashingService) {
  const repos: Repositories = {
    dipRepo: new DipPersistenceAdapter(new DipDAO(db)),
    documentClassRepo: new DocumentClassPersistenceAdapter(
      new DocumentClassDAO(db),
    ),
    processRepo: new ProcessPersistenceAdapter(new ProcessDAO(db)),
    documentRepo: new DocumentPersistenceAdapter(new DocumentDAO(db)),
    fileRepo: new FilePersistenceAdapter(new FileDAO(db)),
  };

  const transactionManager = new SqliteTransactionManager(db);

  const service = new IntegrityVerificationService(
    repos.fileRepo,
    repos.fileRepo,
    repos.fileRepo,
    repos.documentRepo,
    repos.documentRepo,
    repos.documentRepo,
    repos.processRepo,
    repos.processRepo,
    repos.processRepo,
    repos.documentClassRepo,
    repos.documentClassRepo,
    repos.documentClassRepo,
    repos.dipRepo,
    repos.dipRepo,
    hashingService,
    transactionManager,
    "/",
  );

  return { repos, service };
}

function countByStatus(
  db: Database.Database,
  table: "dip" | "document_class" | "process" | "document" | "file",
  status: IntegrityStatusEnum,
): number {
  const row = db
    .prepare(
      `SELECT COUNT(*) AS count FROM "${table}" WHERE integrity_status = ?`,
    )
    .get(status) as { count: number };
  return Number(row.count);
}

function getDipStatus(
  db: Database.Database,
  dipId: number,
): IntegrityStatusEnum {
  const row = db
    .prepare("SELECT integrity_status AS integrityStatus FROM dip WHERE id = ?")
    .get(dipId) as { integrityStatus: IntegrityStatusEnum };
  return row.integrityStatus;
}

function seedFullHierarchy(repos: Repositories): {
  dipId: number;
  totalDocumentClasses: number;
  totalProcesses: number;
  totalDocuments: number;
  totalFiles: number;
  failurePath: string;
} {
  const dip = repos.dipRepo.save(new Dip("dip-int-full"));

  let totalDocumentClasses = 0;
  let totalProcesses = 0;
  let totalDocuments = 0;
  let totalFiles = 0;
  let failurePath = "";

  for (let dci = 1; dci <= 2; dci += 1) {
    const documentClass = repos.documentClassRepo.save(
      new DocumentClass(
        dip.getUuid(),
        `dc-int-${dci}`,
        `Classe ${dci}`,
        `2026-03-0${dci}T00:00:00Z`,
      ),
    );
    totalDocumentClasses += 1;

    for (let pi = 1; pi <= 2; pi += 1) {
      const process = repos.processRepo.save(
        new Process(
          documentClass.getUuid(),
          `proc-int-${dci}-${pi}`,
          buildMetadata(`proc-int-${dci}-${pi}`),
        ),
      );
      totalProcesses += 1;

      for (let di = 1; di <= 2; di += 1) {
        const document = repos.documentRepo.save(
          new Document(
            `doc-int-${dci}-${pi}-${di}`,
            buildMetadata(`doc-int-${dci}-${pi}-${di}`),
            process.getUuid(),
          ),
        );
        totalDocuments += 1;

        for (let fi = 1; fi <= 2; fi += 1) {
          const path = `/pkg/${dci}/${pi}/${di}/file-${fi}.bin`;
          repos.fileRepo.save(
            new File(
              `file-${fi}.bin`,
              path,
              `hash-${dci}-${pi}-${di}-${fi}`,
              fi === 1,
              `file-int-${dci}-${pi}-${di}-${fi}`,
              document.getUuid(),
            ),
          );

          if (dci === 1 && pi === 2 && di === 1 && fi === 2) {
            failurePath = path;
          }

          totalFiles += 1;
        }
      }
    }
  }

  const dipId = dip.getId();
  if (dipId === null) {
    throw new Error("Expected persisted dip id");
  }

  return {
    dipId,
    totalDocumentClasses,
    totalProcesses,
    totalDocuments,
    totalFiles,
    failurePath,
  };
}

describe("IntegrityVerificationService integration", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createTestDb();
  });

  afterEach(() => {
    db.close();
  });

  it("persists cascaded VALID status on dip, document_class, process, document and file", async () => {
    const hashingService: IHashingService = {
      checkFileIntegrity: vi.fn(async () => IntegrityStatusEnum.VALID),
    };

    const { repos, service } = buildSystem(db, hashingService);
    const fixture = seedFullHierarchy(repos);

    const status = await service.checkDipIntegrityStatus(fixture.dipId);

    expect(status).toBe(IntegrityStatusEnum.VALID);
    expect(getDipStatus(db, fixture.dipId)).toBe(IntegrityStatusEnum.VALID);

    expect(countByStatus(db, "document_class", IntegrityStatusEnum.VALID)).toBe(
      fixture.totalDocumentClasses,
    );
    expect(countByStatus(db, "process", IntegrityStatusEnum.VALID)).toBe(
      fixture.totalProcesses,
    );
    expect(countByStatus(db, "document", IntegrityStatusEnum.VALID)).toBe(
      fixture.totalDocuments,
    );
    expect(countByStatus(db, "file", IntegrityStatusEnum.VALID)).toBe(
      fixture.totalFiles,
    );
  });

  it("rolls back every partial update when hashing throws on an internal file", async () => {
    let currentCall = 0;
    let failurePath = "";

    const hashingService: IHashingService = {
      checkFileIntegrity: vi.fn(async (filePath: string) => {
        currentCall += 1;
        if (filePath === failurePath) {
          throw new Error("hashing-failure");
        }
        return IntegrityStatusEnum.VALID;
      }),
    };

    const { repos, service } = buildSystem(db, hashingService);
    const fixture = seedFullHierarchy(repos);
    failurePath = fixture.failurePath;

    await expect(
      service.checkDipIntegrityStatus(fixture.dipId),
    ).rejects.toThrow("hashing-failure");

    expect(currentCall).toBeGreaterThan(1);

    expect(getDipStatus(db, fixture.dipId)).toBe(IntegrityStatusEnum.UNKNOWN);
    expect(
      countByStatus(db, "document_class", IntegrityStatusEnum.UNKNOWN),
    ).toBe(fixture.totalDocumentClasses);
    expect(countByStatus(db, "process", IntegrityStatusEnum.UNKNOWN)).toBe(
      fixture.totalProcesses,
    );
    expect(countByStatus(db, "document", IntegrityStatusEnum.UNKNOWN)).toBe(
      fixture.totalDocuments,
    );
    expect(countByStatus(db, "file", IntegrityStatusEnum.UNKNOWN)).toBe(
      fixture.totalFiles,
    );

    expect(countByStatus(db, "document_class", IntegrityStatusEnum.VALID)).toBe(
      0,
    );
    expect(countByStatus(db, "process", IntegrityStatusEnum.VALID)).toBe(0);
    expect(countByStatus(db, "document", IntegrityStatusEnum.VALID)).toBe(0);
    expect(countByStatus(db, "file", IntegrityStatusEnum.VALID)).toBe(0);
  });

  it("persists VALID when dip has no verifiable children", async () => {
    const hashingService: IHashingService = {
      checkFileIntegrity: vi.fn(async () => IntegrityStatusEnum.VALID),
    };

    const { repos, service } = buildSystem(db, hashingService);
    const dip = repos.dipRepo.save(new Dip("dip-int-no-children"));

    const dipId = dip.getId();
    if (dipId === null) {
      throw new Error("Expected persisted dip id");
    }

    const status = await service.checkDipIntegrityStatus(dipId);

    expect(status).toBe(IntegrityStatusEnum.VALID);
    expect(getDipStatus(db, dipId)).toBe(IntegrityStatusEnum.VALID);

    expect(countByStatus(db, "document_class", IntegrityStatusEnum.VALID)).toBe(
      0,
    );
    expect(countByStatus(db, "process", IntegrityStatusEnum.VALID)).toBe(0);
    expect(countByStatus(db, "document", IntegrityStatusEnum.VALID)).toBe(0);
    expect(countByStatus(db, "file", IntegrityStatusEnum.VALID)).toBe(0);
  });
});
