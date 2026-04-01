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
    expect(component.form.value).toEqual({ field: '', value: '' });
  });

  it('ngOnChanges() dovrebbe sincronizzare il form con i nuovi filtri senza emettere', () => {
    const emitSpy = vi.spyOn(component.filtersChanged, 'emit');
    const incomingFilters = { field: 'Chiave1', value: 'Valore1' };

    component.ngOnChanges({
      filters: new SimpleChange(null, incomingFilters, true),
    });

    expect(component.form.value).toEqual({ field: 'Chiave1', value: 'Valore1' });
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('ngOnChanges() dovrebbe resettare il form se i filtri sono null', () => {
    component.form.patchValue({ field: 'A', value: 'B' });

    component.ngOnChanges({
      filters: new SimpleChange(null, null, true),
    });

    expect(component.form.value).toEqual({ field: '', value: '' });
  });

  it("dovrebbe mostrare i messaggi di errore HTML dinamici per 'field' e 'value'", () => {
    const mockErrorField: ValidationError = {
      field: 'customMeta.field',
      message: 'Chiave non valida',
      code: 'E1',
    };
    const mockErrorValue: ValidationError = {
      field: 'customMeta.value',
      message: 'Valore non valido',
      code: 'E2',
    };

    const mockValidationResult: ValidationResult = {
      isValid: false,
      errors: new Map([
        ['customMeta.field', [mockErrorField]],
        ['customMeta.value', [mockErrorValue]],
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

    component.form.patchValue({ field: '', value: '' });

    expect(emitSpy).toHaveBeenCalledWith(null);
  });
});
