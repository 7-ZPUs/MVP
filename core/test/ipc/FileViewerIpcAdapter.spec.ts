import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("electron", () => ({
  dialog: {
    showSaveDialog: vi.fn(),
    showOpenDialog: vi.fn(),
  },
}));

vi.mock("tsyringe", () => ({
  container: { resolve: vi.fn() },
  injectable: () => () => {},
  inject: () => () => {},
}));

import { container } from "tsyringe";
import { FileViewerIpcAdapter } from "../../src/ipc/FileViewerIpcAdapter";
import { IpcChannels } from "../../../shared/ipc-channels";
import { ExportResult } from "../../../shared/domain/ExportResult";

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

describe("FileViewerIpcAdapter", () => {
  let ipcMain: ReturnType<typeof makeIpcMain>;
  let exportFileUC: { execute: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    ipcMain = makeIpcMain();
    vi.clearAllMocks();

    exportFileUC = { execute: vi.fn() };

    (container.resolve as ReturnType<typeof vi.fn>).mockReturnValueOnce(
      exportFileUC,
    );

    FileViewerIpcAdapter.register(ipcMain as any);
  });

  it("registra tutti i channel IPC attesi", () => {
    const registeredChannels = (
      ipcMain.handle as ReturnType<typeof vi.fn>
    ).mock.calls.map((call: unknown[]) => call[0]);

    expect(registeredChannels).toContain(IpcChannels.FILE_DOWNLOAD);
  });

  describe("FILE_DOWNLOAD", () => {
    it("chiama exportFileUC.execute con fileId e targetPath", async () => {
      exportFileUC.execute.mockResolvedValue(ExportResult.ok());

      await ipcMain.invoke(IpcChannels.FILE_DOWNLOAD, {
        fileId: 1,
        destPath: "/dest/file.pdf",
      });

      expect(exportFileUC.execute).toHaveBeenCalledWith(1, "/dest/file.pdf");
    });

    it("ritorna ExportResult.ok() se l'esportazione riesce", async () => {
      exportFileUC.execute.mockResolvedValue(ExportResult.ok());

      const result = await ipcMain.invoke(IpcChannels.FILE_DOWNLOAD, {
        fileId: 1,
        destPath: "/dest/file.pdf",
      });

      expect(result.success).toBe(true);
    });

    it("ritorna ExportResult.fail() se il file non esiste", async () => {
      exportFileUC.execute.mockResolvedValue(
        ExportResult.fail("NOT_FOUND", "File non trovato"),
      );

      const result = await ipcMain.invoke(IpcChannels.FILE_DOWNLOAD, {
        fileId: 99,
        destPath: "/dest/file.pdf",
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("NOT_FOUND");
    });

    it("ritorna ExportResult.fail() se la scrittura fallisce", async () => {
      exportFileUC.execute.mockResolvedValue(
        ExportResult.fail("WRITE_ERROR", "Permesso negato"),
      );

      const result = await ipcMain.invoke(IpcChannels.FILE_DOWNLOAD, {
        fileId: 1,
        destPath: "/dest/protetto/file.pdf",
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("WRITE_ERROR");
    });

    it("propaga eccezioni di exportFileUC.execute", async () => {
      exportFileUC.execute.mockRejectedValue(new Error("export exploded"));

      await expect(
        ipcMain.invoke(IpcChannels.FILE_DOWNLOAD, {
          fileId: 1,
          destPath: "/dest/file.pdf",
        }),
      ).rejects.toThrow("export exploded");
    });
  });
});
