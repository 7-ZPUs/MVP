import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { By } from '@angular/platform-browser';
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

  it('dovrebbe istanziare un form vuoto', () => {
    expect(component.form.value).toEqual({ entries: [] });
  });

  it('ngOnChanges() dovrebbe sincronizzare il form con i nuovi filtri senza emettere', () => {
    const emitSpy = vi.spyOn(component.filtersChanged, 'emit');
    const incomingFilters = [{ field: 'Chiave1', value: 'Valore1' }];

    component.ngOnChanges({
      filters: new SimpleChange(null, incomingFilters, true),
    });

    expect(component.form.value).toEqual({
      entries: [{ field: 'Chiave1', value: 'Valore1' }],
    });
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('ngOnChanges() dovrebbe resettare il form se i filtri sono null', () => {
    // Add an entry to test the clearing behavior
    component.addEntry({ field: 'A', value: 'B' }, false);

    component.ngOnChanges({
      filters: new SimpleChange(null, null, true),
    });

    expect(component.form.value).toEqual({ entries: [] });
  });

  it("dovrebbe mostrare i messaggi di errore HTML dinamici per 'field' e 'value'", () => {
    // We need at least one entry in the FormArray to render the input fields in the HTML
    component.addEntry({ field: 'Chiave', value: 'Valore' }, false);
    fixture.detectChanges();

    const mockErrorField: ValidationError = {
      field: 'customMeta[0].field',
      message: 'Chiave non valida',
      code: 'E1',
    };
    const mockErrorValue: ValidationError = {
      field: 'customMeta[0].value',
      message: 'Valore non valido',
      code: 'E2',
    };

    const mockValidationResult: ValidationResult = {
      isValid: false,
      errors: new Map([
        ['customMeta[0].field', [mockErrorField]],
        ['customMeta[0].value', [mockErrorValue]],
      ]),
    };

    fixture.componentRef.setInput('validationResult', mockValidationResult);
    fixture.detectChanges();

    const errEls = fixture.debugElement.queryAll(By.css('.validation-error'));

    expect(errEls.length).toBe(2);
    expect(errEls[0].nativeElement.textContent.trim()).toBe('Chiave non valida');
    expect(errEls[1].nativeElement.textContent.trim()).toBe('Valore non valido');
  });

  it("dovrebbe emettere null se l'utente svuota entrambi i campi", () => {
    const emitSpy = vi.spyOn(component.filtersChanged, 'emit');

    // Add a valid entry without triggering valueChanges immediately
    component.addEntry({ field: 'A', value: 'B' }, false);
    
    // Empty the fields of the first entry
    component.entries.at(0).patchValue({ field: '', value: '' });

    // Component should emit null because there are no valid entries left
    expect(emitSpy).toHaveBeenCalledWith(null);
  });
});