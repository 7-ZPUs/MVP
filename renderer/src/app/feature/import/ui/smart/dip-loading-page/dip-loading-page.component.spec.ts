import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DipLoadingPageComponent } from './dip-loading-page.component';
import { ImportFacade } from '../../../services/import.facade';
import { ImportPhase } from '../../../domain/enums';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('DipLoadingPageComponent', () => {
  let component: DipLoadingPageComponent;
  let fixture: ComponentFixture<DipLoadingPageComponent>;

 const mockImportFacade = {
    phase: signal<ImportPhase>(ImportPhase.IDLE),
    selectedDocument: signal(null),
    loading: signal(false),
    rootNodes: signal([]), 
    treeNodes: signal([]),
    
    importState: {
      error: signal(null)
    },
    
    loadRootNodes: vi.fn(),
    selectDocument: vi.fn(),
    retryLoad: vi.fn(),
    isNodeExpanded: vi.fn().mockReturnValue(false),
    isNodeLoading: vi.fn().mockReturnValue(false),
    toggleNode: vi.fn()
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DipLoadingPageComponent],
      providers: [
        { provide: ImportFacade, useValue: mockImportFacade }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DipLoadingPageComponent);
    component = fixture.componentInstance;
  });

  it('dovrebbe mostrare il messaggio di caricamento quando la fase è LOADING', () => {
    mockImportFacade.phase.set(ImportPhase.LOADING);
    fixture.detectChanges();
    const statusBox = fixture.debugElement.query(By.css('[role="status"]'));
    expect(statusBox.nativeElement.textContent).toContain('Caricamento in corso…');
  });

  it('dovrebbe mostrare l\'anteprima quando la fase è READY', () => {
    mockImportFacade.phase.set(ImportPhase.READY);
    fixture.detectChanges();
    const preview = fixture.debugElement.query(By.css('app-document-preview'));
    expect(preview).not.toBeNull();
  });

  it('dovrebbe chiamare selectDocument sulla facade quando un nodo viene selezionato', () => {
    const mockNode = { id: '123', label: 'Test' } as any;
    component.onNodeSelected(mockNode);
    expect(mockImportFacade.selectDocument).toHaveBeenCalledWith(mockNode);
  });

  it('dovrebbe chiamare retryLoad al click sul bottone Riprova', () => {
    mockImportFacade.phase.set(ImportPhase.ERROR);
    fixture.detectChanges();
    const retryBtn = fixture.debugElement.query(By.css('.retry-btn'));
    retryBtn.triggerEventHandler('click', null);
    expect(mockImportFacade.retryLoad).toHaveBeenCalled();
  });
});