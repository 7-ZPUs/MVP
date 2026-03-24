import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { CommonFiltersComponent } from './common-filters.component';
import { CommonFilterValues, ValidationResult, ValidationError } from '../../../domain';

describe('CommonFiltersComponent', () => {
  let component: CommonFiltersComponent;
  let fixture: ComponentFixture<CommonFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonFiltersComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CommonFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dovrebbe istanziare il form correttamente', () => {
    expect(component.form).toBeDefined();
  });

  it("ngOnChanges() non dovrebbe fare nulla se non ci sono cambiamenti nell'input filters (copertura ramo falso)", () => {
    const patchSpy = vi.spyOn(component.form, 'patchValue');

    component.ngOnChanges({
      validationResult: new SimpleChange(null, { isValid: true, errors: new Map() }, true),
    });

    component.ngOnChanges({
      filters: new SimpleChange(null, null, false),
    });

    expect(patchSpy).not.toHaveBeenCalled();
  });

  it('ngOnChanges() dovrebbe aggiornare il form senza emettere eventi', () => {
    const emitSpy = vi.spyOn(component.filtersChanged, 'emit');
    const incomingFilters = {
      chiaveDescrittiva: 'Test',
      tipo: 'PDF',
    } as unknown as CommonFilterValues;

    component.ngOnChanges({
      filters: new SimpleChange(null, incomingFilters, true),
    });

    expect(component.form.value.chiaveDescrittiva).toBe('Test');
    expect(component.form.value.tipo).toBe('PDF');
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('ngOnDestroy() dovrebbe emettere sul subject destroy$ per evitare memory leak', () => {
    const nextSpy = vi.spyOn((component as any).destroy$, 'next');
    const completeSpy = vi.spyOn((component as any).destroy$, 'complete');

    component.ngOnDestroy();

    expect(nextSpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });

  it('dovrebbe mostrare i messaggi di errore nel template HTML (copertura rami *ngIf)', () => {
    const mockErrorChiave: ValidationError = {
      field: 'common.chiaveDescrittiva',
      message: 'Errore chiave',
      code: 'E1',
    };
    const mockErrorClass: ValidationError = {
      field: 'common.classificazione',
      message: 'Errore classe',
      code: 'E2',
    };

    const mockValidationResult: ValidationResult = {
      isValid: false,
      errors: new Map([
        ['common.chiaveDescrittiva', [mockErrorChiave]],
        ['common.classificazione', [mockErrorClass]],
      ]),
    };

    fixture.componentRef.setInput('validationResult', mockValidationResult);
    fixture.detectChanges();

    const errChiaveEl = fixture.debugElement.query(By.css('#err-chiave'));
    const errClassEl = fixture.debugElement.query(By.css('#err-class'));

    expect(errChiaveEl).toBeTruthy();
    expect(errChiaveEl.nativeElement.textContent.trim()).toBe('Errore chiave');
    expect(errClassEl).toBeTruthy();
    expect(errClassEl.nativeElement.textContent.trim()).toBe('Errore classe');
  });
});
