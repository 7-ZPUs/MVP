import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { signal } from '@angular/core';

import { SearchPageComponent } from '../ui/smart/search-page/search-page.component';
import {
  IFilterValidator,
  FILTER_VALIDATOR_TOKEN,
} from '../../validation/contracts/filter-validator.interface';
import { SEARCH_FACADE_TOKEN } from '../contracts/search-facade.interface';
import { ElementType } from '../../../../../../shared/domain/metadata/search.enum';

describe('SearchPageComponent - Integrazione e Navigazione', () => {
  let component: SearchPageComponent;
  let fixture: ComponentFixture<SearchPageComponent>;
  let navigateSpy: any;
  let warnSpy: any;

  beforeEach(async () => {
    const mockFacade = {
      getState: vi.fn().mockReturnValue(
        signal({
          loading: false,
          error: null,
          results: [{ id: 'TEST-DOM-1', type: ElementType.DOCUMENTO_INFORMATICO }],
          query: { text: 'test' },
          filters: {},
          validationErrors: new Map(),
        }),
      ),
      getCustomMetadataKeys: vi.fn().mockReturnValue(signal([])),
      loadCustomMetadataKeys: vi.fn(),
      setFilters: vi.fn(),
      setQuery: vi.fn(),
    };

    const mockValidator: IFilterValidator = {
      validate: vi.fn().mockReturnValue({ isValid: true, errors: new Map() }),
      registerStrategy: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [SearchPageComponent],
      providers: [
        { provide: SEARCH_FACADE_TOKEN, useValue: mockFacade },
        { provide: FILTER_VALIDATOR_TOKEN, useValue: mockValidator },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchPageComponent);
    component = fixture.componentInstance;

    const router = TestBed.inject(Router);
    navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('dovrebbe navigare verso AGGREGATE se il risultato è una AGGREGAZIONE_DOCUMENTALE', () => {
    const mockResult: any = { id: 'FASC-001', type: ElementType.AGGREGAZIONE_DOCUMENTALE };
    component.onResultSelected(mockResult);

    expect(navigateSpy).toHaveBeenCalledTimes(1);
    expect(navigateSpy).toHaveBeenCalledWith(['/detail', 'AGGREGATE', 'FASC-001']);
  });

  it('dovrebbe navigare verso PROCESS se il risultato è un PROCESSO', () => {
    const mockResult: any = { id: 'PROC-31', type: ElementType.PROCESS };
    component.onResultSelected(mockResult);

    expect(navigateSpy).toHaveBeenCalledTimes(1);
    expect(navigateSpy).toHaveBeenCalledWith(['/detail', 'PROCESS', 'PROC-31']);
  });

  it('dovrebbe navigare verso DOCUMENT se il risultato è un DOCUMENTO_INFORMATICO', () => {
    const mockResult: any = { id: 'DOC-123', type: ElementType.DOCUMENTO_INFORMATICO };
    component.onResultSelected(mockResult);

    expect(navigateSpy).toHaveBeenCalledTimes(1);
    expect(navigateSpy).toHaveBeenCalledWith(['/detail', 'DOCUMENT', 'DOC-123']);
  });

  it('dovrebbe navigare verso DOCUMENT se il risultato è un DOCUMENTO_AMMINISTRATIVO_INFORMATICO', () => {
    const mockResult: any = {
      id: 'DOC-456',
      type: ElementType.DOCUMENTO_AMMINISTRATIVO_INFORMATICO,
    };
    component.onResultSelected(mockResult);

    expect(navigateSpy).toHaveBeenCalledTimes(1);
    expect(navigateSpy).toHaveBeenCalledWith(['/detail', 'DOCUMENT', 'DOC-456']);
  });

  it('dovrebbe navigare verso DOCUMENT_CLASS se il risultato è una classe documentale', () => {
    const mockResult: any = { id: 'CLASS-99', type: ElementType.CLASS };
    component.onResultSelected(mockResult);

    expect(navigateSpy).toHaveBeenCalledTimes(1);
    expect(navigateSpy).toHaveBeenCalledWith(['/detail', 'DOCUMENT_CLASS', 'CLASS-99']);
  });

  it('CORNER CASE: NON dovrebbe navigare e dovrebbe emettere un warning se il tipo è sconosciuto', () => {
    const mockResult: any = { id: 'ERR-999', type: 'TIPO_NON_MAPPATO' };
    component.onResultSelected(mockResult);

    expect(navigateSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      'Tipo di documento non ancora supportato in navigazione: TIPO_NON_MAPPATO. Impossibile determinare la rotta di destinazione.',
    );
  });

  it('INTEGRAZIONE HTML: dovrebbe intercettare resultSelected dal componente figlio e scatenare la navigazione', () => {
    const searchResultsElement = fixture.debugElement.query(By.css('app-search-results'));
    expect(searchResultsElement).toBeTruthy();

    const mockEmitData = { id: 'TEST-DOM-1', type: ElementType.DOCUMENTO_INFORMATICO };
    searchResultsElement.triggerEventHandler('resultSelected', mockEmitData);

    expect(navigateSpy).toHaveBeenCalledTimes(1);
    expect(navigateSpy).toHaveBeenCalledWith(['/detail', 'DOCUMENT', 'TEST-DOM-1']);
  });
});
