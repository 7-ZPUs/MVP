import { describe, expect, it, vi } from "vitest";
import { GetFileByIdUC } from "../../../../src/use-case/file/impl/GetFileByIdUC";
import { GetFileByDocumentUC } from "../../../../src/use-case/file/impl/GetFileByDocumentUC";
import { GetFileByStatusUC } from "../../../../src/use-case/file/impl/GetFileByStatusUC";
import { CheckFileIntegrityStatusUC } from "../../../../src/use-case/file/impl/CheckFileIntegrityStatusUC";
import { File } from "../../../../src/entity/File";
import { IFileRepository } from "../../../../src/repo/IFileRepository";
import { IntegrityStatusEnum } from "../../../../src/value-objects/IntegrityStatusEnum";
import { IIntegrityVerificationService } from "../../../../src/services/IIntegrityVerificationService";
import { IExportPort } from "../../../../src/repo/IExportPort";
import { IPackageReaderPort } from "../../../../src/repo/IPackageReaderPort";
import { ExportFileUC } from "../../../../src/use-case/file/impl/ExportFileUC";
import { Readable } from "node:stream";
import { FileMapper } from "../../../../src/dao/mappers/FileMapper";
import { ExportResult } from "../../../../../shared/domain/ExportResult";
import path from "node:path";
import { PrintFileUC } from "../../../../src/use-case/file/impl/PrintFileUC";

describe("File use-cases", () => {
  // identifier: TU-S-browsing-96
  // method_name: execute()
  // description: should GetFileByIdUC delega a repo.getById
  // expected_value: matches asserted behavior: GetFileByIdUC delega a repo.getById
  it("TU-S-browsing-96: execute() should GetFileByIdUC delega a repo.getById", () => {
    const entity = new File("f", "/f", "h", false, "2", "doc-uuid");
    const repo: Pick<IFileRepository, "getById"> = {
      getById: vi.fn().mockReturnValue(entity),
    };

    const uc = new GetFileByIdUC(repo as IFileRepository);
    const result = uc.execute(11);

    expect(repo.getById).toHaveBeenCalledWith(11);
    expect(result).toBe(entity);
  });

  // identifier: TU-S-browsing-97
  // method_name: execute()
  // description: should GetFileByDocumentUC delega a repo.getByDocumentId
  // expected_value: matches asserted behavior: GetFileByDocumentUC delega a repo.getByDocumentId
  it("TU-S-browsing-97: execute() should GetFileByDocumentUC delega a repo.getByDocumentId", () => {
    const list = [new File("f", "/f", "h", false, "8", "doc-uuid")];
    const repo: Pick<IFileRepository, "getByDocumentId"> = {
      getByDocumentId: vi.fn().mockReturnValue(list),
    };

    const uc = new GetFileByDocumentUC(repo as IFileRepository);
    const result = uc.execute(8);

    expect(repo.getByDocumentId).toHaveBeenCalledWith(8);
    expect(result).toBe(list);
  });

  // identifier: TU-S-browsing-98
  // method_name: execute()
  // description: should GetFileByStatusUC delega a repo.getByStatus
  // expected_value: matches asserted behavior: GetFileByStatusUC delega a repo.getByStatus
  it("TU-S-browsing-98: execute() should GetFileByStatusUC delega a repo.getByStatus", () => {
    const list = [new File("f", "/f", "h", false, "8", "doc-uuid")];
    const repo: Pick<IFileRepository, "getByStatus"> = {
      getByStatus: vi.fn().mockReturnValue(list),
    };

    const uc = new GetFileByStatusUC(repo as IFileRepository);
    const result = uc.execute(IntegrityStatusEnum.UNKNOWN);

    expect(repo.getByStatus).toHaveBeenCalledWith(IntegrityStatusEnum.UNKNOWN);
    expect(result).toBe(list);
  });

  // identifier: TU-S-browsing-99
  // method_name: execute()
  // description: should CheckFileIntegrityStatusUC delega al servizio di verifica integrità
  // expected_value: matches asserted behavior: CheckFileIntegrityStatusUC delega al servizio di verifica integrità
  it("TU-S-browsing-99: execute() should CheckFileIntegrityStatusUC imposta VALID se hash coincide", async () => {
    const integrityService: Pick<
      IIntegrityVerificationService,
      "checkFileIntegrityStatus"
    > = {
      checkFileIntegrityStatus: vi
        .fn()
        .mockResolvedValue(IntegrityStatusEnum.VALID),
    };

    const uc = new CheckFileIntegrityStatusUC(
      integrityService as IIntegrityVerificationService,
    );
    const result = await uc.execute(8);

    expect(result).toBe(IntegrityStatusEnum.VALID);
    expect(integrityService.checkFileIntegrityStatus).toHaveBeenCalledWith(8);
  });

  // identifier: TU-S-browsing-100
  // method_name: execute()
  // description: should CheckFileIntegrityStatusUC delega e propaga UNKNOWN
  // expected_value: matches asserted behavior: CheckFileIntegrityStatusUC delega e propaga UNKNOWN
  it("TU-S-browsing-100: execute() should CheckFileIntegrityStatusUC imposta UNKNOWN se hash atteso manca", async () => {
    const integrityService: Pick<
      IIntegrityVerificationService,
      "checkFileIntegrityStatus"
    > = {
      checkFileIntegrityStatus: vi
        .fn()
        .mockResolvedValue(IntegrityStatusEnum.UNKNOWN),
    };

    const uc = new CheckFileIntegrityStatusUC(
      integrityService as IIntegrityVerificationService,
    );
    const result = await uc.execute(8);

    expect(result).toBe(IntegrityStatusEnum.UNKNOWN);
    expect(integrityService.checkFileIntegrityStatus).toHaveBeenCalledWith(8);
  });

  // identifier: TU-S-browsing-101
  // method_name: execute()
  // description: should CheckFileIntegrityStatusUC propaga errore dal servizio
  // expected_value: matches asserted behavior: CheckFileIntegrityStatusUC propaga errore dal servizio
  it("TU-S-browsing-101: execute() should CheckFileIntegrityStatusUC lancia errore se file inesistente", async () => {
    const integrityService: Pick<
      IIntegrityVerificationService,
      "checkFileIntegrityStatus"
    > = {
      checkFileIntegrityStatus: vi
        .fn()
        .mockRejectedValue(new Error("File with id 99 not found")),
    };

    const uc = new CheckFileIntegrityStatusUC(
      integrityService as IIntegrityVerificationService,
    );

    await expect(uc.execute(99)).rejects.toThrow("File with id 99 not found");
  });
});

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

  vi.mock("tsyringe", () => ({
    injectable: () => () => { },
    inject: () => () => { },
  }));

  vi.mock("node:path", () => ({
    default: { resolve: vi.fn() },
  }));



  describe("PrintFileUC", () => {
    let fileRepo: { getById: ReturnType<typeof vi.fn> };
    let printPort: { printSingle: ReturnType<typeof vi.fn> };
    let uc: PrintFileUC;

    const DIP_PATH = "/base/dip";

    beforeEach(() => {
      vi.clearAllMocks();

      fileRepo = { getById: vi.fn() };
      printPort = { printSingle: vi.fn() };

      uc = new PrintFileUC(fileRepo as any, DIP_PATH, printPort as any);
    });

    describe("quando il file non esiste", () => {
      it("ritorna { success: false } con messaggio che include il fileId", async () => {
        fileRepo.getById.mockReturnValue(null);

        const result = await uc.execute(99);

        expect(result).toEqual({
          success: false,
          error: "File con id 99 non trovato",
        });
      });

      it("non chiama printPort.printSingle", async () => {
        fileRepo.getById.mockReturnValue(null);

        await uc.execute(99);

        expect(printPort.printSingle).not.toHaveBeenCalled();
      });
    });

    describe("quando il file esiste", () => {
      const mockFile = () => ({ getPath: vi.fn().mockReturnValue("docs/report.pdf") });

      it("chiama printSingle con il path assoluto e le opzioni corrette", async () => {
        const file = mockFile();
        fileRepo.getById.mockReturnValue(file);
        (path.resolve as ReturnType<typeof vi.fn>).mockReturnValue("/base/dip/docs/report.pdf");
        printPort.printSingle.mockResolvedValue({ success: true });

        await uc.execute(1);

        expect(printPort.printSingle).toHaveBeenCalledWith(
          "/base/dip/docs/report.pdf",
          { silent: false, printBackground: true },
        );
      });

      it("ritorna { success: true } quando la stampa riesce", async () => {
        fileRepo.getById.mockReturnValue(mockFile());
        (path.resolve as ReturnType<typeof vi.fn>).mockReturnValue("/abs/path.pdf");
        printPort.printSingle.mockResolvedValue({ success: true });

        const result = await uc.execute(1);

        expect(result).toEqual({ success: true });
      });

      it("ritorna { success: false, error } quando la stampa fallisce", async () => {
        fileRepo.getById.mockReturnValue(mockFile());
        (path.resolve as ReturnType<typeof vi.fn>).mockReturnValue("/abs/path.pdf");
        printPort.printSingle.mockResolvedValue({
          success: false,
          error: "printer offline",
        });

        const result = await uc.execute(1);

        expect(result).toEqual({ success: false, error: "printer offline" });
      });

      it("propaga eccezioni di printSingle", async () => {
        fileRepo.getById.mockReturnValue(mockFile());
        (path.resolve as ReturnType<typeof vi.fn>).mockReturnValue("/abs/path.pdf");
        printPort.printSingle.mockRejectedValue(new Error("unexpected crash"));

        await expect(uc.execute(1)).rejects.toThrow("unexpected crash");
      });

      it("chiama fileRepo.getById con il fileId corretto", async () => {
        fileRepo.getById.mockReturnValue(mockFile());
        (path.resolve as ReturnType<typeof vi.fn>).mockReturnValue("/abs/path.pdf");
        printPort.printSingle.mockResolvedValue({ success: true });

        await uc.execute(42);

        expect(fileRepo.getById).toHaveBeenCalledWith(42);
      });
    });
  });
});
