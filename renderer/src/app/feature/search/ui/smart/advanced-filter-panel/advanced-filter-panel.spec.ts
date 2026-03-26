import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { By } from '@angular/platform-browser';

import { AdvancedFilterPanelComponent } from './advanced-filter-panel';
import {
  SearchFilters,
  ValidationResult,
  CommonFilterValues,
} from '../../../../../shared/domain/metadata';

describe('AdvancedFilterPanelComponent', () => {
  let component: AdvancedFilterPanelComponent;
  let fixture: ComponentFixture<AdvancedFilterPanelComponent>;
  let mockValidatorFn: any;

  const mockInitialFilters: SearchFilters = {
    common: {} as any,
    diDai: {} as any,
    aggregate: {} as any,
    customMeta: {} as any,
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

    // RIMOSSO: component.strategyRegistry = new Map();

    fixture.detectChanges();
  });

  // ... [MANTAINTIENI QUI TUTTI GLI ALTRI TEST CHE AVEVI GIÀ SCRITTO E CHE ERANO CORRETTI] ...

  // Aggiungi solo questo test specifico per verificare che il submit sia bloccato
  // anche se la validazione esterna (dal server) fallisce
  it('onSubmit() NON dovrebbe emettere se la validazione esterna ha trovato errori', () => {
    const emitSubmitSpy = vi.spyOn(component.filtersSubmit, 'emit');

    fixture.componentRef.setInput('externalValidation', { isValid: false, errors: new Map() });
    component.onSubmit();

    expect(emitSubmitSpy).not.toHaveBeenCalled();
  });
});
