import { TestBed, ComponentFixture } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signal, WritableSignal } from '@angular/core';
import { Router } from '@angular/router';

import { ItemDetailPageComponent } from './item-detail-page.component';
import { AGGREGATE_FACADE_TOKEN } from '../../../../aggregate/contracts/IAggregateFacade';
import { DOCUMENT_FACADE_TOKEN } from '../../../../document/contracts/IDocumentFacade';
import { NODE_FALLBACK_FACADE_TOKEN } from '../../../contracts/INodeFallbackFacade';
import { PROCESS_FACADE_TOKEN } from '../../../../process/contracts/IProcessFacade';
import { OUTPUT_FACADE_TOKEN } from '../../../../../shared/interfaces/output.interfaces';
import { INTEGRITY_FACADE_TOKEN } from '../../../../../shared/interfaces/integrity.interfaces';
import { AggregateState } from '../../../../aggregate/domain/aggregate.models';
import { DocumentState } from '../../../../document/domain/document.models';
import { ProcessState } from '../../../../process/domain/process.models';
import { AppError, ErrorCode, ErrorCategory, ErrorSeverity } from '../../../../../shared/domain';
import { NodeFallbackState } from '../../../domain/node-fallback.models';

describe('ItemDetailPageComponent', () => {
  let component: ItemDetailPageComponent;
  let fixture: ComponentFixture<ItemDetailPageComponent>;

  // Signal scrivibili per simulare dinamicamente i cambi di stato dei Facade
  let mockAggregateState: WritableSignal<AggregateState>;
  let mockProcessState: WritableSignal<ProcessState>;
  let mockDocumentState: WritableSignal<DocumentState>;
  let mockFallbackState: WritableSignal<NodeFallbackState>;

  let mockAggregateFacade: any;
  let mockProcessFacade: any;
  let mockDocumentFacade: any;
  let mockFallbackFacade: any;
  let routerMock: any;

  beforeEach(async () => {
    // Inizializziamo gli stati di base vuoti
    mockAggregateState = signal({ detail: null, loading: false, error: null });
    mockProcessState = signal({ detail: null, loading: false, error: null });
    mockDocumentState = signal({ detail: null, loading: false, error: null });
    mockFallbackState = signal({ detail: null, loading: false, error: null });

    mockAggregateFacade = {
      getState: vi.fn().mockReturnValue(mockAggregateState),
      loadAggregate: vi.fn(),
    };

    mockProcessFacade = {
      getState: vi.fn().mockReturnValue(mockProcessState),
      loadProcess: vi.fn(),
      isProcess: vi.fn().mockResolvedValue(true),
    };

    mockDocumentFacade = {
      getState: vi.fn().mockReturnValue(mockDocumentState),
      loadDocument: vi.fn(),
    };

    mockFallbackFacade = {
      getState: vi.fn().mockReturnValue(mockFallbackState),
      loadNode: vi.fn(),
    };

    routerMock = { navigate: vi.fn() };

    let mockOutputFacade = {
      isWorking: signal(false),
      printDocument: vi.fn(),
      saveDocument: vi.fn(),
    };

    let mockIntegrityFacade = {
      isVerifying: signal(false),
      verifyIntegrity: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ItemDetailPageComponent],
      providers: [
        { provide: AGGREGATE_FACADE_TOKEN, useValue: mockAggregateFacade },
        { provide: PROCESS_FACADE_TOKEN, useValue: mockProcessFacade },
        { provide: DOCUMENT_FACADE_TOKEN, useValue: mockDocumentFacade },
        { provide: NODE_FALLBACK_FACADE_TOKEN, useValue: mockFallbackFacade },
        { provide: OUTPUT_FACADE_TOKEN, useValue: mockOutputFacade },
        { provide: INTEGRITY_FACADE_TOKEN, useValue: mockIntegrityFacade },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ItemDetailPageComponent);
    component = fixture.componentInstance;
  });

  // --- TEST 1: FLUSSO FASCICOLO (AGGREGATE) ---
  it('dovrebbe inizializzare e caricare i dati per un AGGREGATE', () => {
    fixture.componentRef.setInput('itemId', '123');
    fixture.componentRef.setInput('itemType', 'AGGREGATE');

    // Aggiorniamo il mock per simulare l'arrivo dei dati
    mockAggregateState.set({
      loading: false,
      error: null,
      detail: {
        idAgg: {
          tipoAggregazione: 'Fascicolo',
          idAggregazione: '123',
        },
        tipologiaFascicolo: 'affare',
        soggetti: [],
        assegnazione: {
          tipoAssegnazione: 'Per competenza',
          soggettoAssegnatario: { tipoRuolo: 'Assegnatario' },
          dataInizioAssegnazione: '2023-01-01',
        },
        dataApertura: '2023-01-01',
        classificazione: {
          indiceDiClassificazione: '1.1',
          descrizione: 'Classe test',
        },
        progressivo: 1,
        chiaveDescrittiva: { oggetto: 'Oggetto test' },
        indiceDocumenti: [],
      } as any,
    });

    fixture.detectChanges();

    expect(mockAggregateFacade.loadAggregate).toHaveBeenCalledWith('123');
    expect(mockDocumentFacade.loadDocument).not.toHaveBeenCalled();
    expect(mockFallbackFacade.loadNode).not.toHaveBeenCalled();
    expect(component.pageTitle()).toBe('Fascicolo affare'); // Testa il branch del computed
    expect(component.isLoading()).toBe(false);
  });

  // --- TEST 2: FLUSSO DOCUMENTO (DOCUMENT) ---
  it('dovrebbe inizializzare e caricare i dati per un DOCUMENT', () => {
    fixture.componentRef.setInput('itemId', '456');
    fixture.componentRef.setInput('itemType', 'DOCUMENT');

    // Simulo i dati del documento
    mockDocumentState.set({
      loading: false,
      error: null,
      detail: {
        documentId: '456',
        fileName: 'delibera.pdf',
        // Aggiungiamo il blocco che fa crashare il test se manca!
        registration: {
          tipoRegistro: 'Protocollo',
          flusso: 'E',
          data: '2023-01-01',
          numero: '123',
        },
      } as any,
    });

    fixture.detectChanges();

    expect(mockDocumentFacade.loadDocument).toHaveBeenCalledWith('456');
    expect(mockAggregateFacade.loadAggregate).not.toHaveBeenCalled();
    expect(mockProcessFacade.loadProcess).not.toHaveBeenCalled();
    expect(mockFallbackFacade.loadNode).not.toHaveBeenCalled();
    expect(component.pageTitle()).toBe('delibera.pdf'); // Testa l'altro branch del computed
  });

  it('dovrebbe inizializzare e caricare i dati per un PROCESS', () => {
    fixture.componentRef.setInput('itemId', '31');
    fixture.componentRef.setInput('itemType', 'PROCESS');

    mockProcessState.set({
      loading: false,
      error: null,
      detail: {
        processId: '31',
        processUuid: 'PROC-31',
        integrityStatus: 'VALID',
        metadata: {
          processId: '31',
          processUuid: 'PROC-31',
          integrityStatus: 'VALID',
          documentClassName: 'Classe Contratti',
          documentClassUuid: 'CLASS-22',
          documentClassTimestamp: '2026-04-08',
        },
        overview: {
          oggetto: 'Processo Contratti',
          procedimento: 'Gestione Contratti',
          materiaArgomentoStruttura: 'Contratti',
        },
        submission: {
          processo: 'PROC-31',
          sessione: 'VERS-1',
          dataInizio: '2026-04-08',
        },
        conservation: {
          processo: 'PROC-31',
          sessione: 'SESS-1',
          dataInizio: '2026-04-08',
        },
        documentClass: {
          id: 22,
          name: 'Classe Contratti',
          uuid: 'CLASS-22',
          timestamp: '2026-04-08',
        },
        customMetadata: [],
        indiceDocumenti: [],
      },
    });

    fixture.detectChanges();

    expect(mockProcessFacade.loadProcess).toHaveBeenCalledWith('31');
    expect(mockAggregateFacade.loadAggregate).not.toHaveBeenCalled();
    expect(mockDocumentFacade.loadDocument).not.toHaveBeenCalled();
    expect(mockFallbackFacade.loadNode).not.toHaveBeenCalled();
    expect(component.pageTitle()).toBe('PROC-31');

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.process-sidebar')).toBeTruthy();
    expect(compiled.querySelector('.process-main-content')).toBeTruthy();
  });

  it('dovrebbe caricare fallback detail per tipo DIP', () => {
    fixture.componentRef.setInput('itemId', '1');
    fixture.componentRef.setInput('itemType', 'DIP');

    mockFallbackState.set({
      loading: false,
      error: null,
      detail: {
        type: 'DIP',
        typeLabel: 'DIP',
        title: 'DIP',
        subtitle: 'Nodo radice del pacchetto documentale',
        fields: [{ label: 'UUID', value: 'DIP-UUID-1' }],
      },
    });

    fixture.detectChanges();

    expect(mockFallbackFacade.loadNode).toHaveBeenCalledWith('DIP', '1');
    expect(component.pageTitle()).toBe('DIP');
    expect(fixture.nativeElement.querySelector('app-node-fallback-panel')).toBeTruthy();
  });

  it('naviga quando viene selezionato un item correlato dal fallback panel', () => {
    component.onFallbackRelatedSelected({
      itemType: 'PROCESS',
      itemId: '31',
      label: 'Processo Contratti',
    });

    expect(routerMock.navigate).toHaveBeenCalledWith(['/detail', 'PROCESS', '31']);
  });

  // --- TEST 3: STATO DI CARICAMENTO ---
  it('dovrebbe mostrare lo spinner se lo stato è in loading', () => {
    fixture.componentRef.setInput('itemId', '789');
    fixture.componentRef.setInput('itemType', 'DOCUMENT');

    // Simulo il caricamento in corso
    mockDocumentState.set({ detail: null, loading: true, error: null });
    fixture.detectChanges();

    expect(component.isLoading()).toBe(true);

    // Verifica visiva nel DOM: cerca l'elemento con classe spinner-overlay
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.spinner-overlay')).toBeTruthy();
  });

  // --- TEST 4: GESTIONE ERRORE E RETRY ---
  it('dovrebbe mostrare un errore e permettere il retryLoad', () => {
    fixture.componentRef.setInput('itemId', 'ERR-1');
    fixture.componentRef.setInput('itemType', 'AGGREGATE');

    const fintoErrore: AppError = {
      code: ErrorCode.IPC_ERROR,
      message: 'Timeout',
      source: 'Test',
      category: ErrorCategory.IPC,
      severity: ErrorSeverity.ERROR,
      recoverable: true,
      context: null,
      detail: null,
    };

    // Simulo l'errore nel Facade
    mockAggregateState.set({ detail: null, loading: false, error: fintoErrore });
    fixture.detectChanges();

    expect(component.currentError()).toEqual(fintoErrore);

    // Nel DOM ci dovrebbe essere l'app-error-dialog
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-error-dialog')).toBeTruthy();

    // Puliamo i contatori dei mock e testiamo la funzione di retry!
    vi.clearAllMocks();
    component.retryLoad();

    // Siccome itemType è AGGREGATE, retryLoad deve aver richiamato loadAggregate
    expect(mockAggregateFacade.loadAggregate).toHaveBeenCalledWith('ERR-1');
  });

  // --- TEST 5: TITOLO DI DEFAULT ---
  it('dovrebbe restituire una stringa vuota per il pageTitle se non ci sono dettagli', () => {
    fixture.componentRef.setInput('itemId', '123');
    fixture.componentRef.setInput('itemType', 'AGGREGATE'); // Ma lo state è vuoto (detail: null)
    fixture.detectChanges();

    expect(component.pageTitle()).toBe('');
  });
});
