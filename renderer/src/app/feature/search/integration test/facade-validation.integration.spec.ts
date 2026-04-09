import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { of } from 'rxjs';
import { SearchFacade } from '../services/search-facade';
import {
  RegistryContradictionValidationStrategy,
  FormationModeContradictionStrategy,
  SearchRangeValidationStrategy,
} from '../../validation/strategies';
import { SearchFilters } from '../../../../../../shared/domain/metadata';
import { RegisterType, DIDAIFormation } from '../../../../../../shared/domain/metadata/search.enum';
import { FilterValidatorService } from '../../validation/services/filter-validator.service';
import { SEARCH_CHANNEL_TOKEN } from '../contracts/search-channel.interface';
import { FILTER_VALIDATOR_TOKEN } from '../../validation/contracts/filter-validator.interface';
import {
  SEMANTIC_INDEX_STATUS_TOKEN,
} from '../contracts/semantic-index.interface';
import {
  ERROR_HANDLER_TOKEN,
  LIVE_ANNOUNCER_TOKEN,
  TELEMETRY_TOKEN,
} from '../../../shared/contracts';

describe('Search Domain Integration (Facade + Validator + Strategies)', () => {
  let facade: SearchFacade;
  let mockSearchChannel: any;
  let mockErrorHandler: any;
  let mockTelemetry: any;
  let mockSemanticStatus: any;
  let mockLiveAnnouncer: any;

  beforeEach(() => {
    vi.useFakeTimers();

    mockSearchChannel = { searchAdvanced: vi.fn().mockReturnValue(of([])) };
    mockErrorHandler = { handle: vi.fn() };
    mockTelemetry = { trackEvent: vi.fn(), trackError: vi.fn() };
    mockSemanticStatus = { getStatus: vi.fn().mockReturnValue(signal({ status: 'READY' })) };
    mockLiveAnnouncer = { announce: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        SearchFacade,
        FilterValidatorService,
        { provide: FILTER_VALIDATOR_TOKEN, useExisting: FilterValidatorService },

        // Mock infrastrutturali
        { provide: SEARCH_CHANNEL_TOKEN, useValue: mockSearchChannel },
        { provide: ERROR_HANDLER_TOKEN, useValue: mockErrorHandler },
        { provide: TELEMETRY_TOKEN, useValue: mockTelemetry },
        { provide: SEMANTIC_INDEX_STATUS_TOKEN, useValue: mockSemanticStatus },
        { provide: LIVE_ANNOUNCER_TOKEN, useValue: mockLiveAnnouncer },
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

  it('Integrazione 1: Blocca la ricerca se le date del filtro common sono contraddittorie', () => {
    const invalidFilters = {
      common: { dataDa: '2026-12-31', dataA: '2026-01-01' }, // Range invertito!
      diDai: {},
      aggregate: {},
      custom: [],
      subject: null,
    } as unknown as SearchFilters;

    facade.searchAdvanced(invalidFilters);
    const state = facade.getState()();

    expect(state.validationErrors.size).toBe(1);
    expect(state.validationErrors.has('common.dataDa')).toBe(true);
    expect(mockSearchChannel.searchAdvanced).not.toHaveBeenCalled();
  });

  it('Integrazione 2: Blocca la ricerca per contraddizioni multiple (Registro e Modalità Formazione)', () => {
    const multipleInvalidFilters = {
      common: {},
      diDai: {
        registrazione: {
          tipologiaRegistro: RegisterType.NESSUNO,
          codiceRegistro: 'REG-123', // Errore Registro
        },
        modalitaFormazione: 'a' as DIDAIFormation,
        verifica: { conformitaCopie: true }, // Errore Formazione
      },
      aggregate: {},
      custom: [],
      subject: null,
    } as unknown as SearchFilters;

    facade.searchAdvanced(multipleInvalidFilters);

    const state = facade.getState()();

    expect(state.validationErrors.size).toBe(2);
    expect(state.validationErrors.has('diDai.registrazione.codiceRegistro')).toBe(true);
    expect(state.validationErrors.has('diDai.verifica.conformitaCopie')).toBe(true);

    expect(mockSearchChannel.searchAdvanced).not.toHaveBeenCalled();
  });

  it('Integrazione 3: Esegue la ricerca se il filtro è complesso ma coerente (Happy Path)', async () => {
    const validFilters = {
      common: { dataDa: '2026-01-01', dataA: '2026-12-31' },
      diDai: {
        registrazione: {
          tipologiaRegistro: 'Protocollo Ordinario' as RegisterType,
          codiceRegistro: 'REG-123',
        },
        modalitaFormazione: 'b' as DIDAIFormation,
        verifica: { conformitaCopie: true },
      },
      aggregate: {
        tipoAggregazione: 'Fascicolo',
        tipologiaFascicolo: 'procedimento amministrativo',
        procedimentoAmministrativo: 'Gara XYZ',
      },
      custom: [],
      subject: null,
    } as unknown as SearchFilters;

    facade.searchAdvanced(validFilters);

    await vi.advanceTimersByTimeAsync(0);

    const state = facade.getState()();

    expect(state.validationErrors.size).toBe(0);

    expect(mockSearchChannel.searchAdvanced).toHaveBeenCalledTimes(1);
    expect(mockSearchChannel.searchAdvanced).toHaveBeenCalledWith(
      validFilters,
      expect.any(AbortSignal),
    );
  });
});
