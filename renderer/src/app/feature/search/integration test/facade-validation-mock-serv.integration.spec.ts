import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { of, throwError } from 'rxjs';

import { SearchFacade } from '../services/search-facade';
import { FilterValidatorService } from '../../validation/services/filter-validator.service';
import { SearchFilters, ISearchResult } from '../../../../../../shared/domain/metadata';
import { ElementType } from '../../../../../../shared/domain/metadata/search.enum';
import { IntegrityStatusEnum } from '../../../../../../core/src/value-objects/IntegrityStatusEnum';
import { TelemetryEvent } from '../../../shared/domain';

// Strategie Reali
import {
  RegistryContradictionValidationStrategy,
  FormationModeContradictionStrategy,
  SearchRangeValidationStrategy,
} from '../../validation/strategies';

describe('Search Ecosystem (Facade + Domain + Infrastructure)', () => {
  let facade: SearchFacade;

  // Mocks Infrastrutturali
  let mockSearchChannel: any;
  let mockErrorHandler: any;
  let mockTelemetry: any;
  let mockLiveAnnouncer: any;

  beforeEach(() => {
    vi.useFakeTimers();

    mockSearchChannel = { searchAdvanced: vi.fn() };
    mockErrorHandler = { handle: vi.fn() };
    mockTelemetry = { trackEvent: vi.fn(), trackError: vi.fn() };
    mockLiveAnnouncer = { announce: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        SearchFacade,
        FilterValidatorService,
        { provide: 'IFilterValidator', useExisting: FilterValidatorService },
        { provide: 'ISearchChannel', useValue: mockSearchChannel },
        { provide: 'IErrorHandler', useValue: mockErrorHandler },
        { provide: 'ITelemetry', useValue: mockTelemetry },
        { provide: 'ILiveAnnouncer', useValue: mockLiveAnnouncer },
        {
          provide: 'ISemanticIndexStatus',
          useValue: { getStatus: vi.fn().mockReturnValue(signal({ status: 'READY' })) },
        },
      ],
    });

    const validatorService = TestBed.inject(FilterValidatorService);
    validatorService.registerStrategy(new RegistryContradictionValidationStrategy());
    validatorService.registerStrategy(new FormationModeContradictionStrategy());
    validatorService.registerStrategy(new SearchRangeValidationStrategy());

    facade = TestBed.inject(SearchFacade);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('SCENARIO 1: Il Rifiuto (Filtri Contraddittori)', () => {
    it('dovrebbe bloccare tutto e NON chiamare Telemetria, Announcer o IPC', () => {
      const invalidFilters = {
        common: { dataDa: '2026-12-31', dataA: '2026-01-01' },
      } as unknown as SearchFilters;

      facade.searchAdvanced(invalidFilters);

      expect(facade.getState()().validationErrors.has('common.dataDa')).toBe(true);
      expect(mockSearchChannel.searchAdvanced).not.toHaveBeenCalled();
      expect(mockTelemetry.trackEvent).not.toHaveBeenCalled();
      expect(mockLiveAnnouncer.announce).not.toHaveBeenCalled();
      expect(mockErrorHandler.handle).not.toHaveBeenCalled();
    });
  });

  describe('SCENARIO 2: Il Trionfo (Ricerca con Successo)', () => {
    it('dovrebbe coordinare validazione, IPC, stato, telemetria e accessibilità', async () => {
      const validFilters = {
        common: { note: 'Filtro valido' },
      } as unknown as SearchFilters;
      const mockResults: ISearchResult[] = [
        {
          id: '1',
          uuid: 'DOC-1',
          name: 'Test',
          type: ElementType.DOCUMENTO_INFORMATICO,
          integrityStatus: IntegrityStatusEnum.VALID,
          score: 100,
        },
      ];

      mockSearchChannel.searchAdvanced.mockReturnValue(of(mockResults));
      facade.searchAdvanced(validFilters);
      await vi.advanceTimersByTimeAsync(0);
      const state = facade.getState()();

      expect(state.validationErrors.size).toBe(0);
      expect(mockSearchChannel.searchAdvanced).toHaveBeenCalledTimes(1);
      expect(state.results).toEqual(mockResults);
      expect(state.isSearching).toBe(false);
      expect(mockTelemetry.trackEvent).toHaveBeenCalledWith(TelemetryEvent.SEARCH_EXECUTED);
      expect(mockLiveAnnouncer.announce).toHaveBeenCalledWith('Trovati 1 risultati', 'polite');
      expect(mockErrorHandler.handle).not.toHaveBeenCalled();
    });
  });

  describe('SCENARIO 3: Il Disastro (Errore del Motore di Ricerca)', () => {
    it("dovrebbe intercettare l'errore IPC, passarlo all'ErrorHandler, tracciarlo e resettare lo stato", async () => {
      const validFilters = {
        common: { note: 'Filtro valido' },
      } as unknown as SearchFilters;
      const rawError = new Error('Electron IPC Disconnected');
      const handledAppError = { code: 'IPC_ERR', message: 'Connessione persa' };

      mockSearchChannel.searchAdvanced.mockReturnValue(throwError(() => rawError));
      mockErrorHandler.handle.mockReturnValue(handledAppError);

      facade.searchAdvanced(validFilters);
      await vi.advanceTimersByTimeAsync(0);

      const state = facade.getState()();

      expect(mockSearchChannel.searchAdvanced).toHaveBeenCalledTimes(1);
      expect(mockErrorHandler.handle).toHaveBeenCalledWith(rawError);
      expect(mockTelemetry.trackError).toHaveBeenCalledWith(handledAppError);
      expect(state.error).toEqual(handledAppError);
      expect(state.isSearching).toBe(false);
      expect(state.results.length).toBe(0);
      expect(mockLiveAnnouncer.announce).not.toHaveBeenCalled();
    });
  });
});
