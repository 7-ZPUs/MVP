import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DocumentPreviewComponent } from './document-preview.component';
import { Documento } from '../../../domain/models';
import { describe, it, expect, beforeEach } from 'vitest';
import { By } from '@angular/platform-browser';

describe('DocumentPreviewComponent', () => {
  let component: DocumentPreviewComponent;
  let fixture: ComponentFixture<DocumentPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentPreviewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentPreviewComponent);
    component = fixture.componentInstance;
  });

  it('dovrebbe mostrare il messaggio di "nessuna selezione" all\'inizio', () => {
    component.node = null;
    fixture.detectChanges();
    const noSelection = fixture.debugElement.query(By.css('.no-selection'));
    expect(noSelection).not.toBeNull();
  });

  it('dovrebbe mostrare l\'area di anteprima per un file PDF', () => {
    component.node = { label: 'contratto.pdf' } as any;
    fixture.detectChanges();
    const previewArea = fixture.debugElement.query(By.css('.preview-area'));
    expect(previewArea).not.toBeNull();
  });

  it('dovrebbe mostrare "anteprima non disponibile" per formati non supportati', () => {
    component.node = { label: 'file_segreto.exe' } as any;
    fixture.detectChanges();
    const unavailable = fixture.debugElement.query(By.css('.preview-unavailable'));
    expect(unavailable).not.toBeNull();
  });

it('dovrebbe usare il metodo isAnteprimaDisponibile se il nodo è istanza di Documento', () => {
 
    const mockDocument = Object.create(Documento.prototype);
    
    mockDocument.id = '1';
    mockDocument.label = 'test.pdf';

    mockDocument.isAnteprimaDisponibile = () => true;
    component.node = mockDocument;
    fixture.detectChanges();
    expect(component.previewAvailable).toBe(true);
  });
});