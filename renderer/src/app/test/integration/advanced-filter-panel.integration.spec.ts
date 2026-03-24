import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { AdvancedFilterPanelComponent } from '../../feature/search/ui/smart/advanced-filter-panel/advanced-filter-panel';
import { CommonFiltersComponent } from '../../feature/search/ui/dumb/common-filters.component/common-filters.component';
import { DiDaiFiltersComponent } from '../../feature/search/ui/dumb/di-dai-filters.component/di-dai-filters.component';
import { AggregateFiltersComponent } from '../../feature/search/ui/dumb/aggregate-filters.component/aggregate-filters.component';
import { CustomMetaFiltersComponent } from '../../feature/search/ui/dumb/custom-meta-filters.component/custom-meta-filters.component';
import { SubjectFiltersComponent } from '../../feature/search/ui/dumb/subject-filters.component/subject-filters.component';

describe('AdvancedFilterPanelComponent - Test di Integrazione', () => {
  let component: AdvancedFilterPanelComponent;
  let fixture: ComponentFixture<AdvancedFilterPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        AdvancedFilterPanelComponent,
        CommonFiltersComponent,
        DiDaiFiltersComponent,
        AggregateFiltersComponent,
        CustomMetaFiltersComponent,
        SubjectFiltersComponent,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdvancedFilterPanelComponent);
    component = fixture.componentInstance;

    // Forniamo i dati minimi per far renderizzare il pannello espanso e attivare i figli
    component.filters = {
      common: {} as any,
      diDai: {} as any,
      aggregate: {} as any,
      customMeta: {} as any,
      subject: null,
    };
    component.validator = vi.fn().mockReturnValue({ isValid: true, errors: new Map() });
    component.strategyRegistry = new Map();

    // Inneschiamo il render dell'HTML
    fixture.detectChanges();
  });

  it('dovrebbe renderizzare fisicamente i componenti figli nel DOM', () => {
    const commonFiltersDebug = fixture.debugElement.query(By.directive(CommonFiltersComponent));
    const diDaiFiltersDebug = fixture.debugElement.query(By.directive(DiDaiFiltersComponent));

    // Conferma che i tag <app-common-filters> e <app-di-dai-filters> esistono
    expect(commonFiltersDebug).toBeTruthy();
    expect(diDaiFiltersDebug).toBeTruthy();
  });

  it('dovrebbe ricevere gli eventi dal figlio CommonFilters e aggiornare il form del genitore', () => {
    const commonFiltersDebug = fixture.debugElement.query(By.directive(CommonFiltersComponent));
    const commonComponent = commonFiltersDebug.componentInstance as CommonFiltersComponent;

    // 1. Simuliamo l'emissione di un dato dal figlio
    const mockCommonUpdate = { classificazione: 'RISERVATO' } as any;
    commonComponent.filtersChanged.emit(mockCommonUpdate);

    // 2. Verifichiamo che il dato sia "risalito" al padre aggiornando il FormGroup corretto
    expect(component.panelForm.value.common.classificazione).toBe('RISERVATO');
  });

  it('dovrebbe ricevere gli eventi dal figlio DiDaiFilters e aggiornare il form del genitore', () => {
    const diDaiFiltersDebug = fixture.debugElement.query(By.directive(DiDaiFiltersComponent));
    const diDaiComponent = diDaiFiltersDebug.componentInstance as DiDaiFiltersComponent;

    const mockDiDaiUpdate = { annoRegistro: 2024 } as any;
    diDaiComponent.filtersChanged.emit(mockDiDaiUpdate);

    expect(component.panelForm.value.diDai.annoRegistro).toBe(2024);
  });

  it('dovrebbe ricevere gli eventi dal figlio AggregateFilters e aggiornare il form del genitore', () => {
    const aggregateFiltersDebug = fixture.debugElement.query(
      By.directive(AggregateFiltersComponent),
    );
    expect(aggregateFiltersDebug).toBeTruthy();

    const aggregateComponent = aggregateFiltersDebug.componentInstance as AggregateFiltersComponent;

    const mockAggregateUpdate = { fascicolo: 'FAS-999' } as any;
    aggregateComponent.filtersChanged.emit(mockAggregateUpdate);

    expect(component.panelForm.value.aggregate.fascicolo).toBe('FAS-999');
  });

  it('dovrebbe ricevere gli eventi dal figlio CustomMetaFilters ed emettere i filtri aggiornati', () => {
    const customMetaDebug = fixture.debugElement.query(By.directive(CustomMetaFiltersComponent));
    expect(customMetaDebug).toBeTruthy();

    const customMetaComponent = customMetaDebug.componentInstance as CustomMetaFiltersComponent;
    const emitSpy = vi.spyOn(component.filtersChanged, 'emit');

    const mockEntries = [{ name: 'Fornitore', value: 'Acme Corp' }] as any;
    customMetaComponent.filtersChanged.emit(mockEntries);

    expect(emitSpy).toHaveBeenCalledTimes(1);
    expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ customMeta: mockEntries }));
  });

  it('dovrebbe ricevere gli eventi dal figlio SubjectFilters ed emettere i filtri aggiornati', () => {
    const subjectDebug = fixture.debugElement.query(By.directive(SubjectFiltersComponent));
    expect(subjectDebug).toBeTruthy();

    const subjectComponent = subjectDebug.componentInstance as SubjectFiltersComponent;
    const emitSpy = vi.spyOn(component.filtersChanged, 'emit');

    const mockSubject = { role: 'DESTINATARIO', type: 'PA', identifier: '01234567890' } as any;
    subjectComponent.filtersChanged.emit(mockSubject);

    expect(emitSpy).toHaveBeenCalledTimes(1);
    expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ subject: mockSubject }));
  });
});
