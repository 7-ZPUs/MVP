import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { SearchBarComponent } from './search-bar.component';

enum MockQueryType {
  FREE = 'FREE',
  CLASS_NAME = 'CLASS_NAME',
  PROCESS_ID = 'PROCESS_ID',
}

describe('SearchBarComponent', () => {
  let component: SearchBarComponent;
  let fixture: ComponentFixture<SearchBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchBarComponent);
    component = fixture.componentInstance;

    component.QueryType = MockQueryType as any;

    fixture.detectChanges();
  });

  it('dovrebbe istanziare il componente con i valori di default', () => {
    expect(component).toBeTruthy();
    expect(component.form.value.text).toBe('');
    expect(component.form.value.type).toBe(MockQueryType.FREE);
    expect(component.form.value.useSemantic).toBe(false);
  });

  it('ngOnChanges() dovrebbe aggiornare il form se riceve una nuova query in input senza emettere', () => {
    const emitSpy = vi.spyOn(component.queryChanged, 'emit');
    const incomingQuery = {
      text: 'Fascicolo 123',
      type: MockQueryType.PROCESS_ID as any,
      useSemantic: true,
    };

    fixture.componentRef.setInput('query', incomingQuery);
    fixture.detectChanges();

    expect(component.form.getRawValue().text).toBe('Fascicolo 123');
    expect(component.form.getRawValue().type).toBe(MockQueryType.PROCESS_ID);
    expect(component.form.getRawValue().useSemantic).toBe(true);
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('ngOnChanges() dovrebbe disabilitare il form se isSearching diventa true', () => {
    fixture.componentRef.setInput('isSearching', true);
    fixture.detectChanges();

    expect(component.form.disabled).toBe(true);
  });

  it('ngOnChanges() dovrebbe riabilitare il form se isSearching diventa false', () => {
    component.form.disable();

    fixture.componentRef.setInput('isSearching', false);
    fixture.detectChanges();

    expect(component.form.enabled).toBe(true);
  });

  it('dovrebbe mostrare il loader nel template quando isSearching è true', () => {
    fixture.componentRef.setInput('isSearching', true);
    fixture.detectChanges();

    const spinner = fixture.debugElement.query(By.css('.loading-spinner'));
    expect(spinner).toBeTruthy();
    expect(spinner.nativeElement.textContent).toContain('Ricerca in corso');
  });

  it('ngOnDestroy() dovrebbe ripulire le sottoscrizioni chiudendo il subject', () => {
    const nextSpy = vi.spyOn((component as any).destroy$, 'next');
    const completeSpy = vi.spyOn((component as any).destroy$, 'complete');

    component.ngOnDestroy();

    expect(nextSpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });
});
