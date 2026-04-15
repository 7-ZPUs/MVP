import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ExportIpcGateway } from './export-ipc-gateway.service';
import { FileDTO } from '../domain/dtos';
import { IpcChannels } from '@shared/ipc-channels';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeFileDTO(overrides: Partial<FileDTO> = {}): FileDTO {
  return {
    id: 1,
    documentId: 10,
    filename: 'documento.pdf',
    path: '/tmp/documento.pdf',
    hash: 'abc123',
    integrityStatus: 'ok',
    isMain: true,
    ...overrides,
  };
}

function makeIpcMock() {
  return {
    invoke: vi.fn(),
    on: vi.fn().mockReturnValue(vi.fn()),
  };
}

// ─── Setup ────────────────────────────────────────────────────────────────────

function setup(ipcMock?: ReturnType<typeof makeIpcMock>) {
  const ipc = ipcMock ?? makeIpcMock();
  (globalThis as any).electronAPI = ipc;

  TestBed.configureTestingModule({ providers: [ExportIpcGateway] });
  const gateway = TestBed.inject(ExportIpcGateway);

  return { gateway, ipc };
}

function setupNoElectron() {
  delete (globalThis as any).electronAPI;
  TestBed.configureTestingModule({ providers: [ExportIpcGateway] });
  return { gateway: TestBed.inject(ExportIpcGateway) };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ExportIpcGateway', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    delete (globalThis as any).electronAPI;
  });

  // ── Bridge assente ─────────────────────────────────────────────────────────

  describe('senza Electron bridge', () => {
    it('exportFile ritorna ExportResult con successo=false', async () => {
      const { gateway } = setupNoElectron();
      const result = await gateway.exportFile(1);
      expect(result.success).toBe(false);
    });

    it('exportFile ritorna errorCode BRIDGE_UNAVAILABLE', async () => {
      const { gateway } = setupNoElectron();
      const result = await gateway.exportFile(1);
      expect(result.errorCode).toBe('BRIDGE_UNAVAILABLE');
    });

    it('exportFiles ritorna canceled=false e results vuoti', async () => {
      const { gateway } = setupNoElectron();
      const result = await gateway.exportFiles([1, 2]);
      expect(result).toEqual({ canceled: false, results: [] });
    });

    it('getFileDto ritorna null', async () => {
      const { gateway } = setupNoElectron();
      const result = await gateway.getFileDto(1);
      expect(result).toBeNull();
    });

    it('getFilesByDocumentId ritorna array vuoto', async () => {
      const { gateway } = setupNoElectron();
      const result = await gateway.getFilesByDocumentId(10);
      expect(result).toEqual([]);
    });

    it('printFile ritorna success=false', async () => {
      const { gateway } = setupNoElectron();
      const result = await gateway.printFile(1);
      expect(result.success).toBe(false);
    });

    it('printFiles ritorna canceled=false e results vuoti', async () => {
      const { gateway } = setupNoElectron();
      const result = await gateway.printFiles([1]);
      expect(result).toEqual({ canceled: false, results: [] });
    });

    it('onExportProgress ritorna una funzione di unsubscribe no-op', () => {
      const { gateway } = setupNoElectron();
      const unsub = gateway.onExportProgress(vi.fn());
      expect(() => unsub()).not.toThrow();
    });

    it('onPrintProgress ritorna una funzione di unsubscribe no-op', () => {
      const { gateway } = setupNoElectron();
      const unsub = gateway.onPrintProgress(vi.fn());
      expect(() => unsub()).not.toThrow();
    });
  });

  // ── exportFile ─────────────────────────────────────────────────────────────

  describe('exportFile()', () => {
    it('invoca il canale corretto con fileId', async () => {
      const ipc = makeIpcMock();
      ipc.invoke.mockResolvedValue({ success: true });
      const { gateway } = setup(ipc);

      await gateway.exportFile(42);
      expect(ipc.invoke).toHaveBeenCalledWith(IpcChannels.FILE_DOWNLOAD, 42);
    });

    it('ritorna il risultato IPC invariato', async () => {
      const ipcResult = { success: true, errorCode: null, errorMessage: null };
      const ipc = makeIpcMock();
      ipc.invoke.mockResolvedValue(ipcResult);
      const { gateway } = setup(ipc);

      const result = await gateway.exportFile(1);
      expect(result).toEqual(ipcResult);
    });

    it("propaga l'eccezione se ipc.invoke rigetta", async () => {
      const ipc = makeIpcMock();
      ipc.invoke.mockRejectedValue(new Error('IPC crash'));
      const { gateway } = setup(ipc);

      await expect(gateway.exportFile(1)).rejects.toThrow('IPC crash');
    });
  });

  // ── exportFiles ────────────────────────────────────────────────────────────

  describe('exportFiles()', () => {
    it('invoca il canale corretto con i fileIds', async () => {
      const ipc = makeIpcMock();
      ipc.invoke.mockResolvedValue({ canceled: false, results: [] });
      const { gateway } = setup(ipc);

      await gateway.exportFiles([1, 2, 3]);
      expect(ipc.invoke).toHaveBeenCalledWith(IpcChannels.FILE_DOWNLOAD_MANY, [1, 2, 3]);
    });

    it('ritorna la risposta IPC invariata', async () => {
      const ipcResult = {
        canceled: false,
        results: [
          { fileId: 1, success: true },
          { fileId: 2, success: false, error: 'IO fail' },
        ],
      };
      const ipc = makeIpcMock();
      ipc.invoke.mockResolvedValue(ipcResult);
      const { gateway } = setup(ipc);

      const result = await gateway.exportFiles([1, 2]);
      expect(result).toEqual(ipcResult);
    });

    it("ritorna canceled=true se l'utente annulla", async () => {
      const ipc = makeIpcMock();
      ipc.invoke.mockResolvedValue({ canceled: true, results: [] });
      const { gateway } = setup(ipc);

      const result = await gateway.exportFiles([1]);
      expect(result.canceled).toBe(true);
    });

    it("propaga l'eccezione se ipc.invoke rigetta", async () => {
      const ipc = makeIpcMock();
      ipc.invoke.mockRejectedValue(new Error('IPC crash'));
      const { gateway } = setup(ipc);

      await expect(gateway.exportFiles([1])).rejects.toThrow('IPC crash');
    });
  });

  // ── getFileDto ─────────────────────────────────────────────────────────────

  describe('getFileDto()', () => {
    it('invoca il canale corretto con fileId', async () => {
      const ipc = makeIpcMock();
      ipc.invoke.mockResolvedValue(makeFileDTO());
      const { gateway } = setup(ipc);

      await gateway.getFileDto(7);
      expect(ipc.invoke).toHaveBeenCalledWith('browse:get-file-by-id', 7);
    });

    it('ritorna il FileDTO dalla risposta IPC', async () => {
      const dto = makeFileDTO({ id: 7, filename: 'report.pdf' });
      const ipc = makeIpcMock();
      ipc.invoke.mockResolvedValue(dto);
      const { gateway } = setup(ipc);

      const result = await gateway.getFileDto(7);
      expect(result).toEqual(dto);
    });

    it('ritorna null se IPC risponde null', async () => {
      const ipc = makeIpcMock();
      ipc.invoke.mockResolvedValue(null);
      const { gateway } = setup(ipc);

      const result = await gateway.getFileDto(99);
      expect(result).toBeNull();
    });
  });

  // ── getFilesByDocumentId ───────────────────────────────────────────────────

  describe('getFilesByDocumentId()', () => {
    it('invoca il canale corretto con documentId', async () => {
      const ipc = makeIpcMock();
      ipc.invoke.mockResolvedValue([]);
      const { gateway } = setup(ipc);

      await gateway.getFilesByDocumentId(10);
      expect(ipc.invoke).toHaveBeenCalledWith('browse:get-file-by-document', 10);
    });

    it("ritorna l'array di FileDTO dalla risposta IPC", async () => {
      const dtos = [makeFileDTO({ id: 1 }), makeFileDTO({ id: 2 })];
      const ipc = makeIpcMock();
      ipc.invoke.mockResolvedValue(dtos);
      const { gateway } = setup(ipc);

      const result = await gateway.getFilesByDocumentId(10);
      expect(result).toEqual(dtos);
      expect(result).toHaveLength(2);
    });

    it('ritorna array vuoto se IPC risponde con array vuoto', async () => {
      const ipc = makeIpcMock();
      ipc.invoke.mockResolvedValue([]);
      const { gateway } = setup(ipc);

      const result = await gateway.getFilesByDocumentId(10);
      expect(result).toEqual([]);
    });
  });

  // ── printFile ──────────────────────────────────────────────────────────────

  describe('printFile()', () => {
    it('invoca il canale corretto con fileId', async () => {
      const ipc = makeIpcMock();
      ipc.invoke.mockResolvedValue({ success: true });
      const { gateway } = setup(ipc);

      await gateway.printFile(5);
      expect(ipc.invoke).toHaveBeenCalledWith(IpcChannels.FILE_PRINT, 5);
    });

    it('ritorna la risposta IPC invariata', async () => {
      const ipc = makeIpcMock();
      ipc.invoke.mockResolvedValue({ success: true });
      const { gateway } = setup(ipc);

      const result = await gateway.printFile(5);
      expect(result).toEqual({ success: true });
    });

    it('ritorna success=false con error in caso di fallimento IPC', async () => {
      const ipc = makeIpcMock();
      ipc.invoke.mockResolvedValue({ success: false, error: 'Stampante non trovata' });
      const { gateway } = setup(ipc);

      const result = await gateway.printFile(5);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Stampante non trovata');
    });

    it("propaga l'eccezione se ipc.invoke rigetta", async () => {
      const ipc = makeIpcMock();
      ipc.invoke.mockRejectedValue(new Error('IPC crash'));
      const { gateway } = setup(ipc);

      await expect(gateway.printFile(1)).rejects.toThrow('IPC crash');
    });
  });

  // ── printFiles ─────────────────────────────────────────────────────────────

  describe('printFiles()', () => {
    it('invoca il canale corretto con i fileIds', async () => {
      const ipc = makeIpcMock();
      ipc.invoke.mockResolvedValue({ canceled: false, results: [] });
      const { gateway } = setup(ipc);

      await gateway.printFiles([10, 11]);
      expect(ipc.invoke).toHaveBeenCalledWith(IpcChannels.FILE_PRINT_MANY, [10, 11]);
    });

    it('ritorna la risposta IPC invariata', async () => {
      const ipcResult = {
        canceled: false,
        results: [
          { fileId: 10, success: true },
          { fileId: 11, success: false, error: 'Offline' },
        ],
      };
      const ipc = makeIpcMock();
      ipc.invoke.mockResolvedValue(ipcResult);
      const { gateway } = setup(ipc);

      const result = await gateway.printFiles([10, 11]);
      expect(result).toEqual(ipcResult);
    });

    it("ritorna canceled=true se l'utente annulla", async () => {
      const ipc = makeIpcMock();
      ipc.invoke.mockResolvedValue({ canceled: true, results: [] });
      const { gateway } = setup(ipc);

      const result = await gateway.printFiles([1]);
      expect(result.canceled).toBe(true);
    });

    it("propaga l'eccezione se ipc.invoke rigetta", async () => {
      const ipc = makeIpcMock();
      ipc.invoke.mockRejectedValue(new Error('IPC crash'));
      const { gateway } = setup(ipc);

      await expect(gateway.printFiles([1])).rejects.toThrow('IPC crash');
    });
  });

  // ── onExportProgress ───────────────────────────────────────────────────────

  describe('onExportProgress()', () => {
    it('registra il listener sul canale corretto', () => {
      const ipc = makeIpcMock();
      const { gateway } = setup(ipc);

      gateway.onExportProgress(vi.fn());
      expect(ipc.on).toHaveBeenCalledWith(IpcChannels.FILE_DOWNLOAD_PROGRESS, expect.any(Function));
    });

    it('ritorna la funzione di unsubscribe fornita da ipc.on', () => {
      const ipc = makeIpcMock();
      const unsub = vi.fn();
      ipc.on.mockReturnValue(unsub);
      const { gateway } = setup(ipc);

      const result = gateway.onExportProgress(vi.fn());
      expect(result).toBe(unsub);
    });
  });

  // ── onPrintProgress ────────────────────────────────────────────────────────

  describe('onPrintProgress()', () => {
    it('registra il listener sul canale corretto', () => {
      const ipc = makeIpcMock();
      const { gateway } = setup(ipc);

      gateway.onPrintProgress(vi.fn());
      expect(ipc.on).toHaveBeenCalledWith(IpcChannels.FILE_PRINT_PROGRESS, expect.any(Function));
    });

    it('ritorna la funzione di unsubscribe fornita da ipc.on', () => {
      const ipc = makeIpcMock();
      const unsub = vi.fn();
      ipc.on.mockReturnValue(unsub);
      const { gateway } = setup(ipc);

      const result = gateway.onPrintProgress(vi.fn());
      expect(result).toBe(unsub);
    });
  });
});