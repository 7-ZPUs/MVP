import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IntegrityDashboardComponent } from './integrity-dashboard.component';
import { INTEGRITY_FACADE_TOKEN } from '../../../contracts/IIntegrityFacade';
import { signal } from '@angular/core';

describe('IntegrityDashboardComponent', () => {
  let component: IntegrityDashboardComponent;
  let fixture: ComponentFixture<IntegrityDashboardComponent>;
  let mockFacade: any;

  beforeEach(async () => {
    mockFacade = {
      isVerifying: signal(false),
      error: signal(null),
      currentDipStatus: signal(null),
      dipClasses: signal([]),
      overviewStats: signal({
        totalProcesses: 0,
        validProcesses: 0,
        invalidProcesses: 0,
        unverifiedProcesses: 0,
      }),
      corruptedNodes: signal([]),
      validRolledUpNodes: signal([]),
      loadOverview: vi.fn(),
      verifyDip: vi.fn().mockResolvedValue(undefined),
      clearResults: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [IntegrityDashboardComponent],
      providers: [{ provide: INTEGRITY_FACADE_TOKEN, useValue: mockFacade }],
    }).compileComponents();

    fixture = TestBed.createComponent(IntegrityDashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create and load overview on init', () => {
    fixture.detectChanges(); // calls ngOnInit
    expect(component).toBeTruthy();
    expect(mockFacade.loadOverview).toHaveBeenCalledWith(component.currentDipId);
  });

  it('should display progress section when verifying', () => {
    mockFacade.isVerifying.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.progress-section')).toBeTruthy();
    expect(compiled.querySelector('app-integrity-summary-cards')).toBeNull();
    expect(compiled.querySelector('app-integrity-corrupted-panel')).toBeNull();
    expect(compiled.querySelector('app-integrity-valid-panel')).toBeNull();
  });

  it('should display summary, corrupted, and valid panels when not verifying', () => {
    mockFacade.isVerifying.set(false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.progress-section')).toBeNull();
    expect(compiled.querySelector('app-integrity-summary-cards')).toBeTruthy();
    expect(compiled.querySelector('app-integrity-corrupted-panel')).toBeTruthy();
    expect(compiled.querySelector('app-integrity-valid-panel')).toBeTruthy();
  });

  it('should start verification and reload overview when startVerification is called', async () => {
    fixture.detectChanges();
    await component.startVerification();

    expect(mockFacade.verifyDip).toHaveBeenCalledWith(component.currentDipId);
    // Because verifyDip returns a Promise, loadOverview should have been called again
    expect(mockFacade.loadOverview).toHaveBeenCalledTimes(2); // once on init, once on resolve
  });
});
