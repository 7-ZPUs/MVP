import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { CustomMetaFiltersComponent } from './custom-meta-filters.component';
import { ValidationResult, ValidationError } from '../../../domain';

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

  it('dovrebbe istanziare un form array vuoto', () => {
    expect(component.entries.length).toBe(0);
  });

  it('addEntry() dovrebbe aggiungere una riga al FormArray', () => {
    component.addEntry();
    expect(component.entries.length).toBe(1);
    expect(component.entries.at(0).value).toEqual({ name: '', value: '' });
  });

  it('removeEntry() dovrebbe rimuovere la riga specificata', () => {
    component.addEntry();
    component.addEntry();
    expect(component.entries.length).toBe(2);

    component.removeEntry(0);
    expect(component.entries.length).toBe(1);
  });

  it('ngOnChanges() dovrebbe sincronizzare il FormArray con i nuovi filtri senza emettere', () => {
    const emitSpy = vi.spyOn(component.filtersChanged, 'emit');
    const incomingFilters = [{ name: 'Chiave1', value: 'Valore1' }] as any;

    component.ngOnChanges({
      filters: new SimpleChange(null, incomingFilters, true),
    });

    expect(component.entries.length).toBe(1);
    expect(component.entries.at(0).value).toEqual({ name: 'Chiave1', value: 'Valore1' });
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('ngOnChanges() dovrebbe gestire in sicurezza input nulli o non array', () => {
    component.addEntry(); // Partiamo con un elemento

    component.ngOnChanges({
      filters: new SimpleChange(null, null, true), // Passiamo null
    });

    // Deve svuotare l'array in modo sicuro
    expect(component.entries.length).toBe(0);
  });

  it("dovrebbe mostrare i messaggi di errore HTML dinamici basati sull'indice", () => {
    component.addEntry(); // Aggiungiamo l'indice 0

    const mockError: ValidationError = {
      field: 'customMeta[0].name',
      message: 'Chiave non valida',
      code: 'E1',
    };
    const mockValidationResult: ValidationResult = {
      isValid: false,
      errors: new Map([['customMeta[0].name', [mockError]]]),
    };

    fixture.componentRef.setInput('validationResult', mockValidationResult);
    fixture.detectChanges();

    const errEl = fixture.debugElement.query(By.css('.validation-error'));
    expect(errEl).toBeTruthy();
    expect(errEl.nativeElement.textContent.trim()).toBe('Chiave non valida');
  });

  it('ngOnDestroy() dovrebbe emettere sul subject destroy$ per evitare memory leak', () => {
    const nextSpy = vi.spyOn((component as any).destroy$, 'next');
    const completeSpy = vi.spyOn((component as any).destroy$, 'complete');

    component.ngOnDestroy();

    expect(nextSpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });
});
