import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ExportIpcGateway } from './export-ipc-gateway.service';
import { FileDTO, SaveDialogResponseDto } from '../domain/dtos';

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

function makeIpcMock(methods: Record<string, unknown> = {}) {
  return { invoke: vi.fn(), ...methods };
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
      const result = await gateway.exportFile(1, '/out.pdf');
      expect(result.success).toBe(false);
    });

    it('exportFile ritorna errorCode BRIDGE_UNAVAILABLE', async () => {
      const { gateway } = setupNoElectron();
      const result = await gateway.exportFile(1, '/out.pdf');
      expect(result.errorCode).toBe('BRIDGE_UNAVAILABLE');
    });

    it('openSaveDialog ritorna { canceled: true }', async () => {
      const { gateway } = setupNoElectron();
      const result = await gateway.openSaveDialog('file.pdf');
      expect(result).toEqual({ canceled: true });
    });

    it('openFolderDialog ritorna { canceled: true }', async () => {
      const { gateway } = setupNoElectron();
      const result = await gateway.openFolderDialog();
      expect(result).toEqual({ canceled: true });
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
  });

  // ── exportFile ─────────────────────────────────────────────────────────────

  describe('exportFile()', () => {
    it('invoca il canale corretto con fileId e destPath', async () => {
      const ipc = makeIpcMock();
      ipc.invoke.mockResolvedValue({ success: true });
      const { gateway } = setup(ipc);

      await gateway.exportFile(42, '/dest/file.pdf');
      expect(ipc.invoke).toHaveBeenCalledWith('file:download', {
        fileId: 42,
        destPath: '/dest/file.pdf',
      });
    });

    it('ritorna il risultato IPC invariato', async () => {
      const ipcResult = { success: true, errorCode: null, errorMessage: null };
      const ipc = makeIpcMock();
      ipc.invoke.mockResolvedValue(ipcResult);
      const { gateway } = setup(ipc);

      const result = await gateway.exportFile(1, '/out.pdf');
      expect(result).toEqual(ipcResult);
    });

    it("propaga l'eccezione se ipc.invoke rigetta", async () => {
      const ipc = makeIpcMock();
      ipc.invoke.mockRejectedValue(new Error('IPC crash'));
      const { gateway } = setup(ipc);

      await expect(gateway.exportFile(1, '/out.pdf')).rejects.toThrow('IPC crash');
    });
  });

  // ── openSaveDialog ─────────────────────────────────────────────────────────

  describe('openSaveDialog()', () => {
    it('invoca il canale corretto con defaultName', async () => {
      const ipc = makeIpcMock();
      ipc.invoke.mockResolvedValue({ canceled: false, filePath: '/out.pdf' });
      const { gateway } = setup(ipc);

      await gateway.openSaveDialog('report.pdf');
      expect(ipc.invoke).toHaveBeenCalledWith('file:save-dialog', 'report.pdf');
    });

    it('funziona senza defaultName', async () => {
      const ipc = makeIpcMock();
      ipc.invoke.mockResolvedValue({ canceled: false, filePath: '/out.pdf' });
      const { gateway } = setup(ipc);

      await gateway.openSaveDialog();
      expect(ipc.invoke).toHaveBeenCalledWith('file:save-dialog', undefined);
    });

    it('ritorna la risposta IPC', async () => {
      const ipc = makeIpcMock();
      const response: SaveDialogResponseDto = { canceled: false, filePath: '/docs/out.pdf' };
      ipc.invoke.mockResolvedValue(response);
      const { gateway } = setup(ipc);

      const result = await gateway.openSaveDialog('out.pdf');
      expect(result).toEqual(response);
    });

    it("ritorna { canceled: true } se l'utente annulla", async () => {
      const ipc = makeIpcMock();
      ipc.invoke.mockResolvedValue({ canceled: true });
      const { gateway } = setup(ipc);

      const result = await gateway.openSaveDialog();
      expect(result.canceled).toBe(true);
    });
  });

  // ── openFolderDialog ───────────────────────────────────────────────────────

  describe('openFolderDialog()', () => {
    it('invoca il canale corretto', async () => {
      const ipc = makeIpcMock();
      ipc.invoke.mockResolvedValue({ canceled: false, folderPath: '/tmp' });
      const { gateway } = setup(ipc);

      await gateway.openFolderDialog();
      expect(ipc.invoke).toHaveBeenCalledWith('file:folder-dialog');
    });

    it('ritorna folderPath dalla risposta IPC', async () => {
      const ipc = makeIpcMock();
      ipc.invoke.mockResolvedValue({ canceled: false, folderPath: '/tmp/export' });
      const { gateway } = setup(ipc);

      const result = await gateway.openFolderDialog();
      expect(result.folderPath).toBe('/tmp/export');
    });

    it("ritorna { canceled: true } se l'utente annulla", async () => {
      const ipc = makeIpcMock();
      ipc.invoke.mockResolvedValue({ canceled: true });
      const { gateway } = setup(ipc);

      const result = await gateway.openFolderDialog();
      expect(result.canceled).toBe(true);
      expect(result.folderPath).toBeUndefined();
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
});
