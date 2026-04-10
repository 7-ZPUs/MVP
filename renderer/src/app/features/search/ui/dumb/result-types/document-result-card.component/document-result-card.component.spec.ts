import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DocumentResultCardComponent } from './document-result-card.component';
import { IDocumentSearchResult } from '../../../../../../../../../shared/domain/metadata/search-result.models';
import { ElementType } from '../../../../../../../../../shared/domain/metadata/search.enum';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IntegrityStatusEnum } from '../../../../../../../../../core/src/value-objects/IntegrityStatusEnum';

describe('DocumentResultCardComponent', () => {
  let component: DocumentResultCardComponent;
  let fixture: ComponentFixture<DocumentResultCardComponent>;
  const mockAction = vi.fn();

  const mockDocument: IDocumentSearchResult = {
    id: '12345',
    uuid: 'DOC-999',
    type: ElementType.DOCUMENTO_INFORMATICO,
    name: 'Relazione Tecnica',
    integrityStatus: IntegrityStatusEnum.VALID,
    score: 0.88,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentResultCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentResultCardComponent);
    component = fixture.componentInstance;

    // Inizializziamo gli input obbligatori
    component.result = mockDocument;
    component.onSelectAction = mockAction;
  });

  it("dovrebbe renderizzare il nome e l'UUID del documento", () => {
    fixture.detectChanges();

    const nameEl = fixture.debugElement.query(By.css('.document-name')).nativeElement;
    const idEl = fixture.debugElement.query(By.css('.document-id')).nativeElement;

    expect(nameEl.textContent).toContain('Relazione Tecnica');
    expect(idEl.textContent).toContain('DOC-999');
  });

  it('dovrebbe mostrare lo score solo se isSemanticSearch è true', () => {
    fixture.componentRef.setInput('isSemanticSearch', true);
    fixture.detectChanges();

    let scoreBadge = fixture.debugElement.query(By.css('.score-badge'));
    expect(scoreBadge).toBeTruthy();
  });

  it('non dovrebbe mostrare lo score se isSemanticSearch è false', () => {
    fixture.componentRef.setInput('isSemanticSearch', false);
    fixture.detectChanges();

    const scoreBadge = fixture.debugElement.query(By.css('.score-badge'));
    expect(scoreBadge).toBeFalsy();
  });

  it('A11Y: dovrebbe invocare onSelectAction al click', () => {
    fixture.detectChanges();
    const cardEl = fixture.debugElement.query(By.css('.result-card'));

    cardEl.triggerEventHandler('click', null);
    expect(mockAction).toHaveBeenCalledWith(mockDocument);
  });

  it('A11Y: dovrebbe invocare onSelectAction premendo Invio (keydown.enter)', () => {
    fixture.detectChanges();
    const cardEl = fixture.debugElement.query(By.css('.result-card'));

    cardEl.triggerEventHandler('keydown.enter', null);
    expect(mockAction).toHaveBeenCalledWith(mockDocument);
  });
});
