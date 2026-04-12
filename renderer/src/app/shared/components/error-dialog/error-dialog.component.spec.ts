import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ErrorDialogComponent } from './error-dialog.component';
import { AppError, ErrorCode, ErrorSeverity } from '../../domain';

describe('ErrorDialogComponent', () => {
  let component: ErrorDialogComponent;
  let fixture: ComponentFixture<ErrorDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorDialogComponent);
    component = fixture.componentInstance;
  });

  // Helper function to update the input signal and trigger change detection
  const setError = (errorData: Partial<AppError>) => {
    fixture.componentRef.setInput('error', {
      message: 'Default error message',
      severity: ErrorSeverity.ERROR,
      ...errorData,
    } as AppError);
    fixture.detectChanges();
  };

  describe('UI and Severity Renderings', () => {
    it('should render ERROR severity correctly', () => {
      setError({ severity: ErrorSeverity.ERROR, message: 'Test error' });

      expect(component.isFatal()).toBe(false);
      expect(component.getIcon()).toBe('bi-x-octagon-fill');
      expect(component.getTitle()).toBe('Si è verificato un errore');
      
      const headerTitle = fixture.debugElement.query(By.css('.header-title')).nativeElement;
      expect(headerTitle.textContent.trim()).toBe('Si è verificato un errore');
      
      const dialog = fixture.debugElement.query(By.css('.modal-dialog')).nativeElement;
      expect(dialog.classList.contains('fatal-dialog')).toBe(false);
    });

    it('should render FATAL severity and apply the fatal-dialog CSS class', () => {
      setError({ severity: ErrorSeverity.FATAL });

      expect(component.isFatal()).toBe(true);
      expect(component.getIcon()).toBe('bi-bug-fill');
      expect(component.getTitle()).toBe('Errore Critico del Sistema');

      const dialog = fixture.debugElement.query(By.css('.modal-dialog')).nativeElement;
      expect(dialog.classList.contains('fatal-dialog')).toBe(true);
    });

    it('should render WARNING severity correctly', () => {
      setError({ severity: ErrorSeverity.WARNING });

      expect(component.getIcon()).toBe('bi-exclamation-triangle-fill');
      expect(component.getTitle()).toBe('Attenzione');
    });

    it('should render default (INFO/fallback) severity correctly', () => {
      setError({ severity: 'UNKNOWN' as ErrorSeverity });

      expect(component.getIcon()).toBe('bi-info-circle-fill');
      expect(component.getTitle()).toBe('Avviso');
    });
  });

  describe('Optional Elements (@if conditions)', () => {
    it('should not render code, source, details, or retry button when omitted', () => {
      setError({
        code: undefined,
        source: undefined,
        detail: undefined,
        recoverable: false,
      });

      const monoElements = fixture.debugElement.queryAll(By.css('.mono'));
      const techDetails = fixture.debugElement.queryAll(By.css('.tech-details'));
      const retryButtons = fixture.debugElement.queryAll(By.css('.btn-primary'));

      expect(monoElements.length).toBe(0); // Code missing
      expect(techDetails.length).toBe(0); // Detail missing
      expect(retryButtons.length).toBe(0); // Recoverable false
    });

    it('should render code, source, and details when provided', () => {
      setError({
        code: ErrorCode.SEARCH_ENGINE_ERROR,
        source: 'Backend API',
        detail: 'Stack trace details...',
      });

      const errorMeta = fixture.debugElement.query(By.css('.error-meta')).nativeElement;
      const techDetails = fixture.debugElement.query(By.css('.tech-details')).nativeElement;

      expect(errorMeta.textContent).toContain('SEARCH_ENGINE_ERROR');
      expect(errorMeta.textContent).toContain('Backend API');
      expect(techDetails.textContent).toContain('Stack trace details...');
    });
  });

  describe('Event Outputs', () => {
    it('should emit onClose when close button is clicked', () => {
      setError({});
      const closeSpy = vi.spyOn(component.onClose, 'emit');

      const closeBtn = fixture.debugElement.query(By.css('.btn-secondary')).nativeElement;
      closeBtn.click();

      expect(closeSpy).toHaveBeenCalledTimes(1);
    });

    it('should emit onRetry when retry button is clicked (if recoverable)', () => {
      setError({ recoverable: true });
      const retrySpy = vi.spyOn(component.onRetry, 'emit');

      const retryBtn = fixture.debugElement.query(By.css('.btn-primary')).nativeElement;
      retryBtn.click();

      expect(retrySpy).toHaveBeenCalledTimes(1);
    });
  });
});