import "reflect-metadata";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { IndexDip } from "../../../src/use-case/utils/indexing/impl/IndexDip";
import { IPackageReaderPort } from "../../../src/repo/IPackageReaderPort";
import { IDipRepository } from "../../../src/repo/IDipRepository";
import { IDocumentClassRepository } from "../../../src/repo/IDocumentClassRepository";
import { IProcessRepository } from "../../../src/repo/IProcessRepository";
import { IDocumentRepository } from "../../../src/repo/IDocumentRepository";
import { IFileRepository } from "../../../src/repo/IFileRepository";
import { Dip } from "../../../src/entity/Dip";
import { DocumentClass } from "../../../src/entity/DocumentClass";
import { Process } from "../../../src/entity/Process";
import { Document } from "../../../src/entity/Document";
import { File } from "../../../src/entity/File";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";

async function* yieldAll<T>(items: T[]): AsyncGenerator<T> {
  for (const item of items) yield item;
}

function createStubPackageReader(
  dips: Dip[] = [],
  documentClasses: DocumentClass[] = [],
  processes: Process[] = [],
  documents: Document[] = [],
  files: File[] = [],
): IPackageReaderPort {
  return {
    readDip: vi.fn(() => yieldAll(dips)),
    readDocumentClasses: vi.fn(() => yieldAll(documentClasses)),
    readProcesses: vi.fn(() => yieldAll(processes)),
    readDocuments: vi.fn(() => yieldAll(documents)),
    readFiles: vi.fn(() => yieldAll(files)),
    readFileBytes: vi.fn(),
  };
}

function createStubDipRepo(): IDipRepository {
  return {
    getById: vi.fn(),
    getByUuid: vi.fn(),
    save: vi.fn((dip: Dip) => dip),
    getByStatus: vi.fn(),
    updateIntegrityStatus: vi.fn(),
  };
}

function createStubDocClassRepo(): IDocumentClassRepository {
  return {
    getById: vi.fn(),
    getByDipId: vi.fn(),
    getByStatus: vi.fn(),
    save: vi.fn((dc: DocumentClass) => dc),
    updateIntegrityStatus: vi.fn(),
  };
}

function createStubProcessRepo(): IProcessRepository {
  return {
    getById: vi.fn(),
    getByDocumentClassId: vi.fn(),
    getByStatus: vi.fn(),
    save: vi.fn((p: Process) => p),
    updateIntegrityStatus: vi.fn(),
  };
}

function createStubDocumentRepo(): IDocumentRepository {
  return {
    getById: vi.fn(),
    getByProcessId: vi.fn(),
    getByStatus: vi.fn(),
    save: vi.fn((d: Document) => d),
    updateIntegrityStatus: vi.fn(),
  };
}

function createStubFileRepo(): IFileRepository {
  return {
    getById: vi.fn(),
    getByDocumentId: vi.fn(),
    getByStatus: vi.fn(),
    save: vi.fn((f: File) => f),
    updateIntegrityStatus: vi.fn(),
  };
}

describe("IndexDip (IIndexDip)", () => {
  let packageReader: IPackageReaderPort;
  let dipRepo: IDipRepository;
  let docClassRepo: IDocumentClassRepository;
  let processRepo: IProcessRepository;
  let documentRepo: IDocumentRepository;
  let fileRepo: IFileRepository;

  beforeEach(() => {
    dipRepo = createStubDipRepo();
    docClassRepo = createStubDocClassRepo();
    processRepo = createStubProcessRepo();
    documentRepo = createStubDocumentRepo();
    fileRepo = createStubFileRepo();
  });

  it("should return success when given an empty package", async () => {
    packageReader = createStubPackageReader();
    const indexDip = new IndexDip(
      packageReader,
      dipRepo,
      docClassRepo,
      processRepo,
      documentRepo,
      fileRepo,
    );

    const result = await indexDip.execute("/fake/path" as any);

    expect(result.success).toBe(true);
  });

  it("should call dipRepository.save for each Dip yielded", async () => {
    const dip = new Dip("uuid-001");
    packageReader = createStubPackageReader([dip]);
    const indexDip = new IndexDip(
      packageReader,
      dipRepo,
      docClassRepo,
      processRepo,
      documentRepo,
      fileRepo,
    );

    await indexDip.execute("/fake/path" as any);
    // Allow async generators to settle
    await new Promise((r) => setTimeout(r, 50));

    expect(dipRepo.save).toHaveBeenCalledWith(dip);
  });

  it("should call documentClassRepository.save for each DocumentClass", async () => {
    const dc = new DocumentClass(1, "dc-uuid", "Fatture", "2024-01-01");
    packageReader = createStubPackageReader([], [dc]);
    const indexDip = new IndexDip(
      packageReader,
      dipRepo,
      docClassRepo,
      processRepo,
      documentRepo,
      fileRepo,
    );

    await indexDip.execute("/fake/path" as any);
    await new Promise((r) => setTimeout(r, 50));

    expect(docClassRepo.save).toHaveBeenCalledWith(dc);
  });

  it("should call processRepository.save for each Process", async () => {
    const proc = new Process(1, "proc-uuid", []);
    packageReader = createStubPackageReader([], [], [proc]);
    const indexDip = new IndexDip(
      packageReader,
      dipRepo,
      docClassRepo,
      processRepo,
      documentRepo,
      fileRepo,
    );

    await indexDip.execute("/fake/path" as any);
    await new Promise((r) => setTimeout(r, 50));

    expect(processRepo.save).toHaveBeenCalledWith(proc);
  });

  it("should call documentRepository.save for each Document", async () => {
    const doc = new Document("doc-uuid", [], 1);
    packageReader = createStubPackageReader([], [], [], [doc]);
    const indexDip = new IndexDip(
      packageReader,
      dipRepo,
      docClassRepo,
      processRepo,
      documentRepo,
      fileRepo,
    );

    await indexDip.execute("/fake/path" as any);
    await new Promise((r) => setTimeout(r, 50));

    expect(documentRepo.save).toHaveBeenCalledWith(doc);
  });

  it("should call fileRepository.save for each File", async () => {
    const file = new File("test.pdf", "/path/test.pdf", true, 1);
    packageReader = createStubPackageReader([], [], [], [], [file]);
    const indexDip = new IndexDip(
      packageReader,
      dipRepo,
      docClassRepo,
      processRepo,
      documentRepo,
      fileRepo,
    );

    await indexDip.execute("/fake/path" as any);
    await new Promise((r) => setTimeout(r, 50));

    expect(fileRepo.save).toHaveBeenCalledWith(file);
  });

  it("should pipe multiple entities of each type to corresponding repositories", async () => {
    const dips = [new Dip("uuid-1"), new Dip("uuid-2")];
    const docClasses = [
      new DocumentClass(1, "dc-1", "A", "2024-01-01"),
      new DocumentClass(1, "dc-2", "B", "2024-01-01"),
    ];
    const processes = [new Process(1, "p-1", []), new Process(2, "p-2", [])];
    const documents = [new Document("d-1", [], 1), new Document("d-2", [], 2)];
    const files = [
      new File("f1.pdf", "/a", true, 1),
      new File("f2.pdf", "/b", false, 2),
    ];

    packageReader = createStubPackageReader(
      dips,
      docClasses,
      processes,
      documents,
      files,
    );
    const indexDip = new IndexDip(
      packageReader,
      dipRepo,
      docClassRepo,
      processRepo,
      documentRepo,
      fileRepo,
    );

    await indexDip.execute("/fake/path" as any);
    await new Promise((r) => setTimeout(r, 50));

    expect(dipRepo.save).toHaveBeenCalledTimes(2);
    expect(docClassRepo.save).toHaveBeenCalledTimes(2);
    expect(processRepo.save).toHaveBeenCalledTimes(2);
    expect(documentRepo.save).toHaveBeenCalledTimes(2);
    expect(fileRepo.save).toHaveBeenCalledTimes(2);
  });

  it("should invoke all five reader methods on the package reader", async () => {
    packageReader = createStubPackageReader();
    const indexDip = new IndexDip(
      packageReader,
      dipRepo,
      docClassRepo,
      processRepo,
      documentRepo,
      fileRepo,
    );

    await indexDip.execute("/fake/path" as any);

    expect(packageReader.readDip).toHaveBeenCalledWith("/fake/path");
    expect(packageReader.readDocumentClasses).toHaveBeenCalledWith(
      "/fake/path",
    );
    expect(packageReader.readProcesses).toHaveBeenCalledWith("/fake/path");
    expect(packageReader.readDocuments).toHaveBeenCalledWith("/fake/path");
    expect(packageReader.readFiles).toHaveBeenCalledWith("/fake/path");
  });
});
