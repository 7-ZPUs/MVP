import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach } from 'vitest';
import { InlineErrorComponent } from './inline-error.component';

describe('InlineErrorComponent', () => {
  let component: InlineErrorComponent;
  let fixture: ComponentFixture<InlineErrorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InlineErrorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InlineErrorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dovrebbe istanziarsi correttamente e mostrare il messaggio di default', () => {
    expect(component).toBeTruthy();

    expect(component.message).toBe('Si è verificato un errore.');

    // Added coverage for the wrapper container and the static icon
    const wrapperEl = fixture.debugElement.query(By.css('.inline-error'));
    expect(wrapperEl).toBeTruthy();

    const iconEl = fixture.debugElement.query(By.css('.error-icon'));
    expect(iconEl.nativeElement.className).toContain('bi-exclamation-triangle-fill');

    const msgEl = fixture.debugElement.query(By.css('.error-message'));
    expect(msgEl.nativeElement.textContent).toContain('Si è verificato un errore.');
  });

  it('dovrebbe aggiornare il DOM quando riceve un nuovo messaggio in input', () => {
    fixture.componentRef.setInput('message', 'Credenziali non valide.');
    fixture.detectChanges();

    const msgEl = fixture.debugElement.query(By.css('.error-message'));
    expect(msgEl.nativeElement.textContent).toContain('Credenziali non valide.');
  });
});