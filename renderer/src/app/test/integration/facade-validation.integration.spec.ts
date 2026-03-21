import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { of } from 'rxjs';
import { SearchFacade } from '../../feature/search/services/search-facade';
import {
  RegistryContradictionValidationStrategy,
  FormationModeContradictionStrategy,
  SearchRangeValidationStrategy,
} from '../../feature/validation/strategies';
import { SearchFilters } from '../../feature/search/domain';
import { RegisterType, DIDAIFormation } from '../../feature/search/domain/search.enum';
import { FilterValidatorService } from '../../feature/validation/services/filter-validator.service';

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
        { provide: 'IFilterValidator', useExisting: FilterValidatorService },

        // Mock infrastrutturali
        { provide: 'ISearchChannel', useValue: mockSearchChannel },
        { provide: 'IErrorHandler', useValue: mockErrorHandler },
        { provide: 'ITelemetry', useValue: mockTelemetry },
        { provide: 'ISemanticIndexStatus', useValue: mockSemanticStatus },
        { provide: 'ILiveAnnouncer', useValue: mockLiveAnnouncer },
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
