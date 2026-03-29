import { describe, it, expect, vi, afterEach } from "vitest";
import * as fs from "node:fs";
import { FileRepository } from "../../../src/repo/impl/FileRepository";
import { ExportResult } from "../../../src/value-objects/ExportResult";
import { PrintResult } from "../../../src/value-objects/PrintResult";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";
import { DatabaseProvider } from "../../../src/repo/impl/DatabaseProvider";
import { File } from "../../../src/entity/File";

// Mock di electron e fs per evitare dipendenze dall'ambiente
vi.mock("electron", () => ({
  shell: { openPath: vi.fn() },
}));

vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof fs>();
  return {
    ...actual,
    promises: {
      ...actual.promises,
      copyFile: vi.fn(),
    },
  };
});

// Costruisce un FileRepository con DatabaseProvider mockato
const makeRepo = () => {
  const fakeDb = {
    exec: vi.fn(),
    prepare: vi.fn().mockReturnValue({
      get: vi.fn(),
      all: vi.fn(),
      run: vi.fn(),
    }),
  };

  const provider = new DatabaseProvider();

  vi.spyOn(provider, "db", "get").mockReturnValue(fakeDb as any);

  return new FileRepository(provider);
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("FileRepository", () => {
    const makeDb = () => ({
        exec: vi.fn(),
        prepare: vi.fn(),
    });

    let db: ReturnType<typeof makeDb>;
    let repo: FileRepository;

    beforeEach(() => {
        db = makeDb();
        repo = new FileRepository({ db } as unknown as DatabaseProvider);
    });

    it("save e getById funzionano", () => {
        db.prepare
            .mockReturnValueOnce({ run: vi.fn().mockReturnValue({ lastInsertRowid: 71 }) })
            .mockReturnValueOnce({
                get: vi.fn().mockReturnValue({
                    id: 71,
                    filename: "main.xml",
                    path: "/pkg/main.xml",
                    integrityStatus: IntegrityStatusEnum.UNKNOWN,
                    isMain: 1,
                    documentId: 3,
                }),
            });

        const file = new File("main.xml", "/pkg/main.xml", "hash-main", true, 3);

        repo.save(file);

        const found = repo.getById(71);

        expect(found).not.toBeNull();
        expect(found?.getFilename()).toBe("main.xml");
        expect(found?.getPath()).toBe("/pkg/main.xml");
        expect(found?.getDocumentId()).toBe(3);
        expect(found?.getIsMain()).toBe(true);
        expect(found?.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
    });

    it("getByDocumentId, getByStatus e updateIntegrityStatus funzionano", () => {
        const run = vi.fn();

        db.prepare
            .mockReturnValueOnce({
                all: vi.fn().mockReturnValue([
                    {
                        id: 72,
                        filename: "allegato.pdf",
                        path: "/pkg/allegato.pdf",
                        integrityStatus: IntegrityStatusEnum.INVALID,
                        isMain: 0,
                        documentId: 4,
                    },
                ]),
            })
            .mockReturnValueOnce({ run })
            .mockReturnValueOnce({
                all: vi.fn().mockReturnValue([
                    {
                        id: 72,
                        filename: "allegato.pdf",
                        path: "/pkg/allegato.pdf",
                        integrityStatus: IntegrityStatusEnum.INVALID,
                        isMain: 0,
                        documentId: 4,
                    },
                ]),
            });

        expect(repo.getByDocumentId(4)).toHaveLength(1);

        repo.updateIntegrityStatus(72, IntegrityStatusEnum.INVALID);
        const byStatus = repo.getByStatus(IntegrityStatusEnum.INVALID);

        expect(run).toHaveBeenCalledWith(IntegrityStatusEnum.INVALID, 72);
        expect(byStatus).toHaveLength(1);
        expect(byStatus[0].getFilename()).toBe("allegato.pdf");
        expect(byStatus[0].getIntegrityStatus()).toBe(IntegrityStatusEnum.INVALID);
    });
});

// ─── exportFile ──────────────────────────────────────────────────────────────

describe("FileRepository.exportFile", () => {
  // Caso nominale: copyFile non lancia eccezioni
  it("ritorna ExportResult.ok() se la copia riesce", async () => {
    (fs.promises.copyFile as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );

    const repo = makeRepo();
    const result = await repo.exportFile("/src/a.pdf", "/dest/a.pdf");

    expect(fs.promises.copyFile).toHaveBeenCalledWith(
      "/src/a.pdf",
      "/dest/a.pdf",
    );
    expect(result).toBeInstanceOf(ExportResult);
    expect(result.success).toBe(true);
  });

  // copyFile lancia un Error standard
  it("ritorna WRITE_ERROR con il messaggio dell'eccezione se copyFile fallisce", async () => {
    (fs.promises.copyFile as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("EACCES: permesso negato"),
    );

    const repo = makeRepo();
    const result = await repo.exportFile("/src/a.pdf", "/dest/protetto/a.pdf");

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("WRITE_ERROR");
    expect(result.errorMessage).toBe("EACCES: permesso negato");
  });

  // copyFile lancia un valore non-Error (stringa, oggetto, ecc.)
  it("ritorna WRITE_ERROR con messaggio generico se l'eccezione non è un Error", async () => {
    (fs.promises.copyFile as ReturnType<typeof vi.fn>).mockRejectedValue(
      "stringa di errore",
    );

    const repo = makeRepo();
    const result = await repo.exportFile("/src/a.pdf", "/dest/a.pdf");

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("WRITE_ERROR");
    expect(result.errorMessage).toBe("Errore scrittura");
  });
});

// ─── printFile ───────────────────────────────────────────────────────────────

describe("FileRepository.printFile", () => {
  // Caso nominale: shell.openPath ritorna stringa vuota (nessun errore)
  it("ritorna PrintResult.ok() se shell.openPath ha successo", async () => {
    const { shell } = await import("electron");
    (shell.openPath as ReturnType<typeof vi.fn>).mockResolvedValue("");

    const repo = makeRepo();
    const result = await repo.printFile("/src/a.pdf");

    expect(shell.openPath).toHaveBeenCalledWith("/src/a.pdf");
    expect(result).toBeInstanceOf(PrintResult);
    expect(result.success).toBe(true);
  });

  // shell.openPath ritorna stringa non vuota — errore applicativo
  it("ritorna SHELL_ERROR se shell.openPath ritorna un messaggio di errore", async () => {
    const { shell } = await import("electron");
    (shell.openPath as ReturnType<typeof vi.fn>).mockResolvedValue(
      "No application found",
    );

    const repo = makeRepo();
    const result = await repo.printFile("/src/a.pdf");

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("SHELL_ERROR");
    expect(result.errorMessage).toBe("No application found");
  });

  // Eccezione non-Error lanciata da shell
  it("ritorna PRINT_ERROR con messaggio generico per eccezioni non-Error", async () => {
    const { shell } = await import("electron");
    (shell.openPath as ReturnType<typeof vi.fn>).mockRejectedValue(42);

    const repo = makeRepo();
    const result = await repo.printFile("/src/a.pdf");

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("PRINT_ERROR");
    expect(result.errorMessage).toBe("Errore stampa");
  });
});
