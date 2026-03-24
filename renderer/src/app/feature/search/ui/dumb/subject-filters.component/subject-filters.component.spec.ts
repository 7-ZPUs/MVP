import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { SubjectFiltersComponent } from './subject-filters.component';
import { SubjectDetailFormComponent } from '../subject-detail-form.component/subject-detail-form.component';
import { SubjectCriteria } from '../../../../../shared/domain/metadata';

// Mock Dummy per compilare l'enum se non disponibile a test time
enum MockRole {
  PRODUTTORE = 'PRODUTTORE',
}
enum MockType {
  PAI = 'PAI',
}

describe('SubjectFiltersComponent (Wizard)', () => {
  let component: SubjectFiltersComponent;
  let fixture: ComponentFixture<SubjectFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubjectFiltersComponent],
    })
      .overrideComponent(SubjectFiltersComponent, {
        remove: { imports: [SubjectDetailFormComponent] },
        add: { imports: [] }, // In un test unitario reale potresti mockare il figlio
      })
      .compileComponents();

    fixture = TestBed.createComponent(SubjectFiltersComponent);
    component = fixture.componentInstance;

    // Inietto Enum Mocks
    component.RoleType = MockRole as any;
    component.SubjType = MockType as any;

    fixture.detectChanges();
  });

  it('dovrebbe partire allo step 1 con stato pulito', () => {
    expect(component.currentStep()).toBe(1);
    expect(component.selectedRole()).toBeNull();
  });

  it('setRole() dovrebbe salvare il ruolo e passare allo step 2', () => {
    component.setRole(MockRole.PRODUTTORE as any);
    expect(component.selectedRole()).toBe(MockRole.PRODUTTORE);
    expect(component.currentStep()).toBe(2);
  });

  it('setType() dovrebbe salvare il tipo, resettare i dettagli e passare allo step 3', () => {
    component.currentDetails.set({ old: 'data' });
    component.setType(MockType.PAI as any);

    expect(component.selectedType()).toBe(MockType.PAI);
    expect(component.currentDetails()).toBeNull();
    expect(component.currentStep()).toBe(3);
  });

  it('prevStep() e nextStep() dovrebbero scorrere gli step entro i limiti 1-3', () => {
    expect(component.currentStep()).toBe(1);
    component.prevStep();
    expect(component.currentStep()).toBe(1); // Non scende sotto 1

    component.nextStep();
    component.nextStep();
    expect(component.currentStep()).toBe(3);

    component.nextStep();
    expect(component.currentStep()).toBe(3); // Non sale sopra 3
  });

  it('reset() dovrebbe ripristinare tutto allo step 1', () => {
    component.setRole(MockRole.PRODUTTORE as any);
    component.setType(MockType.PAI as any);
    component.reset();

    expect(component.currentStep()).toBe(1);
    expect(component.selectedRole()).toBeNull();
    expect(component.selectedType()).toBeNull();
  });

  it('ngOnChanges() dovrebbe pre-popolare il wizard e saltare allo step 3 se riceve subject', () => {
    const mockSubject = {
      role: MockRole.PRODUTTORE,
      type: MockType.PAI,
      details: { codiceAmministrazione: 'A001' },
    } as unknown as SubjectCriteria;

    component.ngOnChanges({
      subject: new SimpleChange(null, mockSubject, true),
    });

    expect(component.selectedRole()).toBe(MockRole.PRODUTTORE);
    expect(component.selectedType()).toBe(MockType.PAI);
    expect(component.currentStep()).toBe(3);
    expect(component.currentDetails()).toEqual({ codiceAmministrazione: 'A001' });
  });

  it('onDetailsChanged() dovrebbe emettere il SubjectCriteria formattato in unione discriminata', () => {
    const emitSpy = vi.spyOn(component.subjectChanged, 'emit');

    component.selectedRole.set(MockRole.PRODUTTORE as any);
    component.selectedType.set(MockType.PAI as any);

    const mockDetails = { codiceAmministrazione: '123' };
    component.onDetailsChanged(mockDetails);

    expect(emitSpy).toHaveBeenCalledWith({
      role: MockRole.PRODUTTORE,
      type: MockType.PAI,
      details: mockDetails,
    });
  });

  it('onDetailsChanged() NON dovrebbe emettere se manca ruolo o tipo', () => {
    const emitSpy = vi.spyOn(component.subjectChanged, 'emit');
    component.selectedRole.set(null); // Ruolo mancante
    component.onDetailsChanged({ data: '123' });
    expect(emitSpy).not.toHaveBeenCalled();
  });
});
