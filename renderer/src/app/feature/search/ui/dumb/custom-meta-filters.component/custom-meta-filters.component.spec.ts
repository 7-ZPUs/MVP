import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { CustomMetaFiltersComponent } from './custom-meta-filters.component';
import { ValidationResult, ValidationError } from '../../../../../../../../shared/domain/metadata';

describe('CustomMetaFiltersComponent', () => {
  let component: CustomMetaFiltersComponent;
  let fixture: ComponentFixture<CustomMetaFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomMetaFiltersComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomMetaFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dovrebbe istanziare un form con entries vuoto', () => {
    expect(component.entries.length).toBe(0);
  });

  it('ngOnChanges() dovrebbe sincronizzare le entries con i nuovi filtri senza emettere', () => {
    const emitSpy = vi.spyOn(component.filtersChanged, 'emit');
    const incomingFilters = [{ field: 'Chiave1', value: 'Valore1' }];

    component.ngOnChanges({
      filters: new SimpleChange(null, incomingFilters, true),
    });

    expect(component.entries.length).toBe(1);
    expect(component.entries.at(0).value).toEqual({ field: 'Chiave1', value: 'Valore1' });
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('ngOnChanges() non dovrebbe ricreare i controlli se il valore in ingresso è equivalente', () => {
    component.ngOnChanges({
      filters: new SimpleChange(null, [{ field: 'Chiave1', value: 'Valore1' }], true),
    });

    const firstControl = component.entries.at(0);

    component.ngOnChanges({
      filters: new SimpleChange(
        [{ field: 'Chiave1', value: 'Valore1' }],
        [{ field: 'Chiave1', value: 'Valore1' }],
        false,
      ),
    });

    expect(component.entries.at(0)).toBe(firstControl);
  });

  it('ngOnChanges() dovrebbe resettare le entries se i filtri sono null', () => {
    component.addEntry({ field: 'A', value: 'B' }, false);
    expect(component.entries.length).toBe(1);

    component.ngOnChanges({
      filters: new SimpleChange(null, null, true),
    });

    expect(component.entries.length).toBe(0);
  });

  it("dovrebbe emettere l'array filtrato se almeno un campo è valorizzato", () => {
    const emitSpy = vi.spyOn(component.filtersChanged, 'emit');
    component.addEntry(undefined, false);

    component.entries.at(0).patchValue({ field: 'Chiave', value: '' });

    expect(emitSpy).toHaveBeenCalledWith([{ field: 'Chiave', value: '' }]);
  });

  it("dovrebbe emettere null se l'utente svuota i campi delle entries", () => {
    const emitSpy = vi.spyOn(component.filtersChanged, 'emit');
    component.addEntry({ field: 'Chiave', value: 'Valore' }, false);

    component.entries.at(0).patchValue({ field: '', value: '' });

    expect(emitSpy).toHaveBeenCalledWith(null);
  });

  it('dovrebbe restituire gli errori customMeta con getError e hasAnyError', () => {
    const mockErrorField: ValidationError = {
      field: 'customMeta[0].field',
      message: 'Chiave non valida',
      code: 'E1',
    };

    const mockValidationResult: ValidationResult = {
      isValid: false,
      errors: new Map([['customMeta[0].field', [mockErrorField]]]),
    };

    component.validationResult = mockValidationResult;

    expect(component.getError(0, 'field')?.message).toBe('Chiave non valida');
    expect(component.hasAnyError()).toBe(true);
  });

  it('hasAnyError dovrebbe restituire false senza validationResult', () => {
    component.validationResult = null;

    expect(component.hasAnyError()).toBe(false);
  });
});
