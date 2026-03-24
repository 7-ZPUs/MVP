import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { AggregateFiltersComponent } from './aggregate-filters.component';
import { AggregateFilterValues, ValidationResult, ValidationError } from '../../../domain';

describe('AggregateFiltersComponent', () => {
  let component: AggregateFiltersComponent;
  let fixture: ComponentFixture<AggregateFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AggregateFiltersComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AggregateFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dovrebbe istanziare il form correttamente', () => {
    expect(component.form).toBeDefined();
    expect(component.form.value).toEqual({
      fascicolo: null,
      volume: null,
      serie: null,
    });
  });

  it('ngOnChanges() dovrebbe aggiornare il form senza emettere eventi', () => {
    const emitSpy = vi.spyOn(component.filtersChanged, 'emit');
    const incomingFilters = {
      fascicolo: 'FAS-123',
      volume: 'VOL-1',
    } as unknown as AggregateFilterValues;

    component.ngOnChanges({
      filters: new SimpleChange(null, incomingFilters, true),
    });

    expect(component.form.value.fascicolo).toBe('FAS-123');
    expect(component.form.value.volume).toBe('VOL-1');
    expect(emitSpy).not.toHaveBeenCalled();
  });

  // --- COPERTURA TS: 39-40 ---
  it('dovrebbe emettere i nuovi valori quando il form cambia (copertura valueChanges)', () => {
    const emitSpy = vi.spyOn(component.filtersChanged, 'emit');

    component.form.patchValue({ fascicolo: 'NUOVO-FASCICOLO' });

    expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ fascicolo: 'NUOVO-FASCICOLO' }));
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
    const mockErrorFascicolo: ValidationError = {
      field: 'aggregate.fascicolo',
      message: 'Errore fascicolo',
      code: 'E1',
    };

    const mockValidationResult: ValidationResult = {
      isValid: false,
      errors: new Map([['aggregate.fascicolo', [mockErrorFascicolo]]]),
    };

    fixture.componentRef.setInput('validationResult', mockValidationResult);
    fixture.detectChanges();

    const errFascicoloEl = fixture.debugElement.query(By.css('#err-fascicolo'));

    expect(errFascicoloEl).toBeTruthy();
    expect(errFascicoloEl.nativeElement.textContent.trim()).toBe('Errore fascicolo');
  });

  it('dovrebbe mostrare i messaggi di errore nel template HTML (copertura rami *ngIf e aria-describedby)', () => {
    const mockErrorFascicolo: ValidationError = {
      field: 'aggregate.fascicolo',
      message: 'Errore fascicolo',
      code: 'E1',
    };
    const mockErrorVolume: ValidationError = {
      field: 'aggregate.volume',
      message: 'Errore volume',
      code: 'E2',
    };
    const mockErrorSerie: ValidationError = {
      field: 'aggregate.serie',
      message: 'Errore serie',
      code: 'E3',
    };

    const mockValidationResult: ValidationResult = {
      isValid: false,
      errors: new Map([
        ['aggregate.fascicolo', [mockErrorFascicolo]],
        ['aggregate.volume', [mockErrorVolume]],
        ['aggregate.serie', [mockErrorSerie]],
      ]),
    };

    fixture.componentRef.setInput('validationResult', mockValidationResult);
    fixture.detectChanges();

    const errFascicoloEl = fixture.debugElement.query(By.css('#err-fascicolo'));
    const errVolumeEl = fixture.debugElement.query(By.css('#err-volume'));
    const errSerieEl = fixture.debugElement.query(By.css('#err-serie'));

    expect(errFascicoloEl).toBeTruthy();
    expect(errFascicoloEl.nativeElement.textContent.trim()).toBe('Errore fascicolo');

    expect(errVolumeEl).toBeTruthy();
    expect(errVolumeEl.nativeElement.textContent.trim()).toBe('Errore volume');

    expect(errSerieEl).toBeTruthy();
    expect(errSerieEl.nativeElement.textContent.trim()).toBe('Errore serie');
  });
});
