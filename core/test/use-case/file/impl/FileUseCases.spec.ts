import { describe, expect, it, vi, beforeEach } from "vitest";
import { GetFileByIdUC } from "../../../../src/use-case/file/impl/GetFileByIdUC";
import { GetFileByDocumentUC } from "../../../../src/use-case/file/impl/GetFileByDocumentUC";
import { GetFileByStatusUC } from "../../../../src/use-case/file/impl/GetFileByStatusUC";
import { CheckFileIntegrityStatusUC } from "../../../../src/use-case/file/impl/CheckFileIntegrityStatusUC";
import { File } from "../../../../src/entity/File";
import {
  IGetFileByDocumentIdPort,
  IGetFileByIdPort,
  IGetFileByStatusPort,
} from "../../../../src/repo/IFileRepository";
import { IntegrityStatusEnum } from "../../../../src/value-objects/IntegrityStatusEnum";
import { IIntegrityVerificationService } from "../../../../src/services/IIntegrityVerificationService";
import { ExportFileUC } from "../../../../src/use-case/file/impl/ExportFileUC";
import { FileMapper } from "../../../../src/dao/mappers/FileMapper";
import { ExportResult } from "../../../../../shared/domain/ExportResult";
import { PrintFileUC } from "../../../../src/use-case/file/impl/PrintFileUC";
import { PrintFilesUC } from "../../../../src/use-case/file/impl/PrintFilesUC";
import { ExportFilesUC } from "../../../../src/use-case/file/impl/ExportFilesUC";
import { Readable } from "node:stream";

vi.mock("tsyringe", () => ({
  injectable: () => () => {},
  inject: () => () => {},
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeFile = (id: number, filePath: string, filename = "file.pdf") =>
  FileMapper.fromPersistence({
    id,
    uuid: `file-${id}`,
    filename,
    path: filePath,
    hash: "fake-hash",
    integrityStatus: "UNKNOWN",
    isMain: 1,
    documentId: 1,
    documentUuid: "doc-uuid",
  });

// ---------------------------------------------------------------------------
// Generic use-cases
// ---------------------------------------------------------------------------

describe("File use-cases", () => {
  it("TU-S-browsing-96: GetFileByIdUC delega a repo.getById", () => {
    const entity = new File("f", "/f", "h", false, "2", "doc-uuid");
    const repo: IGetFileByIdPort = {
      getById: vi.fn().mockReturnValue(entity),
    };
    const uc = new GetFileByIdUC(repo);
    const result = uc.execute(11);
    expect(repo.getById).toHaveBeenCalledWith(11);
    expect(result).toBe(entity);
  });

  it("TU-S-browsing-97: GetFileByDocumentUC delega a repo.getByDocumentId", () => {
    const list = [new File("f", "/f", "h", false, "8", "doc-uuid")];
    const repo: IGetFileByDocumentIdPort = {
      getByDocumentId: vi.fn().mockReturnValue(list),
    };
    const uc = new GetFileByDocumentUC(repo);
    const result = uc.execute(8);
    expect(repo.getByDocumentId).toHaveBeenCalledWith(8);
    expect(result).toBe(list);
  });

  it("TU-S-browsing-98: GetFileByStatusUC delega a repo.getByStatus", () => {
    const list = [new File("f", "/f", "h", false, "8", "doc-uuid")];
    const repo: IGetFileByStatusPort = {
      getByStatus: vi.fn().mockReturnValue(list),
    };
    const uc = new GetFileByStatusUC(repo);
    const result = uc.execute(IntegrityStatusEnum.UNKNOWN);
    expect(repo.getByStatus).toHaveBeenCalledWith(IntegrityStatusEnum.UNKNOWN);
    expect(result).toBe(list);
  });

  it("TU-S-browsing-99: CheckFileIntegrityStatusUC imposta VALID se hash coincide", async () => {
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

  it("TU-S-browsing-100: CheckFileIntegrityStatusUC propaga UNKNOWN", async () => {
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

  it("TU-S-browsing-101: CheckFileIntegrityStatusUC lancia errore se file inesistente", async () => {
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

// ---------------------------------------------------------------------------
// ExportFileUC
// ---------------------------------------------------------------------------

describe("ExportFileUC", () => {
  let fileRepo: { getById: ReturnType<typeof vi.fn> };
  let exportPort: { exportFile: ReturnType<typeof vi.fn> };
  let fileSystemProvider: { openReadStream: ReturnType<typeof vi.fn> };
  let dialogPort: { showSaveDialog: ReturnType<typeof vi.fn> };
  const DIP_PATH = "/base/dip";

  const makeUC = () =>
    new ExportFileUC(
      fileRepo as any,
      exportPort as any,
      fileSystemProvider as any,
      dialogPort as any,
      DIP_PATH,
    );

  beforeEach(() => {
    vi.clearAllMocks();
    fileRepo = { getById: vi.fn() };
    exportPort = { exportFile: vi.fn() };
    fileSystemProvider = { openReadStream: vi.fn() };
    dialogPort = { showSaveDialog: vi.fn() };
  });

  it("ritorna NOT_FOUND quando il file non esiste", async () => {
    fileRepo.getById.mockReturnValue(null);

    const result = await makeUC().execute(99);

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("NOT_FOUND");
    expect(dialogPort.showSaveDialog).not.toHaveBeenCalled();
    expect(exportPort.exportFile).not.toHaveBeenCalled();
  });

  it("ritorna ExportResult.canceled() se il dialog viene annullato", async () => {
    fileRepo.getById.mockReturnValue(makeFile(1, "docs/f.pdf"));
    dialogPort.showSaveDialog.mockResolvedValue({ canceled: true });

    const result = await makeUC().execute(1);

    expect(result.success).toBe(false);
    expect(result.canceled).toBe(true);
    expect(exportPort.exportFile).not.toHaveBeenCalled();
  });

  it("chiama exportPort.exportFile con lo stream e il path scelto dal dialog", async () => {
    const stream = Readable.from(Buffer.from("abc"));
    const file = makeFile(1, "docs/f.pdf");
    fileRepo.getById.mockReturnValue(file);
    dialogPort.showSaveDialog.mockResolvedValue({
      canceled: false,
      filePath: "/dest/f.pdf",
    });
    // openReadStream viene chiamato con il path assoluto risolto da require("path").resolve
    // Verifichiamo il comportamento osservabile: che openReadStream venga invocato
    // con un path che contiene sia DIP_PATH che il file path relativo
    fileSystemProvider.openReadStream.mockResolvedValue(stream);
    const exported = ExportResult.ok();
    exportPort.exportFile.mockResolvedValue(exported);

    const result = await makeUC().execute(1);

    // Il path assoluto passato a openReadStream deve contenere entrambe le parti
    const openReadStreamArg = fileSystemProvider.openReadStream.mock
      .calls[0][0] as string;
    expect(openReadStreamArg).toContain("base/dip");
    expect(openReadStreamArg).toContain("docs/f.pdf");

    expect(exportPort.exportFile).toHaveBeenCalledWith(stream, "/dest/f.pdf");
    expect(result).toBe(exported);
  });

  it("propaga eccezioni di exportPort.exportFile", async () => {
    const file = makeFile(1, "docs/f.pdf");
    fileRepo.getById.mockReturnValue(file);
    dialogPort.showSaveDialog.mockResolvedValue({
      canceled: false,
      filePath: "/dest/f.pdf",
    });
    fileSystemProvider.openReadStream.mockResolvedValue(
      Readable.from(Buffer.from("")),
    );
    exportPort.exportFile.mockRejectedValue(new Error("disk full"));

    await expect(makeUC().execute(1)).rejects.toThrow("disk full");
  });
});

// ---------------------------------------------------------------------------
// ExportFilesUC
// ---------------------------------------------------------------------------

describe("ExportFilesUC", () => {
  let fileRepo: { getById: ReturnType<typeof vi.fn> };
  let exportPort: { exportFile: ReturnType<typeof vi.fn> };
  let fileSystemProvider: { openReadStream: ReturnType<typeof vi.fn> };
  let dialogPort: { showFolderDialog: ReturnType<typeof vi.fn> };
  const DIP_PATH = "/base/dip";

  const makeUC = () =>
    new ExportFilesUC(
      fileRepo as any,
      exportPort as any,
      fileSystemProvider as any,
      dialogPort as any,
      DIP_PATH,
    );

  beforeEach(() => {
    vi.clearAllMocks();
    fileRepo = { getById: vi.fn() };
    exportPort = { exportFile: vi.fn() };
    fileSystemProvider = { openReadStream: vi.fn() };
    dialogPort = { showFolderDialog: vi.fn() };
  });

  it("ritorna canceled:true se il dialog cartella viene annullato", async () => {
    dialogPort.showFolderDialog.mockResolvedValue({ canceled: true });
    const onProgress = vi.fn();

    const result = await makeUC().execute([1, 2], onProgress);

    expect(result.canceled).toBe(true);
    expect(result.results).toHaveLength(0);
    expect(onProgress).not.toHaveBeenCalled();
  });

  it("registra errore per file non trovato senza interrompere il loop", async () => {
    dialogPort.showFolderDialog.mockResolvedValue({
      canceled: false,
      folderPath: "/dest",
    });
    fileRepo.getById.mockReturnValueOnce(null);
    const onProgress = vi.fn();

    const result = await makeUC().execute([99], onProgress);

    expect(result.canceled).toBe(false);
    expect(result.results[0]).toMatchObject({ fileId: 99, exportResult: ExportResult.fail("NOT_FOUND", "File 99 non trovato") });
    expect(onProgress).toHaveBeenCalledWith(1, 1);
  });

  it("esporta ogni file nel folder scelto e chiama onProgress", async () => {
    const stream = Readable.from(Buffer.from("data"));
    dialogPort.showFolderDialog.mockResolvedValue({
      canceled: false,
      folderPath: "/dest",
    });
    fileRepo.getById.mockReturnValue(makeFile(1, "docs/f.pdf", "f.pdf"));
    fileSystemProvider.openReadStream.mockResolvedValue(stream);
    exportPort.exportFile.mockResolvedValue(ExportResult.ok());
    const onProgress = vi.fn();

    const result = await makeUC().execute([1], onProgress);

    // Verifica che exportFile sia stato chiamato con lo stream
    // e un destPath che combina folderPath + filename
    const [streamArg, destPathArg] = exportPort.exportFile.mock.calls[0];
    expect(streamArg).toBe(stream);
    expect(destPathArg).toContain("/dest");
    expect(destPathArg).toContain("f.pdf");

    expect(result.canceled).toBe(false);
    expect(result.results[0]).toMatchObject({ fileId: 1, exportResult: ExportResult.ok() });
    expect(onProgress).toHaveBeenCalledWith(1, 1);
  });
});

// ---------------------------------------------------------------------------
// PrintFileUC
// ---------------------------------------------------------------------------

describe("PrintFileUC", () => {
  let fileRepo: { getById: ReturnType<typeof vi.fn> };
  let printPort: { printSingle: ReturnType<typeof vi.fn> };
  const DIP_PATH = "/base/dip";

  const makeUC = () =>
    new PrintFileUC(fileRepo as any, DIP_PATH, printPort as any);

  beforeEach(() => {
    vi.clearAllMocks();
    fileRepo = { getById: vi.fn() };
    printPort = { printSingle: vi.fn() };
  });

  it("ritorna NOT_FOUND quando il file non esiste", async () => {
    fileRepo.getById.mockReturnValue(null);

    const result = await makeUC().execute(99);

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("NOT_FOUND");
    expect(printPort.printSingle).not.toHaveBeenCalled();
  });

  it("chiama printSingle con il path assoluto e le opzioni corrette", async () => {
    fileRepo.getById.mockReturnValue(makeFile(1, "docs/report.pdf"));
    printPort.printSingle.mockResolvedValue(ExportResult.ok());

    await makeUC().execute(1);

    const [absolutePathArg, optsArg] = printPort.printSingle.mock.calls[0];
    expect(absolutePathArg).toContain("base/dip");
    expect(absolutePathArg).toContain("docs/report.pdf");
    expect(optsArg).toEqual({ silent: false, printBackground: true });
  });

  it("ritorna il risultato di printSingle quando la stampa riesce", async () => {
    fileRepo.getById.mockReturnValue(makeFile(1, "docs/report.pdf"));
    const ok = ExportResult.ok();
    printPort.printSingle.mockResolvedValue(ok);

    const result = await makeUC().execute(1);

    expect(result).toBe(ok);
  });

  it("propaga eccezioni di printSingle", async () => {
    fileRepo.getById.mockReturnValue(makeFile(1, "docs/report.pdf"));
    printPort.printSingle.mockRejectedValue(new Error("unexpected crash"));

    await expect(makeUC().execute(1)).rejects.toThrow("unexpected crash");
  });

  it("chiama fileRepo.getById con il fileId corretto", async () => {
    fileRepo.getById.mockReturnValue(makeFile(42, "docs/report.pdf"));
    printPort.printSingle.mockResolvedValue(ExportResult.ok());

    await makeUC().execute(42);

    expect(fileRepo.getById).toHaveBeenCalledWith(42);
  });
});

// ---------------------------------------------------------------------------
// PrintFilesUC
// ---------------------------------------------------------------------------

describe("PrintFilesUC", () => {
  let fileRepo: { getById: ReturnType<typeof vi.fn> };
  let printPort: { printSingle: ReturnType<typeof vi.fn> };
  let dialogPort: { showConfirmPrint: ReturnType<typeof vi.fn> };
  const DIP_PATH = "/base/dip";

  const makeUC = () =>
    new PrintFilesUC(
      fileRepo as any,
      printPort as any,
      dialogPort as any,
      DIP_PATH,
    );

  beforeEach(() => {
    vi.clearAllMocks();
    fileRepo = { getById: vi.fn() };
    printPort = { printSingle: vi.fn() };
    dialogPort = { showConfirmPrint: vi.fn() };
  });

  it("ritorna canceled:true se il dialog di conferma viene annullato", async () => {
    dialogPort.showConfirmPrint.mockResolvedValue({ confirmed: false });
    const onProgress = vi.fn();

    const result = await makeUC().execute([1, 2], onProgress);

    expect(result.canceled).toBe(true);
    expect(result.results).toHaveLength(0);
    expect(onProgress).not.toHaveBeenCalled();
  });

  it("registra errore per file non trovato senza interrompere il loop", async () => {
    dialogPort.showConfirmPrint.mockResolvedValue({ confirmed: true });
    fileRepo.getById.mockReturnValueOnce(null);
    const onProgress = vi.fn();

    const result = await makeUC().execute([99], onProgress);

    expect(result.canceled).toBe(false);
    expect(result.results[0]).toMatchObject({ fileId: 99, exportResult: ExportResult.fail("NOT_FOUND", "File 99 non trovato") });
    expect(onProgress).toHaveBeenCalledWith(1, 1);
  });

  it("chiama showConfirmPrint con il numero corretto di file", async () => {
    dialogPort.showConfirmPrint.mockResolvedValue({ confirmed: false });

    await makeUC().execute([1, 2, 3], vi.fn());

    expect(dialogPort.showConfirmPrint).toHaveBeenCalledWith(3);
  });
});
