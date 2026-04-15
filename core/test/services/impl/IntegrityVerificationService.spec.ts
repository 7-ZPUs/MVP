import { beforeEach, describe, expect, it, vi } from "vitest";

import { Dip } from "../../../src/entity/Dip";
import { Document } from "../../../src/entity/Document";
import { DocumentClass } from "../../../src/entity/DocumentClass";
import { File } from "../../../src/entity/File";
import { Process } from "../../../src/entity/Process";
import type {
  IGetDipByIdPort,
  IUpdateDipIntegrityStatusPort,
} from "../../../src/repo/IDipRepository";
import type {
  IGetDocumentClassByDipIdPort,
  IGetDocumentClassByIdPort,
  IUpdateDocumentClassIntegrityStatusPort,
} from "../../../src/repo/IDocumentClassRepository";
import type {
  IGetDocumentByIdPort,
  IGetDocumentByProcessIdPort,
  IUpdateDocumentIntegrityStatusPort,
} from "../../../src/repo/IDocumentRepository";
import type {
  IGetFileByDocumentIdPort,
  IGetFileByIdPort,
  IUpdateFileIntegrityStatusPort,
} from "../../../src/repo/IFileRepository";
import type {
  IGetProcessByDocumentClassIdPort,
  IGetProcessByIdPort,
  IUpdateProcessIntegrityStatusPort,
} from "../../../src/repo/IProcessRepository";
import type { ITransactionManager } from "../../../src/repo/ITransactionManager";
import { IntegrityVerificationService } from "../../../src/services/impl/IntegrityVerificationService";
import type { IHashingService } from "../../../src/services/IHashingService";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";
import { Metadata, MetadataType } from "../../../src/value-objects/Metadata";

function buildMetadata(label: string): Metadata {
  return new Metadata(
    "root",
    [new Metadata("label", label, MetadataType.STRING)],
    MetadataType.COMPOSITE,
  );
}

function createHarness() {
  const fileRepo = {
    getById: vi.fn(),
    getByDocumentId: vi.fn(),
    getByStatus: vi.fn(),
    save: vi.fn(),
    updateIntegrityStatus: vi.fn(),
  };

  const documentRepo = {
    getById: vi.fn(),
    getByProcessId: vi.fn(),
    getByStatus: vi.fn(),
    save: vi.fn(),
    updateIntegrityStatus: vi.fn(),
  };

  const processRepo = {
    getById: vi.fn(),
    getByDocumentClassId: vi.fn(),
    getByStatus: vi.fn(),
    save: vi.fn(),
    updateIntegrityStatus: vi.fn(),
  };

  const documentClassRepo = {
    getById: vi.fn(),
    getByDipId: vi.fn(),
    getByStatus: vi.fn(),
    save: vi.fn(),
    updateIntegrityStatus: vi.fn(),
  };

  const dipRepo = {
    getById: vi.fn(),
    getByUuid: vi.fn(),
    save: vi.fn(),
    getByStatus: vi.fn(),
    updateIntegrityStatus: vi.fn(),
  };

  const hashingService = {
    checkFileIntegrity: vi.fn(),
  };

  const transactionManager = {
    runInTransaction: vi.fn(async <T>(work: () => Promise<T>) => work()),
  };

  const service = new IntegrityVerificationService(
    fileRepo as unknown as IGetFileByIdPort,
    fileRepo as unknown as IGetFileByDocumentIdPort,
    fileRepo as unknown as IUpdateFileIntegrityStatusPort,
    documentRepo as unknown as IGetDocumentByIdPort,
    documentRepo as unknown as IGetDocumentByProcessIdPort,
    documentRepo as unknown as IUpdateDocumentIntegrityStatusPort,
    processRepo as unknown as IGetProcessByIdPort,
    processRepo as unknown as IGetProcessByDocumentClassIdPort,
    processRepo as unknown as IUpdateProcessIntegrityStatusPort,
    documentClassRepo as unknown as IGetDocumentClassByIdPort,
    documentClassRepo as unknown as IGetDocumentClassByDipIdPort,
    documentClassRepo as unknown as IUpdateDocumentClassIntegrityStatusPort,
    dipRepo as unknown as IGetDipByIdPort,
    dipRepo as unknown as IUpdateDipIntegrityStatusPort,
    hashingService as unknown as IHashingService,
    transactionManager as unknown as ITransactionManager,
    "/",
  );

  return {
    service,
    fileRepo,
    documentRepo,
    processRepo,
    documentClassRepo,
    dipRepo,
    hashingService,
    transactionManager,
  };
}

type Hierarchy = {
  dip: Dip;
  documentClasses: DocumentClass[];
  processesByDocumentClassId: Map<number, Process[]>;
  documentsByProcessId: Map<number, Document[]>;
  filesByDocumentId: Map<number, File[]>;
  invalidChain: {
    documentClassId: number;
    processId: number;
    documentId: number;
    filePath: string;
  };
};

function buildFullHierarchy(): Hierarchy {
  const dip = new Dip("dip-root", IntegrityStatusEnum.UNKNOWN, 1);

  const documentClasses: DocumentClass[] = [];
  const processesByDocumentClassId = new Map<number, Process[]>();
  const documentsByProcessId = new Map<number, Document[]>();
  const filesByDocumentId = new Map<number, File[]>();

  let invalidChain: Hierarchy["invalidChain"] = {
    documentClassId: -1,
    processId: -1,
    documentId: -1,
    filePath: "",
  };

  for (let dci = 1; dci <= 2; dci += 1) {
    const documentClassId = dci;
    const documentClassUuid = `dc-${dci}`;

    const documentClass = new DocumentClass(
      dip.getUuid(),
      documentClassUuid,
      `DocumentClass-${dci}`,
      `2026-03-0${dci}T00:00:00Z`,
      IntegrityStatusEnum.UNKNOWN,
      documentClassId,
      dip.getId(),
    );

    documentClasses.push(documentClass);

    const processes: Process[] = [];

    for (let pi = 1; pi <= 2; pi += 1) {
      const processId = documentClassId * 10 + pi;
      const processUuid = `proc-${documentClassId}-${pi}`;

      const process = new Process(
        documentClassUuid,
        processUuid,
        buildMetadata(processUuid),
        IntegrityStatusEnum.UNKNOWN,
        processId,
        documentClassId,
      );

      processes.push(process);

      const documents: Document[] = [];

      for (let di = 1; di <= 2; di += 1) {
        const documentId = processId * 10 + di;
        const documentUuid = `doc-${documentClassId}-${pi}-${di}`;

        const document = new Document(
          documentUuid,
          buildMetadata(documentUuid),
          processUuid,
          IntegrityStatusEnum.UNKNOWN,
          documentId,
          processId,
        );

        documents.push(document);

        const files: File[] = [];

        for (let fi = 1; fi <= 2; fi += 1) {
          const fileId = documentId * 10 + fi;
          const filePath = `/fixture/${fileId}.bin`;

          const file = new File(
            `${fileId}.bin`,
            filePath,
            `hash-${fileId}`,
            fi === 1,
            `file-${fileId}`,
            documentUuid,
            IntegrityStatusEnum.UNKNOWN,
            fileId,
            documentId,
          );

          files.push(file);

          if (dci === 1 && pi === 1 && di === 1 && fi === 1) {
            invalidChain = {
              documentClassId,
              processId,
              documentId,
              filePath,
            };
          }
        }

        filesByDocumentId.set(documentId, files);
      }

      documentsByProcessId.set(processId, documents);
    }

    processesByDocumentClassId.set(documentClassId, processes);
  }

  return {
    dip,
    documentClasses,
    processesByDocumentClassId,
    documentsByProcessId,
    filesByDocumentId,
    invalidChain,
  };
}

describe("IntegrityVerificationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when file root is not found and uses transaction wrapper", async () => {
    const h = createHarness();
    h.fileRepo.getById.mockReturnValue(null);

    await expect(h.service.checkFileIntegrityStatus(777)).rejects.toThrow(
      "File with id 777 not found",
    );

    expect(h.transactionManager.runInTransaction).toHaveBeenCalledTimes(1);
  });

  it("throws when document root is not found and uses transaction wrapper", async () => {
    const h = createHarness();
    h.documentRepo.getById.mockReturnValue(null);

    await expect(h.service.checkDocumentIntegrityStatus(778)).rejects.toThrow(
      "Document with id 778 not found",
    );

    expect(h.transactionManager.runInTransaction).toHaveBeenCalledTimes(1);
  });

  it("throws when process root is not found and uses transaction wrapper", async () => {
    const h = createHarness();
    h.processRepo.getById.mockReturnValue(null);

    await expect(h.service.checkProcessIntegrityStatus(779)).rejects.toThrow(
      "Process with id 779 not found",
    );

    expect(h.transactionManager.runInTransaction).toHaveBeenCalledTimes(1);
  });

  it("throws when document class root is not found and uses transaction wrapper", async () => {
    const h = createHarness();
    h.documentClassRepo.getById.mockReturnValue(null);

    await expect(
      h.service.checkDocumentClassIntegrityStatus(780),
    ).rejects.toThrow("DocumentClass with id 780 not found");

    expect(h.transactionManager.runInTransaction).toHaveBeenCalledTimes(1);
  });

  it("throws when dip root is not found and uses transaction wrapper", async () => {
    const h = createHarness();
    h.dipRepo.getById.mockReturnValue(null);

    await expect(h.service.checkDipIntegrityStatus(781)).rejects.toThrow(
      "Dip with id 781 not found",
    );

    expect(h.transactionManager.runInTransaction).toHaveBeenCalledTimes(1);
  });

  it("checkFileIntegrityStatus returns status and updates only file level", async () => {
    const h = createHarness();

    const file = new File(
      "a.bin",
      "/fixture/a.bin",
      "hash-a",
      true,
      "file-a",
      "doc-a",
      IntegrityStatusEnum.UNKNOWN,
      1,
      11,
    );

    h.fileRepo.getById.mockReturnValue(file);
    h.hashingService.checkFileIntegrity.mockResolvedValue(
      IntegrityStatusEnum.VALID,
    );

    const status = await h.service.checkFileIntegrityStatus(1);

    expect(status).toBe(IntegrityStatusEnum.VALID);
    expect(h.fileRepo.updateIntegrityStatus).toHaveBeenCalledWith(
      1,
      IntegrityStatusEnum.VALID,
    );
    expect(h.documentRepo.updateIntegrityStatus).not.toHaveBeenCalled();
    expect(h.processRepo.updateIntegrityStatus).not.toHaveBeenCalled();
    expect(h.documentClassRepo.updateIntegrityStatus).not.toHaveBeenCalled();
    expect(h.dipRepo.updateIntegrityStatus).not.toHaveBeenCalled();
  });

  it("checkDocumentIntegrityStatus returns status and updates document level", async () => {
    const h = createHarness();

    const document = new Document(
      "doc-1",
      buildMetadata("doc-1"),
      "proc-1",
      IntegrityStatusEnum.UNKNOWN,
      10,
      100,
    );

    const files = [
      new File(
        "f1.bin",
        "/fixture/f1.bin",
        "hash-f1",
        true,
        "file-1",
        "doc-1",
        IntegrityStatusEnum.UNKNOWN,
        1001,
        10,
      ),
      new File(
        "f2.bin",
        "/fixture/f2.bin",
        "hash-f2",
        false,
        "file-2",
        "doc-1",
        IntegrityStatusEnum.UNKNOWN,
        1002,
        10,
      ),
    ];

    h.documentRepo.getById.mockReturnValue(document);
    h.fileRepo.getByDocumentId.mockReturnValue(files);
    h.hashingService.checkFileIntegrity.mockResolvedValue(
      IntegrityStatusEnum.VALID,
    );

    const status = await h.service.checkDocumentIntegrityStatus(10);

    expect(status).toBe(IntegrityStatusEnum.VALID);
    expect(h.documentRepo.updateIntegrityStatus).toHaveBeenCalledWith(
      10,
      IntegrityStatusEnum.VALID,
    );
    expect(h.fileRepo.updateIntegrityStatus).toHaveBeenCalledTimes(2);
  });

  it("checkProcessIntegrityStatus returns status and updates process level", async () => {
    const h = createHarness();

    const process = new Process(
      "dc-1",
      "proc-1",
      buildMetadata("proc-1"),
      IntegrityStatusEnum.UNKNOWN,
      20,
      2,
    );

    const document = new Document(
      "doc-1",
      buildMetadata("doc-1"),
      "proc-1",
      IntegrityStatusEnum.UNKNOWN,
      21,
      20,
    );

    const file = new File(
      "f1.bin",
      "/fixture/f1.bin",
      "hash-f1",
      true,
      "file-21",
      "doc-1",
      IntegrityStatusEnum.UNKNOWN,
      2101,
      21,
    );

    h.processRepo.getById.mockReturnValue(process);
    h.documentRepo.getByProcessId.mockReturnValue([document]);
    h.fileRepo.getByDocumentId.mockReturnValue([file]);
    h.hashingService.checkFileIntegrity.mockResolvedValue(
      IntegrityStatusEnum.VALID,
    );

    const status = await h.service.checkProcessIntegrityStatus(20);

    expect(status).toBe(IntegrityStatusEnum.VALID);
    expect(h.processRepo.updateIntegrityStatus).toHaveBeenCalledWith(
      20,
      IntegrityStatusEnum.VALID,
    );
    expect(h.documentRepo.updateIntegrityStatus).toHaveBeenCalledWith(
      21,
      IntegrityStatusEnum.VALID,
    );
    expect(h.fileRepo.updateIntegrityStatus).toHaveBeenCalledWith(
      2101,
      IntegrityStatusEnum.VALID,
    );
  });

  it("checkDocumentClassIntegrityStatus returns status and updates class level", async () => {
    const h = createHarness();

    const documentClass = new DocumentClass(
      "dip-1",
      "dc-1",
      "Classe 1",
      "2026-03-01T00:00:00Z",
      IntegrityStatusEnum.UNKNOWN,
      30,
      3,
    );

    const process = new Process(
      "dc-1",
      "proc-1",
      buildMetadata("proc-1"),
      IntegrityStatusEnum.UNKNOWN,
      31,
      30,
    );

    const document = new Document(
      "doc-1",
      buildMetadata("doc-1"),
      "proc-1",
      IntegrityStatusEnum.UNKNOWN,
      32,
      31,
    );

    const file = new File(
      "f.bin",
      "/fixture/f.bin",
      "hash-f",
      true,
      "file-32",
      "doc-1",
      IntegrityStatusEnum.UNKNOWN,
      3201,
      32,
    );

    h.documentClassRepo.getById.mockReturnValue(documentClass);
    h.processRepo.getByDocumentClassId.mockReturnValue([process]);
    h.documentRepo.getByProcessId.mockReturnValue([document]);
    h.fileRepo.getByDocumentId.mockReturnValue([file]);
    h.hashingService.checkFileIntegrity.mockResolvedValue(
      IntegrityStatusEnum.VALID,
    );

    const status = await h.service.checkDocumentClassIntegrityStatus(30);

    expect(status).toBe(IntegrityStatusEnum.VALID);
    expect(h.documentClassRepo.updateIntegrityStatus).toHaveBeenCalledWith(
      30,
      IntegrityStatusEnum.VALID,
    );
    expect(h.processRepo.updateIntegrityStatus).toHaveBeenCalledWith(
      31,
      IntegrityStatusEnum.VALID,
    );
    expect(h.documentRepo.updateIntegrityStatus).toHaveBeenCalledWith(
      32,
      IntegrityStatusEnum.VALID,
    );
    expect(h.fileRepo.updateIntegrityStatus).toHaveBeenCalledWith(
      3201,
      IntegrityStatusEnum.VALID,
    );
  });

  it("checkDipIntegrityStatus with full 2x2x2x2 valid tree marks every level as VALID", async () => {
    const h = createHarness();
    const hierarchy = buildFullHierarchy();

    h.dipRepo.getById.mockReturnValue(hierarchy.dip);
    h.documentClassRepo.getByDipId.mockImplementation((dipId: number) =>
      dipId === hierarchy.dip.getId() ? hierarchy.documentClasses : [],
    );
    h.processRepo.getByDocumentClassId.mockImplementation(
      (documentClassId: number) =>
        hierarchy.processesByDocumentClassId.get(documentClassId) ?? [],
    );
    h.documentRepo.getByProcessId.mockImplementation(
      (processId: number) =>
        hierarchy.documentsByProcessId.get(processId) ?? [],
    );
    h.fileRepo.getByDocumentId.mockImplementation(
      (documentId: number) => hierarchy.filesByDocumentId.get(documentId) ?? [],
    );
    h.hashingService.checkFileIntegrity.mockResolvedValue(
      IntegrityStatusEnum.VALID,
    );

    const status = await h.service.checkDipIntegrityStatus(1);

    expect(status).toBe(IntegrityStatusEnum.VALID);
    expect(h.transactionManager.runInTransaction).toHaveBeenCalledTimes(1);

    const fileValidUpdates = h.fileRepo.updateIntegrityStatus.mock.calls.filter(
      ([, currentStatus]) => currentStatus === IntegrityStatusEnum.VALID,
    );
    const documentValidUpdates =
      h.documentRepo.updateIntegrityStatus.mock.calls.filter(
        ([, currentStatus]) => currentStatus === IntegrityStatusEnum.VALID,
      );
    const processValidUpdates =
      h.processRepo.updateIntegrityStatus.mock.calls.filter(
        ([, currentStatus]) => currentStatus === IntegrityStatusEnum.VALID,
      );
    const documentClassValidUpdates =
      h.documentClassRepo.updateIntegrityStatus.mock.calls.filter(
        ([, currentStatus]) => currentStatus === IntegrityStatusEnum.VALID,
      );

    expect(fileValidUpdates).toHaveLength(16);
    expect(documentValidUpdates).toHaveLength(8);
    expect(processValidUpdates).toHaveLength(4);
    expect(documentClassValidUpdates).toHaveLength(2);
    expect(h.dipRepo.updateIntegrityStatus).toHaveBeenCalledWith(
      1,
      IntegrityStatusEnum.VALID,
    );
  });

  it("checkDipIntegrityStatus propagates INVALID from one file to all its parents", async () => {
    const h = createHarness();
    const hierarchy = buildFullHierarchy();

    h.dipRepo.getById.mockReturnValue(hierarchy.dip);
    h.documentClassRepo.getByDipId.mockReturnValue(hierarchy.documentClasses);
    h.processRepo.getByDocumentClassId.mockImplementation(
      (documentClassId: number) =>
        hierarchy.processesByDocumentClassId.get(documentClassId) ?? [],
    );
    h.documentRepo.getByProcessId.mockImplementation(
      (processId: number) =>
        hierarchy.documentsByProcessId.get(processId) ?? [],
    );
    h.fileRepo.getByDocumentId.mockImplementation(
      (documentId: number) => hierarchy.filesByDocumentId.get(documentId) ?? [],
    );
    h.hashingService.checkFileIntegrity.mockImplementation(
      async (path: string) =>
        path === hierarchy.invalidChain.filePath
          ? IntegrityStatusEnum.INVALID
          : IntegrityStatusEnum.VALID,
    );

    const status = await h.service.checkDipIntegrityStatus(1);

    expect(status).toBe(IntegrityStatusEnum.INVALID);
    expect(h.documentRepo.updateIntegrityStatus).toHaveBeenCalledWith(
      hierarchy.invalidChain.documentId,
      IntegrityStatusEnum.INVALID,
    );
    expect(h.processRepo.updateIntegrityStatus).toHaveBeenCalledWith(
      hierarchy.invalidChain.processId,
      IntegrityStatusEnum.INVALID,
    );
    expect(h.documentClassRepo.updateIntegrityStatus).toHaveBeenCalledWith(
      hierarchy.invalidChain.documentClassId,
      IntegrityStatusEnum.INVALID,
    );
    expect(h.dipRepo.updateIntegrityStatus).toHaveBeenCalledWith(
      1,
      IntegrityStatusEnum.INVALID,
    );
  });

  it("checkDipIntegrityStatus returns VALID when there are no verifiable children", async () => {
    const h = createHarness();

    const dip = new Dip("dip-empty", IntegrityStatusEnum.UNKNOWN, 99);
    h.dipRepo.getById.mockReturnValue(dip);
    h.documentClassRepo.getByDipId.mockReturnValue([]);

    const status = await h.service.checkDipIntegrityStatus(99);

    expect(status).toBe(IntegrityStatusEnum.VALID);
    expect(h.dipRepo.updateIntegrityStatus).toHaveBeenCalledWith(
      99,
      IntegrityStatusEnum.VALID,
    );
    expect(h.documentClassRepo.updateIntegrityStatus).not.toHaveBeenCalled();
    expect(h.processRepo.updateIntegrityStatus).not.toHaveBeenCalled();
    expect(h.documentRepo.updateIntegrityStatus).not.toHaveBeenCalled();
    expect(h.fileRepo.updateIntegrityStatus).not.toHaveBeenCalled();
  });
});
