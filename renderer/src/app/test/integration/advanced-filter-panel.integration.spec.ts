import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { AdvancedFilterPanelComponent } from '../../feature/search/ui/smart/advanced-filter-panel/advanced-filter-panel'; // Aggiusta il percorso se serve
import { CommonFiltersComponent } from '../../feature/search/ui/dumb/common-filters.component/common-filters.component';
import { DiDaiFiltersComponent } from '../../feature/search/ui/dumb/di-dai-filters.component/di-dai-filters.component';

describe('AdvancedFilterPanelComponent - Test di Integrazione', () => {
  let component: AdvancedFilterPanelComponent;
  let fixture: ComponentFixture<AdvancedFilterPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // Importiamo i componenti VERI per testare il cablaggio reale, senza mock
      imports: [
        ReactiveFormsModule,
        AdvancedFilterPanelComponent,
        CommonFiltersComponent,
        DiDaiFiltersComponent,
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

    // 1. Simuliamo l'emissione di un dato dal figlio
    const mockDiDaiUpdate = { annoRegistro: 2024 } as any;
    diDaiComponent.filtersChanged.emit(mockDiDaiUpdate);

    // 2. Verifichiamo il cablaggio sul padre
    expect(component.panelForm.value.diDai.annoRegistro).toBe(2024);
  });
});
