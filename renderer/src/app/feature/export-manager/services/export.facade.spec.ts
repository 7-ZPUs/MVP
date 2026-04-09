import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, type MockedObject } from 'vitest';
import { signal } from '@angular/core';

import { ExportFacade } from '../services/export.facade';
import { FileDTO } from '../domain/dtos';
import { ExportState } from '../domain/export.state';
import { ExportIpcGateway } from '../infrastructure/export-ipc-gateway.service';
import { ExportPhase, OutputContext } from '../domain/enums';
import { ExportResult } from '../domain/models';

// ─── Mock factories ──────────────────────────────────────────────────────────

function makeDto(overrides: Partial<FileDTO> = {}): FileDTO {
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

function makeSaveDialog(overrides: Partial<{ canceled: boolean; filePath: string }> = {}) {
  return { canceled: false, filePath: '/tmp/out.pdf', ...overrides };
}

function makeFolderDialog(overrides: Partial<{ canceled: boolean; folderPath: string }> = {}) {
  return { canceled: false, folderPath: '/tmp/folder', ...overrides };
}

function makeIpcResult(
  overrides: Partial<{ success: boolean; errorMessage?: string; errorCode?: string }> = {},
) {
  return { success: true, ...overrides };
}

// ─── Setup ───────────────────────────────────────────────────────────────────

function setup() {
  const stateMock: MockedObject<ExportState> = {
    phase: signal(ExportPhase.IDLE),
    outputContext: signal(null),
    result: signal(null),
    progress: signal(0),
    error: signal(null),
    loading: signal(false),
    queue: signal([]),
    setProcessing: vi.fn(),
    setSuccess: vi.fn(),
    setError: vi.fn(),
    setUnavailable: vi.fn(),
    reset: vi.fn(),
    initQueue: vi.fn(),
    updateQueueItem: vi.fn(),
    setProgress: vi.fn(),
  } as any;

  const gatewayMock: MockedObject<ExportIpcGateway> = {
    getFileDto: vi.fn(),
    openSaveDialog: vi.fn(),
    openFolderDialog: vi.fn(),
    exportFile: vi.fn(),
    printFile: vi.fn(),
    printFiles: vi.fn(),
    onPrintProgress: vi.fn(() => () => {}),
  } as any;

  TestBed.configureTestingModule({
    providers: [
      ExportFacade,
      { provide: ExportState, useValue: stateMock },
      { provide: ExportIpcGateway, useValue: gatewayMock },
    ],
  });

  return {
    facade: TestBed.inject(ExportFacade),
    state: stateMock,
    gateway: gatewayMock,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ExportFacade', () => {
  // ── Signals delegati ───────────────────────────────────────────────────────

  describe('signal accessors', () => {
    it('delega phase a ExportState', () => {
      const { facade, state } = setup();
      expect(facade.phase).toBe(state.phase);
    });

    it('delega outputContext a ExportState', () => {
      const { facade, state } = setup();
      expect(facade.outputContext).toBe(state.outputContext);
    });

    it('delega result a ExportState', () => {
      const { facade, state } = setup();
      expect(facade.result).toBe(state.result);
    });

    it('delega progress a ExportState', () => {
      const { facade, state } = setup();
      expect(facade.progress).toBe(state.progress);
    });

    it('delega error a ExportState', () => {
      const { facade, state } = setup();
      expect(facade.error).toBe(state.error);
    });

    it('delega loading a ExportState', () => {
      const { facade, state } = setup();
      expect(facade.loading).toBe(state.loading);
    });

    it('delega queue a ExportState', () => {
      const { facade, state } = setup();
      expect(facade.queue).toBe(state.queue);
    });
  });

  // ── reset ──────────────────────────────────────────────────────────────────

  describe('reset()', () => {
    it('chiama state.reset()', () => {
      const { facade, state } = setup();
      facade.reset();
      expect(state.reset).toHaveBeenCalledTimes(1);
    });
  });

  // ── exportFile ─────────────────────────────────────────────────────────────

  describe('exportFile()', () => {
    it('chiama setProcessing con SINGLE_EXPORT', async () => {
      const { facade, state, gateway } = setup();
      gateway.getFileDto.mockResolvedValue(makeDto());
      gateway.openSaveDialog.mockResolvedValue(makeSaveDialog());
      gateway.exportFile.mockResolvedValue(makeIpcResult());

      await facade.exportFile(1);
      expect(state.setProcessing).toHaveBeenCalledWith(OutputContext.SINGLE_EXPORT);
    });

    it('chiama reset e ritorna se il dialog è annullato', async () => {
      const { facade, state, gateway } = setup();
      gateway.getFileDto.mockResolvedValue(makeDto());
      gateway.openSaveDialog.mockResolvedValue(
        makeSaveDialog({ canceled: true, filePath: undefined }),
      );

      await facade.exportFile(1);
      expect(state.reset).toHaveBeenCalledTimes(1);
      expect(state.setSuccess).not.toHaveBeenCalled();
    });

    it('chiama reset e ritorna se filePath è assente', async () => {
      const { facade, state, gateway } = setup();
      gateway.getFileDto.mockResolvedValue(makeDto());
      gateway.openSaveDialog.mockResolvedValue({ canceled: false, filePath: undefined });

      await facade.exportFile(1);
      expect(state.reset).toHaveBeenCalledTimes(1);
    });

    it('chiama setSuccess con ExportResult corretto', async () => {
      const { facade, state, gateway } = setup();
      const dto = makeDto();
      const dialog = makeSaveDialog({ filePath: '/out/file.pdf' });
      gateway.getFileDto.mockResolvedValue(dto);
      gateway.openSaveDialog.mockResolvedValue(dialog);
      gateway.exportFile.mockResolvedValue(makeIpcResult());

      await facade.exportFile(1);

      expect(state.setSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          outputContext: OutputContext.SINGLE_EXPORT,
          successCount: 1,
          failedCount: 0,
        }),
      );
    });

    it('chiama setError se getFileDto ritorna null', async () => {
      const { facade, state, gateway } = setup();
      gateway.getFileDto.mockResolvedValue(null);

      await facade.exportFile(99);
      expect(state.setError).toHaveBeenCalledTimes(1);
      expect(state.setSuccess).not.toHaveBeenCalled();
    });

    it('chiama setError se ipcResult.success è false', async () => {
      const { facade, state, gateway } = setup();
      gateway.getFileDto.mockResolvedValue(makeDto());
      gateway.openSaveDialog.mockResolvedValue(makeSaveDialog());
      gateway.exportFile.mockResolvedValue(
        makeIpcResult({ success: false, errorMessage: 'Disco pieno' }),
      );

      await facade.exportFile(1);
      expect(state.setError).toHaveBeenCalledTimes(1);
    });

    it('usa errorCode come fallback se errorMessage è assente', async () => {
      const { facade, state, gateway } = setup();
      gateway.getFileDto.mockResolvedValue(makeDto());
      gateway.openSaveDialog.mockResolvedValue(makeSaveDialog());
      gateway.exportFile.mockResolvedValue(makeIpcResult({ success: false, errorCode: 'ERR_IO' }));

      await facade.exportFile(1);

      const error = (state.setError as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.message).toBe('ERR_IO');
    });

    it('chiama setError con recoverable=true in caso di eccezione', async () => {
      const { facade, state, gateway } = setup();
      gateway.getFileDto.mockRejectedValue(new Error('IPC crash'));

      await facade.exportFile(1);

      const error = (state.setError as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.recoverable).toBe(true);
      expect(error.message).toBe('IPC crash');
    });

    it('gestisce err non-Error come "Errore sconosciuto"', async () => {
      const { facade, state, gateway } = setup();
      gateway.getFileDto.mockRejectedValue('stringa di errore');

      await facade.exportFile(1);

      const error = (state.setError as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.message).toBe('Errore sconosciuto');
    });
  });

  // ── exportFiles ────────────────────────────────────────────────────────────

  describe('exportFiles()', () => {
    it('chiama setProcessing con MULTI_EXPORT', async () => {
      const { facade, state, gateway } = setup();
      gateway.getFileDto.mockResolvedValue(makeDto());
      gateway.openFolderDialog.mockResolvedValue(makeFolderDialog());
      gateway.exportFile.mockResolvedValue(makeIpcResult());

      await facade.exportFiles([1, 2]);
      expect(state.setProcessing).toHaveBeenCalledWith(OutputContext.MULTI_EXPORT);
    });

    it('lancia errore se tutti i DTO sono null', async () => {
      const { facade, state, gateway } = setup();
      gateway.getFileDto.mockResolvedValue(null);

      await facade.exportFiles([1, 2]);
      expect(state.setError).toHaveBeenCalledTimes(1);
    });

    it('costruisce la coda solo con i DTO validi', async () => {
      const { facade, state, gateway } = setup();
      gateway.getFileDto
        .mockResolvedValueOnce(makeDto({ filename: 'a.pdf' }))
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(makeDto({ filename: 'c.pdf' }));
      gateway.openFolderDialog.mockResolvedValue(makeFolderDialog());
      gateway.exportFile.mockResolvedValue(makeIpcResult());

      await facade.exportFiles([1, 2, 3]);

      const queue = (state.initQueue as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(queue).toHaveLength(2);
      expect(queue.map((q: any) => q.filename)).toEqual(['a.pdf', 'c.pdf']);
    });

    it('chiama reset e ritorna se il folder dialog è annullato', async () => {
      const { facade, state, gateway } = setup();
      gateway.getFileDto.mockResolvedValue(makeDto());
      gateway.openFolderDialog.mockResolvedValue(
        makeFolderDialog({ canceled: true, folderPath: undefined }),
      );

      await facade.exportFiles([1]);
      expect(state.reset).toHaveBeenCalledTimes(1);
      expect(state.setSuccess).not.toHaveBeenCalled();
    });

    it('aggiorna il progresso dopo ogni file', async () => {
      const { facade, state, gateway } = setup();
      gateway.getFileDto.mockResolvedValue(makeDto());
      gateway.openFolderDialog.mockResolvedValue(makeFolderDialog());
      gateway.exportFile.mockResolvedValue(makeIpcResult());

      await facade.exportFiles([1, 2, 4]);

      const calls = (state.setProgress as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0]);
      expect(calls).toEqual([expect.closeTo(33.33, 1), expect.closeTo(66.67, 1), 100]);
    });

    it('conteggia successCount e failedCount correttamente', async () => {
      const { facade, state, gateway } = setup();
      gateway.getFileDto.mockResolvedValue(makeDto());
      gateway.openFolderDialog.mockResolvedValue(makeFolderDialog());
      gateway.exportFile
        .mockResolvedValueOnce(makeIpcResult())
        .mockResolvedValueOnce(makeIpcResult({ success: false, errorMessage: 'err' }))
        .mockResolvedValueOnce(makeIpcResult());

      await facade.exportFiles([1, 2, 3]);

      const result: ExportResult = (state.setSuccess as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(result.successCount).toBe(2);
      expect(result.failedCount).toBe(1);
    });

    it('aggiorna lo stato dell\'item a "done" in caso di successo', async () => {
      const { facade, state, gateway } = setup();
      gateway.getFileDto.mockResolvedValue(makeDto({ filename: 'x.pdf' }));
      gateway.openFolderDialog.mockResolvedValue(makeFolderDialog());
      gateway.exportFile.mockResolvedValue(makeIpcResult());

      await facade.exportFiles([7]);

      expect(state.updateQueueItem).toHaveBeenCalledWith(7, { status: 'done' });
    });

    it('aggiorna lo stato dell\'item a "error" in caso di fallimento', async () => {
      const { facade, state, gateway } = setup();
      gateway.getFileDto.mockResolvedValue(makeDto());
      gateway.openFolderDialog.mockResolvedValue(makeFolderDialog());
      gateway.exportFile.mockResolvedValue(
        makeIpcResult({ success: false, errorMessage: 'IO fail' }),
      );

      await facade.exportFiles([5]);

      expect(state.updateQueueItem).toHaveBeenCalledWith(
        5,
        expect.objectContaining({ status: 'error', error: 'IO fail' }),
      );
    });

    it('setSuccess ha outputContext MULTI_EXPORT', async () => {
      const { facade, state, gateway } = setup();
      gateway.getFileDto.mockResolvedValue(makeDto());
      gateway.openFolderDialog.mockResolvedValue(makeFolderDialog());
      gateway.exportFile.mockResolvedValue(makeIpcResult());

      await facade.exportFiles([1]);

      const result: ExportResult = (state.setSuccess as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(result.outputContext).toBe(OutputContext.MULTI_EXPORT);
    });
  });

  // ── printDocument ──────────────────────────────────────────────────────────

  describe('printDocument()', () => {
    it('chiama setProcessing con SINGLE_PRINT', async () => {
      const { facade, state, gateway } = setup();
      gateway.getFileDto.mockResolvedValue(makeDto({ filename: 'doc.pdf' }));
      gateway.printFile.mockResolvedValue({ success: true });

      await facade.printDocument(1);
      expect(state.setProcessing).toHaveBeenCalledWith(OutputContext.SINGLE_PRINT);
    });

    it('chiama printFile per i formati stampabili', async () => {
      const { facade, gateway } = setup();
      const dto = makeDto({ filename: 'doc.pdf', path: '/docs/doc.pdf' });
      gateway.getFileDto.mockResolvedValue(dto);
      gateway.printFile.mockResolvedValue({ success: true });

      await facade.printDocument(1);
      expect(gateway.printFile).toHaveBeenCalledWith(1);
    });

    it('chiama setSuccess con SINGLE_PRINT dopo la stampa', async () => {
      const { facade, state, gateway } = setup();
      gateway.getFileDto.mockResolvedValue(makeDto({ filename: 'doc.png' }));
      gateway.printFile.mockResolvedValue({ success: true });

      await facade.printDocument(1);

      const result: ExportResult = (state.setSuccess as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(result.outputContext).toBe(OutputContext.SINGLE_PRINT);
      expect(result.successCount).toBe(1);
    });

    it('chiama setUnavailable per formati non stampabili', async () => {
      const { facade, state, gateway } = setup();
      gateway.getFileDto.mockResolvedValue(makeDto({ filename: 'doc.docx' }));

      await facade.printDocument(1);

      expect(state.setUnavailable).toHaveBeenCalledTimes(1);
      expect(gateway.printFile).not.toHaveBeenCalled();
    });

    it('il messaggio setUnavailable contiene il nome del file', async () => {
      const { facade, state, gateway } = setup();
      gateway.getFileDto.mockResolvedValue(makeDto({ filename: 'report.xlsx' }));

      await facade.printDocument(1);

      const error = (state.setUnavailable as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.message).toContain('report.xlsx');
    });

    it('setUnavailable ha recoverable=false', async () => {
      const { facade, state, gateway } = setup();
      gateway.getFileDto.mockResolvedValue(makeDto({ filename: 'file.docx' }));

      await facade.printDocument(1);

      const error = (state.setUnavailable as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.recoverable).toBe(false);
    });

    it('chiama setError se getFileDto ritorna null', async () => {
      const { facade, state, gateway } = setup();
      gateway.getFileDto.mockResolvedValue(null);

      await facade.printDocument(1);
      expect(state.setError).toHaveBeenCalledTimes(1);
    });

    it('chiama setError se printFile lancia eccezione', async () => {
      const { facade, state, gateway } = setup();
      gateway.getFileDto.mockResolvedValue(makeDto({ filename: 'doc.pdf' }));
      gateway.printFile.mockRejectedValue(new Error('OS error'));

      await facade.printDocument(1);
      expect(state.setError).toHaveBeenCalledTimes(1);
    });

    const stampabili = ['pdf', 'png', 'jpg', 'jpeg', 'tiff'];
    stampabili.forEach((ext) => {
      it(`accetta il formato .${ext}`, async () => {
        const { facade, state, gateway } = setup();
        gateway.getFileDto.mockResolvedValue(makeDto({ filename: `file.${ext}` }));
        gateway.printFile.mockResolvedValue({ success: true });

        await facade.printDocument(1);
        expect(state.setSuccess).toHaveBeenCalled();
        expect(state.setUnavailable).not.toHaveBeenCalled();
      });
    });

    it("è case-insensitive per l'estensione", async () => {
      const { facade, state, gateway } = setup();
      gateway.getFileDto.mockResolvedValue(makeDto({ filename: 'IMAGE.PDF' }));
      gateway.printFile.mockResolvedValue({ success: true });

      await facade.printDocument(1);
      expect(state.setSuccess).toHaveBeenCalled();
    });
  });

  // ── printDocuments ─────────────────────────────────────────────────────────

  describe('printDocuments()', () => {
    it('chiama printFiles per ogni file stampabile', async () => {
      const { facade, gateway } = setup();
      gateway.getFileDto
        .mockResolvedValueOnce(makeDto({ filename: 'a.pdf', path: '/a.pdf' }))
        .mockResolvedValueOnce(makeDto({ filename: 'b.png', path: '/b.png' }));
      gateway.printFiles.mockResolvedValue({
        canceled: false,
        results: [
          { fileId: 1, success: true },
          { fileId: 2, success: true },
        ],
      });

      await facade.printDocuments([1, 2]);
      expect(gateway.printFiles).toHaveBeenCalledWith([1, 2]);
    });

    it('salta i file con DTO null', async () => {
      const { facade, gateway } = setup();
      gateway.getFileDto
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(makeDto({ filename: 'b.pdf', path: '/b.pdf' }));
      gateway.printFiles.mockResolvedValue({
        canceled: false,
        results: [{ fileId: 2, success: true }],
      });

      await facade.printDocuments([1, 2]);
      expect(gateway.printFiles).toHaveBeenCalledWith([2]);
    });

    it('salta i file con formato non stampabile', async () => {
      const { facade, gateway } = setup();
      gateway.getFileDto
        .mockResolvedValueOnce(makeDto({ filename: 'doc.docx', path: '/doc.docx' }))
        .mockResolvedValueOnce(makeDto({ filename: 'img.jpg', path: '/img.jpg' }));
      gateway.printFiles.mockResolvedValue({
        canceled: false,
        results: [{ fileId: 2, success: true }],
      });

      await facade.printDocuments([1, 2]);
      expect(gateway.printFiles).toHaveBeenCalledWith([2]);
    });

    it('chiama setSuccess al termine', async () => {
      const { facade, state, gateway } = setup();
      gateway.getFileDto.mockResolvedValue(makeDto({ filename: 'doc.pdf' }));
      gateway.printFiles.mockResolvedValue({
        canceled: false,
        results: [
          { fileId: 1, success: true },
          { fileId: 2, success: true },
        ],
      });

      await facade.printDocuments([1, 2]);
      expect(state.setSuccess).toHaveBeenCalledTimes(1);
    });

    it('chiama setError se printFiles lancia eccezione', async () => {
      const { facade, state, gateway } = setup();
      gateway.getFileDto.mockResolvedValue(makeDto({ filename: 'doc.pdf' }));
      gateway.printFiles.mockRejectedValue(new Error('crash'));

      await facade.printDocuments([1]);
      expect(state.setError).toHaveBeenCalledTimes(1);
    });
  });
});
