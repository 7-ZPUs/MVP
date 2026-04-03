import { describe, it, expect, vi, beforeEach } from "vitest";
import { SearchRequestDTO } from "../../../shared/domain/metadata/search.models";
import { SearchDocumentsQuery } from "../../src/entity/search/SearchQuery.model";

vi.mock("electron", () => ({
  app: { isPackaged: false },
}));

vi.mock("tsyringe", () => ({
  container: { resolve: vi.fn() },
  injectable: () => () => {},
  inject: () => () => {},
}));

import { container } from "tsyringe";
import { SearchIpcAdapter } from "../../src/ipc/SearchIpcAdapter";
import { IpcChannels } from "../../../shared/ipc-channels";
import { DocumentClass } from "../../src/entity/DocumentClass";
import { Process } from "../../src/entity/Process";
import { Document } from "../../src/entity/Document";
import { DocumentClassMapper } from "../../src/dao/mappers/DocumentClassMapper";
import { ProcessMapper } from "../../src/dao/mappers/ProcessMapper";
import { DocumentMapper } from "../../src/dao/mappers/DocumentMapper";
import { MetadataType } from "../../src/value-objects/Metadata";

const makeIpcMain = () => {
  const handlers = new Map<string, Function>();
  return {
    handle: vi.fn((channel: string, handler: Function) => {
      handlers.set(channel, handler);
    }),
    invoke: async (channel: string, ...args: unknown[]) => {
      const handler = handlers.get(channel);
      if (!handler) throw new Error(`Handler non registrato: ${channel}`);
      return handler({} /* _event */, ...args);
    },
  };
};

const makeDocumentClass = (id: number, name: string) =>
  DocumentClassMapper.fromPersistence({
    id,
    dipId: 1,
    dipUuid: "dip-uuid",
    uuid: `uuid-dc-${id}`,
    name,
    timestamp: "2026-01-01",
    integrityStatus: "UNKNOWN",
  });

const makeProcess = (id: number, uuid: string) =>
  ProcessMapper.fromPersistence(
    {
      id,
      documentClassId: 1,
      documentClassUuid: "dc-uuid",
      uuid,
      integrityStatus: "UNKNOWN",
    },
    [
      {
        id: 1,
        parent_id: null,
        name: "root",
        value: "",
        type: MetadataType.COMPOSITE,
      },
    ],
  );

const makeDocument = (
  uuid: string,
  metadata: { name: string; value: string }[] = [],
) => {
  const rows = [
    {
      id: 1,
      parent_id: null,
      name: "root",
      value: "",
      type: MetadataType.COMPOSITE,
    },
    ...metadata.map((m, idx) => ({
      id: idx + 2,
      parent_id: 1,
      name: m.name,
      value: m.value,
      type: MetadataType.STRING,
    })),
  ];
  return DocumentMapper.fromPersistence(
    {
      id: 1,
      uuid,
      integrityStatus: "UNKNOWN",
      processId: 1,
      processUuid: "proc-uuid",
    },
    rows,
  );
};

describe("SearchIpcAdapter", () => {
  let ipcMain: ReturnType<typeof makeIpcMain>;
  let searchClassesUC: { execute: ReturnType<typeof vi.fn> };
  let searchProcessiUC: { execute: ReturnType<typeof vi.fn> };
  let searchDocumentsUC: { execute: ReturnType<typeof vi.fn> };
  let searchSemanticUC: { execute: ReturnType<typeof vi.fn> };
  let aiAdapter: { isInitialized: ReturnType<typeof vi.fn> };
  let documentRepo: { getIndexedDocumentsCount: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    ipcMain = makeIpcMain();

    (container.resolve as ReturnType<typeof vi.fn>).mockReset();

    searchClassesUC = { execute: vi.fn().mockReturnValue([]) };
    searchProcessiUC = { execute: vi.fn().mockReturnValue([]) };
    searchDocumentsUC = { execute: vi.fn().mockResolvedValue([]) };
    searchSemanticUC = { execute: vi.fn().mockResolvedValue([]) };
    aiAdapter = { isInitialized: vi.fn().mockReturnValue(false) };
    documentRepo = { getIndexedDocumentsCount: vi.fn().mockReturnValue(0) };

    (container.resolve as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(searchClassesUC)
      .mockReturnValueOnce(searchProcessiUC)
      .mockReturnValueOnce(searchDocumentsUC)
      .mockReturnValueOnce(searchSemanticUC)
      .mockReturnValueOnce(aiAdapter)
      .mockReturnValueOnce(documentRepo);

    SearchIpcAdapter.register(ipcMain as any);
  });

  // ─── Registrazione handler ────────────────────────────────────────────────

  it("registra tutti i channel IPC attesi", () => {
    const registeredChannels = (
      ipcMain.handle as ReturnType<typeof vi.fn>
    ).mock.calls.map((call: unknown[]) => call[0]);

    expect(registeredChannels).toContain(IpcChannels.SEARCH_CLASSES);
    expect(registeredChannels).toContain(IpcChannels.SEARCH_PROCESSES);
    expect(registeredChannels).toContain(IpcChannels.SEARCH_DOCUMENTS);
    expect(registeredChannels).toContain(IpcChannels.SEARCH_SEMANTIC);
    expect(registeredChannels).toContain(IpcChannels.SEARCH_FULLTEXT);
    expect(registeredChannels).toContain(IpcChannels.SEARCH_GET_AI_STATE);
  });

  // ─── SEARCH_CLASSES ───────────────────────────────────────────────────────

  it("SEARCH_CLASSES chiama execute con il nome e ritorna i DTO", async () => {
    const dc = makeDocumentClass(1, "Contratti");
    searchClassesUC.execute.mockReturnValue([dc]);

    const result = await ipcMain.invoke(
      IpcChannels.SEARCH_CLASSES,
      "Contratti",
    );

    expect(searchClassesUC.execute).toHaveBeenCalledWith("Contratti");
    expect(result).toEqual([DocumentClassMapper.toDTO(dc)]);
  });

  it("SEARCH_CLASSES usa stringa vuota se il nome non è fornito", async () => {
    await ipcMain.invoke(IpcChannels.SEARCH_CLASSES, undefined);
    expect(searchClassesUC.execute).toHaveBeenCalledWith("");
  });

  it("SEARCH_CLASSES ritorna array vuoto se nessuna classe trovata", async () => {
    searchClassesUC.execute.mockReturnValue([]);
    const result = await ipcMain.invoke(
      IpcChannels.SEARCH_CLASSES,
      "inesistente",
    );
    expect(result).toEqual([]);
  });

  it("SEARCH_CLASSES propaga eccezioni della use-case", async () => {
    searchClassesUC.execute.mockImplementation(() => {
      throw new Error("classes failed");
    });
    await expect(
      ipcMain.invoke(IpcChannels.SEARCH_CLASSES, "Contratti"),
    ).rejects.toThrow("classes failed");
  });

  // ─── SEARCH_PROCESSES ─────────────────────────────────────────────────────

  it("SEARCH_PROCESSES chiama execute con uuid e ritorna i DTO", async () => {
    const proc = makeProcess(1, "proc-uuid-abc");
    searchProcessiUC.execute.mockReturnValue([proc]);

    const result = await ipcMain.invoke(
      IpcChannels.SEARCH_PROCESSES,
      "proc-uuid-abc",
    );

    expect(searchProcessiUC.execute).toHaveBeenCalledWith("proc-uuid-abc");
    expect(result).toEqual([ProcessMapper.toDTO(proc)]);
  });

  it("SEARCH_PROCESSES usa stringa vuota se uuid non è fornito", async () => {
    await ipcMain.invoke(IpcChannels.SEARCH_PROCESSES, undefined);
    expect(searchProcessiUC.execute).toHaveBeenCalledWith("");
  });

  it("SEARCH_PROCESSES ritorna array vuoto se nessun processo trovato", async () => {
    searchProcessiUC.execute.mockReturnValue([]);
    const result = await ipcMain.invoke(
      IpcChannels.SEARCH_PROCESSES,
      "uuid-inesistente",
    );
    expect(result).toEqual([]);
  });

  it("SEARCH_PROCESSES propaga eccezioni della use-case", async () => {
    searchProcessiUC.execute.mockImplementation(() => {
      throw new Error("processes failed");
    });
    await expect(
      ipcMain.invoke(IpcChannels.SEARCH_PROCESSES, "uuid-1"),
    ).rejects.toThrow("processes failed");
  });

  // ─── SEARCH_DOCUMENTS ─────────────────────────────────────────────────────

  it("SEARCH_DOCUMENTS chiama execute e propaga i risultati", async () => {
    const doc = makeDocument("uuid-1", [{ name: "nome", value: "doc.pdf" }]);
    searchDocumentsUC.execute.mockResolvedValue([doc]);

    const filters: SearchRequestDTO = {
      filter: {
        logicOperator: "AND",
        items: [{ path: "NomeDelDocumento", operator: "EQ", value: "test" }]
      }
    };
    const result = await ipcMain.invoke(IpcChannels.SEARCH_DOCUMENTS, filters);

    expect(searchDocumentsUC.execute).toHaveBeenCalled();
    expect(result).toEqual([doc]);
  });

  it("SEARCH_DOCUMENTS ritorna array vuoto se nessun documento trovato", async () => {
    searchDocumentsUC.execute.mockResolvedValue([]);
    const filters: SearchRequestDTO = {
      filter: { logicOperator: "AND", items: [{ path: "X", operator: "EQ", value: "Y" }] }
    };
    const result = await ipcMain.invoke(IpcChannels.SEARCH_DOCUMENTS, filters);
    expect(result).toEqual([]);
  });

  it("SEARCH_DOCUMENTS propaga rejection della use-case", async () => {
    searchDocumentsUC.execute.mockRejectedValue(new Error("documents failed"));
    const filters: SearchRequestDTO = {
      filter: { logicOperator: "AND", items: [{ path: "X", operator: "EQ", value: "Y" }] }
    };
    await expect(
      ipcMain.invoke(IpcChannels.SEARCH_DOCUMENTS, filters),
    ).rejects.toThrow("documents failed");
  });

  // ─── SEARCH_SEMANTIC ──────────────────────────────────────────────────────

  it("SEARCH_SEMANTIC chiama execute con la query e ritorna SearchResult[]", async () => {
    const expectedResults = [
      {
        documentId: "uuid-s1",
        name: "sem.pdf",
        type: "DOCUMENTO INFORMATICO",
        score: 0.91,
      },
    ];
    searchSemanticUC.execute.mockResolvedValue(expectedResults);

    const query = {
      text: "ricerca semantica",
      type: "FREE",
      useSemanticSearch: true,
    };
    const result = await ipcMain.invoke(IpcChannels.SEARCH_SEMANTIC, query);

    expect(searchSemanticUC.execute).toHaveBeenCalledWith("ricerca semantica");
    expect(result).toEqual(expectedResults);
  });

  it("SEARCH_SEMANTIC ritorna array vuoto se nessun documento simile trovato", async () => {
    searchSemanticUC.execute.mockResolvedValue([]);

    const query = {
      text: "query senza match",
      type: "FREE",
      useSemanticSearch: true,
    };
    const result = await ipcMain.invoke(IpcChannels.SEARCH_SEMANTIC, query);

    expect(result).toEqual([]);
  });

  it("SEARCH_SEMANTIC passa stringa vuota quando la query è vuota", async () => {
    searchSemanticUC.execute.mockResolvedValue([]);

    const query = { text: "", type: "FREE", useSemanticSearch: true };
    await ipcMain.invoke(IpcChannels.SEARCH_SEMANTIC, query);

    expect(searchSemanticUC.execute).toHaveBeenCalledWith("");
  });

  it("SEARCH_SEMANTIC propaga rejection della use-case", async () => {
    searchSemanticUC.execute.mockRejectedValue(new Error("semantic failed"));

    const query = { text: "query", type: "FREE", useSemanticSearch: true };
    await expect(
      ipcMain.invoke(IpcChannels.SEARCH_SEMANTIC, query),
    ).rejects.toThrow("semantic failed");
  });

  // ─── SEARCH_FULLTEXT ──────────────────────────────────────────────────────

  it("SEARCH_FULLTEXT chiama searchDocumentsUC con filtro sul nome", async () => {
    searchDocumentsUC.execute.mockResolvedValue([]);

    const query = {
      text: "fattura.pdf",
      type: "FREE",
      useSemanticSearch: false,
    };
    await ipcMain.invoke(IpcChannels.SEARCH_FULLTEXT, query);

    const calledQuery = searchDocumentsUC.execute.mock
      .calls[0][0] as SearchDocumentsQuery;
    expect(calledQuery.filter.items[0]).toEqual({
      path: "NomeDelDocumento",
      operator: "LIKE",
      value: "%fattura.pdf%",
    });
  });

  it("SEARCH_FULLTEXT ritorna Document[] dal searchDocumentsUC", async () => {
    const expectedResults = [ makeDocument("uuid-1", []) ];
    searchDocumentsUC.execute.mockResolvedValue(expectedResults);

    const query = {
      text: "fattura.pdf",
      type: "FREE",
      useSemanticSearch: false,
    };
    const result = await ipcMain.invoke(IpcChannels.SEARCH_FULLTEXT, query);

    expect(result).toEqual(expectedResults);
  });

  it("SEARCH_FULLTEXT ritorna array vuoto se nessun documento trovato", async () => {
    searchDocumentsUC.execute.mockResolvedValue([]);

    const query = {
      text: "inesistente",
      type: "FREE",
      useSemanticSearch: false,
    };
    const result = await ipcMain.invoke(IpcChannels.SEARCH_FULLTEXT, query);

    expect(result).toEqual([]);
  });

  it("SEARCH_FULLTEXT propaga rejection della use-case", async () => {
    searchDocumentsUC.execute.mockRejectedValue(new Error("fulltext failed"));

    const query = { text: "query", type: "FREE", useSemanticSearch: false };
    await expect(
      ipcMain.invoke(IpcChannels.SEARCH_FULLTEXT, query),
    ).rejects.toThrow("fulltext failed");
  });

  // ─── SEARCH_GET_AI_STATE ──────────────────────────────────────────────────

  it("SEARCH_GET_AI_STATE ritorna IDLE quando il modello non è caricato", async () => {
    aiAdapter.isInitialized.mockReturnValue(false);
    documentRepo.getIndexedDocumentsCount.mockReturnValue(0);

    const result = await ipcMain.invoke(IpcChannels.SEARCH_GET_AI_STATE);

    expect(result.status).toBe("IDLE");
    expect(result.progressPercentage).toBe(0);
    expect(result.lastIndexedAt).toBeNull();
    expect(result.indexedDocuments).toBe(0);
  });

  it("SEARCH_GET_AI_STATE ritorna READY quando il modello è caricato", async () => {
    aiAdapter.isInitialized.mockReturnValue(true);
    documentRepo.getIndexedDocumentsCount.mockReturnValue(42);

    const result = await ipcMain.invoke(IpcChannels.SEARCH_GET_AI_STATE);

    expect(result.status).toBe("READY");
    expect(result.progressPercentage).toBe(100);
    expect(result.lastIndexedAt).toBeNull();
    expect(result.indexedDocuments).toBe(42);
  });

  it("SEARCH_GET_AI_STATE riflette il conteggio aggiornato dei documenti indicizzati", async () => {
    aiAdapter.isInitialized.mockReturnValue(true);
    documentRepo.getIndexedDocumentsCount.mockReturnValue(150);

    const result = await ipcMain.invoke(IpcChannels.SEARCH_GET_AI_STATE);

    expect(result.indexedDocuments).toBe(150);
  });

  it("SEARCH_GET_AI_STATE propaga eccezioni durante la lettura dello stato AI", async () => {
    aiAdapter.isInitialized.mockImplementation(() => {
      throw new Error("ai state unavailable");
    });
    await expect(
      ipcMain.invoke(IpcChannels.SEARCH_GET_AI_STATE),
    ).rejects.toThrow("ai state unavailable");
  });
});
