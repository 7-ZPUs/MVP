import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExportResultComponent } from './export-result.component';
import { ExportPhase, OutputContext } from '../../../domain/enums';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { By } from '@angular/platform-browser';

describe('ExportResultComponent', () => {
  let component: ExportResultComponent;
  let fixture: ComponentFixture<ExportResultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExportResultComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ExportResultComponent);
    component = fixture.componentInstance;
  });

  it('dovrebbe mostrare il messaggio di successo per MULTI_EXPORT', () => {
    component.phase = ExportPhase.SUCCESS;
    component.result = { 
        outputContext: OutputContext.MULTI_EXPORT, 
        successCount: 5, 
        failedCount: 0 
    } as any;
    
    fixture.detectChanges();
    const title = fixture.debugElement.query(By.css('.result-success .result-title')).nativeElement;
    expect(title.textContent).toBe('5 documenti salvati');
  });

  it('dovrebbe mostrare il contatore dei falliti se maggiore di zero', () => {
    component.phase = ExportPhase.SUCCESS;
    component.result = { 
        outputContext: OutputContext.MULTI_EXPORT, 
        successCount: 3, 
        failedCount: 2 
    } as any;
    
    fixture.detectChanges();
    const sub = fixture.debugElement.query(By.css('.result-sub')).nativeElement;
    expect(sub.textContent).toContain('2 elementi non salvati');
  });

  it('dovrebbe mostrare l\'errore e il tasto riprova se recuperabile', () => {
    component.phase = ExportPhase.ERROR;
    component.error = { message: 'Connessione persa', recoverable: true } as any;
    
    fixture.detectChanges();
    const retryBtn = fixture.debugElement.query(By.css('.retry-btn'));
    expect(retryBtn).not.toBeNull();
  });

  it('dovrebbe emettere retry quando si clicca sul tasto Riprova', () => {
    component.phase = ExportPhase.ERROR;
    component.error = { message: 'Errore', recoverable: true } as any;
    const spy = vi.spyOn(component.retry, 'emit');
    
    fixture.detectChanges();
    const retryBtn = fixture.debugElement.query(By.css('.retry-btn'));
    retryBtn.triggerEventHandler('click', null);

    expect(spy).toHaveBeenCalled();
  });

  it('dovrebbe mostrare il warning se la fase è UNAVAILABLE', () => {
    component.phase = ExportPhase.UNAVAILABLE;
    component.error = { message: 'Servizio non pronto' } as any;
    
    fixture.detectChanges();
    const box = fixture.debugElement.query(By.css('.result-warning'));
    expect(box.nativeElement.textContent).toContain('Servizio non pronto');
  });
});