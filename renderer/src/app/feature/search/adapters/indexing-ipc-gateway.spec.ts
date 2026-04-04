import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { SearchPageComponent } from '../ui/smart/search-page/search-page.component';
import { SearchFacade } from '../services/search-facade';
import { SearchIpcGateway } from '../adapters/search-ipc-gateway';
import { FilterValidatorService } from '../../validation/services/filter-validator.service';
import { IpcErrorHandlerService } from '../../../shared/services/ipc-error-handler.service';
import { SearchBarComponent } from '../ui/dumb/search-bar.component/search-bar.component';
import { AdvancedFilterPanelComponent } from '../ui/smart/advanced-filter-panel/advanced-filter-panel';

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
    mockElectronBridge.invoke.mockResolvedValue([{ documentId: '1', title: 'Doc Testo', type: 'DOCUMENTO_INFORMATICO' }]);

    // Interazione tramite il componente figlio SearchBar
    const searchBar = fixture.debugElement.query(By.directive(SearchBarComponent));
    searchBar.triggerEventHandler('queryChanged', { text: 'Ricerca Valida', type: SearchQueryType.FREE, useSemanticSearch: false });
    searchBar.triggerEventHandler('searchRequested', null);

    await sleep(350);
    fixture.detectChanges();

    expect(mockElectronBridge.invoke).toHaveBeenCalledWith(
      'ipc:search:text',
      expect.objectContaining({ text: 'Ricerca Valida' }),
      expect.any(AbortSignal),
    );
  });

  it('2. Ricerca Avanzata: dal Pannello Filtri al canale ipc:search:advanced', async () => {
    mockElectronBridge.invoke.mockResolvedValue([{ documentId: '2', title: 'Doc Filtri', type: 'DOCUMENTO_INFORMATICO' }]);

    const validFilters = { common: { note: 'Filtro Note' }, subject: [] };
    const filterPanel = fixture.debugElement.query(By.directive(AdvancedFilterPanelComponent));
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
    mockElectronBridge.invoke.mockResolvedValue([{ documentId: '3', title: 'Doc Semantico', type: 'DOCUMENTO_INFORMATICO' }]);

    const searchBar = fixture.debugElement.query(By.directive(SearchBarComponent));
    searchBar.triggerEventHandler('queryChanged', { text: 'Concetto chiave', type: SearchQueryType.FREE, useSemanticSearch: true });
    searchBar.triggerEventHandler('searchRequested', null);

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

    const searchBar = fixture.debugElement.query(By.directive(SearchBarComponent));
    searchBar.triggerEventHandler('searchRequested', null);

    await sleep(350);
    fixture.detectChanges();

    const errorBox = fixture.debugElement.query(By.css('.error-banner'));
    expect(errorBox).toBeTruthy();
    expect(errorBox.nativeElement.textContent).toContain('IPC_TIMEOUT');
  });

 it('5. Validazione Reale: la ricerca si blocca se i filtri sono invalidi', async () => {
    const invalidFilters = { common: { note: 'a' }, subject: [] };
    const validator = TestBed.inject(FilterValidatorService);
    vi.spyOn(validator, 'validate').mockReturnValue({
      isValid: false,
      errors: new Map([['common.note', [{ message: 'Troppo corto', code: 'ERR', field: '' }]]])
    });

    const filterPanel = fixture.debugElement.query(By.directive(AdvancedFilterPanelComponent));
    filterPanel.triggerEventHandler('filtersSubmit', invalidFilters);

    await sleep(350);
    fixture.detectChanges();

    expect(mockElectronBridge.invoke).not.toHaveBeenCalled();
  });
});