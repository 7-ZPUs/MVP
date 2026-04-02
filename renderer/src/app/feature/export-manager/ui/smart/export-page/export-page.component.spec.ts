import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExportPageComponent } from './export-page.component';
import { ExportFacade } from '../../../services/export.facade';
import { ImportFacade } from '../../../../import/services/import.facade';
import { ExportPhase, OutputContext } from '../../../domain/enums';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { ExportError, ExportResult } from '../../../domain/models';

describe('ExportPageComponent', () => {
  let component: ExportPageComponent;
  let fixture: ComponentFixture<ExportPageComponent>;
  
const mockExportFacade = {
    phase: signal<ExportPhase>(ExportPhase.IDLE),
    outputContext: signal<OutputContext | null>(null), // <--- QUI IL TRUCCO
    result: signal<ExportResult | null>(null),
    progress: signal<number>(0),
    error: signal<ExportError | null>(null),
    loading: signal<boolean>(false),
    exportDocument: vi.fn(),
    reset: vi.fn()
  };
  
  const mockImportFacade = {
    selectedDocument: signal(null)
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExportPageComponent],
      providers: [
        { provide: ExportFacade, useValue: mockExportFacade },
        { provide: ImportFacade, useValue: mockImportFacade }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExportPageComponent);
    component = fixture.componentInstance;
  });

  it('dovrebbe mostrare il progresso solo durante MULTI_EXPORT in fase loading', () => {
    // Simulo stato: Loading + Multi Export
    mockExportFacade.loading.set(true);
    mockExportFacade.outputContext.set(OutputContext.MULTI_EXPORT);
    
    fixture.detectChanges();
    
    const progressEl = fixture.debugElement.query(By.css('app-export-progress'));
    expect(progressEl).not.toBeNull();
  });

  it('dovrebbe chiamare exportDocument sulla Facade quando onExport viene attivato', () => {
    const mockNode = { label: 'doc.pdf' } as any;
    component.onExport([mockNode]);
    
    expect(mockExportFacade.exportDocument).toHaveBeenCalledWith(mockNode);
  });

  it('dovrebbe mostrare il risultato quando la fase non è IDLE o PROCESSING', () => {
    mockExportFacade.phase.set(ExportPhase.SUCCESS);
    mockExportFacade.result.set({ successCount: 1, outputContext: OutputContext.SINGLE_EXPORT } as any);
    
    fixture.detectChanges();
    
    const resultEl = fixture.debugElement.query(By.css('app-export-result'));
    expect(resultEl).not.toBeNull();
  });

  it('dovrebbe resettare la facade al click su retry', () => {
    // Simulo fase errore per far apparire il componente result
    mockExportFacade.phase.set(ExportPhase.ERROR);
    mockExportFacade.error.set({ message: 'Errore' } as any);
    fixture.detectChanges();

    const resultComponent = fixture.debugElement.query(By.css('app-export-result'));
    resultComponent.triggerEventHandler('retry', null);

    expect(mockExportFacade.reset).toHaveBeenCalled();
  });
});