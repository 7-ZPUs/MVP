import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Component, Input } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { SearchResultsComponent } from './search-results.component';
import { SearchResultFactoryService } from '../../../services/search-result-factory.service';
import { ISearchResult } from '../../../../../../../../shared/domain/metadata';
import { ElementType } from '../../../../../../../../shared/domain/metadata/search.enum';
import { IntegrityStatusEnum } from '../../../../../../../../core/src/value-objects/IntegrityStatusEnum';
import { ISearchResultItemComponent } from '../../../contracts/search-result-item.interface';


@Component({ selector: 'app-stub-result-item', standalone: true, template: '' })
class StubResultItemComponent implements ISearchResultItemComponent {
  @Input() result!: ISearchResult;
  @Input() isSemanticSearch!: boolean;
  @Input() onSelectAction!: (res: ISearchResult) => void;
}

const mockFactory = {
  getComponentForType: vi.fn().mockReturnValue(StubResultItemComponent),
};

const makeResult = (overrides: Partial<ISearchResult> = {}): ISearchResult => ({
  id: '1',
  uuid: 'DOC-1',
  name: 'Fascicolo Alfa',
  type: ElementType.DOCUMENTO_INFORMATICO,
  integrityStatus: IntegrityStatusEnum.VALID,
  score: 0.95,
  ...overrides,
});

describe('SearchResultsComponent', () => {
  let component: SearchResultsComponent;
  let fixture: ComponentFixture<SearchResultsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchResultsComponent],
    })
      .overrideProvider(SearchResultFactoryService, { useValue: mockFactory })
      .compileComponents();

    fixture = TestBed.createComponent(SearchResultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // -------------------------------------------------------------------------
  it('dovrebbe istanziarsi correttamente con array vuoto di default', () => {
    expect(component).toBeTruthy();
    expect(component.results.length).toBe(0);
  });

  // -------------------------------------------------------------------------
  it('dovrebbe mostrare il componente EmptyState se non ci sono risultati', () => {
    fixture.componentRef.setInput('results', []);
    fixture.componentRef.setInput('emptyMessage', 'Nessun dato');
    fixture.detectChanges();

    const emptyState = fixture.debugElement.query(By.css('app-empty-state'));
    expect(emptyState).toBeTruthy();
    expect(emptyState.componentInstance.message).toBe('Nessun dato');
    expect(emptyState.nativeElement.textContent).toContain('Nessun dato');
  });

  // -------------------------------------------------------------------------
  it('dovrebbe NON mostrare EmptyState quando ci sono risultati', () => {
    fixture.componentRef.setInput('results', [makeResult()]);
    fixture.detectChanges();

    const emptyState = fixture.debugElement.query(By.css('app-empty-state'));
    expect(emptyState).toBeNull();
  });

  // -------------------------------------------------------------------------
  it('dovrebbe delegare al factory il componente corretto per ogni tipo di risultato', () => {
    const results = [
      makeResult({ id: '1', type: ElementType.DOCUMENTO_INFORMATICO }),
      makeResult({ id: '2', type: ElementType.DOCUMENTO_AMMINISTRATIVO_INFORMATICO }),
    ];
    fixture.componentRef.setInput('results', results);
    fixture.detectChanges();

    expect(mockFactory.getComponentForType).toHaveBeenCalledWith(ElementType.DOCUMENTO_INFORMATICO);
    expect(mockFactory.getComponentForType).toHaveBeenCalledWith(
      ElementType.DOCUMENTO_AMMINISTRATIVO_INFORMATICO,
    );
  });

  // -------------------------------------------------------------------------
  it('dovrebbe renderizzare un container dinamico per ogni risultato', () => {
    const results = [makeResult({ id: '1' }), makeResult({ id: '2', uuid: 'DOC-2' })];
    fixture.componentRef.setInput('results', results);
    fixture.detectChanges();

    // Each outlet renders into an ng-container; count the stub host elements
    const stubs = fixture.debugElement.queryAll(By.directive(StubResultItemComponent));
    expect(stubs.length).toBe(2);
  });

  // -------------------------------------------------------------------------
  it('getInputs dovrebbe passare result, isSemanticSearch e onSelectAction', () => {
    const result = makeResult();
    fixture.componentRef.setInput('isSemanticSearch', true);
    fixture.detectChanges();

    const inputs = component.getInputs(result);

    expect(inputs['result']).toBe(result);
    expect(inputs['isSemanticSearch']).toBe(true);
    expect(typeof inputs['onSelectAction']).toBe('function');
  });

  // -------------------------------------------------------------------------
  it('dovrebbe emettere resultSelected quando onSelectAction viene invocata dal componente figlio', () => {
    const result = makeResult({ id: '123', uuid: 'DOC-123', name: 'Test' });
    fixture.componentRef.setInput('results', [result]);
    fixture.detectChanges();

    const emitSpy = vi.spyOn(component.resultSelected, 'emit');

    // Simulate the child component calling back through the injected action
    const { onSelectAction } = component.getInputs(result) as {
      onSelectAction: (r: ISearchResult) => void;
    };
    onSelectAction(result);

    expect(emitSpy).toHaveBeenCalledTimes(1);
    expect(emitSpy).toHaveBeenCalledWith(result);
  });

  it('dovrebbe propagare isSemanticSearch=false di default agli input del componente figlio', () => {
    const result = makeResult();
    const inputs = component.getInputs(result);
    expect(inputs['isSemanticSearch']).toBe(false);
  });
});