import { TestBed } from '@angular/core/testing';
import { ExportFacade } from './export.facade';
import { ExportState } from '../domain/export.state';
import { ExportPhase, ExportErrorCode } from '../domain/enums';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ExportFacade', () => {
  let facade: ExportFacade;
  let state: ExportState;

  const mockIpc = {
    openSaveDialog: vi.fn(),
    exportFile: vi.fn(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ExportState,
        {
          provide: ExportFacade,
          useFactory: (exportState: ExportState) => new ExportFacade(exportState, mockIpc as any),
          deps: [ExportState]
        }
      ]
    });

    state  = TestBed.inject(ExportState);
    facade = TestBed.inject(ExportFacade);
    vi.clearAllMocks();
  });

  it('exportFile dovrebbe resettare lo stato se l\'utente annulla il dialog', async () => {
    mockIpc.openSaveDialog.mockResolvedValue({ canceled: true });
    const node = { id: '1', label: 'test.pdf' } as any;

    await facade.exportFile(node);

    expect(state.phase()).toBe(ExportPhase.IDLE);
    expect(mockIpc.exportFile).not.toHaveBeenCalled();
  });

  it('exportFile dovrebbe completare con successo se il gateway risponde OK', async () => {
    mockIpc.openSaveDialog.mockResolvedValue({ canceled: false, filePath: 'C:/path' });
    mockIpc.exportFile.mockResolvedValue({ success: true });
    const node = { id: '1', label: 'test.pdf' } as any;

    await facade.exportFile(node);

    expect(state.phase()).toBe(ExportPhase.SUCCESS);
    expect(state.result()?.successCount).toBe(1);
  });

  it('exportFiles (multi) dovrebbe calcolare il progresso correttamente', async () => {
    mockIpc.openSaveDialog.mockResolvedValue({ canceled: false, filePath: 'C:/path' });
    mockIpc.exportFile.mockResolvedValue({ success: true });
    const nodes = [
      { id: '1', label: 'a.pdf' },
      { id: '2', label: 'b.pdf' }
    ] as any;

    await facade.exportFiles(nodes);

    expect(state.progress()).toBe(100);
    expect(mockIpc.exportFile).toHaveBeenCalledTimes(2);
  });

  it('printDocument dovrebbe dare errore UNAVAILABLE se il formato non è supportato', async () => {
    const node = { id: '1', label: 'file.zip' } as any;

    await facade.printDocument(node);

    expect(state.phase()).toBe(ExportPhase.UNAVAILABLE);
    expect(state.error()?.code).toBe(ExportErrorCode.PRINT_UNAVAILABLE);
  });

  it('exportFile dovrebbe impostare lo stato di errore in caso di crash', async () => {
    mockIpc.openSaveDialog.mockImplementation(() => { throw new Error('Crash fatale'); });
    const node = { id: '1', label: 'test.pdf' } as any;

    await facade.exportFile(node);

    expect(state.phase()).toBe(ExportPhase.ERROR);
    expect(state.error()?.message).toBe('Crash fatale');
  });
});