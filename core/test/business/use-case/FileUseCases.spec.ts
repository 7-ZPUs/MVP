import { describe, it, expect, vi, beforeEach } from "vitest";
import * as path from "node:path";
import { ExportFileUC } from "../../../src/use-case/file/impl/ExportFileUC";
import { PrintFileUC } from "../../../src/use-case/file/impl/PrintFileUC";
import { IFileRepository } from "../../../src/repo/IFileRepository";
import { ExportResult } from "../../../src/value-objects/ExportResult";
import { PrintResult } from "../../../src/value-objects/PrintResult";
import { File } from "../../../src/entity/File";
import fs from "node:fs";
import { CreateFileUC } from "../../../src/use-case/file/impl/CreateFileUC";
import { GetFileByIdUC } from "../../../src/use-case/file/impl/GetFileByIdUC";
import { GetFileByDocumentUC } from "../../../src/use-case/file/impl/GetFileByDocumentUC";
import { GetFileByStatusUC } from "../../../src/use-case/file/impl/GetFileByStatusUC";
import { CheckFileIntegrityStatusUC } from "../../../src/use-case/file/impl/CheckFileIntegrityStatusUC";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";
import { IHashingService } from "../../../src/services/IHashingService";


// Costruisce un'entità File già persistita a partire da id e path
const makeFile = (id: number, filePath: string) =>
  File.fromDB({
    id,
    filename: path.basename(filePath),
    path: filePath,
    hash: "fakehash",
    integrityStatus: "UNKNOWN",
    isMain: 1,
    documentId: 1,
  });

describe("File use-cases", () => {
  it("CreateFileUC delega a repo.save", () => {
    const entity = new File("file.xml", "/file.xml", "hash-1", true, 1);
    const repo: Pick<IFileRepository, "save"> = { save: vi.fn().mockReturnValue(entity) };

    const uc = new CreateFileUC(repo as IFileRepository);
    const input = { documentId: 1, filename: "file.xml", path: "/file.xml", isMain: true, hash: "hash-1" };
    const result = uc.execute(input);

    const savedEntity = (repo.save as ReturnType<typeof vi.fn>).mock.calls[0][0] as File;

    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(savedEntity).toBeInstanceOf(File);
    expect(savedEntity.getFilename()).toBe(input.filename);
    expect(savedEntity.getPath()).toBe(input.path);
    expect(savedEntity.getHash()).toBe(input.hash);
    expect(savedEntity.getIsMain()).toBe(input.isMain);
    expect(savedEntity.getDocumentId()).toBe(input.documentId);
    expect(result).toBe(entity);
  });

  it("GetFileByIdUC delega a repo.getById", () => {
    const entity = new File("f", "/f", "h", false, 2);
    const repo: Pick<IFileRepository, "getById"> = { getById: vi.fn().mockReturnValue(entity) };

    const uc = new GetFileByIdUC(repo as IFileRepository);
    const result = uc.execute(11);

    expect(repo.getById).toHaveBeenCalledWith(11);
    expect(result).toBe(entity);
  });

  it("GetFileByDocumentUC delega a repo.getByDocumentId", () => {
    const list = [new File("f", "/f", "h", false, 8)];
    const repo: Pick<IFileRepository, "getByDocumentId"> = { getByDocumentId: vi.fn().mockReturnValue(list) };

    const uc = new GetFileByDocumentUC(repo as IFileRepository);
    const result = uc.execute(8);

    expect(repo.getByDocumentId).toHaveBeenCalledWith(8);
    expect(result).toBe(list);
  });

  it("GetFileByStatusUC delega a repo.getByStatus", () => {
    const list = [new File("f", "/f", "h", false, 8)];
    const repo: Pick<IFileRepository, "getByStatus"> = { getByStatus: vi.fn().mockReturnValue(list) };

    const uc = new GetFileByStatusUC(repo as IFileRepository);
    const result = uc.execute(IntegrityStatusEnum.UNKNOWN);

    expect(repo.getByStatus).toHaveBeenCalledWith(IntegrityStatusEnum.UNKNOWN);
    expect(result).toBe(list);
  });

  it("CheckFileIntegrityStatusUC imposta VALID se hash coincide", async () => {
    const entity = new File("f", "/f", "expected", false, 8);
    const repo: Pick<IFileRepository, "getById" | "updateIntegrityStatus"> = {
      getById: vi.fn().mockReturnValue(entity),
      updateIntegrityStatus: vi.fn(),
    };
    const hashingService: Pick<IHashingService, "calcolaHash"> = {
      calcolaHash: vi.fn().mockResolvedValue("expected"),
    };

    vi.spyOn(fs, "readFileSync").mockReturnValue(Buffer.from("abc"));

    const uc = new CheckFileIntegrityStatusUC(repo as IFileRepository, hashingService as IHashingService);
    const result = await uc.execute(8);

    expect(result).toBe(IntegrityStatusEnum.VALID);
    expect(repo.updateIntegrityStatus).toHaveBeenCalledWith(8, IntegrityStatusEnum.VALID);
  });

  it("CheckFileIntegrityStatusUC imposta UNKNOWN se hash atteso manca", async () => {
    const entity = new File("f", "/f", "", false, 8);
    const repo: Pick<IFileRepository, "getById" | "updateIntegrityStatus"> = {
      getById: vi.fn().mockReturnValue(entity),
      updateIntegrityStatus: vi.fn(),
    };
    const hashingService: Pick<IHashingService, "calcolaHash"> = {
      calcolaHash: vi.fn(),
    };

    const uc = new CheckFileIntegrityStatusUC(repo as IFileRepository, hashingService as IHashingService);
    const result = await uc.execute(8);

    expect(result).toBe(IntegrityStatusEnum.UNKNOWN);
    expect(repo.updateIntegrityStatus).toHaveBeenCalledWith(8, IntegrityStatusEnum.UNKNOWN);
    expect(hashingService.calcolaHash).not.toHaveBeenCalled();
  });

  it("CheckFileIntegrityStatusUC lancia errore se file inesistente", async () => {
    const repo: Pick<IFileRepository, "getById" | "updateIntegrityStatus"> = {
      getById: vi.fn().mockReturnValue(null),
      updateIntegrityStatus: vi.fn(),
    };
    const hashingService: Pick<IHashingService, "calcolaHash"> = {
      calcolaHash: vi.fn(),
    };

    const uc = new CheckFileIntegrityStatusUC(repo as IFileRepository, hashingService as IHashingService);

    await expect(uc.execute(99)).rejects.toThrow("File with id 99 not found");
  });
});

// ─── ExportFileUC ────────────────────────────────────────────────────────────

describe("ExportFileUC", () => {
  let repo: Pick<IFileRepository, "getById" | "exportFile">;

  beforeEach(() => {
    repo = {
      getById: vi.fn(),
      exportFile: vi.fn(),
    };
  });

  // Caso nominale: file trovato e copia riuscita
  it("esporta il file e ritorna ExportResult.ok()", async () => {
    (repo.getById as ReturnType<typeof vi.fn>).mockReturnValue(
      makeFile(1, "/src/file.pdf"),
    );
    (repo.exportFile as ReturnType<typeof vi.fn>).mockResolvedValue(
      ExportResult.ok(),
    );

    const uc = new ExportFileUC(repo as IFileRepository);
    const result = await uc.execute(1, "/dest/file.pdf");

    expect(repo.getById).toHaveBeenCalledWith(1);
    expect(repo.exportFile).toHaveBeenCalledWith(
      "/src/file.pdf",
      "/dest/file.pdf",
    );
    expect(result.success).toBe(true);
    expect(result.errorCode).toBeUndefined();
  });

  // Il fileId non corrisponde a nessun record nel DB
  it("ritorna NOT_FOUND se il file non esiste nel repository", async () => {
    (repo.getById as ReturnType<typeof vi.fn>).mockReturnValue(null);

    const uc = new ExportFileUC(repo as IFileRepository);
    const result = await uc.execute(99, "/dest/file.pdf");

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("NOT_FOUND");
    expect(result.errorMessage).toContain("99");
    // exportFile non deve essere chiamato se il file non esiste
    expect(repo.exportFile).not.toHaveBeenCalled();
  });

  // Il file esiste ma la copia su disco fallisce (es. permessi, disco pieno)
  it("propaga WRITE_ERROR se la copia del file fallisce", async () => {
    (repo.getById as ReturnType<typeof vi.fn>).mockReturnValue(
      makeFile(1, "/src/file.pdf"),
    );
    (repo.exportFile as ReturnType<typeof vi.fn>).mockResolvedValue(
      ExportResult.fail("WRITE_ERROR", "Permesso negato"),
    );

    const uc = new ExportFileUC(repo as IFileRepository);
    const result = await uc.execute(1, "/dest/protetto/file.pdf");

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("WRITE_ERROR");
    expect(result.errorMessage).toBe("Permesso negato");
  });

  // Verifica che il path sorgente provenga dall'entità e non dal chiamante
  it("usa il path interno del file come sorgente, non un path arbitrario", async () => {
    (repo.getById as ReturnType<typeof vi.fn>).mockReturnValue(
      makeFile(1, "/archivio/originale.pdf"),
    );
    (repo.exportFile as ReturnType<typeof vi.fn>).mockResolvedValue(
      ExportResult.ok(),
    );

    const uc = new ExportFileUC(repo as IFileRepository);
    await uc.execute(1, "/export/copia.pdf");

    // Il sorgente deve essere quello dell'entità, non un path inventato dal chiamante
    expect(repo.exportFile).toHaveBeenCalledWith(
      "/archivio/originale.pdf",
      "/export/copia.pdf",
    );
  });

  // Esportazioni multiple sullo stesso file devono essere indipendenti
  it("gestisce più esportazioni successive dello stesso file", async () => {
    (repo.getById as ReturnType<typeof vi.fn>).mockReturnValue(
      makeFile(1, "/src/file.pdf"),
    );
    (repo.exportFile as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(ExportResult.ok())
      .mockResolvedValueOnce(ExportResult.ok());

    const uc = new ExportFileUC(repo as IFileRepository);
    const r1 = await uc.execute(1, "/dest/copia1.pdf");
    const r2 = await uc.execute(1, "/dest/copia2.pdf");

    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);
    expect(repo.exportFile).toHaveBeenCalledTimes(2);
  });

  it("ritorna la stessa istanza di ExportResult restituita dal repository", async () => {
    (repo.getById as ReturnType<typeof vi.fn>).mockReturnValue(
      makeFile(1, "/src/file.pdf"),
    );
    const exported = ExportResult.ok();
    (repo.exportFile as ReturnType<typeof vi.fn>).mockResolvedValue(exported);

    const uc = new ExportFileUC(repo as IFileRepository);
    const result = await uc.execute(1, "/dest/file.pdf");

    expect(result).toBe(exported);
  });

  it("propaga eccezioni del repository in exportFile", async () => {
    (repo.getById as ReturnType<typeof vi.fn>).mockReturnValue(
      makeFile(1, "/src/file.pdf"),
    );
    (repo.exportFile as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("disk I/O failure"),
    );

    const uc = new ExportFileUC(repo as IFileRepository);

    await expect(uc.execute(1, "/dest/file.pdf")).rejects.toThrow(
      "disk I/O failure",
    );
  });
});

// ─── PrintFileUC ─────────────────────────────────────────────────────────────

describe("PrintFileUC", () => {
  let repo: Pick<IFileRepository, "getById" | "printFile">;

  beforeEach(() => {
    repo = {
      getById: vi.fn(),
      printFile: vi.fn(),
    };
  });

  // Caso nominale: file trovato e apertura riuscita
  it("stampa il file e ritorna PrintResult.ok()", async () => {
    (repo.getById as ReturnType<typeof vi.fn>).mockReturnValue(
      makeFile(1, "/src/file.pdf"),
    );
    (repo.printFile as ReturnType<typeof vi.fn>).mockResolvedValue(
      PrintResult.ok(),
    );

    const uc = new PrintFileUC(repo as IFileRepository);
    const result = await uc.execute(1);

    expect(repo.getById).toHaveBeenCalledWith(1);
    expect(repo.printFile).toHaveBeenCalledWith("/src/file.pdf");
    expect(result.success).toBe(true);
    expect(result.errorCode).toBeUndefined();
  });

  // Il fileId non corrisponde a nessun record nel DB
  it("ritorna NOT_FOUND se il file non esiste nel repository", async () => {
    (repo.getById as ReturnType<typeof vi.fn>).mockReturnValue(null);

    const uc = new PrintFileUC(repo as IFileRepository);
    const result = await uc.execute(99);

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("NOT_FOUND");
    expect(result.errorMessage).toContain("99");
    // printFile non deve essere chiamato se il file non esiste
    expect(repo.printFile).not.toHaveBeenCalled();
  });

  // shell.openPath ritorna una stringa di errore non vuota
  it("propaga SHELL_ERROR se shell.openPath fallisce", async () => {
    (repo.getById as ReturnType<typeof vi.fn>).mockReturnValue(
      makeFile(1, "/src/file.pdf"),
    );
    (repo.printFile as ReturnType<typeof vi.fn>).mockResolvedValue(
      PrintResult.fail("SHELL_ERROR", "Applicazione non trovata"),
    );

    const uc = new PrintFileUC(repo as IFileRepository);
    const result = await uc.execute(1);

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("SHELL_ERROR");
    expect(result.errorMessage).toBe("Applicazione non trovata");
  });

  // Errore generico non legato a shell (es. import di electron fallisce)
  it("propaga PRINT_ERROR in caso di eccezione generica", async () => {
    (repo.getById as ReturnType<typeof vi.fn>).mockReturnValue(
      makeFile(1, "/src/file.pdf"),
    );
    (repo.printFile as ReturnType<typeof vi.fn>).mockResolvedValue(
      PrintResult.fail("PRINT_ERROR", "Errore imprevisto"),
    );

    const uc = new PrintFileUC(repo as IFileRepository);
    const result = await uc.execute(1);

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("PRINT_ERROR");
  });

  // Verifica che il path sorgente provenga dall'entità
  it("usa il path interno del file per la stampa", async () => {
    (repo.getById as ReturnType<typeof vi.fn>).mockReturnValue(
      makeFile(5, "/archivio/documento.docx"),
    );
    (repo.printFile as ReturnType<typeof vi.fn>).mockResolvedValue(
      PrintResult.ok(),
    );

    const uc = new PrintFileUC(repo as IFileRepository);
    await uc.execute(5);

    expect(repo.printFile).toHaveBeenCalledWith("/archivio/documento.docx");
  });

  it("ritorna la stessa istanza di PrintResult restituita dal repository", async () => {
    (repo.getById as ReturnType<typeof vi.fn>).mockReturnValue(
      makeFile(1, "/src/file.pdf"),
    );
    const printed = PrintResult.ok();
    (repo.printFile as ReturnType<typeof vi.fn>).mockResolvedValue(printed);

    const uc = new PrintFileUC(repo as IFileRepository);
    const result = await uc.execute(1);

    expect(result).toBe(printed);
  });

  it("propaga eccezioni del repository in printFile", async () => {
    (repo.getById as ReturnType<typeof vi.fn>).mockReturnValue(
      makeFile(1, "/src/file.pdf"),
    );
    (repo.printFile as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("open command failed"),
    );

    const uc = new PrintFileUC(repo as IFileRepository);

    await expect(uc.execute(1)).rejects.toThrow("open command failed");
  });
});
