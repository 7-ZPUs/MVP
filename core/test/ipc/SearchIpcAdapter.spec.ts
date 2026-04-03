import { describe, it, expect, vi, beforeEach } from "vitest";
import { SearchFilters } from "../../../shared/domain/metadata/search.models";

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

    searchClassesUC = { execute: vi.fn().mockResolvedValue([]) };
    searchProcessiUC = { execute: vi.fn().mockResolvedValue([]) };
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

  it("SEARCH_CLASSES chiama execute con il nome e ritorna SearchResult[]", async () => {
    const expectedResults = [
      {
        documentId: "1",
        name: "Contratti",
        type: "",
        score: null,
      },
    ];
    searchClassesUC.execute.mockResolvedValue(expectedResults);

    const result = await ipcMain.invoke(
      IpcChannels.SEARCH_CLASSES,
      "Contratti",
    );

    expect(searchClassesUC.execute).toHaveBeenCalledWith("Contratti");
    expect(result).toEqual(expectedResults);
  });

  it("SEARCH_CLASSES usa stringa vuota se il nome non è fornito", async () => {
    await ipcMain.invoke(IpcChannels.SEARCH_CLASSES, undefined);
    expect(searchClassesUC.execute).toHaveBeenCalledWith("");
  });

  it("SEARCH_CLASSES ritorna array vuoto se nessuna classe trovata", async () => {
    searchClassesUC.execute.mockResolvedValue([]);
    const result = await ipcMain.invoke(
      IpcChannels.SEARCH_CLASSES,
      "inesistente",
    );
    expect(result).toEqual([]);
  });

  it("SEARCH_CLASSES propaga eccezioni della use-case", async () => {
    searchClassesUC.execute.mockRejectedValue(new Error("classes failed"));
    await expect(
      ipcMain.invoke(IpcChannels.SEARCH_CLASSES, "Contratti"),
    ).rejects.toThrow("classes failed");
  });

  // ─── SEARCH_PROCESSES ─────────────────────────────────────────────────────

  it("SEARCH_PROCESSES chiama execute con uuid e ritorna SearchResult[]", async () => {
    const expectedResults = [
      {
        documentId: "1",
        name: "",
        type: "",
        score: null,
      },
    ];
    searchProcessiUC.execute.mockResolvedValue(expectedResults);

    const result = await ipcMain.invoke(
      IpcChannels.SEARCH_PROCESSES,
      "proc-uuid-abc",
    );

    expect(searchProcessiUC.execute).toHaveBeenCalledWith("proc-uuid-abc");
    expect(result).toEqual(expectedResults);
  });

  it("SEARCH_PROCESSES usa stringa vuota se uuid non è fornito", async () => {
    await ipcMain.invoke(IpcChannels.SEARCH_PROCESSES, undefined);
    expect(searchProcessiUC.execute).toHaveBeenCalledWith("");
  });

  it("SEARCH_PROCESSES ritorna array vuoto se nessun processo trovato", async () => {
    searchProcessiUC.execute.mockResolvedValue([]);
    const result = await ipcMain.invoke(
      IpcChannels.SEARCH_PROCESSES,
      "uuid-inesistente",
    );
    expect(result).toEqual([]);
  });

  it("SEARCH_PROCESSES propaga eccezioni della use-case", async () => {
    searchProcessiUC.execute.mockRejectedValue(new Error("processes failed"));
    await expect(
      ipcMain.invoke(IpcChannels.SEARCH_PROCESSES, "uuid-1"),
    ).rejects.toThrow("processes failed");
  });

  // ─── SEARCH_DOCUMENTS ─────────────────────────────────────────────────────

  it("SEARCH_DOCUMENTS chiama execute con i filtri e ritorna SearchResult[]", async () => {
    const expectedResults = [
      {
        documentId: "uuid-1",
        name: "doc.pdf",
        type: "DOCUMENTO INFORMATICO",
        score: null,
      },
    ];
    searchDocumentsUC.execute.mockResolvedValue(expectedResults);

    const filters = {
      common: null,
      diDai: null,
      aggregate: null,
      subject: null,
      custom: null,
    };
    const result = await ipcMain.invoke(IpcChannels.SEARCH_DOCUMENTS, filters);

    expect(searchDocumentsUC.execute).toHaveBeenCalledWith(filters);
    expect(result).toEqual(expectedResults);
  });

  it("SEARCH_DOCUMENTS ritorna array vuoto se nessun documento trovato", async () => {
    searchDocumentsUC.execute.mockResolvedValue([]);
    const result = await ipcMain.invoke(IpcChannels.SEARCH_DOCUMENTS, {});
    expect(result).toEqual([]);
  });

  it("SEARCH_DOCUMENTS propaga rejection della use-case", async () => {
    searchDocumentsUC.execute.mockRejectedValue(new Error("documents failed"));
    await expect(
      ipcMain.invoke(IpcChannels.SEARCH_DOCUMENTS, {}),
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

    const calledFilters = searchDocumentsUC.execute.mock
      .calls[0][0] as SearchFilters;
    expect(calledFilters.diDai?.nome).toBe("fattura.pdf");
  });

  it("SEARCH_FULLTEXT ritorna SearchResult[] dal searchDocumentsUC", async () => {
    const expectedResults = [
      {
        documentId: "uuid-1",
        name: "fattura.pdf",
        type: "DOCUMENTO INFORMATICO",
        score: null,
      },
    ];
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
