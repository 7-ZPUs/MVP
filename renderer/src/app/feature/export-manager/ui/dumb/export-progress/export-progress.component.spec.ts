import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExportProgressComponent } from './export-progress.component';
import { OutputContext } from '../../../domain/enums';
import { describe, it, expect, beforeEach } from 'vitest';
import { By } from '@angular/platform-browser';

describe('ExportProgressComponent', () => {
  let component: ExportProgressComponent;
  let fixture: ComponentFixture<ExportProgressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExportProgressComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ExportProgressComponent);
    component = fixture.componentInstance;
    // Non chiamiamo detectChanges qui per permettere ai singoli test di impostare gli @Input()
  });

  it('dovrebbe mostrare la percentuale corretta nel testo', () => {
    component.progress = 45;
    fixture.detectChanges();
    
    const pctElement = fixture.debugElement.query(By.css('.progress-pct')).nativeElement;
    expect(pctElement.textContent).toContain('45%');
  });

  it('dovrebbe mostrare la label "Generazione PDF…" per il contesto REPORT_PDF', () => {
    component.outputContext = OutputContext.REPORT_PDF;
    fixture.detectChanges();
    
    const labelElement = fixture.debugElement.query(By.css('.progress-label')).nativeElement;
    expect(labelElement.textContent).toBe('Generazione PDF…');
  });

  it('dovrebbe mostrare la label "Stampa in corso…" per il contesto MULTI_PRINT', () => {
    component.outputContext = OutputContext.MULTI_PRINT;
    fixture.detectChanges();
    
    const labelElement = fixture.debugElement.query(By.css('.progress-label')).nativeElement;
    expect(labelElement.textContent).toBe('Stampa in corso…');
  });

  it('dovrebbe aggiornare la larghezza della barra fill', () => {
    component.progress = 75;
    fixture.detectChanges();
    
    const fillElement = fixture.debugElement.query(By.css('.progress-bar-fill')).nativeElement;
    expect(fillElement.style.width).toBe('75%');
  });
});