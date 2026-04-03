import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DocumentActionsComponent } from './document-actions.component';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { By } from '@angular/platform-browser';

describe('DocumentActionsComponent', () => {
  let component: DocumentActionsComponent;
  let fixture: ComponentFixture<DocumentActionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentActionsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentActionsComponent);
    component = fixture.componentInstance;
  });

  it('dovrebbe creare il componente', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('dovrebbe avere i bottoni disabilitati se la selezione è vuota', () => {
    component.selectedDocuments = [];
    fixture.detectChanges();

    // Cerchiamo i bottoni per testo, visto che non hanno classi nel tuo TS
    const buttons = fixture.debugElement.queryAll(By.css('button'));
    const saveButton = buttons.find(b => b.nativeElement.textContent.includes('Salva'));
    
    expect(saveButton?.nativeElement.disabled).toBe(true);
  });

  it('dovrebbe abilitare i bottoni quando ci sono documenti selezionati', () => {
    component.selectedDocuments = [{ label: 'test.pdf' } as any];
    fixture.detectChanges();

    const buttons = fixture.debugElement.queryAll(By.css('button'));
    const saveButton = buttons.find(b => b.nativeElement.textContent.includes('Salva'));
    
    expect(saveButton?.nativeElement.disabled).toBe(false);
  });

  it('dovrebbe emettere exportClicked al click su Salva', () => {
    const mockDocs = [{ label: 'doc1.pdf' } as any];
    component.selectedDocuments = mockDocs;
    fixture.detectChanges();

    const spy = vi.spyOn(component.exportClicked, 'emit');
    const buttons = fixture.debugElement.queryAll(By.css('button'));
    const saveButton = buttons.find(b => b.nativeElement.textContent.includes('Salva'));
    
    saveButton?.triggerEventHandler('click', null);

    expect(spy).toHaveBeenCalledWith(mockDocs);
  });

it('NON dovrebbe mostrare il bottone Report PDF se reportId è null', () => {
    component.reportId = null;
    fixture.detectChanges();
    const buttons = fixture.debugElement.queryAll(By.css('button'));
    const reportBtn = buttons.find(b => b.nativeElement.textContent.includes('Esporta report PDF'));
    expect(reportBtn).toBeUndefined();
  });

  it('DOVREBBE mostrare il bottone Report PDF se reportId è presente', () => {
    component.reportId = '123';
    fixture.detectChanges();
    const buttons = fixture.debugElement.queryAll(By.css('button'));
    const reportBtn = buttons.find(b => b.nativeElement.textContent.includes('Esporta report PDF'));
    expect(reportBtn).toBeDefined();
  });
});