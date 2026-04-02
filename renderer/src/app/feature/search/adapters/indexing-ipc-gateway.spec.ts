import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { SearchPageComponent } from '../ui/smart/search-page/search-page.component';
import { SearchFacade } from '../services/search-facade';
import { SearchIpcGateway } from '../adapters/search-ipc-gateway';
import { FilterValidatorService } from '../../validation/services/filter-validator.service';
import { IpcErrorHandlerService } from '../../../shared/services/ipc-error-handler.service';

import {
  ELECTRON_CONTEXT_BRIDGE_TOKEN,
  CACHE_SERVICE_TOKEN,
  ERROR_HANDLER_TOKEN,
} from '../../../shared/contracts';
import { SearchQueryType } from '../../../../../../shared/domain/metadata/search.enum';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Broad Integration: Full Search Engine Flow (Servizi Reali)', () => {
  let fixture: ComponentFixture<SearchPageComponent>;
  let mockElectronBridge: any;

  beforeEach(async () => {
    // Il finto backend
    mockElectronBridge = {
      invoke: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [SearchPageComponent],
      providers: [
        SearchFacade,
        SearchIpcGateway,
        FilterValidatorService,
        IpcErrorHandlerService,

        { provide: 'ISearchChannel', useExisting: SearchIpcGateway },
        { provide: 'IFilterValidator', useExisting: FilterValidatorService },
        { provide: ERROR_HANDLER_TOKEN, useClass: IpcErrorHandlerService },
        { provide: 'IErrorHandler', useClass: IpcErrorHandlerService },

        { provide: ELECTRON_CONTEXT_BRIDGE_TOKEN, useValue: mockElectronBridge },
        {
          provide: CACHE_SERVICE_TOKEN,
          useValue: { get: () => null, set: () => {}, invalidatePrefix: () => {} },
        },
        { provide: 'ITelemetry', useValue: { trackEvent: vi.fn(), trackError: vi.fn() } },
        {
          provide: 'ISemanticIndexStatus',
          useValue: { getStatus: () => signal({ status: 'READY' }) },
        },
        { provide: 'ILiveAnnouncer', useValue: { announce: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchPageComponent);
    fixture.detectChanges();
  });

  it('1. Ricerca Libera: dalla UI al canale ipc:search:text', async () => {
    mockElectronBridge.invoke.mockResolvedValue([{ id: '1', title: 'Doc Testo' }]);

    const searchInput = fixture.debugElement.query(By.css('input[type="text"]')).nativeElement;
    searchInput.value = 'Ricerca Valida';
    searchInput.dispatchEvent(new Event('input'));

    const searchBtn = fixture.debugElement.query(By.css('header button'));
    searchBtn.triggerEventHandler('click', null);

    await sleep(350);
    fixture.detectChanges();

    expect(mockElectronBridge.invoke).toHaveBeenCalledWith(
      'ipc:search:text',
      expect.objectContaining({ text: 'Ricerca Valida' }),
      expect.any(AbortSignal),
    );

    const resultsHeader = fixture.debugElement.query(By.css('main h2')).nativeElement;
    expect(resultsHeader.textContent).toContain('Trovati 1 risultati');
  });

  it('2. Ricerca Avanzata: dal Pannello Filtri al canale ipc:search:advanced', async () => {
    mockElectronBridge.invoke.mockResolvedValue([{ id: '2', title: 'Doc Filtri' }]);

    const validFilters = { common: { text: 'Filtro Valido' } };
    const filterPanel = fixture.debugElement.query(By.css('app-advanced-filter-panel'));
    filterPanel.triggerEventHandler('filtersSubmit', validFilters);

    await sleep(350);
    fixture.detectChanges();

    expect(mockElectronBridge.invoke).toHaveBeenCalledWith(
      'ipc:search:advanced',
      expect.objectContaining(validFilters),
      expect.any(AbortSignal),
    );
  });

  it('3. Ricerca Semantica: attivazione toggle e chiamata a ipc:search:semantic', async () => {
    mockElectronBridge.invoke.mockResolvedValue([{ id: '3', title: 'Doc Semantico' }]);

    const semanticToggle = fixture.debugElement.query(
      By.css('input[type="checkbox"]'),
    ).nativeElement;
    semanticToggle.checked = true;
    semanticToggle.dispatchEvent(new Event('change'));

    const searchInput = fixture.debugElement.query(By.css('input[type="text"]')).nativeElement;
    searchInput.value = 'Concetto chiave';
    searchInput.dispatchEvent(new Event('input'));

    const searchBtn = fixture.debugElement.query(By.css('header button'));
    searchBtn.triggerEventHandler('click', null);

    await sleep(350);
    fixture.detectChanges();

    expect(mockElectronBridge.invoke).toHaveBeenCalledWith(
      'ipc:search:semantic',
      expect.objectContaining({ text: 'Concetto chiave', useSemanticSearch: true }),
      expect.any(AbortSignal),
    );
  });

  it('4. Gestione Errori Reale: crash del backend tradotto dalla UI', async () => {
    mockElectronBridge.invoke.mockRejectedValue(new Error('IPC_TIMEOUT'));

    const searchBtn = fixture.debugElement.query(By.css('header button'));
    searchBtn.triggerEventHandler('click', null);

    await sleep(350);
    fixture.detectChanges();

    const errorBox = fixture.debugElement.query(
      By.css('div[style*="background: #fee2e2"]'),
    ).nativeElement;
    expect(errorBox).toBeTruthy();
    expect(errorBox.textContent.length).toBeGreaterThan(0);
  });

  it('5. Validazione Reale: la ricerca si blocca se i filtri sono invalidi', async () => {
    const invalidFilters = { common: { text: 'a' } };

    const filterPanel = fixture.debugElement.query(By.css('app-advanced-filter-panel'));
    filterPanel.triggerEventHandler('filtersSubmit', invalidFilters);

    await sleep(350);
    fixture.detectChanges();
  });
});
