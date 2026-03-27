import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { AdvancedFilterPanelComponent } from './advanced-filter-panel';
import { SearchFilters, ValidationResult } from '../../../../../../../../shared/metadata';

describe('AdvancedFilterPanelComponent', () => {
  let component: AdvancedFilterPanelComponent;
  let fixture: ComponentFixture<AdvancedFilterPanelComponent>;
  let mockValidatorFn: any;

  const mockInitialFilters: SearchFilters = {
    common: {} as any,
    diDai: {} as any,
    aggregate: {} as any,
    customMeta: [] as any,
    subject: null,
  };

  beforeEach(async () => {
    mockValidatorFn = vi
      .fn()
      .mockReturnValue({ isValid: true, errors: new Map() } as ValidationResult);

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, AdvancedFilterPanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdvancedFilterPanelComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('filters', { ...mockInitialFilters });
    fixture.componentRef.setInput('validator', mockValidatorFn);

    fixture.detectChanges();
  });

  it('dovrebbe inizializzarsi in stato espanso e creare il form', () => {
    expect(component.isExpanded).toBe(true);
    expect(component.panelForm).toBeDefined();
  });

  describe('Interazione con i componenti figli (Eventi DOM HTML)', () => {
    it('dovrebbe intercettare onEntriesChanged da app-custom-meta-filters (HTML righe 39-40)', () => {
      const emitSpy = vi.spyOn(component.filtersChanged, 'emit');
      const child = fixture.debugElement.query(By.css('app-custom-meta-filters'));
      const mockEntries = [{ key: 'campo', value: 'valore' }] as any;

      child.triggerEventHandler('filtersChanged', mockEntries);

      expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ customMeta: mockEntries }));
    });

    it('dovrebbe intercettare onSubjectChanged da app-subject-filters', () => {
      const emitSpy = vi.spyOn(component.filtersChanged, 'emit');
      const child = fixture.debugElement.query(By.css('app-subject-filters'));
      const mockSubject = { role: 'Mittente', type: 'PF' } as any;

      child.triggerEventHandler('subjectChanged', mockSubject);

      expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ subject: mockSubject }));
    });
  });

  describe('Submit e Disabilitazione Bottone', () => {
    it('onSubmit() NON dovrebbe emettere se la validazione esterna ha trovato errori', () => {
      const emitSubmitSpy = vi.spyOn(component.filtersSubmit, 'emit');
      fixture.componentRef.setInput('externalValidation', { isValid: false, errors: new Map() });

      component.onSubmit();
      expect(emitSubmitSpy).not.toHaveBeenCalled();
    });

    it('dovrebbe disabilitare il bottone Applica se currentValidationResult è invalido (HTML riga 104)', () => {
      // 1. Disconnettiamo il componente dal motore globale per bloccare il "fuoco amico" dei figli
      const cdr = fixture.debugElement.injector.get(ChangeDetectorRef);
      cdr.detach();

      // 2. Impostiamo la variabile in totale sicurezza
      component.currentValidationResult = { isValid: false, errors: new Map() };

      // 3. Forziamo il disegno locale solo per questo componente
      cdr.detectChanges();

      // 4. Verifichiamo il bottone
      const submitBtn = fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement;
      expect(submitBtn.disabled).toBe(true);

      // 5. Riattacchiamo per pulizia
      cdr.reattach();
    });

    it('dovrebbe emettere filtersSubmit se non ci sono errori e si preme Applica (TS riga 100)', () => {
      const cdr = fixture.debugElement.injector.get(ChangeDetectorRef);
      cdr.detach(); // Isoliamo il componente

      const emitSubmitSpy = vi.spyOn(component.filtersSubmit, 'emit');

      component.currentValidationResult = { isValid: true, errors: new Map() };
      component.externalValidation = null;

      cdr.detectChanges(); // Disegno locale

      const form = fixture.debugElement.query(By.css('form'));
      form.triggerEventHandler('ngSubmit', null);

      expect(emitSubmitSpy).toHaveBeenCalled();

      cdr.reattach();
    });
  });

  describe('Logica Reattiva (validateAndEmit)', () => {
    it('dovrebbe chiamare validateAndEmit al variare del form, aggiornando validationResult e filtersChanged (TS 108-120)', () => {
      const emitValidationSpy = vi.spyOn(component.validationResult, 'emit');
      const emitFiltersSpy = vi.spyOn(component.filtersChanged, 'emit');

      component.panelForm.patchValue({ common: { testo: 'prova reattività' } });

      expect(mockValidatorFn).toHaveBeenCalled();
      expect(emitValidationSpy).toHaveBeenCalled();

      expect(emitFiltersSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          common: expect.objectContaining({ testo: 'prova reattività' }),
        }),
      );
    });
  });

  describe('Altre Funzioni Base', () => {
    it('dovrebbe resettare il form e il validationResult con onReset', () => {
      const emitResetSpy = vi.spyOn(component.filtersReset, 'emit');
      component.currentValidationResult = { isValid: false, errors: new Map() };

      component.onReset();

      expect(component.currentValidationResult).toBeNull();
      expect(emitResetSpy).toHaveBeenCalled();
    });

    it('dovrebbe gestire i toggle del pannello', () => {
      component.isExpanded = true;
      component.togglePanel();
      expect(component.isExpanded).toBe(false);
    });
  });
});
