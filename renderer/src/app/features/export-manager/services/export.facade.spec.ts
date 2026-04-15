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

function makeIpcResult(
  overrides: Partial<{ success: boolean; canceled: boolean; errorMessage?: string; errorCode?: string }> = {},
) {
  return { success: true, canceled: false, ...overrides };
}

function makeExportFilesResult(
  results: Array<{ fileId: number; success: boolean; error?: string }>,
  canceled = false,
) {
  return { canceled, results };
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
    exportFile: vi.fn(),
    exportFiles: vi.fn(),
    printFile: vi.fn(),
    printFiles: vi.fn(),
    onExportProgress: vi.fn().mockReturnValue(vi.fn()),
    onPrintProgress: vi.fn().mockReturnValue(vi.fn()),
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
      gateway.exportFile.mockResolvedValue(makeIpcResult());

      await facade.exportFile(1);
      expect(state.setProcessing).toHaveBeenCalledWith(OutputContext.SINGLE_EXPORT);
    });

    it('chiama reset e ritorna se il risultato è canceled', async () => {
      const { facade, state, gateway } = setup();
      gateway.exportFile.mockResolvedValue(makeIpcResult({ canceled: true }));

      await facade.exportFile(1);
      expect(state.reset).toHaveBeenCalledTimes(1);
      expect(state.setSuccess).not.toHaveBeenCalled();
    });

    it('chiama setSuccess con ExportResult corretto', async () => {
      const { facade, state, gateway } = setup();
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

    it('chiama setError se ipcResult.success è false', async () => {
      const { facade, state, gateway } = setup();
      gateway.exportFile.mockResolvedValue(
        makeIpcResult({ success: false, errorMessage: 'Disco pieno' }),
      );

      await facade.exportFile(1);
      expect(state.setError).toHaveBeenCalledTimes(1);
    });

    it('usa errorCode come fallback se errorMessage è assente', async () => {
      const { facade, state, gateway } = setup();
      gateway.exportFile.mockResolvedValue(makeIpcResult({ success: false, errorCode: 'ERR_IO' }));

      await facade.exportFile(1);

      const error = (state.setError as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.message).toBe('ERR_IO');
    });

    it('chiama setError con recoverable=true in caso di eccezione', async () => {
      const { facade, state, gateway } = setup();
      gateway.exportFile.mockRejectedValue(new Error('IPC crash'));

      await facade.exportFile(1);

      const error = (state.setError as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.recoverable).toBe(true);
      expect(error.message).toBe('IPC crash');
    });

    it('gestisce err non-Error come "Errore sconosciuto"', async () => {
      const { facade, state, gateway } = setup();
      gateway.exportFile.mockRejectedValue('stringa di errore');

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
      gateway.exportFiles.mockResolvedValue(
        makeExportFilesResult([{ fileId: 1, success: true }, { fileId: 2, success: true }]),
      );

      await facade.exportFiles([1, 2]);
      expect(state.setProcessing).toHaveBeenCalledWith(OutputContext.MULTI_EXPORT);
    });

    it('chiama setError se tutti i DTO sono null', async () => {
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
      gateway.exportFiles.mockResolvedValue(
        makeExportFilesResult([{ fileId: 1, success: true }, { fileId: 3, success: true }]),
      );

      await facade.exportFiles([1, 2, 3]);

      const queue = (state.initQueue as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(queue).toHaveLength(2);
      expect(queue.map((q: any) => q.filename)).toEqual(['a.pdf', 'c.pdf']);
    });

    it('chiama reset e ritorna se exportFiles è canceled', async () => {
      const { facade, state, gateway } = setup();
      gateway.getFileDto.mockResolvedValue(makeDto());
      gateway.exportFiles.mockResolvedValue(makeExportFilesResult([], true));

      await facade.exportFiles([1]);
      expect(state.reset).toHaveBeenCalledTimes(1);
      expect(state.setSuccess).not.toHaveBeenCalled();
    });

    it('aggiorna il progresso tramite onExportProgress callback', async () => {
      const { facade, state, gateway } = setup();
      gateway.getFileDto.mockResolvedValue(makeDto());

      let progressCallback: ((e: { current: number; total: number }) => void) | null = null;
      gateway.onExportProgress.mockImplementation((cb: any) => {
        progressCallback = cb;
        return vi.fn();
      });

      gateway.exportFiles.mockImplementation(async () => {
        progressCallback?.({ current: 1, total: 3 });
        progressCallback?.({ current: 2, total: 3 });
        progressCallback?.({ current: 3, total: 3 });
        return makeExportFilesResult([
          { fileId: 1, success: true },
          { fileId: 2, success: true },
          { fileId: 3, success: true },
        ]);
      });

      await facade.exportFiles([1, 2, 3]);

      const calls = (state.setProgress as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0]);
      expect(calls).toEqual([
        expect.closeTo(33.33, 1),
        expect.closeTo(66.67, 1),
        100,
      ]);
    });

    it('conteggia successCount e failedCount correttamente', async () => {
      const { facade, state, gateway } = setup();
      gateway.getFileDto.mockResolvedValue(makeDto());
      gateway.exportFiles.mockResolvedValue(
        makeExportFilesResult([
          { fileId: 1, success: true },
          { fileId: 2, success: false, error: 'err' },
          { fileId: 3, success: true },
        ]),
      );

      await facade.exportFiles([1, 2, 3]);

      const result: ExportResult = (state.setSuccess as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(result.successCount).toBe(2);
      expect(result.failedCount).toBe(1);
    });

    it('aggiorna lo stato dell\'item a "done" in caso di successo', async () => {
      const { facade, state, gateway } = setup();
      gateway.getFileDto.mockResolvedValue(makeDto({ filename: 'x.pdf' }));
      gateway.exportFiles.mockResolvedValue(
        makeExportFilesResult([{ fileId: 7, success: true }]),
      );

      await facade.exportFiles([7]);

      expect(state.updateQueueItem).toHaveBeenCalledWith(7, { status: 'done', error: undefined });
    });

    it('aggiorna lo stato dell\'item a "error" in caso di fallimento', async () => {
      const { facade, state, gateway } = setup();
      gateway.getFileDto.mockResolvedValue(makeDto());
      gateway.exportFiles.mockResolvedValue(
        makeExportFilesResult([{ fileId: 5, success: false, error: 'IO fail' }]),
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
      gateway.exportFiles.mockResolvedValue(
        makeExportFilesResult([{ fileId: 1, success: true }]),
      );

      await facade.exportFiles([1]);

      const result: ExportResult = (state.setSuccess as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(result.outputContext).toBe(OutputContext.MULTI_EXPORT);
    });

    it('chiama setError se exportFiles lancia eccezione', async () => {
      const { facade, state, gateway } = setup();
      gateway.getFileDto.mockResolvedValue(makeDto());
      gateway.exportFiles.mockRejectedValue(new Error('crash'));

      await facade.exportFiles([1]);
      expect(state.setError).toHaveBeenCalledTimes(1);
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
      gateway.getFileDto.mockResolvedValue(makeDto({ filename: 'doc.pdf' }));
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
    it('chiama printFiles per i file stampabili validi', async () => {
      const { facade, gateway } = setup();
      gateway.getFileDto
        .mockResolvedValueOnce(makeDto({ filename: 'a.pdf' }))
        .mockResolvedValueOnce(makeDto({ filename: 'b.png' }));
      gateway.printFiles.mockResolvedValue({
        canceled: false,
        results: [{ success: true, fileId: 1 }, { success: true, fileId: 2 }],
      });

      await facade.printDocuments([1, 2]);
      expect(gateway.printFiles).toHaveBeenCalledTimes(1);
      expect(gateway.printFiles).toHaveBeenCalledWith([1, 2]);
    });

    it('salta i file con DTO null o formato non stampabile', async () => {
      const { facade, gateway } = setup();
      gateway.getFileDto
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(makeDto({ filename: 'doc.docx' }))
        .mockResolvedValueOnce(makeDto({ filename: 'b.pdf' }));
      gateway.printFiles.mockResolvedValue({
        canceled: false,
        results: [{ success: true, fileId: 3 }],
      });

      await facade.printDocuments([1, 2, 3]);
      expect(gateway.printFiles).toHaveBeenCalledWith([3]);
    });

    it('chiama setUnavailable se non ci sono formati stampabili tra tutti quelli scelti', async () => {
      const { facade, gateway, state } = setup();
      gateway.getFileDto
        .mockResolvedValueOnce(makeDto({ filename: 'doc.docx' }))
        .mockResolvedValueOnce(makeDto({ filename: 'doc2.xlsx' }));

      await facade.printDocuments([1, 2]);
      expect(state.setUnavailable).toHaveBeenCalledTimes(1);
      expect(gateway.printFiles).not.toHaveBeenCalled();
    });

    it('chiama setSuccess al termine', async () => {
      const { facade, state, gateway } = setup();
      gateway.getFileDto.mockResolvedValue(makeDto({ filename: 'doc.pdf' }));
      gateway.printFiles.mockResolvedValue({
        canceled: false,
        results: [{ success: true, fileId: 1 }],
      });

      await facade.printDocuments([1]);
      expect(state.setSuccess).toHaveBeenCalledTimes(1);
    });

    it('chiama reset e ritorna se printFiles è canceled', async () => {
      const { facade, state, gateway } = setup();
      gateway.getFileDto.mockResolvedValue(makeDto({ filename: 'doc.pdf' }));
      gateway.printFiles.mockResolvedValue({ canceled: true, results: [] });

      await facade.printDocuments([1]);
      expect(state.reset).toHaveBeenCalledTimes(1);
      expect(state.setSuccess).not.toHaveBeenCalled();
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