import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AsyncStateWrapperComponent } from './async-state-wrapper.component';
import { AppError } from '../../../../../shared/domain';

// Creiamo un componente Host fittizio per testare la Content Projection (<ng-content>)
@Component({
  standalone: true,
  imports: [AsyncStateWrapperComponent],
  template: `
    <app-async-state-wrapper [isLoading]="loading" [error]="errorObj" (retry)="onRetry()">
      <div class="projected-content">Contenuto Reale della Pagina</div>
    </app-async-state-wrapper>
  `,
})
class HostComponent {
  loading = false;
  errorObj: AppError | null = null;
  onRetry = vi.fn();
}

describe('AsyncStateWrapperComponent', () => {
  let hostComponent: HostComponent;
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, AsyncStateWrapperComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    hostComponent = fixture.componentInstance;
  });

  it('dovrebbe proiettare il contenuto quando non è in caricamento e non ci sono errori', () => {
    // Di default loading=false e error=null nel nostro Host
    fixture.detectChanges();
    const projected = fixture.debugElement.query(By.css('.projected-content'));
    expect(projected).toBeTruthy();
    expect(projected.nativeElement.textContent).toContain('Contenuto Reale');

    expect(fixture.debugElement.query(By.css('.async-loading-state'))).toBeNull();
    expect(fixture.debugElement.query(By.css('.async-error-state'))).toBeNull();
  });

  it('dovrebbe mostrare il loader e nascondere il contenuto quando isLoading è true', () => {
    hostComponent.loading = true;
    fixture.detectChanges();

    const loader = fixture.debugElement.query(By.css('.async-loading-state'));
    expect(loader).toBeTruthy();
    expect(loader.nativeElement.textContent).toContain('Caricamento in corso');

    expect(fixture.debugElement.query(By.css('.projected-content'))).toBeNull();
  });

  it("dovrebbe mostrare l'errore, nascondere il contenuto e innescare il retry al click", () => {
    hostComponent.errorObj = {
      code: 'ERR_1',
      message: 'Il server non risponde',
    } as unknown as AppError;
    fixture.detectChanges();

    const errorState = fixture.debugElement.query(By.css('.async-error-state'));
    expect(errorState).toBeTruthy();
    expect(errorState.nativeElement.textContent).toContain('Il server non risponde');

    const retryBtn = fixture.debugElement.query(By.css('.btn-retry'));
    retryBtn.triggerEventHandler('click', null);

    expect(hostComponent.onRetry).toHaveBeenCalled();
  });

  it('dovrebbe usare il messaggio di errore di fallback se error.message è vuoto', () => {
    hostComponent.errorObj = { code: 'ERR_2', message: '' } as unknown as AppError;
    fixture.detectChanges();

    const errorState = fixture.debugElement.query(By.css('.async-error-state'));
    expect(errorState.nativeElement.textContent).toContain('Si è verificato un errore imprevisto.');
  });
});
