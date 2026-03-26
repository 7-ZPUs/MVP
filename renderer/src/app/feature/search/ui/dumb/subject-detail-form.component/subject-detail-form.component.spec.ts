import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { SubjectDetailFormComponent } from './subject-detail-form.component';
import { SubjectType } from '../../../../../shared/domain/metadata/search.enum';

describe('SubjectDetailFormComponent', () => {
  let component: SubjectDetailFormComponent;
  let fixture: ComponentFixture<SubjectDetailFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubjectDetailFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SubjectDetailFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dovrebbe creare il componente', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnDestroy() dovrebbe completare il subject destroy$ per evitare memory leak', () => {
    const nextSpy = vi.spyOn((component as any).destroy$, 'next');
    const completeSpy = vi.spyOn((component as any).destroy$, 'complete');

    component.ngOnDestroy();

    expect(nextSpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });

  it('ngOnChanges() dovrebbe ricostruire il form per SubjectType.PAI con i campi corretti', () => {
    component.subjectType = SubjectType.PAI;

    component.ngOnChanges({
      subjectType: new SimpleChange(null, SubjectType.PAI, true),
    });

    expect(component.fields.length).toBe(2);
    expect(component.fields[0].key).toBe('denominazione');
    expect(component.form.contains('denominazione')).toBe(true);
    expect(component.form.contains('codiceIPA')).toBe(true);
  });

  it('ngOnChanges() dovrebbe ricostruire il form per SubjectType.PF applicando i validatori required', () => {
    component.subjectType = SubjectType.PF;

    component.ngOnChanges({
      subjectType: new SimpleChange(null, SubjectType.PF, true),
    });

    expect(component.fields.length).toBe(2);
    expect(component.form.contains('cognomePF')).toBe(true);

    const cognomeCtrl = component.form.get('cognomePF');
    expect(cognomeCtrl?.valid).toBe(false); // Inizialmente invalido perché vuoto

    cognomeCtrl?.setValue('Rossi');
    expect(cognomeCtrl?.valid).toBe(true); // Valido dopo aver inserito testo
  });

  it('ngOnChanges() dovrebbe usare i campi di fallback per tipi non mappati esplicitamente', () => {
    component.subjectType = SubjectType.SW;

    component.ngOnChanges({
      subjectType: new SimpleChange(null, SubjectType.SW, true),
    });

    expect(component.fields.length).toBe(1);
    expect(component.fields[0].key).toBe('identificativo');
    expect(component.form.contains('identificativo')).toBe(true);
  });

  it('ngOnChanges() dovrebbe patchare i details senza emettere eventi se i controlli esistono', () => {
    component.subjectType = SubjectType.PAI;
    component.ngOnChanges({
      subjectType: new SimpleChange(null, SubjectType.PAI, true),
    });

    const mockDetails = { denominazione: 'Ministero Test' } as any;
    const emitSpy = vi.spyOn(component.detailsChanged, 'emit');

    component.ngOnChanges({
      details: new SimpleChange(null, mockDetails, true),
    });

    // Verifica che il form sia stato aggiornato ma nessun evento emesso (emitEvent: false)
    expect(component.form.value.denominazione).toBe('Ministero Test');
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('dovrebbe emettere detailsChanged quando il form appena ricostruito cambia', () => {
    component.subjectType = SubjectType.PAI;
    component.ngOnChanges({
      subjectType: new SimpleChange(null, SubjectType.PAI, true),
    });

    const emitSpy = vi.spyOn(component.detailsChanged, 'emit');

    component.form.patchValue({ codiceIPA: '12345' });

    expect(emitSpy).toHaveBeenCalledTimes(1);
    expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ codiceIPA: '12345' }));
  });
});
