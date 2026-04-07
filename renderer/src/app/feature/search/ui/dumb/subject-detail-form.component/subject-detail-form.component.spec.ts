import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { SimpleChange } from '@angular/core';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { SubjectDetailFormComponent } from './subject-detail-form.component';
import { SubjectType } from '../../../../../../../../shared/domain/metadata/subject.enum';

describe('SubjectDetailFormComponent', () => {
  let component: SubjectDetailFormComponent;
  let fixture: ComponentFixture<SubjectDetailFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubjectDetailFormComponent, ReactiveFormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(SubjectDetailFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dovrebbe nascere vuoto e mostrare il messaggio di fallback', () => {
    expect(component).toBeTruthy();
    expect(component.fields.length).toBe(0);

    const renderedText = fixture.nativeElement.textContent;
    expect(renderedText).toContain('Seleziona una tipologia');
  });

  describe('Ricostruzione Dinamica (Strategy Pattern)', () => {
    it('dovrebbe ricostruire il form e stampare gli input corretti per Persona Fisica (PF)', async () => {
      fixture.componentRef.setInput('subjectType', SubjectType.PF);

      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.fields.length).toBe(3);
      expect(component.form.contains('cognomePF')).toBe(true);
      expect(component.form.contains('nomePF')).toBe(true);

      const inputs = fixture.debugElement.queryAll(By.css('input[type="text"]'));
      expect(inputs.length).toBe(3);
    });

    it('dovrebbe applicare il validatore required solo ai campi obbligatori', async () => {
      fixture.componentRef.setInput('subjectType', SubjectType.PF);

      fixture.detectChanges();
      await fixture.whenStable();

      const cognomeControl = component.form.get('cognomePF');
      expect(cognomeControl?.hasValidator).toBeTruthy();

      expect(cognomeControl?.invalid).toBe(true);
    });
  });

  describe('Patching dei Dati', () => {
    it('dovrebbe valorizzare il form quando arrivano details esterni', () => {
      component.ngOnChanges({
        subjectType: new SimpleChange(null, SubjectType.PF, true),
      });

      component.ngOnChanges({
        details: new SimpleChange(null, { cognomePF: 'Rossi', nomePF: 'Mario' }, true),
      });

      expect(component.form.value.cognomePF).toBe('Rossi');
      expect(component.form.value.nomePF).toBe('Mario');
    });

    it('non dovrebbe fallire se arrivano details prima che il form sia costruito', () => {
      expect(() => {
        component.ngOnChanges({
          details: new SimpleChange(null, { cognomePF: 'Rossi' }, true),
        });
      }).not.toThrow();
    });
  });

  describe('Emissione Eventi', () => {
    it('dovrebbe emettere detailsChanged quando un utente compila il form', () => {
      const emitSpy = vi.spyOn(component.detailsChanged, 'emit');

      component.ngOnChanges({
        subjectType: new SimpleChange(null, SubjectType.PF, true),
      });

      // Simuliamo la digitazione
      component.form.patchValue({ cognomePF: 'Bianchi' });

      expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ cognomePF: 'Bianchi' }));
    });
  });

  it('ngOnDestroy() deve pulire le sottoscrizioni per evitare memory leak', () => {
    const nextSpy = vi.spyOn((component as any).destroy$, 'next');
    const completeSpy = vi.spyOn((component as any).destroy$, 'complete');

    component.ngOnDestroy();

    expect(nextSpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });
});
