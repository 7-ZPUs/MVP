import { describe, it, expect, vi, beforeEach } from "vitest";
import { IndexDip } from "../../../src/use-case/utils/indexing/impl/IndexDip";
import { Dip } from "../../../src/entity/Dip";
import { DocumentClass } from "../../../src/entity/DocumentClass";
import { Process } from "../../../src/entity/Process";
import { Document } from "../../../src/entity/Document";
import { File } from "../../../src/entity/File";
import type { IPackageReaderPort } from "../../../src/repo/IPackageReaderPort";
import type { IDipRepository } from "../../../src/repo/IDipRepository";
import type { IDocumentClassRepository } from "../../../src/repo/IDocumentClassRepository";
import type { IProcessRepository } from "../../../src/repo/IProcessRepository";
import type { IDocumentRepository } from "../../../src/repo/IDocumentRepository";
import type { IFileRepository } from "../../../src/repo/IFileRepository";

async function* toAsyncGenerator<T>(items: T[]): AsyncGenerator<T> {
  for (const item of items) {
    yield item;
  }
}

describe("IndexDip", () => {
  let packageReader: IPackageReaderPort;
  let dipRepository: IDipRepository;
  let documentClassRepository: IDocumentClassRepository;
  let processRepository: IProcessRepository;
  let documentRepository: IDocumentRepository;
  let fileRepository: IFileRepository;

  beforeEach(() => {
    packageReader = {
      readDip: vi.fn(),
      readDocumentClasses: vi.fn(),
      readProcesses: vi.fn(),
      readDocuments: vi.fn(),
      readFiles: vi.fn(),
      readFileBytes: vi.fn(),
    };

    dipRepository = {
      getById: vi.fn(),
      getByUuid: vi.fn(),
      save: vi.fn(),
      getByStatus: vi.fn(),
      updateIntegrityStatus: vi.fn(),
    };

    documentClassRepository = {
      getById: vi.fn(),
      getByDipId: vi.fn(),
      getByStatus: vi.fn(),
      save: vi.fn(),
      updateIntegrityStatus: vi.fn(),
    };

    processRepository = {
      getById: vi.fn(),
      getByDocumentClassId: vi.fn(),
      getByStatus: vi.fn(),
      save: vi.fn(),
      updateIntegrityStatus: vi.fn(),
    };

    documentRepository = {
      getById: vi.fn(),
      getByProcessId: vi.fn(),
      getByStatus: vi.fn(),
      save: vi.fn(),
      updateIntegrityStatus: vi.fn(),
    };

    fileRepository = {
      getById: vi.fn(),
      getByDocumentId: vi.fn(),
      getByStatus: vi.fn(),
      save: vi.fn(),
      updateIntegrityStatus: vi.fn(),
    };
  });

  it("should orchestrate reader and repository writes for all entities", async () => {
    const dipPath = "core/test/resources";

    const dip = new Dip("dip-uuid-1");
    const documentClass1 = new DocumentClass(
      0,
      "dc-1",
      "Class 1",
      "2026-01-01",
    );
    const documentClass2 = new DocumentClass(
      0,
      "dc-2",
      "Class 2",
      "2026-01-02",
    );
    const process1 = new Process(0, "proc-1", []);
    const document1 = new Document("doc-1", [], 0);
    const document2 = new Document("doc-2", [], 0);
    const file1 = new File("main.pdf", "docs/main.pdf", "", true, 0);
    const file2 = new File("att.pdf", "docs/att.pdf", "", false, 0);

    vi.mocked(packageReader.readDip).mockResolvedValue(dip);
    vi.mocked(packageReader.readDocumentClasses).mockReturnValue(
      toAsyncGenerator([documentClass1, documentClass2]),
    );
    vi.mocked(packageReader.readProcesses).mockReturnValue(
      toAsyncGenerator([process1]),
    );
    vi.mocked(packageReader.readDocuments).mockReturnValue(
      toAsyncGenerator([document1, document2]),
    );
    vi.mocked(packageReader.readFiles).mockReturnValue(
      toAsyncGenerator([file1, file2]),
    );

    const useCase = new IndexDip(
      packageReader,
      dipRepository,
      documentClassRepository,
      processRepository,
      documentRepository,
      fileRepository,
    );

    const result = await useCase.execute(dipPath);

    expect(result).toEqual({ success: true });

    expect(packageReader.readDip).toHaveBeenCalledWith(dipPath);
    expect(packageReader.readDocumentClasses).toHaveBeenCalledWith(dipPath);
    expect(packageReader.readProcesses).toHaveBeenCalledWith(dipPath);
    expect(packageReader.readDocuments).toHaveBeenCalledWith(dipPath);
    expect(packageReader.readFiles).toHaveBeenCalledWith(dipPath);

    expect(dipRepository.save).toHaveBeenCalledWith(dip);
    expect(documentClassRepository.save).toHaveBeenCalledTimes(2);
    expect(documentClassRepository.save).toHaveBeenNthCalledWith(
      1,
      documentClass1,
    );
    expect(documentClassRepository.save).toHaveBeenNthCalledWith(
      2,
      documentClass2,
    );

    expect(processRepository.save).toHaveBeenCalledTimes(1);
    expect(processRepository.save).toHaveBeenCalledWith(process1);

    expect(documentRepository.save).toHaveBeenCalledTimes(2);
    expect(documentRepository.save).toHaveBeenNthCalledWith(1, document1);
    expect(documentRepository.save).toHaveBeenNthCalledWith(2, document2);

    expect(fileRepository.save).toHaveBeenCalledTimes(2);
    expect(fileRepository.save).toHaveBeenNthCalledWith(1, file1);
    expect(fileRepository.save).toHaveBeenNthCalledWith(2, file2);
  });

  it("should not persist entities when reader generators are empty", async () => {
    const dipPath = "empty/dip/path";
    const dip = new Dip("dip-empty");

    vi.mocked(packageReader.readDip).mockResolvedValue(dip);
    vi.mocked(packageReader.readDocumentClasses).mockReturnValue(
      toAsyncGenerator([]),
    );
    vi.mocked(packageReader.readProcesses).mockReturnValue(
      toAsyncGenerator([]),
    );
    vi.mocked(packageReader.readDocuments).mockReturnValue(
      toAsyncGenerator([]),
    );
    vi.mocked(packageReader.readFiles).mockReturnValue(toAsyncGenerator([]));

    const useCase = new IndexDip(
      packageReader,
      dipRepository,
      documentClassRepository,
      processRepository,
      documentRepository,
      fileRepository,
    );

    const result = await useCase.execute(dipPath);

    expect(result).toEqual({ success: true });

    expect(dipRepository.save).toHaveBeenCalledTimes(1);
    expect(dipRepository.save).toHaveBeenCalledWith(dip);
    expect(documentClassRepository.save).not.toHaveBeenCalled();
    expect(processRepository.save).not.toHaveBeenCalled();
    expect(documentRepository.save).not.toHaveBeenCalled();
    expect(fileRepository.save).not.toHaveBeenCalled();
  });
});
