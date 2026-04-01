import { beforeEach, describe, expect, it, vi } from "vitest";
import { Readable } from "node:stream";
import { ExportFileUC } from "../../../src/use-case/file/impl/ExportFileUC";
import { GetFileByIdUC } from "../../../src/use-case/file/impl/GetFileByIdUC";
import { GetFileByDocumentUC } from "../../../src/use-case/file/impl/GetFileByDocumentUC";
import { GetFileByStatusUC } from "../../../src/use-case/file/impl/GetFileByStatusUC";
import { CheckFileIntegrityStatusUC } from "../../../src/use-case/file/impl/CheckFileIntegrityStatusUC";
import { FileMapper } from "../../../src/dao/mappers/FileMapper";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";
import { ExportResult } from "../../../src/value-objects/ExportResult";
import { IFileRepository } from "../../../src/repo/IFileRepository";
import { IExportPort } from "../../../src/repo/IExportPort";
import { IPackageReaderPort } from "../../../src/repo/IPackageReaderPort";
import { IIntegrityVerificationService } from "../../../src/services/IIntegrityVerificationService";

const makeFile = (id: number, filePath: string) =>
  FileMapper.fromPersistence({
    id,
    uuid: `file-${id}`,
    filename: "file.pdf",
    path: filePath,
    hash: "fake-hash",
    integrityStatus: "UNKNOWN",
    isMain: 1,
    documentId: 1,
    documentUuid: "doc-uuid",
  });

describe("File query use-cases", () => {
  it("GetFileByIdUC delegates to repository", () => {
    const file = makeFile(11, "/data/f11.pdf");
    const repo = {
      getById: vi.fn().mockReturnValue(file),
    } as unknown as IFileRepository;

    const uc = new GetFileByIdUC(repo);
    const result = uc.execute(11);

    expect(repo.getById as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(11);
    expect(result).toBe(file);
  });

  it("GetFileByDocumentUC delegates to repository", () => {
    const files = [makeFile(1, "/data/f1.pdf")];
    const repo = {
      getByDocumentId: vi.fn().mockReturnValue(files),
    } as unknown as IFileRepository;

    const uc = new GetFileByDocumentUC(repo);
    const result = uc.execute(7);

    expect(
      repo.getByDocumentId as ReturnType<typeof vi.fn>,
    ).toHaveBeenCalledWith(7);
    expect(result).toBe(files);
  });

  it("GetFileByStatusUC delegates to repository", () => {
    const files = [makeFile(2, "/data/f2.pdf")];
    const repo = {
      getByStatus: vi.fn().mockReturnValue(files),
    } as unknown as IFileRepository;

    const uc = new GetFileByStatusUC(repo);
    const result = uc.execute(IntegrityStatusEnum.UNKNOWN);

    expect(repo.getByStatus as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(
      IntegrityStatusEnum.UNKNOWN,
    );
    expect(result).toBe(files);
  });
});

describe("CheckFileIntegrityStatusUC", () => {
  it("delegates to integrity verification service", async () => {
    const service = {
      checkFileIntegrityStatus: vi
        .fn()
        .mockResolvedValue(IntegrityStatusEnum.VALID),
    } as unknown as IIntegrityVerificationService;

    const uc = new CheckFileIntegrityStatusUC(service);
    const result = await uc.execute(9);

    expect(
      service.checkFileIntegrityStatus as ReturnType<typeof vi.fn>,
    ).toHaveBeenCalledWith(9);
    expect(result).toBe(IntegrityStatusEnum.VALID);
  });
});

describe("ExportFileUC", () => {
  let fileRepo: IFileRepository;
  let exportPort: IExportPort;
  let packageReader: IPackageReaderPort;

  beforeEach(() => {
    fileRepo = {
      getById: vi.fn(),
    } as unknown as IFileRepository;

    exportPort = {
      exportFile: vi.fn(),
    };

    packageReader = {
      readFileBytes: vi.fn(),
    } as unknown as IPackageReaderPort;
  });

  it("returns NOT_FOUND when file does not exist", async () => {
    (fileRepo.getById as ReturnType<typeof vi.fn>).mockReturnValue(null);

    const uc = new ExportFileUC(fileRepo, exportPort, packageReader);
    const result = await uc.execute(99, "/dest/file.pdf");

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("NOT_FOUND");
    expect(
      packageReader.readFileBytes as ReturnType<typeof vi.fn>,
    ).not.toHaveBeenCalled();
    expect(
      exportPort.exportFile as ReturnType<typeof vi.fn>,
    ).not.toHaveBeenCalled();
  });

  it("reads bytes via packageReader and exports through exportPort", async () => {
    const stream = Readable.from(Buffer.from("abc"));
    (fileRepo.getById as ReturnType<typeof vi.fn>).mockReturnValue(
      makeFile(1, "/src/f1.pdf"),
    );
    (packageReader.readFileBytes as ReturnType<typeof vi.fn>).mockResolvedValue(
      stream,
    );
    const exported = ExportResult.ok();
    (exportPort.exportFile as ReturnType<typeof vi.fn>).mockResolvedValue(
      exported,
    );

    const uc = new ExportFileUC(fileRepo, exportPort, packageReader);
    const result = await uc.execute(1, "/dest/f1.pdf");

    expect(
      packageReader.readFileBytes as ReturnType<typeof vi.fn>,
    ).toHaveBeenCalledWith("/src/f1.pdf");
    expect(
      exportPort.exportFile as ReturnType<typeof vi.fn>,
    ).toHaveBeenCalledWith(stream, "/dest/f1.pdf");
    expect(result).toBe(exported);
  });
});
