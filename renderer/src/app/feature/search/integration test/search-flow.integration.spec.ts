import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { SearchPageComponent } from '../ui/smart/search-page/search-page.component';
import { SearchIpcGateway } from '../adapters/search-ipc-gateway';

import {
  ELECTRON_CONTEXT_BRIDGE_TOKEN,
  CACHE_SERVICE_TOKEN,
  ERROR_HANDLER_TOKEN,
} from '../../../shared/contracts';
import { SearchQueryType } from '../../../../../../shared/metadata/search.enum';
import { SearchFacade } from '../services';

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
        { provide: ERROR_HANDLER_TOKEN, useValue: mockErrorHandler }, // Per il Gateway
        { provide: 'IErrorHandler', useValue: mockErrorHandler }, // Per la Facade

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

  // ... (import e setup invariati)

  it('Flusso Completo: dalla digitazione in UI, al bridge IPC, al rendering dei risultati', async () => {
    const mockBackendResults = [
      { id: 'DOC-01', title: 'Fascicolo di Prova', type: 'PDF' },
      { id: 'DOC-02', title: 'Relazione Tecnica', type: 'DOCX' },
    ];
    mockElectronBridge.invoke.mockResolvedValue(mockBackendResults);

    const searchInput = fixture.debugElement.query(
      By.css('input[placeholder*="Cerca"]'),
    ).nativeElement;
    searchInput.value = 'Prova integrazione';
    searchInput.dispatchEvent(new Event('input'));

    const searchBtn = fixture.debugElement.query(By.css('header button'));
    searchBtn.triggerEventHandler('click', null);

    await sleep(350);
    fixture.detectChanges();

    expect(mockElectronBridge.invoke).toHaveBeenCalledWith(
      'ipc:search:text',
      expect.objectContaining({ text: 'Prova integrazione' }),
      expect.any(AbortSignal),
    );

    const resultsHeader = fixture.debugElement.query(By.css('main h2')).nativeElement;
    expect(resultsHeader.textContent).toContain('Trovati 2 risultati');
  });

  it('Flusso di Errore: dal crash IPC alla visualizzazione del banner di errore in UI', async () => {
    const backendError = new Error('Connessione al database locale fallita');
    mockElectronBridge.invoke.mockRejectedValue(backendError);

    const searchInput = fixture.debugElement.query(
      By.css('input[placeholder*="Cerca"]'),
    ).nativeElement;
    searchInput.value = 'Test errore';
    searchInput.dispatchEvent(new Event('input'));

    const searchBtn = fixture.debugElement.query(By.css('header button'));
    searchBtn.triggerEventHandler('click', null);

    await sleep(350);
    fixture.detectChanges();

    expect(mockElectronBridge.invoke).toHaveBeenCalled();

    const errorBox = fixture.debugElement.query(
      By.css('div[style*="background: #fee2e2"]'),
    ).nativeElement;
    expect(errorBox).toBeTruthy();
    expect(errorBox.textContent).toContain('Connessione al database locale fallita');

    const retryBtn = fixture.debugElement.query(
      By.css('button[style*="background: #ef4444"]'),
    ).nativeElement;
    expect(retryBtn.textContent).toContain('Riprova');
  });
});
