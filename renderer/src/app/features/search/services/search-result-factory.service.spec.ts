import { FILTER_VALIDATOR_TOKEN } from '../../validation/contracts/filter-validator.interface';
import { TestBed } from '@angular/core/testing';
import { SearchResultFactoryService } from './search-result-factory.service';
import {
  DocumentResultCardComponent,
  ProcessResultCardComponent,
  ClassResultCardComponent,
  AggregateResultCardComponent,
} from '../ui/dumb/result-types';
import { ElementType } from '../../../../../../shared/domain/metadata/search.enum';
import { describe, it, expect, beforeEach } from 'vitest';

describe('SearchResultFactoryService', () => {
  let service: SearchResultFactoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: FILTER_VALIDATOR_TOKEN,
          useValue: { validate: () => ({ valid: true, errors: new Map() }) },
        },
        SearchResultFactoryService,
      ],
    });
    service = TestBed.inject(SearchResultFactoryService);
  });

  it('dovrebbe restituire ProcessResultCardComponent per il tipo PROCESSO', () => {
    const componentClass = service.getComponentForType('PROCESSO');
    expect(componentClass).toBe(ProcessResultCardComponent);
  });

  it('dovrebbe restituire ClassResultCardComponent per il tipo CLASSE', () => {
    const componentClass = service.getComponentForType('CLASSE');
    expect(componentClass).toBe(ClassResultCardComponent);
  });

  it('dovrebbe restituire DocumentResultCardComponent per ElementType.DOCUMENTO_INFORMATICO', () => {
    const componentClass = service.getComponentForType(ElementType.DOCUMENTO_INFORMATICO);
    expect(componentClass).toBe(DocumentResultCardComponent);
  });

  it('dovrebbe restituire DocumentResultCardComponent per ElementType.DOCUMENTO_AMMINISTRATIVO_INFORMATICO', () => {
    const componentClass = service.getComponentForType(
      ElementType.DOCUMENTO_AMMINISTRATIVO_INFORMATICO,
    );
    expect(componentClass).toBe(DocumentResultCardComponent);
  });

  it('dovrebbe restituire AggregateResultCardComponent per ElementType.AGGREGAZIONE_DOCUMENTALE', () => {
    const componentClass = service.getComponentForType(ElementType.AGGREGAZIONE_DOCUMENTALE);
    expect(componentClass).toBe(AggregateResultCardComponent);
  });

  it('dovrebbe restituire ProcessResultCardComponent per ElementType.PROCESS', () => {
    const componentClass = service.getComponentForType(ElementType.PROCESS);
    expect(componentClass).toBe(ProcessResultCardComponent);
  });

  it('CORNER CASE: dovrebbe usare DocumentResultCardComponent come fallback per tipi sconosciuti', () => {
    const componentClass = service.getComponentForType('TIPO_NON_ESISTENTE');
    expect(componentClass).toBe(DocumentResultCardComponent);
  });

  it('CORNER CASE: dovrebbe usare DocumentResultCardComponent se il tipo è vuoto', () => {
    const componentClass = service.getComponentForType('');
    expect(componentClass).toBe(DocumentResultCardComponent);
  });
});
