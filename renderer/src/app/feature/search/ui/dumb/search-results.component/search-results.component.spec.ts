import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { SearchResultsComponent } from './search-results.component';
import { ISearchResult } from '../../../../../../../../shared/domain/metadata';
import { ElementType } from '../../../../../../../../shared/domain/metadata/search.enum';
import { IntegrityStatusEnum } from '../../../../../../../../core/src/value-objects/IntegrityStatusEnum';

describe('SearchResultsComponent', () => {
  let component: SearchResultsComponent;
  let fixture: ComponentFixture<SearchResultsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchResultsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchResultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dovrebbe istanziarsi correttamente con array vuoto di default', () => {
    expect(component).toBeTruthy();
    expect(component.results.length).toBe(0);
  });

  it('dovrebbe mostrare il componente EmptyState se non ci sono risultati', () => {
    fixture.componentRef.setInput('results', []);
    fixture.componentRef.setInput('emptyMessage', 'Nessun dato');
    fixture.detectChanges();

    const emptyState = fixture.debugElement.query(By.css('app-empty-state'));

    expect(emptyState).toBeTruthy();
    expect(emptyState.componentInstance.message).toBe('Nessun dato');
    expect(emptyState.nativeElement.textContent).toContain('Nessun dato');
  });

  it('dovrebbe renderizzare la tabella se ci sono risultati', () => {
    const mockResults: ISearchResult[] = [
      {
        id: '1',
        uuid: 'DOC-1',
        name: 'Fascicolo Alfa',
        type: ElementType.DOCUMENTO_INFORMATICO,
        integrityStatus: IntegrityStatusEnum.VALID,
        score: 0.95,
      },
      {
        id: '2',
        uuid: 'DOC-2',
        name: 'Fascicolo Beta',
        type: ElementType.DOCUMENTO_AMMINISTRATIVO_INFORMATICO,
        integrityStatus: IntegrityStatusEnum.VALID,
        score: null,
      },
    ];

    fixture.componentRef.setInput('results', mockResults);
    fixture.detectChanges();

    const table = fixture.debugElement.query(By.css('table'));
    expect(table).toBeTruthy();

    const rows = fixture.debugElement.queryAll(By.css('tbody tr'));
    expect(rows.length).toBe(2);

    expect(rows[0].nativeElement.textContent).toContain('Fascicolo Alfa');
    expect(rows[1].nativeElement.textContent).toContain('DOC-2');
  });

  it('dovrebbe emettere resultSelected con il documentId corretto al click sulla riga', () => {
    const selected: ISearchResult = {
      id: '123',
      uuid: 'DOC-123',
      name: 'Test',
      type: ElementType.AGGREGAZIONE_DOCUMENTALE,
      integrityStatus: IntegrityStatusEnum.VALID,
      score: null,
    };
    const mockResults: ISearchResult[] = [selected];
    fixture.componentRef.setInput('results', mockResults);
    fixture.detectChanges();

    const emitSpy = vi.spyOn(component.resultSelected, 'emit');

    const firstRow = fixture.debugElement.query(By.css('tbody tr'));
    firstRow.triggerEventHandler('click', null);

    expect(emitSpy).toHaveBeenCalledTimes(1);
    expect(emitSpy).toHaveBeenCalledWith(selected);
  });
});
