import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { SimpleChange } from '@angular/core';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { CommonFiltersComponent } from './common-filters.component';
import { DocumentType } from '../../../../../../../../shared/metadata/search.enum';

describe('CommonFiltersComponent', () => {
  let component: CommonFiltersComponent;
  let fixture: ComponentFixture<CommonFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonFiltersComponent, ReactiveFormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(CommonFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dovrebbe istanziarsi correttamente con la struttura base annidata', () => {
    expect(component).toBeTruthy();
    expect(component.form.contains('chiaveDescrittiva')).toBe(true);
    expect(component.form.contains('classificazione')).toBe(true);
    expect(component.form.contains('conservazione')).toBe(true);
    expect(component.form.contains('note')).toBe(true);
    expect(component.form.contains('tipoDocumento')).toBe(true);
  });

  it('dovrebbe emettere filtersChanged quando un valore del form cambia dal DOM', async () => {
    const emitSpy = vi.spyOn(component.filtersChanged, 'emit');

    const noteInput = fixture.debugElement.query(By.css('input[formControlName="note"]'));
    noteInput.nativeElement.value = 'Test di nota';
    noteInput.nativeElement.dispatchEvent(new Event('input'));

    expect(emitSpy).toHaveBeenCalled();
    const emittedValue = emitSpy.mock.lastCall?.[0];
    expect(emittedValue?.note).toBe('Test di nota');
  });

  describe('ngOnChanges (Patching dei dati esterni)', () => {
    it('dovrebbe aggiornare i campi del form quando riceve nuovi filtri', () => {
      const mockFilters = {
        tipoDocumento: DocumentType.DOCUMENTO_INFORMATICO,
        note: 'Da verificare',
        classificazione: { codice: 'TIT.1', descrizione: 'Titolo I' },
      } as any;

      component.ngOnChanges({
        filters: new SimpleChange(null, mockFilters, true),
      });

      expect(component.form.get('tipoDocumento')?.value).toBe(DocumentType.DOCUMENTO_INFORMATICO);
      expect(component.form.get('note')?.value).toBe('Da verificare');
      expect(component.form.get('classificazione.codice')?.value).toBe('TIT.1');
    });

    it('non dovrebbe fallire se ngOnChanges non riceve il parametro filters', () => {
      expect(() => component.ngOnChanges({})).not.toThrow();
    });
  });

  describe('getError (Gestione Errori di Validazione)', () => {
    it("dovrebbe restituire l'errore corretto navigando il path annidato e stamparlo nell'HTML", async () => {
      fixture.componentRef.setInput('validationResult', {
        isValid: false,
        errors: new Map([
          [
            'common.chiaveDescrittiva.oggetto',
            [{ message: 'Oggetto obbligatorio', code: 'ERR_REQ', field: '' }],
          ],
        ]),
      });

      fixture.detectChanges();
      await fixture.whenStable();

      const error = component.getError('chiaveDescrittiva.oggetto');
      expect(error).toBeTruthy();
      expect(error?.message).toBe('Oggetto obbligatorio');

      const errorDiv = fixture.debugElement.query(By.css('div.validation-error'));
      expect(errorDiv).toBeTruthy();
      expect(errorDiv.nativeElement.textContent).toContain('Oggetto obbligatorio');
    });

    it("dovrebbe restituire undefined se l'errore non esiste o validationResult è null", () => {
      component.validationResult = null;
      expect(component.getError('note')).toBeUndefined();

      component.validationResult = { isValid: true, errors: new Map() };
      expect(component.getError('classificazione.codice')).toBeUndefined();
    });
  });
});
