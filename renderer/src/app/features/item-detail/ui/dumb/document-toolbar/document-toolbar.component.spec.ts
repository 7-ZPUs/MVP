import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DocumentToolbarComponent } from './document-toolbar.component';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('DocumentToolbarComponent', () => {
  let component: DocumentToolbarComponent;
  let fixture: ComponentFixture<DocumentToolbarComponent>;

  // 1. PREPARAZIONE: Si esegue prima di ogni 'it'
  beforeEach(async () => {
    // TestBed crea un modulo Angular virtuale solo per questo test
    await TestBed.configureTestingModule({
      imports: [DocumentToolbarComponent], // Essendo standalone, lo importiamo direttamente
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentToolbarComponent);
    component = fixture.componentInstance;

    // In Angular 17+, i signal input.required() si impostano tramite setInput sulla fixture
    fixture.componentRef.setInput('titolo', 'Documento di Test');
    fixture.componentRef.setInput('formato', 'PDF');
    fixture.componentRef.setInput('zoomLevel', 1);

    // Aggiorniamo il DOM virtuale
    fixture.detectChanges();
  });

  // 2. IL TEST PIÙ SEMPLICE: Verifica che il componente nasca senza errori
  it('dovrebbe crearsi correttamente', () => {
    expect(component).toBeTruthy();
  });

  // 3. TEST DELL'INTERFACCIA: Verifica che l'HTML mostri i nostri input
  it('dovrebbe mostrare il titolo e il formato passati come input', () => {
    // Cerchiamo l'elemento HTML nativo
    const htmlElement: HTMLElement = fixture.nativeElement;

    expect(htmlElement.querySelector('.title')?.textContent).toContain('Documento di Test');
    expect(htmlElement.querySelector('.badge')?.textContent).toContain('PDF');
  });

  // 4. TEST DEGLI OUTPUT: Verifica che cliccare un bottone emetta l'evento
  it('dovrebbe emettere "zoomIn" quando si clicca sul bottone +', () => {
    // 'vi.fn()' è una funzione "spia" di Vitest. Registra se viene chiamata.
    const spiaZoomIn = vi.fn();

    // Ascoltiamo l'output del componente e agganciamo la nostra spia
    component.zoomIn.subscribe(spiaZoomIn);

    // Simuliamo il click sul bottone con il '+'
    const bottonePiu = fixture.nativeElement.querySelector('button[title="Aumenta zoom"]');
    bottonePiu.click();

    // Verifichiamo che la spia sia stata chiamata esattamente 1 volta!
    expect(spiaZoomIn).toHaveBeenCalledOnce();
  });
});
