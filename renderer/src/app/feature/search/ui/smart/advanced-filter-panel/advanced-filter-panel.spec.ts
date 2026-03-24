import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdvancedFilterPanelComponent } from './advanced-filter-panel';
import { SearchFilters, ValidationResult, CommonFilterValues } from '../../../domain';

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

    component.filters = { ...mockInitialFilters };
    component.validator = mockValidatorFn;
    component.strategyRegistry = new Map();

    fixture.detectChanges();
  });

  it('dovrebbe inizializzarsi in stato espanso e creare il form', () => {
    expect(component.isExpanded).toBe(true);
    expect(component.panelForm).toBeDefined();
  });

  it('togglePanel() dovrebbe invertire lo stato isExpanded', () => {
    component.togglePanel();
    expect(component.isExpanded).toBe(false);
    component.togglePanel();
    expect(component.isExpanded).toBe(true);
  });

  it('onCommonFiltersChanged() dovrebbe aggiornare il form, validare ed emettere filtersChanged', () => {
    const emitFiltersSpy = vi.spyOn(component.filtersChanged, 'emit');
    const emitValidationSpy = vi.spyOn(component.validationResult, 'emit');
    const newCommonFilters = { tipo: 'PDF' } as unknown as CommonFilterValues;

    component.onCommonFiltersChanged(newCommonFilters);

    expect(component.panelForm.value.common).toEqual(newCommonFilters);
    expect(mockValidatorFn).toHaveBeenCalledTimes(1);
    expect(emitValidationSpy).toHaveBeenCalledTimes(1);
    expect(emitFiltersSpy).toHaveBeenCalledTimes(1);
  });

  it('onDiDaiFiltersChanged() dovrebbe aggiornare il form locale', () => {
    const newFilters = { tipologiaRegistro: 'PROTOCOLLO' } as any;
    component.onDiDaiFiltersChanged(newFilters);
    expect(component.panelForm.value.diDai).toEqual(newFilters);
  });

  it('onAggregateFiltersChanged() dovrebbe aggiornare il form locale', () => {
    const newFilters = { fascicolo: '12345' } as any;
    component.onAggregateFiltersChanged(newFilters);
    expect(component.panelForm.value.aggregate).toEqual(newFilters);
  });

  it('onEntriesChanged() dovrebbe aggiornare i customMeta ed emettere i filtri completi', () => {
    const emitSpy = vi.spyOn(component.filtersChanged, 'emit');
    const newEntries = [{ name: 'Chiave', value: 'Valore' }] as any;

    component.onEntriesChanged(newEntries);

    expect(emitSpy).toHaveBeenCalledTimes(1);
    expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ customMeta: newEntries }));
  });

  it('onSubjectChanged() dovrebbe aggiornare il subject ed emettere i filtri completi', () => {
    const emitSpy = vi.spyOn(component.filtersChanged, 'emit');
    const newSubject = { role: 'PRODUTTORE', type: 'PAI' } as any;

    component.onSubjectChanged(newSubject);

    expect(emitSpy).toHaveBeenCalledTimes(1);
    expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ subject: newSubject }));
  });

  it('onFieldValidationError() dovrebbe eseguire senza lanciare eccezioni', () => {
    expect(() => component.onFieldValidationError('testField', null)).not.toThrow();
  });

  it('onSubmit() dovrebbe emettere i filtri finali solo se la validazione non blocca', () => {
    const emitSubmitSpy = vi.spyOn(component.filtersSubmit, 'emit');

    component.currentValidationResult = { isValid: true, errors: new Map() };
    component.onSubmit();

    expect(emitSubmitSpy).toHaveBeenCalledTimes(1);
  });

  it('onSubmit() NON dovrebbe emettere se la validazione locale ha trovato errori', () => {
    const emitSubmitSpy = vi.spyOn(component.filtersSubmit, 'emit');

    component.currentValidationResult = { isValid: false, errors: new Map() };
    component.onSubmit();

    expect(emitSubmitSpy).not.toHaveBeenCalled();
  });

  it('onReset() dovrebbe svuotare il form ed emettere filtersReset', () => {
    const emitResetSpy = vi.spyOn(component.filtersReset, 'emit');

    component.onReset();

    expect(emitResetSpy).toHaveBeenCalledTimes(1);
    expect(component.panelForm.value.common).toBeNull();
  });

  it('dovrebbe mostrare il banner di errore se externalValidation non è valido', () => {
    fixture.componentRef.setInput('externalValidation', { isValid: false, errors: new Map() });
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('.error-banner');
    expect(banner).toBeTruthy();
    expect(banner.textContent).toContain('i filtri contengono errori');
  });

  it('ngOnInit() dovrebbe usare oggetti vuoti di fallback se i filtri in input sono nulli (copertura rami || {})', () => {
    const fb = TestBed.inject(FormBuilder);
    const rawComponent = new AdvancedFilterPanelComponent(fb);

    rawComponent.filters = null as any;
    rawComponent.ngOnInit();

    expect(rawComponent.panelForm.value).toEqual({ common: {}, diDai: {}, aggregate: {} });
  });

  it('validateAndEmit() NON dovrebbe eseguire la validazione se il validator è assente (copertura ramo falso)', () => {
    const emitValidationSpy = vi.spyOn(component.validationResult, 'emit');

    component.validator = null as any;
    component.panelForm.patchValue({ common: { tipo: 'TEST' } });

    expect(emitValidationSpy).not.toHaveBeenCalled();
  });

  it('dovrebbe testare entrambi i casi del pulsante Espandi/Comprimi eseguendo un ciclo completo (copertura ternario HTML)', async () => {
    const headerDiv = fixture.nativeElement.querySelector('.panel-header');
    const toggleBtn = headerDiv.querySelector('button');

    expect(toggleBtn.textContent.trim()).toBe('Comprimi');

    headerDiv.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(toggleBtn.textContent.trim()).toBe('Espandi');

    headerDiv.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(toggleBtn.textContent.trim()).toBe('Comprimi');
  });

  it('dovrebbe disabilitare il pulsante submit se la validazione locale fallisce (copertura [disabled] HTML)', () => {
    const localFixture = TestBed.createComponent(AdvancedFilterPanelComponent);
    const localComponent = localFixture.componentInstance;

    localComponent.filters = {
      common: {} as any,
      diDai: {} as any,
      aggregate: {} as any,
      customMeta: {} as any,
      subject: null,
    };
    localComponent.validator = vi.fn();
    localComponent.strategyRegistry = new Map();
    localComponent.currentValidationResult = { isValid: false, errors: new Map() };
    localFixture.detectChanges();

    const submitBtn = localFixture.nativeElement.querySelector('button[type="submit"]');
    expect(submitBtn.disabled).toBe(true);
  });
});
