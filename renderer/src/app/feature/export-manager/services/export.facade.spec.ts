import { TestBed } from '@angular/core/testing';
import { ExportFacade } from './export.facade';
import { ExportState } from '../domain/export.state';
import { ExportPhase, ExportErrorCode } from '../domain/enums';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ExportFacade', () => {
  let facade: ExportFacade;
  let state: ExportState;

  // Mock del gateway
  const mockIpc = {
    openSaveDialog: vi.fn(),
    exportDocument: vi.fn(),
    printDocument: vi.fn(),
    exportReportPdf: vi.fn()
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ExportState,

        {
          provide: ExportFacade,
          useFactory: (exportState: ExportState) => {
            return new ExportFacade(
              exportState,
              mockIpc, // ipcGateway
              {},      // auditLogger
              {},      // perfMonitor
              {}       // liveAnnouncer
            );
          },
          deps: [ExportState]
        }
      ]
    });

    state = TestBed.inject(ExportState);
    facade = TestBed.inject(ExportFacade);
    vi.clearAllMocks();
  });

  it('exportDocument dovrebbe resettare lo stato se l\'utente annulla il dialog', async () => {
    mockIpc.openSaveDialog.mockResolvedValue({ canceled: true });
    const node = { id: '1', label: 'test.pdf' } as any;

    await facade.exportDocument(node);

    expect(state.phase()).toBe(ExportPhase.IDLE);
    expect(mockIpc.exportDocument).not.toHaveBeenCalled();
  });

  it('exportDocument dovrebbe completare con successo se il gateway risponde OK', async () => {
    mockIpc.openSaveDialog.mockResolvedValue({ canceled: false, filePath: 'C:/path' });
    mockIpc.exportDocument.mockResolvedValue({ success: true });
    const node = { id: '1', label: 'test.pdf' } as any;

    await facade.exportDocument(node);

    expect(state.phase()).toBe(ExportPhase.SUCCESS);
    expect(state.result()?.successCount).toBe(1);
  });

  it('exportDocuments (multi) dovrebbe calcolare il progresso correttamente', async () => {
    mockIpc.openSaveDialog.mockResolvedValue({ canceled: false, filePath: 'C:/path' });
    mockIpc.exportDocument.mockResolvedValue({ success: true });
    const nodes = [
      { id: '1', label: 'a.pdf' },
      { id: '2', label: 'b.pdf' }
    ] as any;

    await facade.exportDocuments(nodes);

    expect(state.progress()).toBe(100);
    expect(mockIpc.exportDocument).toHaveBeenCalledTimes(2);
  });

  it('printDocument dovrebbe dare errore "UNAVAILABLE" se il formato non è supportato', async () => {
    const node = { id: '1', label: 'file.zip' } as any;

    await facade.printDocument(node);

    expect(state.phase()).toBe(ExportPhase.UNAVAILABLE);
    expect(state.error()?.code).toBe(ExportErrorCode.PRINT_UNAVAILABLE);
  });

  it('handleError dovrebbe catturare i crash e impostare lo stato di errore', async () => {
    // Simuliamo un errore lanciando un'eccezione
    mockIpc.openSaveDialog.mockImplementation(() => {
      throw new Error('Crash fatale');
    });
    const node = { id: '1', label: 'test.pdf' } as any;

    await facade.exportDocument(node);

    expect(state.phase()).toBe(ExportPhase.ERROR);
    expect(state.error()?.message).toBe('Crash fatale');
  });
});