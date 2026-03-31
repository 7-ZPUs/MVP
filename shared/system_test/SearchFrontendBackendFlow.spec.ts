import { describe, it, expect, beforeEach, vi } from "vitest";
import { signal } from "@angular/core";
import { container } from "tsyringe";

import { SearchFacade } from "../../renderer/src/app/feature/search/services/search-facade";
import { SearchIpcGateway } from "../../renderer/src/app/feature/search/adapters/search-ipc-gateway";
import { SearchIpcAdapter } from "../../core/src/ipc/SearchIpcAdapter";
import { SearchDocumentsUC } from "../../core/src/use-case/document/impl/SearchDocumentsUC";
import { SearchProcessUC } from "../../core/src/use-case/process/impl/SearchProcessUC";
import { SearchDocumentalClassUC } from "../../core/src/use-case/classe-documentale/impl/SearchDocumentalClassUC";
import { SearchSemanticUC } from "../../core/src/use-case/document/impl/SearchSemanticUC";
import { DocumentClass } from "../../core/src/entity/DocumentClass";
import { Process } from "../../core/src/entity/Process";
import { Document } from "../../core/src/entity/Document";
import { Metadata } from "../../core/src/value-objects/Metadata";
import { DocumentoUC } from "../../core/src/use-case/document/tokens";
import { ProcessUC } from "../../core/src/use-case/process/token";
import { DocumentClassUC } from "../../core/src/use-case/classe-documentale/tokens";
import { WORD_EMBEDDING_PORT_TOKEN } from "../../core/src/repo/IWordEmbedding";
import { DOCUMENTO_REPOSITORY_TOKEN } from "../../core/src/repo/IDocumentRepository";
import { IntegrityStatusEnum } from "../../core/src/value-objects/IntegrityStatusEnum";

import { IpcChannels } from "../ipc-channels";
import { SearchQueryType } from "../domain/metadata/search.enum";
import type {
  SearchQuery,
  SearchResult,
  SearchFilters,
} from "../domain/metadata/search.models";

type IpcHandler = (_event: unknown, ...args: unknown[]) => unknown;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const makeIpcMain = () => {
  const handlers = new Map<string, IpcHandler>();

  return {
    handle: vi.fn((channel: string, handler: IpcHandler) => {
      handlers.set(channel, handler);
    }),
    async invoke(channel: string, ...args: unknown[]) {
      const handler = handlers.get(channel);
      if (!handler) {
        throw new Error(`Missing IPC handler for channel: ${channel}`);
      }
      return handler({}, ...args);
    },
  };
};

describe("Integration: Search frontend <-> backend flow", () => {
  const className = "Classe Contratti 2026";
  const processUuid = "PROC-2026-ABC";
  const documentUuid = "DOC-001";
  const freeQueryText = "Fattura gennaio 2026";

  const expectedDocumentResult: SearchResult = {
    documentId: documentUuid,
    name: "Fattura gennaio 2026.pdf",
    type: "DOCUMENTO INFORMATICO",
    score: null,
  };

  let ipcMain: ReturnType<typeof makeIpcMain>;

  let bridge: { invoke: any };
  let cache: {
    get: any;
    set: any;
    invalidate: any;
    invalidatePrefix: any;
  };

  let gatewayErrorHandler: { handle: any };
  let facadeErrorHandler: { handle: any };
  let validator: { validate: any };
  let telemetry: {
    trackEvent: any;
    trackTiming: any;
    trackError: any;
  };
  let liveAnnouncer: { announce: any };
  let semanticStatusProvider: { getStatus: any };
  let searchDocumentImpl: (filters: SearchFilters) => Document[];
  let searchDocumentSemanticImpl: (
    query: string,
  ) => Promise<Array<{ document: Document; score: number }>>;

  let gateway: SearchIpcGateway;
  let facade: SearchFacade;

  beforeEach(() => {
    container.clearInstances();
    ipcMain = makeIpcMain();

    const processEntity = Process.fromDB(
      {
        id: 1,
        documentClassId: 1,
        uuid: processUuid,
        integrityStatus: IntegrityStatusEnum.UNKNOWN,
      },
      [new Metadata("stato", "APERTO")],
    );

    const classEntity = DocumentClass.fromDB({
      id: 1,
      dipId: 1,
      uuid: "CLASS-UUID-001",
      integrityStatus: IntegrityStatusEnum.UNKNOWN,
      name: className,
      timestamp: "2026-01-10T12:00:00.000Z",
    });

    const documentEntity = new Document(
      documentUuid,
      [
        new Metadata("NomeDelDocumento", freeQueryText),
        new Metadata("nome", expectedDocumentResult.name),
        new Metadata("tipoDocumento", expectedDocumentResult.type),
      ],
      1,
    );

    searchDocumentImpl = (filters: SearchFilters) => {
      if (filters.diDai?.nome === freeQueryText) return [documentEntity];
      return [];
    };

    searchDocumentSemanticImpl = async () => [];

    const documentRepo = {
      getById: () => null,
      getByProcessId: () => [],
      getByStatus: () => [],
      save: (document: Document) => document,
      updateIntegrityStatus: () => undefined,
      getAggregatedIntegrityStatusByProcessId: () =>
        IntegrityStatusEnum.UNKNOWN,
      searchDocument: (filters: SearchFilters) => searchDocumentImpl(filters),
      searchDocumentSemantic: (query: string) =>
        searchDocumentSemanticImpl(query),
      getIndexedDocumentsCount: () => 1,
    };

    const processRepo = {
      getById: () => null,
      getByDocumentClassId: () => [],
      getByStatus: () => [],
      save: (process: Process) => process,
      updateIntegrityStatus: () => undefined,
      getAggregatedIntegrityStatusByDocumentClassId: () =>
        IntegrityStatusEnum.UNKNOWN,
      searchProcesses: (uuid: string) =>
        processUuid.includes(uuid) ? [processEntity] : [],
    };

    const documentClassRepo = {
      getById: () => null,
      getByDipId: () => [],
      getByStatus: () => [],
      save: (documentClass: DocumentClass) => documentClass,
      updateIntegrityStatus: () => undefined,
      getAggregatedIntegrityStatusByDipId: () => IntegrityStatusEnum.UNKNOWN,
      searchDocumentalClasses: (name: string) =>
        className.includes(name) ? [classEntity] : [],
    };

    const aiAdapter = {
      isInitialized: () => true,
      initialize: async () => undefined,
      generateEmbedding: async () => new Float32Array(384),
    };

    container.registerInstance(
      DocumentClassUC.SEARCH_BY_DOCUMENTAL_CLASS_NAME,
      new SearchDocumentalClassUC(documentClassRepo as never),
    );
    container.registerInstance(
      ProcessUC.SEARCH_BY_PROCESS_UUID,
      new SearchProcessUC(processRepo as never),
    );
    container.registerInstance(
      DocumentoUC.SEARCH_BY_FILTERS,
      new SearchDocumentsUC(documentRepo as never),
    );
    container.registerInstance(
      DocumentoUC.SEARCH_SEMANTIC,
      new SearchSemanticUC(documentRepo as never),
    );
    container.registerInstance(WORD_EMBEDDING_PORT_TOKEN, aiAdapter as never);
    container.registerInstance(
      DOCUMENTO_REPOSITORY_TOKEN,
      documentRepo as never,
    );

    SearchIpcAdapter.register(ipcMain as never);

    bridge = {
      invoke: vi.fn((channel: string, payload: unknown) =>
        ipcMain.invoke(channel, payload),
      ),
    };

    const cacheStore = new Map<string, SearchResult[]>();
    cache = {
      get: vi.fn((key: string) => cacheStore.get(key) ?? null),
      set: vi.fn((key: string, value: SearchResult[]) => {
        cacheStore.set(key, value);
      }),
      invalidate: vi.fn((key: string) => {
        cacheStore.delete(key);
      }),
      invalidatePrefix: vi.fn((prefix: string) => {
        for (const key of cacheStore.keys()) {
          if (key.startsWith(prefix)) cacheStore.delete(key);
        }
      }),
    };

    gatewayErrorHandler = {
      handle: vi.fn((raw: unknown) => {
        const message = raw instanceof Error ? raw.message : "gateway error";
        return { code: "IPC_ERROR", message, recoverable: true };
      }),
    };

    facadeErrorHandler = {
      handle: vi.fn((raw: any) => {
        if (
          raw &&
          typeof raw === "object" &&
          "code" in raw &&
          "message" in raw
        ) {
          return raw;
        }
        const message = raw instanceof Error ? raw.message : "unexpected error";
        return { code: "SEARCH_ERROR", message, recoverable: true };
      }),
    };

    validator = {
      validate: vi.fn().mockReturnValue({ isValid: true, errors: new Map() }),
    };

    telemetry = {
      trackEvent: vi.fn(),
      trackTiming: vi.fn(),
      trackError: vi.fn(),
    };

    liveAnnouncer = {
      announce: vi.fn(),
    };

    semanticStatusProvider = {
      getStatus: vi
        .fn()
        .mockReturnValue(signal({ status: "READY", progress: 100 })),
    };

    gateway = new SearchIpcGateway(
      bridge as never,
      cache as never,
      gatewayErrorHandler as never,
    );

    facade = new SearchFacade(
      gateway,
      validator as never,
      facadeErrorHandler as never,
      telemetry as never,
      semanticStatusProvider as never,
      liveAnnouncer as never,
    );
  });

  it("full-text FREE: executes end-to-end with real use case and repositories", async () => {
    const query: SearchQuery = {
      text: freeQueryText,
      type: SearchQueryType.FREE,
      useSemanticSearch: false,
    };

    facade.setQuery(query);
    facade.search();

    await sleep(350);

    expect(bridge.invoke).toHaveBeenCalledWith(
      IpcChannels.SEARCH_FULLTEXT,
      expect.objectContaining({ text: freeQueryText }),
      expect.any(AbortSignal),
    );

    expect(facade.getState()().results).toEqual([expectedDocumentResult]);
    expect(telemetry.trackEvent).toHaveBeenCalled();
    expect(liveAnnouncer.announce).toHaveBeenCalledWith(
      "Trovati 1 risultati",
      "polite",
    );
  });

  it("full-text PROCESS_ID: routes to process search use case through IPC adapter", async () => {
    const query: SearchQuery = {
      text: "2026-ABC",
      type: SearchQueryType.PROCESS_ID,
      useSemanticSearch: false,
    };

    facade.setQuery(query);
    facade.search();
    await sleep(350);

    expect(bridge.invoke).toHaveBeenCalledWith(
      IpcChannels.SEARCH_FULLTEXT,
      expect.objectContaining({ type: SearchQueryType.PROCESS_ID }),
      expect.any(AbortSignal),
    );
    expect(facade.getState()().results).toEqual([
      expect.objectContaining({ uuid: processUuid }),
    ]);
  });

  it("full-text CLASS_NAME: routes to documental class search use case through IPC adapter", async () => {
    const query: SearchQuery = {
      text: "Contratti",
      type: SearchQueryType.CLASS_NAME,
      useSemanticSearch: false,
    };

    facade.setQuery(query);
    facade.search();
    await sleep(350);

    expect(bridge.invoke).toHaveBeenCalledWith(
      IpcChannels.SEARCH_FULLTEXT,
      expect.objectContaining({ type: SearchQueryType.CLASS_NAME }),
      expect.any(AbortSignal),
    );
    expect(facade.getState()().results).toEqual([
      expect.objectContaining({ name: className }),
    ]);
  });

  it("full-text FREE: returns empty results when backend finds nothing", async () => {
    const query: SearchQuery = {
      text: "nessun documento",
      type: SearchQueryType.FREE,
      useSemanticSearch: false,
    };

    facade.setQuery(query);
    facade.search();
    await sleep(350);

    expect(bridge.invoke).toHaveBeenCalledWith(
      IpcChannels.SEARCH_FULLTEXT,
      expect.objectContaining({ text: "nessun documento" }),
      expect.any(AbortSignal),
    );
    expect(facade.getState()().results).toEqual([]);
    expect(facade.getState()().error).toBeNull();
    expect(liveAnnouncer.announce).toHaveBeenCalledWith(
      "Trovati 0 risultati",
      "polite",
    );
  });

  it("full-text FREE: propagates backend errors into facade state", async () => {
    searchDocumentImpl = () => {
      throw new Error("SQLite unavailable");
    };

    const query: SearchQuery = {
      text: freeQueryText,
      type: SearchQueryType.FREE,
      useSemanticSearch: false,
    };

    facade.setQuery(query);
    facade.search();
    await sleep(350);

    expect(gatewayErrorHandler.handle).toHaveBeenCalled();
    expect(facadeErrorHandler.handle).toHaveBeenCalled();
    expect(facade.getState()().error).toEqual({
      code: "IPC_ERROR",
      message: "SQLite unavailable",
      recoverable: true,
    });
    expect(telemetry.trackError).toHaveBeenCalled();
  });

  it("semantic: does not trigger backend when indexing status is not READY", async () => {
    semanticStatusProvider.getStatus.mockReturnValue(
      signal({ status: "INDEXING", progress: 42 }),
    );

    facade.searchSemantic({
      text: "contratto",
      type: SearchQueryType.FREE,
      useSemanticSearch: true,
    });
    await sleep(0);

    expect(bridge.invoke).not.toHaveBeenCalledWith(
      IpcChannels.SEARCH_SEMANTIC,
      expect.anything(),
      expect.anything(),
    );
    expect(facade.getState()().results).toEqual([]);
    expect(facade.getState()().error).toBeNull();
  });

  it("semantic: executes end-to-end when indexing status is READY", async () => {
    searchDocumentSemanticImpl = async () => [
      {
        document: new Document(
          "DOC-SEM-001",
          [
            new Metadata("nome", "Contratto lavoro dipendente.pdf"),
            new Metadata("tipoDocumento", "DOCUMENTO INFORMATICO"),
          ],
          1,
        ),
        score: 0.91,
      },
    ];

    semanticStatusProvider.getStatus.mockReturnValue(
      signal({ status: "READY", progress: 100 }),
    );

    facade.searchSemantic({
      text: "contratto di lavoro",
      type: SearchQueryType.FREE,
      useSemanticSearch: true,
    });
    await sleep(0);

    expect(bridge.invoke).toHaveBeenCalledWith(
      IpcChannels.SEARCH_SEMANTIC,
      expect.objectContaining({ text: "contratto di lavoro" }),
      expect.any(AbortSignal),
    );
    expect(facade.getState()().results).toEqual([
      {
        documentId: "DOC-SEM-001",
        name: "Contratto lavoro dipendente.pdf",
        type: "DOCUMENTO INFORMATICO",
        score: 0.91,
      },
    ]);
    expect(liveAnnouncer.announce).toHaveBeenCalledWith(
      "Trovati 1 risultati",
      "polite",
    );
  });

  it("advanced search: stops before IPC when validation fails", async () => {
    validator.validate.mockReturnValue({
      isValid: false,
      errors: new Map([
        [
          "common",
          [
            {
              field: "common",
              message: "Filtro comune non valido",
              code: "INVALID_FILTER",
            },
          ],
        ],
      ]),
    });

    const invalidFilters = {} as SearchFilters;

    facade.searchAdvanced(invalidFilters as any);
    await sleep(0);

    expect(bridge.invoke).not.toHaveBeenCalled();
    expect(facade.getState()().validationErrors.size).toBe(1);
    expect(
      facade.getState()().validationErrors.get("common")?.[0].message,
    ).toBe("Filtro comune non valido");
  });
});
