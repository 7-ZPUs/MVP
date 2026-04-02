import { TestBed } from '@angular/core/testing';
import { ImportFacade } from './import.facade';
import { ImportState } from '../domain/import.state';
import { DipIpcGateway } from '../infrastructure/dip-ipc-gateway.service';
import { ImportPhase } from '../domain/enums';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ImportFacade', () => {
  let facade: ImportFacade;
  let state: ImportState;

  // Mock del Gateway
  const mockIpc = {
    getClasses: vi.fn(),
    loadChildren: vi.fn(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ImportFacade,
        ImportState,
        { provide: DipIpcGateway, useValue: mockIpc }
      ]
    });

    facade = TestBed.inject(ImportFacade);
    state = TestBed.inject(ImportState);
    vi.clearAllMocks();
  });

  it('loadRootNodes dovrebbe mappare i DTO e aggiornare lo stato', async () => {
    const mockDtos = [{ id: '1', nome: 'Classe A' }];
    mockIpc.getClasses.mockResolvedValue(mockDtos);

    await facade.loadRootNodes();

    expect(state.loading()).toBe(false);
    expect(state.rootNodes().length).toBe(1);
    expect(state.rootNodes()[0].label).toBe('Classe A');
    expect(state.phase()).toBe(ImportPhase.READY);
  });

  it('loadChildren NON dovrebbe chiamare il gateway se i dati sono già in cache', async () => {
    state.setChildrenForNode('node-123', [{ id: 'child-1' } as any]);
    
    await facade.loadChildren('node-123');

    expect(mockIpc.loadChildren).not.toHaveBeenCalled();
  });

  it('loadChildren dovrebbe gestire l\'errore caricando i figli di un nodo specifico', async () => {
    mockIpc.loadChildren.mockRejectedValue(new Error('Timeout IPC'));
    
    await facade.loadChildren('node-err');

    const errorMap = state.nodeChildrenErrors();
    expect(errorMap.has('node-err')).toBe(true);
    expect(errorMap.get('node-err')?.message).toContain('Timeout IPC');
  });

  it('retryLoad dovrebbe resettare tutto e far ripartire il caricamento', async () => {
    const spyLoad = vi.spyOn(facade, 'loadRootNodes');
    const spyReset = vi.spyOn(state, 'reset');

    facade.retryLoad();

    expect(spyReset).toHaveBeenCalled();
    expect(spyLoad).toHaveBeenCalled();
  });

  it('selectDocument dovrebbe aggiornare il documento selezionato nello stato', () => {
    const mockNode = { id: 'doc-1', label: 'manuale.pdf' } as any;
    facade.selectDocument(mockNode);

    expect(state.selectedDocument()).toEqual(mockNode);
  });
});