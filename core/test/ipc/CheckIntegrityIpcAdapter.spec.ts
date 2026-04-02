import { describe, expect, it, vi, beforeEach } from "vitest";
import type { IpcMain } from "electron";

const { resolveMock } = vi.hoisted(() => ({
  resolveMock: vi.fn(),
}));

vi.mock("tsyringe", () => ({
  container: {
    resolve: resolveMock,
  },
}));

import { CheckIntegrityIpcAdapter } from "../../src/ipc/CheckIntegrityIpcAdapter";
import { IpcChannels } from "../../../shared/ipc-channels";
import { DocumentoUC } from "../../src/use-case/document/tokens";
import { FileUC } from "../../src/use-case/file/tokens";
import { ProcessUC } from "../../src/use-case/process/token";
import { DocumentClassUC } from "../../src/use-case/classe-documentale/tokens";
import { DipUC } from "../../src/use-case/dip/token";
import { IntegrityStatusEnum } from "../../src/value-objects/IntegrityStatusEnum";

type IpcHandler = (_event: unknown, ...args: unknown[]) => unknown;

function createIpcMainMock(): {
  ipcMain: IpcMain;
  handleMock: ReturnType<typeof vi.fn>;
} {
  const handleMock = vi.fn((_channel: string, _handler: IpcHandler) => {});

  return {
    ipcMain: { handle: handleMock } as unknown as IpcMain,
    handleMock,
  };
}

function getRegisteredHandler(handleMock: ReturnType<typeof vi.fn>, channel: string): IpcHandler {
  const matchedCall = handleMock.mock.calls.find((call) => call[0] === channel);
  const handler = matchedCall?.[1] as IpcHandler | undefined;
  if (!handler) {
    throw new Error(`Handler not registered for channel: ${channel}`);
  }
  return handler;
}

describe("CheckIntegrityIpcAdapter", () => {
  let checkDocumentIntegrityUC: { execute: ReturnType<typeof vi.fn> };
  let checkFileIntegrityUC: { execute: ReturnType<typeof vi.fn> };
  let checkProcessIntegrityUC: { execute: ReturnType<typeof vi.fn> };
  let checkDocumentClassIntegrityUC: { execute: ReturnType<typeof vi.fn> };
  let checkDipIntegrityUC: { execute: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
    resolveMock.mockReset();

    checkDocumentIntegrityUC = { execute: vi.fn() };
    checkFileIntegrityUC = { execute: vi.fn() };
    checkProcessIntegrityUC = { execute: vi.fn() };
    checkDocumentClassIntegrityUC = { execute: vi.fn() };
    checkDipIntegrityUC = { execute: vi.fn() };

    resolveMock.mockImplementation((token: symbol) => {
      switch (token) {
        case DocumentoUC.CHECK_INTEGRITY_STATUS:
          return checkDocumentIntegrityUC;
        case FileUC.CHECK_INTEGRITY_STATUS:
          return checkFileIntegrityUC;
        case ProcessUC.CHECK_INTEGRITY_STATUS:
          return checkProcessIntegrityUC;
        case DocumentClassUC.CHECK_INTEGRITY_STATUS:
          return checkDocumentClassIntegrityUC;
        case DipUC.CHECK_INTEGRITY_STATUS:
          return checkDipIntegrityUC;
        default:
          throw new Error(`Unexpected token: ${String(token)}`);
      }
    });
  });

  // identifier: TU-S-browsing-107
  // method_name: register()
  // description: should resolve all integrity use-cases and register all integrity channels
  // expected_value: all expected channels are registered and all expected tokens are resolved
  it("TU-S-browsing-107: register() should resolve all integrity use-cases and register all integrity channels", () => {
    const { ipcMain, handleMock } = createIpcMainMock();

    CheckIntegrityIpcAdapter.register(ipcMain);

    expect(resolveMock).toHaveBeenCalledWith(DocumentoUC.CHECK_INTEGRITY_STATUS);
    expect(resolveMock).toHaveBeenCalledWith(FileUC.CHECK_INTEGRITY_STATUS);
    expect(resolveMock).toHaveBeenCalledWith(ProcessUC.CHECK_INTEGRITY_STATUS);
    expect(resolveMock).toHaveBeenCalledWith(DocumentClassUC.CHECK_INTEGRITY_STATUS);
    expect(resolveMock).toHaveBeenCalledWith(DipUC.CHECK_INTEGRITY_STATUS);

    expect(handleMock).toHaveBeenCalledTimes(5);
    expect(
      handleMock.mock.calls.some(
        (call) => call[0] === IpcChannels.CHECK_DOCUMENT_INTEGRITY_STATUS,
      ),
    ).toBe(true);
    expect(
      handleMock.mock.calls.some(
        (call) => call[0] === IpcChannels.CHECK_FILE_INTEGRITY_STATUS,
      ),
    ).toBe(true);
    expect(
      handleMock.mock.calls.some(
        (call) => call[0] === IpcChannels.CHECK_PROCESS_INTEGRITY_STATUS,
      ),
    ).toBe(true);
    expect(
      handleMock.mock.calls.some(
        (call) => call[0] === IpcChannels.CHECK_DOCUMENT_CLASS_INTEGRITY_STATUS,
      ),
    ).toBe(true);
    expect(
      handleMock.mock.calls.some((call) => call[0] === IpcChannels.CHECK_DIP_INTEGRITY_STATUS),
    ).toBe(true);
  });

  // identifier: TU-S-browsing-108
  // method_name: register()
  // description: should delegate document/process/document-class/dip integrity checks to their use-cases
  // expected_value: handlers call execute with the provided id and return the use-case result
  it("TU-S-browsing-108: register() should delegate non-file integrity checks to the resolved use-cases", async () => {
    const { ipcMain, handleMock } = createIpcMainMock();

    checkDocumentIntegrityUC.execute.mockResolvedValue(IntegrityStatusEnum.VALID);
    checkProcessIntegrityUC.execute.mockResolvedValue(IntegrityStatusEnum.INVALID);
    checkDocumentClassIntegrityUC.execute.mockResolvedValue(IntegrityStatusEnum.UNKNOWN);
    checkDipIntegrityUC.execute.mockResolvedValue(IntegrityStatusEnum.VALID);

    CheckIntegrityIpcAdapter.register(ipcMain);

    const documentResult = await getRegisteredHandler(
      handleMock,
      IpcChannels.CHECK_DOCUMENT_INTEGRITY_STATUS,
    )({}, 10);
    const processResult = await getRegisteredHandler(
      handleMock,
      IpcChannels.CHECK_PROCESS_INTEGRITY_STATUS,
    )({}, 11);
    const documentClassResult = await getRegisteredHandler(
      handleMock,
      IpcChannels.CHECK_DOCUMENT_CLASS_INTEGRITY_STATUS,
    )({}, 12);
    const dipResult = await getRegisteredHandler(handleMock, IpcChannels.CHECK_DIP_INTEGRITY_STATUS)(
      {},
      13,
    );

    expect(checkDocumentIntegrityUC.execute).toHaveBeenCalledWith(10);
    expect(checkProcessIntegrityUC.execute).toHaveBeenCalledWith(11);
    expect(checkDocumentClassIntegrityUC.execute).toHaveBeenCalledWith(12);
    expect(checkDipIntegrityUC.execute).toHaveBeenCalledWith(13);

    expect(documentResult).toBe(IntegrityStatusEnum.VALID);
    expect(processResult).toBe(IntegrityStatusEnum.INVALID);
    expect(documentClassResult).toBe(IntegrityStatusEnum.UNKNOWN);
    expect(dipResult).toBe(IntegrityStatusEnum.VALID);
  });

  // identifier: TU-S-browsing-109
  // method_name: register()
  // description: should await and return file integrity result
  // expected_value: file channel handler resolves to the same value returned by use-case
  it("TU-S-browsing-109: register() should await and return file integrity result", async () => {
    const { ipcMain, handleMock } = createIpcMainMock();
    checkFileIntegrityUC.execute.mockResolvedValue(IntegrityStatusEnum.UNKNOWN);

    CheckIntegrityIpcAdapter.register(ipcMain);

    const result = await getRegisteredHandler(handleMock, IpcChannels.CHECK_FILE_INTEGRITY_STATUS)(
      {},
      22,
    );

    expect(checkFileIntegrityUC.execute).toHaveBeenCalledWith(22);
    expect(result).toBe(IntegrityStatusEnum.UNKNOWN);
  });

  // identifier: TU-S-browsing-110
  // method_name: register()
  // description: should propagate rejection from file integrity use-case
  // expected_value: file channel handler rejects with the same error from use-case
  it("TU-S-browsing-110: register() should propagate rejection from file integrity use-case", async () => {
    const { ipcMain, handleMock } = createIpcMainMock();
    checkFileIntegrityUC.execute.mockRejectedValue(new Error("File with id 99 not found"));

    CheckIntegrityIpcAdapter.register(ipcMain);

    await expect(
      getRegisteredHandler(handleMock, IpcChannels.CHECK_FILE_INTEGRITY_STATUS)({}, 99),
    ).rejects.toThrow("File with id 99 not found");
  });
});