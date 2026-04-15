import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DocumentActionsComponent } from './document-actions.component';
import { OUTPUT_FACADE_TOKEN } from '../../../../../shared/interfaces/output.interfaces';
import { INTEGRITY_FACADE_TOKEN } from '../../../../../shared/interfaces/integrity.interfaces';
import { ExportPageComponent } from '../../../../export-manager/ui/smart/export-page/export-page.component';
import { Component, signal, input } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';

@Component({
  selector: 'app-export-page',
  standalone: true,
  template: '<div>Mock Export Page</div>',
})
class MockExportPageComponent {
  documentId = input<string>();
}

describe('DocumentActionsComponent', () => {
  let component: DocumentActionsComponent;
  let fixture: ComponentFixture<DocumentActionsComponent>;
  let mockOutputFacade: any;
  let mockIntegrityFacade: any;

  beforeEach(async () => {
    mockOutputFacade = {
      exportPdf: vi.fn(),
      print: vi.fn(),
    };

    mockIntegrityFacade = {
      isVerifying: vi.fn().mockReturnValue(signal(false)),
      verifyItem: vi.fn().mockResolvedValue('VALID'),
    };

    await TestBed.configureTestingModule({
      imports: [DocumentActionsComponent],
      providers: [
        { provide: OUTPUT_FACADE_TOKEN, useValue: mockOutputFacade },
        { provide: INTEGRITY_FACADE_TOKEN, useValue: mockIntegrityFacade },
      ],
    })
      .overrideComponent(DocumentActionsComponent, {
        remove: { imports: [ExportPageComponent] },
        add: { imports: [MockExportPageComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(DocumentActionsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('itemId', '123');
    fixture.componentRef.setInput('itemType', 'DOCUMENT');
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should display correct context label based on itemType', () => {
    fixture.componentRef.setInput('itemId', '1');
    fixture.componentRef.setInput('itemType', 'DOCUMENT');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Documento');

    fixture.componentRef.setInput('itemType', 'PROCESS');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Processo');

    fixture.componentRef.setInput('itemType', 'DOCUMENT_CLASS');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Classe Documentale');

    fixture.componentRef.setInput('itemType', 'AGGREGATE');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Fascicolo');
  });

  it('should call verifyItem and emit actionCompleted on success', async () => {
    fixture.componentRef.setInput('itemId', '123');
    fixture.componentRef.setInput('itemType', 'DOCUMENT');
    fixture.detectChanges();

    const spyEmit = vi.spyOn(component.actionCompleted, 'emit');

    // Come per l'errore, aspettiamo la risoluzione micro-task
    await component.onVerify();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockIntegrityFacade.verifyItem).toHaveBeenCalledWith('123', 'DOCUMENT');
    expect(component.manualStatus()).toBe('VALID');
    expect(spyEmit).toHaveBeenCalled();
  });

  it('should handle verification failure and set status to UNKNOWN', async () => {
    fixture.componentRef.setInput('itemId', '456');
    fixture.componentRef.setInput('itemType', 'PROCESS');
    fixture.detectChanges();

    const spyEmit = vi.spyOn(component.actionCompleted, 'emit');
    mockIntegrityFacade.verifyItem.mockRejectedValue(new Error('fail'));

    // Dobbiamo aspettare esplicitamente che la promise rejected venga intercettata e gestita
    // siccome all'interno di onVerify() c'è una Promise chain autonoma svincolata dal return
    await component.onVerify();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockIntegrityFacade.verifyItem).toHaveBeenCalledWith('456', 'PROCESS');
    expect(component.manualStatus()).toBe('UNKNOWN');
    expect(spyEmit).toHaveBeenCalled();
  });

  it('should compute verificationStatus prioritizing manualStatus over initial', () => {
    fixture.componentRef.setInput('itemId', '1');
    fixture.componentRef.setInput('itemType', 'DOCUMENT');
    fixture.componentRef.setInput('initialVerificationStatus', 'INVALID');
    fixture.detectChanges();

    expect(component.verificationStatus()).toBe('INVALID');

    component.manualStatus.set('VALID');
    expect(component.verificationStatus()).toBe('VALID');
  });

  it('should call exportPdf on export action', () => {
    fixture.componentRef.setInput('itemId', '789');
    fixture.componentRef.setInput('itemType', 'PROCESS');
    fixture.detectChanges();

    component.onExport();
    expect(mockOutputFacade.exportPdf).toHaveBeenCalledWith({ documentId: '789', tipo: 'PROCESS' });
  });

  it('should call print on print action', () => {
    fixture.componentRef.setInput('itemId', '789');
    fixture.componentRef.setInput('itemType', 'PROCESS');
    fixture.detectChanges();

    component.onPrint();
    expect(mockOutputFacade.print).toHaveBeenCalledWith({ documentId: '789', tipo: 'PROCESS' });
  });

  it('should reset manualStatus when itemId or itemType changes via effect', async () => {
    // Eseguiamo il setup iniziale in un contesto fakeAsync se usassimo flush,
    // ma con i signal possiamo semplicemente chiamare detectChanges che trigghererà l'effect()
    fixture.componentRef.setInput('itemId', '1');
    fixture.componentRef.setInput('itemType', 'DOCUMENT');
    fixture.detectChanges();

    component.manualStatus.set('VALID');
    expect(component.manualStatus()).toBe('VALID');

    fixture.componentRef.setInput('itemId', '2');
    fixture.detectChanges();

    expect(component.manualStatus()).toBeNull();
  });
});
