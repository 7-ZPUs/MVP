import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { SimpleChange } from '@angular/core';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { AggregateFiltersComponent } from './aggregate-filters.component';
import {
  AggregationType,
  ProcedimentoFaseType,
} from '../../../../../../../../shared/metadata/search.enum';

describe('AggregateFiltersComponent', () => {
  let component: AggregateFiltersComponent;
  let fixture: ComponentFixture<AggregateFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AggregateFiltersComponent, ReactiveFormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(AggregateFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dovrebbe istanziarsi con la struttura gerarchica corretta e array vuoto', () => {
    expect(component).toBeTruthy();
    expect(component.form.contains('procedimento')).toBe(true);
    expect(component.form.contains('assegnazione')).toBe(true);
    expect(component.fasiFormArray.length).toBe(0);
  });

  it('dovrebbe emettere filtersChanged quando il form cambia', async () => {
    const emitSpy = vi.spyOn(component.filtersChanged, 'emit');

    // Modifichiamo un campo base
    component.form.patchValue({ idAggregazione: 'AGG-001' });

    expect(emitSpy).toHaveBeenCalled();
    const emitted = emitSpy.mock.lastCall?.[0];
    expect(emitted?.idAggregazione).toBe('AGG-001');
  });

  describe('Gestione Fasi (FormArray)', () => {
    it('dovrebbe aggiungere e rimuovere fasi correttamente', () => {
      component.addFase();
      expect(component.fasiFormArray.length).toBe(1);
      expect(component.fasiFormArray.at(0).get('tipoFase')).toBeDefined();

      component.removeFase(0);
      expect(component.fasiFormArray.length).toBe(0);
    });

    it('dovrebbe innescare add/remove tramite i bottoni HTML per la copertura', async () => {
      // 1. Click su Aggiungi
      const addBtn = fixture.debugElement.query(By.css('button[type="button"]'));
      addBtn.triggerEventHandler('click', null);
      fixture.detectChanges();

      expect(component.fasiFormArray.length).toBe(1);

      const removeBtn = fixture.debugElement.query(By.css('button[style*="color: #dc2626"]'));
      removeBtn.triggerEventHandler('click', null);
      fixture.detectChanges();

      expect(component.fasiFormArray.length).toBe(0);
    });
  });

  describe('ngOnChanges (Integrazione Dati)', () => {
    it('dovrebbe aggiornare i campi annidati e ricostruire le fasi', () => {
      const mockFilters = {
        tipoAggregazione: AggregationType.FASCICOLO,
        procedimento: {
          materia: 'Ambiente',
          fasi: [{ tipoFase: ProcedimentoFaseType.ISTRUTTORIA, dataInizioFase: '2026-01-01' }],
        },
      } as any;

      component.ngOnChanges({
        filters: new SimpleChange(null, mockFilters, true),
      });

      expect(component.form.get('tipoAggregazione')?.value).toBe(AggregationType.FASCICOLO);
      expect(component.form.get('procedimento.materia')?.value).toBe('Ambiente');
      expect(component.fasiFormArray.length).toBe(1);
    });

    it('dovrebbe ignorare cambiamenti se filters non è presente o nullo', () => {
      const patchSpy = vi.spyOn(component.form, 'patchValue');
      component.ngOnChanges({});
      expect(patchSpy).not.toHaveBeenCalled();
    });
  });

  describe('getError & Visualizzazione Errori', () => {
    it("dovrebbe restituire l'errore corretto per un path annidato", () => {
      component.validationResult = {
        isValid: false,
        errors: new Map([
          [
            'aggregate.procedimento.URICatalogo',
            [{ message: 'URI non valido', code: 'E1', field: '' }],
          ],
        ]),
      };

      const error = component.getError('procedimento.URICatalogo');
      expect(error?.message).toBe('URI non valido');
    });

    it('non dovrebbe causare ExpressionChangedAfterItHasBeenCheckedError usando setInput', async () => {
      fixture.componentRef.setInput('validationResult', {
        isValid: false,
        errors: new Map([
          ['aggregate.idAggregazione', [{ message: 'Campo obbligatorio', code: 'REQ', field: '' }]],
        ]),
      });

      expect(() => fixture.detectChanges()).not.toThrow();
    });
  });

  it('ngOnDestroy() deve pulire le sottoscrizioni', () => {
    const nextSpy = vi.spyOn((component as any).destroy$, 'next');
    const completeSpy = vi.spyOn((component as any).destroy$, 'complete');

    component.ngOnDestroy();

    expect(nextSpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });
});
