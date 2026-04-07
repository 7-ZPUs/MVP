import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IntegritySummaryCardsComponent } from './integrity-summary-cards.component';
import { ComponentRef } from '@angular/core';

describe('IntegritySummaryCardsComponent', () => {
  let component: IntegritySummaryCardsComponent;
  let fixture: ComponentFixture<IntegritySummaryCardsComponent>;
  let componentRef: ComponentRef<IntegritySummaryCardsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IntegritySummaryCardsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(IntegritySummaryCardsComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
  });

  it('should create', () => {
    componentRef.setInput('stats', {
      totalProcesses: 0,
      validProcesses: 0,
      invalidProcesses: 0,
      unverifiedProcesses: 0,
    });
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should render the stats correctly', () => {
    componentRef.setInput('stats', {
      totalProcesses: 10,
      validProcesses: 5,
      invalidProcesses: 3,
      unverifiedProcesses: 2,
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    // valid
    const validCard = compiled.querySelector('.valid-card');
    expect(validCard?.textContent).toContain('5');
    expect(validCard?.textContent).toContain('Elementi Integri');

    // invalid
    const invalidCard = compiled.querySelector('.invalid-card');
    expect(invalidCard?.textContent).toContain('3');
    expect(invalidCard?.textContent).toContain('Elementi Corrotti');

    // unknown
    const unknownCard = compiled.querySelector('.unknown-card');
    expect(unknownCard?.textContent).toContain('2');
    expect(unknownCard?.textContent).toContain('In Attesa di Verifica');
  });
});
