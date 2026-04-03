import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { SearchPageComponent } from '../ui/smart/search-page/search-page.component';
import { SearchIpcGateway } from '../adapters/search-ipc-gateway';
import { SearchBarComponent } from '../ui/dumb/search-bar.component/search-bar.component';
import { SearchResultsComponent } from '../ui/dumb/search-results.component/search-results.component';

import {
  ELECTRON_CONTEXT_BRIDGE_TOKEN,
  CACHE_SERVICE_TOKEN,
  ERROR_HANDLER_TOKEN,
} from '../../../shared/contracts';
import { SearchFacade } from '../services';
import { SearchQueryType } from '../../../../../../shared/domain/metadata/search.enum';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Integration: Search Flow (UI -> Facade -> IPC Gateway)', () => {
  let fixture: ComponentFixture<SearchPageComponent>;
  let mockElectronBridge: any;
  let mockCache: any;

  beforeEach(async () => {
    mockElectronBridge = {
      invoke: vi.fn(),
    };

    mockCache = {
      get: vi.fn().mockReturnValue(null),
      set: vi.fn(),
      invalidatePrefix: vi.fn(),
    };

    const mockErrorHandler = {
      handle: vi.fn().mockImplementation((err) => ({ message: err.message, code: 'ERR' })),
    };
    const mockValidator = {
      validate: vi.fn().mockReturnValue({ isValid: true, errors: new Map() }),
    };
    const mockTelemetry = { trackEvent: vi.fn(), trackTiming: vi.fn(), trackError: vi.fn() };
    const mockLiveAnnouncer = { announce: vi.fn() };
    const mockSemanticStatus = {
      getStatus: vi.fn().mockReturnValue(signal({ status: 'READY', progress: 100 })),
    };

    await TestBed.configureTestingModule({
      imports: [SearchPageComponent],
      providers: [
        SearchFacade,
        SearchIpcGateway,
        { provide: 'ISearchChannel', useExisting: SearchIpcGateway },
        { provide: ELECTRON_CONTEXT_BRIDGE_TOKEN, useValue: mockElectronBridge },

        { provide: CACHE_SERVICE_TOKEN, useValue: mockCache },
        { provide: ERROR_HANDLER_TOKEN, useValue: mockErrorHandler },
        { provide: 'IErrorHandler', useValue: mockErrorHandler },

        { provide: 'IFilterValidator', useValue: mockValidator },
        { provide: 'ITelemetry', useValue: mockTelemetry },
        { provide: 'ITelemetryService', useValue: mockTelemetry },
        { provide: 'ISemanticIndexStatus', useValue: mockSemanticStatus },
        { provide: 'ILiveAnnouncer', useValue: mockLiveAnnouncer },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchPageComponent);
    fixture.detectChanges();
  });

  it('Flusso Completo: dalla digitazione in UI, al bridge IPC, al rendering dei risultati', async () => {
    const mockBackendResults = [
      { documentId: 'DOC-01', title: 'Fascicolo di Prova', type: 'AGGREGAZIONE_DOCUMENTALE' },
      { documentId: 'DOC-02', title: 'Relazione Tecnica', type: 'DOCUMENTO_INFORMATICO' },
    ];
    mockElectronBridge.invoke.mockResolvedValue(mockBackendResults);

    // Interazione tramite il componente figlio SearchBar (pattern corretto per componenti smart-dumb)
    const searchBar = fixture.debugElement.query(By.directive(SearchBarComponent));
    
    // Simula la digitazione dell'utente
    searchBar.triggerEventHandler('queryChanged', { 
      text: 'Prova integrazione', 
      type: SearchQueryType.FREE, 
      useSemanticSearch: false 
    });
    
    // Simula l'invio della ricerca
    searchBar.triggerEventHandler('searchRequested', null);

    await sleep(350);
    fixture.detectChanges();

    // Verifica che la chiamata al bridge IPC sia avvenuta con i parametri corretti
    expect(mockElectronBridge.invoke).toHaveBeenCalledWith(
      'ipc:search:text',
      expect.objectContaining({ text: 'Prova integrazione' }),
      expect.any(AbortSignal),
    );

    // Verifica il rendering dei risultati tramite la nuova classe semantica
    const resultsHeader = fixture.debugElement.query(By.css('.page-title')).nativeElement;
    expect(resultsHeader.textContent).toContain('Trovati 2 risultati');

    const resultsComponent = fixture.debugElement.query(By.directive(SearchResultsComponent));
    expect(resultsComponent).toBeTruthy();
  });

  it('Flusso di Errore: dal crash IPC alla visualizzazione del banner di errore in UI', async () => {
    const backendError = new Error('Connessione al database locale fallita');
    mockElectronBridge.invoke.mockRejectedValue(backendError);

    const searchBar = fixture.debugElement.query(By.directive(SearchBarComponent));
    
    searchBar.triggerEventHandler('queryChanged', { 
      text: 'Test errore', 
      type: SearchQueryType.FREE, 
      useSemanticSearch: false 
    });
    
    searchBar.triggerEventHandler('searchRequested', null);

    await sleep(350);
    fixture.detectChanges();

    expect(mockElectronBridge.invoke).toHaveBeenCalled();

    // Verifica la comparsa del banner usando la classe corretta .error-banner
    const errorBox = fixture.debugElement.query(By.css('.error-banner')).nativeElement;
    expect(errorBox).toBeTruthy();
    expect(errorBox.textContent).toContain('Connessione al database locale fallita');

    // Verifica la presenza del tasto Riprova usando la classe corretta .btn-retry
    const retryBtn = fixture.debugElement.query(By.css('.btn-retry')).nativeElement;
    expect(retryBtn.textContent).toContain('Riprova');
  });
});