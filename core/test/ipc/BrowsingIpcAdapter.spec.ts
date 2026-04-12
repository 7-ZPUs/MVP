import { beforeEach, describe, expect, it, vi } from "vitest";
import type { IpcMain } from "electron";

const {
  resolveMock,
  documentToDtoMock,
  fileToDtoMock,
  processToDtoMock,
  documentClassToDtoMock,
  dipToDtoMock,
} = vi.hoisted(() => ({
  resolveMock: vi.fn(),
  documentToDtoMock: vi.fn(),
  fileToDtoMock: vi.fn(),
  processToDtoMock: vi.fn(),
  documentClassToDtoMock: vi.fn(),
  dipToDtoMock: vi.fn(),
}));

vi.mock("tsyringe", () => ({
  container: {
    resolve: resolveMock,
  },
}));

vi.mock("../../src/repo/impl/EntityToDtoConverter", () => ({
  EntityToDtoConverter: {
    documentToDto: documentToDtoMock,
    fileToDto: fileToDtoMock,
    processToDto: processToDtoMock,
    documentClassToDto: documentClassToDtoMock,
    dipToDto: dipToDtoMock,
  },
}));

import { BrowsingIpcAdapter } from "../../src/ipc/BrowsingIpcAdapter";
import { IpcChannels } from "../../../shared/ipc-channels";
import { IntegrityStatusEnum } from "../../src/value-objects/IntegrityStatusEnum";
import { DocumentoUC } from "../../src/use-case/document/tokens";
import { FileUC } from "../../src/use-case/file/tokens";
import { ProcessUC } from "../../src/use-case/process/token";
import { DocumentClassUC } from "../../src/use-case/classe-documentale/tokens";
import { DipUC } from "../../src/use-case/dip/token";

type IpcHandler = (_event: unknown, ...args: unknown[]) => unknown;

function createIpcMainMock(): {
  ipcMain: IpcMain;
  handleMock: ReturnType<typeof vi.fn>;
  handlers: Map<string, IpcHandler>;
} {
  const handlers = new Map<string, IpcHandler>();
  const handleMock = vi.fn((channel: string, handler: IpcHandler) => {
    handlers.set(channel, handler);
  });

  return {
    ipcMain: { handle: handleMock } as unknown as IpcMain,
    handleMock,
    handlers,
  };
}

function getHandler(handlers: Map<string, IpcHandler>, channel: string): IpcHandler {
  const handler = handlers.get(channel);
  if (!handler) {
    throw new Error(`Handler not registered for channel: ${channel}`);
  }
  return handler;
}

describe("BrowsingIpcAdapter", () => {
  let getDocByIdUC: { execute: ReturnType<typeof vi.fn> };
  let getDocByProcessUC: { execute: ReturnType<typeof vi.fn> };
  let getDocByStatusUC: { execute: ReturnType<typeof vi.fn> };
  let getFileByIdUC: { execute: ReturnType<typeof vi.fn> };
  let getFileByDocUC: { execute: ReturnType<typeof vi.fn> };
  let getFileByStatusUC: { execute: ReturnType<typeof vi.fn> };
  let getProcessByIdUC: { execute: ReturnType<typeof vi.fn> };
  let getProcessByStatusUC: { execute: ReturnType<typeof vi.fn> };
  let getProcessByDocumentClassUC: { execute: ReturnType<typeof vi.fn> };
  let getDocClassByDipIdUC: { execute: ReturnType<typeof vi.fn> };
  let getDocClassByStatusUC: { execute: ReturnType<typeof vi.fn> };
  let getDocClassByIdUC: { execute: ReturnType<typeof vi.fn> };
  let getDipByIdUC: { execute: ReturnType<typeof vi.fn> };
  let getDipByStatusUC: { execute: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
    resolveMock.mockReset();

    getDocByIdUC = { execute: vi.fn() };
    getDocByProcessUC = { execute: vi.fn() };
    getDocByStatusUC = { execute: vi.fn() };

    getFileByIdUC = { execute: vi.fn() };
    getFileByDocUC = { execute: vi.fn() };
    getFileByStatusUC = { execute: vi.fn() };

    getProcessByIdUC = { execute: vi.fn() };
    getProcessByStatusUC = { execute: vi.fn() };
    getProcessByDocumentClassUC = { execute: vi.fn() };

    getDocClassByDipIdUC = { execute: vi.fn() };
    getDocClassByStatusUC = { execute: vi.fn() };
    getDocClassByIdUC = { execute: vi.fn() };

    getDipByIdUC = { execute: vi.fn() };
    getDipByStatusUC = { execute: vi.fn() };

    resolveMock.mockImplementation((token: symbol) => {
      switch (token) {
        case DocumentoUC.GET_BY_ID:
          return getDocByIdUC;
        case DocumentoUC.GET_BY_PROCESS:
          return getDocByProcessUC;
        case DocumentoUC.GET_BY_STATUS:
          return getDocByStatusUC;
        case FileUC.GET_BY_ID:
          return getFileByIdUC;
        case FileUC.GET_BY_DOCUMENT:
          return getFileByDocUC;
        case FileUC.GET_BY_STATUS:
          return getFileByStatusUC;
        case ProcessUC.GET_BY_ID:
          return getProcessByIdUC;
        case ProcessUC.GET_BY_STATUS:
          return getProcessByStatusUC;
        case ProcessUC.GET_BY_DOCUMENT_CLASS:
          return getProcessByDocumentClassUC;
        case DocumentClassUC.GET_BY_DIP_ID:
          return getDocClassByDipIdUC;
        case DocumentClassUC.GET_BY_STATUS:
          return getDocClassByStatusUC;
        case DocumentClassUC.GET_BY_ID:
          return getDocClassByIdUC;
        case DipUC.GET_BY_ID:
          return getDipByIdUC;
        case DipUC.GET_BY_STATUS:
          return getDipByStatusUC;
        case FileUC.GET_CONTENT:
          return { execute: vi.fn() };
        default:
          throw new Error(`Unexpected token: ${String(token)}`);
      }
    });
  });

  // identifier: TU-S-browsing-111
  // method_name: register()
  // description: should resolve all browsing use-cases and register all browse channels handled by adapter
  // expected_value: all expected channels are registered and all expected tokens are resolved
  it("TU-S-browsing-111: register() should resolve all browsing use-cases and register all browse channels handled by adapter", () => {
    const { ipcMain, handleMock, handlers } = createIpcMainMock();

    BrowsingIpcAdapter.register(ipcMain);

    expect(resolveMock).toHaveBeenCalledWith(DocumentoUC.GET_BY_ID);
    expect(resolveMock).toHaveBeenCalledWith(DocumentoUC.GET_BY_PROCESS);
    expect(resolveMock).toHaveBeenCalledWith(DocumentoUC.GET_BY_STATUS);
    expect(resolveMock).toHaveBeenCalledWith(FileUC.GET_BY_ID);
    expect(resolveMock).toHaveBeenCalledWith(FileUC.GET_BY_DOCUMENT);
    expect(resolveMock).toHaveBeenCalledWith(FileUC.GET_BY_STATUS);
    expect(resolveMock).toHaveBeenCalledWith(ProcessUC.GET_BY_ID);
    expect(resolveMock).toHaveBeenCalledWith(ProcessUC.GET_BY_STATUS);
    expect(resolveMock).toHaveBeenCalledWith(ProcessUC.GET_BY_DOCUMENT_CLASS);
    expect(resolveMock).toHaveBeenCalledWith(DocumentClassUC.GET_BY_DIP_ID);
    expect(resolveMock).toHaveBeenCalledWith(DocumentClassUC.GET_BY_STATUS);
    expect(resolveMock).toHaveBeenCalledWith(DocumentClassUC.GET_BY_ID);
    expect(resolveMock).toHaveBeenCalledWith(DipUC.GET_BY_ID);
    expect(resolveMock).toHaveBeenCalledWith(DipUC.GET_BY_STATUS);

    expect(handleMock).toHaveBeenCalledTimes(15);
    expect(handlers.has(IpcChannels.BROWSE_GET_DOCUMENT_BY_ID)).toBe(true);
    expect(handlers.has(IpcChannels.BROWSE_GET_DOCUMENTS_BY_PROCESS)).toBe(true);
    expect(handlers.has(IpcChannels.BROWSE_GET_DOCUMENTS_BY_STATUS)).toBe(true);
    expect(handlers.has(IpcChannels.BROWSE_GET_FILE_BY_ID)).toBe(true);
    expect(handlers.has(IpcChannels.BROWSE_GET_FILE_BUFFER_BY_ID)).toBe(true);
    expect(handlers.has(IpcChannels.BROWSE_GET_FILE_BY_DOCUMENT)).toBe(true);
    expect(handlers.has(IpcChannels.BROWSE_GET_FILE_BY_STATUS)).toBe(true);
    expect(handlers.has(IpcChannels.BROWSE_GET_PROCESS_BY_ID)).toBe(true);
    expect(handlers.has(IpcChannels.BROWSE_GET_PROCESS_BY_STATUS)).toBe(true);
    expect(handlers.has(IpcChannels.BROWSE_GET_PROCESS_BY_DOCUMENT_CLASS)).toBe(true);
    expect(handlers.has(IpcChannels.BROWSE_GET_DOCUMENT_CLASS_BY_DIP_ID)).toBe(true);
    expect(handlers.has(IpcChannels.BROWSE_GET_DOCUMENT_CLASS_BY_STATUS)).toBe(true);
    expect(handlers.has(IpcChannels.BROWSE_GET_DOCUMENT_CLASS_BY_ID)).toBe(true);
    expect(handlers.has(IpcChannels.BROWSE_GET_DIP_BY_ID)).toBe(true);
    expect(handlers.has(IpcChannels.BROWSE_GET_DIP_BY_STATUS)).toBe(true);

    expect(handlers.has(IpcChannels.BROWSE_GET_DIP_BY_DOCUMENT_CLASS)).toBe(false);
  });

  // identifier: TU-S-browsing-112
  // method_name: register()
  // description: should map all by-id channels to DTO when entity exists
  // expected_value: each by-id channel delegates to use-case and returns mapped DTO
  it("TU-S-browsing-112: register() should map all by-id channels to DTO when entity exists", () => {
    const { ipcMain, handlers } = createIpcMainMock();

    const docEntity = { kind: "doc-entity" };
    const fileEntity = { kind: "file-entity" };
    const processEntity = { kind: "process-entity" };
    const docClassEntity = { kind: "doc-class-entity" };
    const dipEntity = { kind: "dip-entity" };

    getDocByIdUC.execute.mockReturnValue(docEntity);
    getFileByIdUC.execute.mockReturnValue(fileEntity);
    getProcessByIdUC.execute.mockReturnValue(processEntity);
    getDocClassByIdUC.execute.mockReturnValue(docClassEntity);
    getDipByIdUC.execute.mockReturnValue(dipEntity);

    documentToDtoMock.mockReturnValue({ id: 1, dto: "doc" });
    fileToDtoMock.mockReturnValue({ id: 2, dto: "file" });
    processToDtoMock.mockReturnValue({ id: 3, dto: "process" });
    documentClassToDtoMock.mockReturnValue({ id: 4, dto: "doc-class" });
    dipToDtoMock.mockReturnValue({ id: 5, dto: "dip" });

    BrowsingIpcAdapter.register(ipcMain);

    const docResult = getHandler(handlers, IpcChannels.BROWSE_GET_DOCUMENT_BY_ID)({}, 10);
    const fileResult = getHandler(handlers, IpcChannels.BROWSE_GET_FILE_BY_ID)({}, 11);
    const processResult = getHandler(handlers, IpcChannels.BROWSE_GET_PROCESS_BY_ID)({}, 12);
    const docClassResult = getHandler(handlers, IpcChannels.BROWSE_GET_DOCUMENT_CLASS_BY_ID)({}, 13);
    const dipResult = getHandler(handlers, IpcChannels.BROWSE_GET_DIP_BY_ID)({}, 14);

    expect(getDocByIdUC.execute).toHaveBeenCalledWith(10);
    expect(getFileByIdUC.execute).toHaveBeenCalledWith(11);
    expect(getProcessByIdUC.execute).toHaveBeenCalledWith(12);
    expect(getDocClassByIdUC.execute).toHaveBeenCalledWith(13);
    expect(getDipByIdUC.execute).toHaveBeenCalledWith(14);

    expect(documentToDtoMock).toHaveBeenCalledWith(docEntity);
    expect(fileToDtoMock).toHaveBeenCalledWith(fileEntity);
    expect(processToDtoMock).toHaveBeenCalledWith(processEntity);
    expect(documentClassToDtoMock).toHaveBeenCalledWith(docClassEntity);
    expect(dipToDtoMock).toHaveBeenCalledWith(dipEntity);

    expect(docResult).toEqual({ id: 1, dto: "doc" });
    expect(fileResult).toEqual({ id: 2, dto: "file" });
    expect(processResult).toEqual({ id: 3, dto: "process" });
    expect(docClassResult).toEqual({ id: 4, dto: "doc-class" });
    expect(dipResult).toEqual({ id: 5, dto: "dip" });
  });

  // identifier: TU-S-browsing-113
  // method_name: register()
  // description: should return null for all by-id channels when entity is not found
  // expected_value: converter is not called and null is returned for each by-id channel
  it("TU-S-browsing-113: register() should return null for all by-id channels when entity is not found", () => {
    const { ipcMain, handlers } = createIpcMainMock();

    getDocByIdUC.execute.mockReturnValue(null);
    getFileByIdUC.execute.mockReturnValue(null);
    getProcessByIdUC.execute.mockReturnValue(null);
    getDocClassByIdUC.execute.mockReturnValue(null);
    getDipByIdUC.execute.mockReturnValue(null);

    BrowsingIpcAdapter.register(ipcMain);

    const docResult = getHandler(handlers, IpcChannels.BROWSE_GET_DOCUMENT_BY_ID)({}, 100);
    const fileResult = getHandler(handlers, IpcChannels.BROWSE_GET_FILE_BY_ID)({}, 101);
    const processResult = getHandler(handlers, IpcChannels.BROWSE_GET_PROCESS_BY_ID)({}, 102);
    const docClassResult = getHandler(handlers, IpcChannels.BROWSE_GET_DOCUMENT_CLASS_BY_ID)({}, 103);
    const dipResult = getHandler(handlers, IpcChannels.BROWSE_GET_DIP_BY_ID)({}, 104);

    expect(docResult).toBeNull();
    expect(fileResult).toBeNull();
    expect(processResult).toBeNull();
    expect(docClassResult).toBeNull();
    expect(dipResult).toBeNull();

    expect(documentToDtoMock).not.toHaveBeenCalled();
    expect(fileToDtoMock).not.toHaveBeenCalled();
    expect(processToDtoMock).not.toHaveBeenCalled();
    expect(documentClassToDtoMock).not.toHaveBeenCalled();
    expect(dipToDtoMock).not.toHaveBeenCalled();
  });

  // identifier: TU-S-browsing-114
  // method_name: register()
  // description: should map document list channels to DTO and forward arguments
  // expected_value: list channels return mapped arrays and execute receives the provided argument
  it("TU-S-browsing-114: register() should map document list channels to DTO and forward arguments", () => {
    const { ipcMain, handlers } = createIpcMainMock();
    const doc1 = { id: "d1" };
    const doc2 = { id: "d2" };

    getDocByProcessUC.execute.mockReturnValue([doc1, doc2]);
    getDocByStatusUC.execute.mockReturnValue([doc1]);

    documentToDtoMock.mockImplementation((entity: unknown) => ({ mapped: entity }));

    BrowsingIpcAdapter.register(ipcMain);

    const byProcessResult = getHandler(handlers, IpcChannels.BROWSE_GET_DOCUMENTS_BY_PROCESS)(
      {},
      200,
    );
    const byStatusResult = getHandler(handlers, IpcChannels.BROWSE_GET_DOCUMENTS_BY_STATUS)(
      {},
      IntegrityStatusEnum.VALID,
    );

    expect(getDocByProcessUC.execute).toHaveBeenCalledWith(200);
    expect(getDocByStatusUC.execute).toHaveBeenCalledWith(IntegrityStatusEnum.VALID);

    expect(documentToDtoMock).toHaveBeenCalledWith(doc1);
    expect(documentToDtoMock).toHaveBeenCalledWith(doc2);
    expect(byProcessResult).toEqual([{ mapped: doc1 }, { mapped: doc2 }]);
    expect(byStatusResult).toEqual([{ mapped: doc1 }]);
  });

  // identifier: TU-S-browsing-115
  // method_name: register()
  // description: should map file list channels to DTO and forward arguments
  // expected_value: list channels return mapped arrays and execute receives the provided argument
  it("TU-S-browsing-115: register() should map file list channels to DTO and forward arguments", () => {
    const { ipcMain, handlers } = createIpcMainMock();
    const file1 = { id: "f1" };
    const file2 = { id: "f2" };

    getFileByDocUC.execute.mockReturnValue([file1, file2]);
    getFileByStatusUC.execute.mockReturnValue([file2]);

    fileToDtoMock.mockImplementation((entity: unknown) => ({ mapped: entity }));

    BrowsingIpcAdapter.register(ipcMain);

    const byDocumentResult = getHandler(handlers, IpcChannels.BROWSE_GET_FILE_BY_DOCUMENT)(
      {},
      300,
    );
    const byStatusResult = getHandler(handlers, IpcChannels.BROWSE_GET_FILE_BY_STATUS)(
      {},
      IntegrityStatusEnum.UNKNOWN,
    );

    expect(getFileByDocUC.execute).toHaveBeenCalledWith(300);
    expect(getFileByStatusUC.execute).toHaveBeenCalledWith(IntegrityStatusEnum.UNKNOWN);

    expect(fileToDtoMock).toHaveBeenCalledWith(file1);
    expect(fileToDtoMock).toHaveBeenCalledWith(file2);
    expect(byDocumentResult).toEqual([{ mapped: file1 }, { mapped: file2 }]);
    expect(byStatusResult).toEqual([{ mapped: file2 }]);
  });

  // identifier: TU-S-browsing-116
  // method_name: register()
  // description: should map process list channels to DTO and forward arguments
  // expected_value: list channels return mapped arrays and execute receives the provided argument
  it("TU-S-browsing-116: register() should map process list channels to DTO and forward arguments", () => {
    const { ipcMain, handlers } = createIpcMainMock();
    const process1 = { id: "p1" };
    const process2 = { id: "p2" };

    getProcessByStatusUC.execute.mockReturnValue([process1, process2]);
    getProcessByDocumentClassUC.execute.mockReturnValue([process2]);

    processToDtoMock.mockImplementation((entity: unknown) => ({ mapped: entity }));

    BrowsingIpcAdapter.register(ipcMain);

    const byStatusResult = getHandler(handlers, IpcChannels.BROWSE_GET_PROCESS_BY_STATUS)(
      {},
      IntegrityStatusEnum.INVALID,
    );
    const byDocClassResult = getHandler(
      handlers,
      IpcChannels.BROWSE_GET_PROCESS_BY_DOCUMENT_CLASS,
    )({}, 400);

    expect(getProcessByStatusUC.execute).toHaveBeenCalledWith(IntegrityStatusEnum.INVALID);
    expect(getProcessByDocumentClassUC.execute).toHaveBeenCalledWith(400);

    expect(processToDtoMock).toHaveBeenCalledWith(process1);
    expect(processToDtoMock).toHaveBeenCalledWith(process2);
    expect(byStatusResult).toEqual([{ mapped: process1 }, { mapped: process2 }]);
    expect(byDocClassResult).toEqual([{ mapped: process2 }]);
  });

  // identifier: TU-S-browsing-117
  // method_name: register()
  // description: should map document-class list channels to DTO and forward arguments
  // expected_value: list channels return mapped arrays and execute receives the provided argument
  it("TU-S-browsing-117: register() should map document-class list channels to DTO and forward arguments", () => {
    const { ipcMain, handlers } = createIpcMainMock();
    const docClass1 = { id: "dc1" };
    const docClass2 = { id: "dc2" };

    getDocClassByDipIdUC.execute.mockReturnValue([docClass1, docClass2]);
    getDocClassByStatusUC.execute.mockReturnValue([docClass2]);

    documentClassToDtoMock.mockImplementation((entity: unknown) => ({ mapped: entity }));

    BrowsingIpcAdapter.register(ipcMain);

    const byDipResult = getHandler(handlers, IpcChannels.BROWSE_GET_DOCUMENT_CLASS_BY_DIP_ID)(
      {},
      500,
    );
    const byStatusResult = getHandler(
      handlers,
      IpcChannels.BROWSE_GET_DOCUMENT_CLASS_BY_STATUS,
    )({}, IntegrityStatusEnum.VALID);

    expect(getDocClassByDipIdUC.execute).toHaveBeenCalledWith(500);
    expect(getDocClassByStatusUC.execute).toHaveBeenCalledWith(IntegrityStatusEnum.VALID);

    expect(documentClassToDtoMock).toHaveBeenCalledWith(docClass1);
    expect(documentClassToDtoMock).toHaveBeenCalledWith(docClass2);
    expect(byDipResult).toEqual([{ mapped: docClass1 }, { mapped: docClass2 }]);
    expect(byStatusResult).toEqual([{ mapped: docClass2 }]);
  });

  // identifier: TU-S-browsing-118
  // method_name: register()
  // description: should map dip-by-status channel to DTO and forward argument
  // expected_value: list channel returns mapped arrays and execute receives the provided argument
  it("TU-S-browsing-118: register() should map dip-by-status channel to DTO and forward argument", () => {
    const { ipcMain, handlers } = createIpcMainMock();
    const dip1 = { id: "dip-1" };
    const dip2 = { id: "dip-2" };

    getDipByStatusUC.execute.mockReturnValue([dip1, dip2]);
    dipToDtoMock.mockImplementation((entity: unknown) => ({ mapped: entity }));

    BrowsingIpcAdapter.register(ipcMain);

    const result = getHandler(handlers, IpcChannels.BROWSE_GET_DIP_BY_STATUS)(
      {},
      IntegrityStatusEnum.UNKNOWN,
    );

    expect(getDipByStatusUC.execute).toHaveBeenCalledWith(IntegrityStatusEnum.UNKNOWN);
    expect(dipToDtoMock).toHaveBeenCalledWith(dip1);
    expect(dipToDtoMock).toHaveBeenCalledWith(dip2);
    expect(result).toEqual([{ mapped: dip1 }, { mapped: dip2 }]);
  });
});