import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { SubjectFiltersComponent } from './subject-filters.component';
import { SubjectCriteria } from '../../../../../../../../shared/domain/metadata';

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
      ASSEGNATARIO: 'ASSEGNATARIO',
      REGISTRAZIONE: 'REGISTRAZIONE',
      ALTRO: 'ALTRO',
      RGD: 'RGD',
      RSP: 'RSP'
    } as any;
    component.SubjType = { PAI: 'PAI', PAE: 'PAE', PG: 'PG', PF: 'PF' } as any;

    fixture.detectChanges();
  });

  it('dovrebbe partire allo step 0 con stato pulito', () => {
    expect(component.currentStep()).toBe(0);
    expect(component.selectedRole()).toBeNull();
  });

  it('dovrebbe chiamare setRole cliccando i bottoni dello step 1', () => {
    component.currentStep.set(1);
    fixture.detectChanges();
    
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

  it('ngOnChanges() dovrebbe chiamare resetWizard() quando resetCounter viene incrementato', () => {
    const resetSpy = vi.spyOn(component, 'resetWizard');
    component.ngOnChanges({
      resetCounter: new SimpleChange(0, 1, false),
    });
    expect(resetSpy).toHaveBeenCalled();
  });

  it('ngOnChanges() NON dovrebbe chiamare resetWizard() al primo caricamento', () => {
    const resetSpy = vi.spyOn(component, 'resetWizard');
    component.ngOnChanges({
      resetCounter: new SimpleChange(undefined, 0, true),
    });
    expect(resetSpy).not.toHaveBeenCalled();
  });

  it('setRole() dovrebbe salvare il ruolo e passare allo step 2', () => {
    component.currentStep.set(1);
    component.setRole('AUTORE' as any);
    expect(component.selectedRole()).toBe('AUTORE');
    expect(component.currentStep()).toBe(2);
  });

  it('setType() dovrebbe salvare il tipo, resettare i dettagli e passare allo step 3', () => {
    component.currentStep.set(2);
    component.setRole('AUTORE' as any);
    component.currentDetails.set({ old: 'data' });
    component.setType('PAI' as any);

    expect(component.selectedType()).toBe('PAI');
    expect(component.currentDetails()).toBeNull();
    expect(component.currentStep()).toBe(3);
  });

  it('prevStep() e nextStep() dovrebbero scorrere gli step', () => {
    component.currentStep.set(1);
    
    component.prevStep();
    expect(component.currentStep()).toBe(1);

    component.nextStep();
    component.nextStep();
    expect(component.currentStep()).toBe(3);

    component.nextStep();
    expect(component.currentStep()).toBe(3);
  });

  it('resetWizard() dovrebbe ripristinare tutto allo step 0', () => {
    component.setRole('AUTORE' as any);
    component.setType('PAI' as any);
    component.resetWizard();

    expect(component.currentStep()).toBe(0);
    expect(component.selectedRole()).toBeNull();
    expect(component.selectedType()).toBeNull();
  });

  it('ngOnChanges() dovrebbe popolare subjectsList se riceve un array subject', () => {
    const mockSubject = [{
      role: 'AUTORE',
      type: 'PAI',
      details: { codiceAmministrazione: 'A001' },
    }] as unknown as SubjectCriteria[];

    component.ngOnChanges({
      subject: new SimpleChange(null, mockSubject, true),
    });

    expect(component.subjectsList()).toEqual(mockSubject);
  });

  it('onDetailsChanged() dovrebbe solo salvare i dati temporaneamente nel signal', () => {
    const mockDetails = { codiceAmministrazione: '123' };
    component.onDetailsChanged(mockDetails);
    
    expect(component.currentDetails()).toEqual(mockDetails);
  });

  it('addSubjectToList() dovrebbe emettere e aggiornare la lista se i dati sono completi', () => {
    const emitSpy = vi.spyOn(component.subjectChanged, 'emit');

    component.selectedRole.set('AUTORE' as any);
    component.selectedType.set('PAI' as any);
    const mockDetails = { codiceAmministrazione: '123' };
    component.currentDetails.set(mockDetails);

    component.addSubjectToList();

    expect(emitSpy).toHaveBeenCalled();
    expect(component.subjectsList().length).toBe(1);
    expect(component.subjectsList()[0].role).toBe('AUTORE');
    expect(component.subjectsList()[0].details).toEqual(mockDetails);
    expect(component.currentStep()).toBe(0); 
  });

  it('removeSubject() dovrebbe rimuovere l\'elemento e lanciare l\'evento', () => {
    const emitSpy = vi.spyOn(component.subjectChanged, 'emit');
    const mockList = [
      { role: 'AUTORE' },
      { role: 'DESTINATARIO' }
    ] as any[];
    
    component.subjectsList.set(mockList);
    component.removeSubject(0);

    expect(component.subjectsList().length).toBe(1);
    expect(component.subjectsList()[0].role).toBe('DESTINATARIO');
    expect(emitSpy).toHaveBeenCalledWith(component.subjectsList());
  });

  it('dovrebbe renderizzare lo Step 1 e coprire click e annulla', () => {
    component.currentStep.set(1);
    fixture.detectChanges();

    const buttons = fixture.debugElement.queryAll(By.css('.btn-choice'));
    expect(buttons.length).toBe(8);

    buttons[2].triggerEventHandler('click', null); 

    const actionBtns = fixture.debugElement.queryAll(By.css('.wizard-actions.step-1 button'));
    expect(actionBtns.length).toBe(1);
    actionBtns[0].triggerEventHandler('click', null);
  });

  it('dovrebbe renderizzare lo Step 2 e coprire click, indietro e annulla', () => {
    component.currentStep.set(2);
    fixture.detectChanges();

    const buttons = fixture.debugElement.queryAll(By.css('.btn-choice'));
    expect(buttons.length).toBe(4);

    buttons[1].triggerEventHandler('click', null);

    const actionBtns = fixture.debugElement.queryAll(By.css('.wizard-actions.step-2 button'));
    expect(actionBtns.length).toBe(2);
    actionBtns[0].triggerEventHandler('click', null);
    actionBtns[1].triggerEventHandler('click', null);
  });

  it('dovrebbe renderizzare lo Step 3 e coprire azioni e binding del figlio', () => {
    component.currentStep.set(3);
    component.currentDetails.set({ valid: true });
    fixture.detectChanges();

    const detailForm = fixture.debugElement.query(By.css('app-subject-detail-form'));
    expect(detailForm).toBeTruthy();
    detailForm.triggerEventHandler('detailsChanged', { test: 'ok' });

    const actionBtns = fixture.debugElement.queryAll(By.css('.wizard-actions.step-3 button'));
    expect(actionBtns.length).toBe(3);

    actionBtns[0].triggerEventHandler('click', null);
    actionBtns[1].triggerEventHandler('click', null);
    actionBtns[2].triggerEventHandler('click', null);
  });
});