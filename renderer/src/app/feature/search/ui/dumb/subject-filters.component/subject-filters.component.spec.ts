import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { SubjectFiltersComponent } from './subject-filters.component';
import { SubjectCriteria } from '../../../../../../../../shared/metadata';

describe('SubjectFiltersComponent (Wizard)', () => {
  let component: SubjectFiltersComponent;
  let fixture: ComponentFixture<SubjectFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubjectFiltersComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SubjectFiltersComponent);
    component = fixture.componentInstance;

    component.RoleType = {
      AUTORE: 'AUTORE',
      DESTINATARIO: 'DESTINATARIO',
      OPERATORE: 'OPERATORE',
    } as any;
    component.SubjType = { PAI: 'PAI', PAE: 'PAE', PG: 'PG', PF: 'PF' } as any;

    fixture.detectChanges();
  });

  it('dovrebbe partire allo step 1 con stato pulito', () => {
    expect(component.currentStep()).toBe(1);
    expect(component.selectedRole()).toBeNull();
  });

  it('dovrebbe chiamare setRole cliccando i bottoni dello step 1', () => {
    const setRoleSpy = vi.spyOn(component, 'setRole');

    const buttons = fixture.debugElement.queryAll(By.css('.btn-choice'));
    buttons[0].nativeElement.click();

    expect(setRoleSpy).toHaveBeenCalledWith('AUTORE');
  });

  it('dovrebbe chiamare setType cliccando i bottoni dello step 2', () => {
    component.currentStep.set(2);
    fixture.detectChanges();

    const setTypeSpy = vi.spyOn(component, 'setType');

    const buttons = fixture.debugElement.queryAll(By.css('.btn-choice'));
    buttons[1].nativeElement.click();

    expect(setTypeSpy).toHaveBeenCalledWith('PAE');
  });

  it('dovrebbe renderizzare il componente figlio e i bottoni di azione nello step 3', () => {
    component.selectedRole.set('AUTORE' as any);
    component.selectedType.set('PAE' as any);
    component.currentDetails.set({ test: 123 });
    component.currentStep.set(3);
    fixture.detectChanges();

    const childComponent = fixture.debugElement.query(By.css('app-subject-detail-form'));
    expect(childComponent).toBeTruthy();

    const prevSpy = vi.spyOn(component, 'prevStep');
    const resetSpy = vi.spyOn(component, 'reset');

    const actionButtons = fixture.debugElement.queryAll(By.css('.wizard-actions button'));

    actionButtons[0].nativeElement.click();
    expect(prevSpy).toHaveBeenCalled();

    actionButtons[1].nativeElement.click();
    expect(resetSpy).toHaveBeenCalled();
  });

  it('ngOnChanges() dovrebbe chiamare reset() quando resetCounter viene incrementato (non al primo avvio)', () => {
    const resetSpy = vi.spyOn(component, 'reset');

    component.ngOnChanges({
      resetCounter: new SimpleChange(0, 1, false),
    });

    expect(resetSpy).toHaveBeenCalled();
  });

  it('ngOnChanges() NON dovrebbe chiamare reset() al primo caricamento del componente (firstChange: true)', () => {
    const resetSpy = vi.spyOn(component, 'reset');

    component.ngOnChanges({
      resetCounter: new SimpleChange(undefined, 0, true),
    });

    expect(resetSpy).not.toHaveBeenCalled();
  });

  it('setRole() dovrebbe salvare il ruolo e passare allo step 2', () => {
    component.setRole('AUTORE' as any);
    expect(component.selectedRole()).toBe('AUTORE');
    expect(component.currentStep()).toBe(2);
  });

  it('setType() dovrebbe salvare il tipo, resettare i dettagli e passare allo step 3', () => {
    component.setRole('AUTORE' as any);
    component.currentDetails.set({ old: 'data' });
    component.setType('PAI' as any);

    expect(component.selectedType()).toBe('PAI');
    expect(component.currentDetails()).toBeNull();
    expect(component.currentStep()).toBe(3);
  });

  it('prevStep() e nextStep() dovrebbero scorrere gli step entro i limiti 1-3', () => {
    expect(component.currentStep()).toBe(1);
    component.prevStep();
    expect(component.currentStep()).toBe(1);

    component.nextStep();
    component.nextStep();
    expect(component.currentStep()).toBe(3);

    component.nextStep();
    expect(component.currentStep()).toBe(3);
  });

  it('reset() dovrebbe ripristinare tutto allo step 1', () => {
    component.setRole('AUTORE' as any);
    component.setType('PAI' as any);
    component.reset();

    expect(component.currentStep()).toBe(1);
    expect(component.selectedRole()).toBeNull();
    expect(component.selectedType()).toBeNull();
  });

  it('ngOnChanges() dovrebbe pre-popolare il wizard e saltare allo step 3 se riceve subject', () => {
    const mockSubject = {
      role: 'AUTORE',
      type: 'PAI',
      details: { codiceAmministrazione: 'A001' },
    } as unknown as SubjectCriteria;

    component.ngOnChanges({
      subject: new SimpleChange(null, mockSubject, true),
    });

    expect(component.selectedRole()).toBe('AUTORE');
    expect(component.selectedType()).toBe('PAI');
    expect(component.currentStep()).toBe(3);
    expect(component.currentDetails()).toEqual({ codiceAmministrazione: 'A001' });
  });

  it('onDetailsChanged() dovrebbe emettere il SubjectCriteria formattato in unione discriminata', () => {
    const emitSpy = vi.spyOn(component.subjectChanged, 'emit');

    component.selectedRole.set('AUTORE' as any);
    component.selectedType.set('PAI' as any);

    const mockDetails = { codiceAmministrazione: '123' };
    component.onDetailsChanged(mockDetails);

    expect(emitSpy).toHaveBeenCalledWith({
      role: 'AUTORE',
      type: 'PAI',
      details: mockDetails,
    });
  });

  it('onDetailsChanged() NON dovrebbe emettere se manca ruolo o tipo', () => {
    const emitSpy = vi.spyOn(component.subjectChanged, 'emit');
    component.selectedRole.set(null);
    component.onDetailsChanged({ data: '123' });
    expect(emitSpy).not.toHaveBeenCalled();
  });

  // --- FORZATURA COPERTURA HTML: STEP 1 (Riga 7) ---
  it('dovrebbe renderizzare lo Step 1 e coprire tutti i click sui ruoli', () => {
    component.currentStep.set(1);
    fixture.detectChanges(); // Forza Angular a stampare l'HTML dello step 1

    const buttons = fixture.debugElement.queryAll(By.css('.btn-choice'));
    expect(buttons.length).toBe(3); // Deve trovare i 3 bottoni del ruolo

    // Clicchiamo per attivare il binding (click) sull'HTML
    buttons[0].triggerEventHandler('click', null); // AUTORE
    buttons[1].triggerEventHandler('click', null); // DESTINATARIO
    buttons[2].triggerEventHandler('click', null); // OPERATORE
  });

  // --- FORZATURA COPERTURA HTML: STEP 2 (Righe 20-36) ---
  it('dovrebbe renderizzare lo Step 2 e coprire tutti i click sui tipi e indietro', () => {
    component.currentStep.set(2);
    fixture.detectChanges(); // Forza Angular a stampare l'HTML dello step 2

    const buttons = fixture.debugElement.queryAll(By.css('.btn-choice'));
    expect(buttons.length).toBe(4); // Deve trovare PAI, PAE, PG, PF

    // Clicchiamo per attivare il binding (click) sull'HTML
    buttons[0].triggerEventHandler('click', null);
    buttons[1].triggerEventHandler('click', null);
    buttons[2].triggerEventHandler('click', null);
    buttons[3].triggerEventHandler('click', null);

    // Clicchiamo il tasto indietro
    const backBtn = fixture.debugElement.query(By.css('.wizard-actions .btn-outline'));
    expect(backBtn).toBeTruthy();
    backBtn.triggerEventHandler('click', null);
  });

  // --- FORZATURA COPERTURA HTML: STEP 3 (Righe 41-55) ---
  it('dovrebbe renderizzare lo Step 3 e coprire le azioni finali e il binding del figlio', () => {
    component.currentStep.set(3);
    fixture.detectChanges(); // Forza Angular a stampare l'HTML dello step 3

    // 1. Copriamo l'evento (detailsChanged) emesso dal componente figlio
    const detailForm = fixture.debugElement.query(By.css('app-subject-detail-form'));
    expect(detailForm).toBeTruthy();
    detailForm.triggerEventHandler('detailsChanged', { test: 'ok' });

    // 2. Copriamo i due bottoni (click)
    const actionBtns = fixture.debugElement.queryAll(By.css('.wizard-actions button'));
    expect(actionBtns.length).toBe(2);

    actionBtns[0].triggerEventHandler('click', null); // Cambia Tipo
    actionBtns[1].triggerEventHandler('click', null); // Rimuovi Soggetto
  });
});
