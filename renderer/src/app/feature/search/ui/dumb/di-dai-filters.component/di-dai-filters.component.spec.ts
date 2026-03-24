import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { DiDaiFiltersComponent } from './di-dai-filters.component';
import { DiDaiFilterValues, ValidationResult, ValidationError } from '../../../domain';

describe('DiDaiFiltersComponent', () => {
  let component: DiDaiFiltersComponent;
  let fixture: ComponentFixture<DiDaiFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiDaiFiltersComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DiDaiFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dovrebbe istanziare il form correttamente', () => {
    expect(component.form).toBeDefined();
  });

  it('ngOnChanges() dovrebbe aggiornare il form senza emettere eventi', () => {
    const emitSpy = vi.spyOn(component.filtersChanged, 'emit');
    // Usiamo unknown per aggirare i controlli TypeScript sui mock parziali
    const incomingFilters = {
      tipologiaRegistro: 'PROTOCOLLO',
      numeroRegistro: '123',
    } as unknown as DiDaiFilterValues;

    component.ngOnChanges({
      filters: new SimpleChange(null, incomingFilters, true),
    });

    expect(component.form.value.tipologiaRegistro).toBe('PROTOCOLLO');
    expect(component.form.value.numeroRegistro).toBe('123');
    expect(emitSpy).not.toHaveBeenCalled();
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

  it('ngOnDestroy() dovrebbe emettere sul subject destroy$ per evitare memory leak', () => {
    const nextSpy = vi.spyOn((component as any).destroy$, 'next');
    const completeSpy = vi.spyOn((component as any).destroy$, 'complete');

    component.ngOnDestroy();

    expect(nextSpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });

  it('dovrebbe mostrare i messaggi di errore nel template HTML (copertura rami *ngIf)', () => {
    const mockErrorTipo: ValidationError = {
      field: 'diDai.tipologiaRegistro',
      message: 'Errore tipologia',
      code: 'E1',
    };
    const mockErrorNum: ValidationError = {
      field: 'diDai.numeroRegistro',
      message: 'Errore numero',
      code: 'E2',
    };

    const mockValidationResult: ValidationResult = {
      isValid: false,
      errors: new Map([
        ['diDai.tipologiaRegistro', [mockErrorTipo]],
        ['diDai.numeroRegistro', [mockErrorNum]],
      ]),
    };

    // SetInput aggira NG0100
    fixture.componentRef.setInput('validationResult', mockValidationResult);
    fixture.detectChanges();

    const errTipoEl = fixture.debugElement.query(By.css('#err-tipo-reg'));
    const errNumEl = fixture.debugElement.query(By.css('#err-num-reg'));

    expect(errTipoEl).toBeTruthy();
    expect(errTipoEl.nativeElement.textContent.trim()).toBe('Errore tipologia');

    expect(errNumEl).toBeTruthy();
    expect(errNumEl.nativeElement.textContent.trim()).toBe('Errore numero');
  });
});
