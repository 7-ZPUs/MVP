import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { SimpleChange } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { DiDaiFiltersComponent } from './di-dai-filters.component';
import { RegisterType, ModificationType } from '../../../../../shared/domain/metadata/search.enum';

describe('DiDaiFiltersComponent', () => {
  let component: DiDaiFiltersComponent;
  let fixture: ComponentFixture<DiDaiFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiDaiFiltersComponent, ReactiveFormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(DiDaiFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dovrebbe istanziarsi correttamente con la struttura base', () => {
    expect(component).toBeTruthy();
    expect(component.form.contains('registrazione')).toBe(true);
    expect(component.form.contains('identificativoFormato')).toBe(true);
    expect(component.form.contains('verifica')).toBe(true);
    expect(component.tracciatureFormArray.length).toBe(0);
  });

  it('dovrebbe emettere filtersChanged quando un valore del form cambia', async () => {
    const emitSpy = vi.spyOn(component.filtersChanged, 'emit');

    // Modifichiamo un campo base
    component.form.patchValue({ tipologia: 'Test Tipo' });

    // Verifichiamo che l'evento sia stato emesso con l'oggetto aggiornato
    expect(emitSpy).toHaveBeenCalled();
    const emittedValue = emitSpy.mock.lastCall?.[0];
    expect(emittedValue?.tipologia).toBe('Test Tipo');
  });

  describe('Gestione FormArray Tracciature', () => {
    it('dovrebbe aggiungere una nuova tracciatura vuota', () => {
      expect(component.tracciatureFormArray.length).toBe(0);

      component.addTracciatura();

      expect(component.tracciatureFormArray.length).toBe(1);
      expect(component.tracciatureFormArray.at(0).value).toEqual({
        tipoModifica: null,
        dataModifica: null,
        oraModifica: null,
        idVersionePrec: null,
      });
    });

    it('dovrebbe rimuovere una tracciatura esistente', () => {
      component.addTracciatura();
      component.addTracciatura();
      expect(component.tracciatureFormArray.length).toBe(2);

      component.removeTracciatura(0);

      expect(component.tracciatureFormArray.length).toBe(1);
    });
  });

  describe('ngOnChanges (Patching dei dati esterni)', () => {
    it("dovrebbe aggiornare i campi statici e ricostruire l'array tracciature", () => {
      const mockFilters = {
        tipologia: 'Bando',
        registrazione: { tipologiaRegistro: RegisterType.PROTOCOLLO },
        tracciatureModifiche: [
          { tipoModifica: ModificationType.INTEGRAZIONE, dataModifica: '2026-03-26' },
          { tipoModifica: ModificationType.ANNULLAMENTO, dataModifica: '2026-03-27' },
        ],
      } as any;

      component.ngOnChanges({
        filters: new SimpleChange(null, mockFilters, true),
      });

      // Verifica campi statici
      expect(component.form.get('tipologia')?.value).toBe('Bando');
      expect(component.form.get('registrazione.tipologiaRegistro')?.value).toBe(
        RegisterType.PROTOCOLLO,
      );

      // Verifica campi dinamici
      expect(component.tracciatureFormArray.length).toBe(2);
      expect(component.tracciatureFormArray.at(0).get('tipoModifica')?.value).toBe(
        ModificationType.INTEGRAZIONE,
      );
      expect(component.tracciatureFormArray.at(1).get('tipoModifica')?.value).toBe(
        ModificationType.ANNULLAMENTO,
      );
    });

    it('non dovrebbe fallire se ngOnChanges non riceve il parametro filters', () => {
      expect(() => component.ngOnChanges({})).not.toThrow();
    });

    it("dovrebbe svuotare l'array se i nuovi filtri non hanno tracciatureModifiche", () => {
      component.addTracciatura();
      expect(component.tracciatureFormArray.length).toBe(1);

      component.ngOnChanges({
        filters: new SimpleChange(null, { tipologia: 'Test' }, false),
      });

      expect(component.tracciatureFormArray.length).toBe(0);
    });
  });

  describe('getError (Gestione Errori di Validazione)', () => {
    it("dovrebbe restituire l'errore corretto navigando il path", () => {
      component.validationResult = {
        isValid: false,
        errors: new Map([
          [
            'diDai.registrazione.numeroRegistrazione',
            [{ message: 'Numero invalido', code: 'ERR_1', field: '' }],
          ],
        ]),
      };

      const error = component.getError('registrazione.numeroRegistrazione');
      expect(error).toBeTruthy();
      expect(error?.message).toBe('Numero invalido');
    });

    it("dovrebbe restituire undefined se l'errore non esiste o validationResult è null", () => {
      component.validationResult = null;
      expect(component.getError('campoInesistente')).toBeUndefined();

      component.validationResult = { isValid: true, errors: new Map() };
      expect(component.getError('registrazione.tipologiaFlusso')).toBeUndefined();
    });
  });

  it('dovrebbe innescare i metodi di tracciatura cliccando fisicamente i bottoni nel template HTML', async () => {
    const buttons = fixture.debugElement.queryAll(By.css('button'));
    const addBtn = buttons.find((b) => b.nativeElement.textContent.includes('+ Aggiungi'));

    expect(addBtn).toBeTruthy();
    addBtn?.triggerEventHandler('click', null);

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.tracciatureFormArray.length).toBe(1);

    const updatedButtons = fixture.debugElement.queryAll(By.css('button'));
    const removeBtn = updatedButtons.find((b) => b.nativeElement.textContent.includes('✕ Rimuovi'));

    expect(removeBtn).toBeTruthy();
    removeBtn?.triggerEventHandler('click', null);

    fixture.detectChanges();

    expect(component.tracciatureFormArray.length).toBe(0);
  });
});
