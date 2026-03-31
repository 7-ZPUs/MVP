import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach } from 'vitest';
import { SemanticIndexStatusComponent } from './semantic-index-status.component';

describe('SemanticIndexStatusComponent', () => {
  let component: SemanticIndexStatusComponent;
  let fixture: ComponentFixture<SemanticIndexStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SemanticIndexStatusComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SemanticIndexStatusComponent);
    component = fixture.componentInstance;
  });

  it('dovrebbe renderizzare lo stato sconosciuto se state è null', () => {
    fixture.componentRef.setInput('state', null);
    fixture.detectChanges();

    expect(component.statusClass).toBe('status-unknown');
    expect(component.statusLabel).toBe('Sconosciuto');

    const textEl = fixture.debugElement.query(By.css('.status-text'));
    expect(textEl.nativeElement.textContent).toContain('Sconosciuto');
  });

  it('dovrebbe renderizzare lo stato READY', () => {
    fixture.componentRef.setInput('state', { status: 'READY' });
    fixture.detectChanges();

    expect(component.statusClass).toBe('status-ready');
    expect(component.statusLabel).toBe('Pronto');
  });

  it('dovrebbe renderizzare lo stato ERROR', () => {
    fixture.componentRef.setInput('state', { status: 'ERROR' });
    fixture.detectChanges();

    expect(component.statusClass).toBe('status-error');
    expect(component.statusLabel).toBe('Errore Indice');
  });

  it('dovrebbe renderizzare lo stato INDEXING senza progress se non fornito', () => {
    fixture.componentRef.setInput('state', { status: 'INDEXING' });
    fixture.detectChanges();

    expect(component.statusClass).toBe('status-indexing');
    expect(component.statusLabel).toBe('In Aggiornamento...');

    const progressEl = fixture.debugElement.query(By.css('.status-progress'));
    expect(progressEl).toBeNull();
  });

  it('dovrebbe renderizzare lo stato INDEXING mostrando la percentuale se progress è presente', async () => {
    component.state = { status: 'INDEXING', progress: 45 } as any;
    fixture.detectChanges();
    await fixture.whenStable();

    const progressEl = fixture.debugElement.query(By.css('.status-progress'));

    expect(progressEl).toBeTruthy();
    expect(progressEl.nativeElement.textContent).toContain('45%');
  });

  it('dovrebbe gestire uno status non mappato restituendo il valore originale come label', () => {
    fixture.componentRef.setInput('state', { status: 'CUSTOM_STATE' } as any);
    fixture.detectChanges();

    expect(component.statusClass).toBe('status-unknown');
    expect(component.statusLabel).toBe('CUSTOM_STATE');
  });
});
