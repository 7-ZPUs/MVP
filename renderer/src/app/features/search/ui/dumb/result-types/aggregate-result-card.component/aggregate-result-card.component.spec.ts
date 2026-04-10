import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AggregateResultCardComponent } from './aggregate-result-card.component';
import { IAggregateSearchResult } from '../../../../../../../../../shared/domain/metadata/search-result.models';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ElementType } from '../../../../../../../../../shared/domain/metadata/search.enum';
import { IntegrityStatusEnum } from '../../../../../../../../../core/src/value-objects/IntegrityStatusEnum';

describe('AggregateResultCardComponent', () => {
  let component: AggregateResultCardComponent;
  let fixture: ComponentFixture<AggregateResultCardComponent>;
  const mockAction = vi.fn();

  const mockAggregate: IAggregateSearchResult = {
    id: '12345',
    uuid: 'FAS-456',
    type: ElementType.AGGREGAZIONE_DOCUMENTALE,
    name: 'Fascicolo Personale Mario Rossi',
    integrityStatus: IntegrityStatusEnum.VALID,
    score: 0.72,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AggregateResultCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AggregateResultCardComponent);
    component = fixture.componentInstance;

    component.result = mockAggregate;
    component.onSelectAction = mockAction;
  });

  it("dovrebbe renderizzare il nome e l'UUID del fascicolo", () => {
    fixture.detectChanges();

    const nameEl = fixture.debugElement.query(By.css('.document-name')).nativeElement;
    const idEl = fixture.debugElement.query(By.css('.document-id')).nativeElement;
    const badgeEl = fixture.debugElement.query(By.css('.aggregate-badge')).nativeElement;

    expect(nameEl.textContent).toContain('Fascicolo Personale Mario Rossi');
    expect(idEl.textContent).toContain('ID Fascicolo: FAS-456');
    expect(badgeEl.textContent).toContain('AGGREGAZIONE DOCUMENTALE');
  });

  it('dovrebbe mostrare lo score semantico formattato se attivo', () => {
    component.isSemanticSearch = true;
    fixture.detectChanges();

    const scoreBadge = fixture.debugElement.query(By.css('.score-badge')).nativeElement;
    // Il pipe '1.0-2' arrotonderà 0.72
    expect(scoreBadge.textContent).toContain('0.72');
  });

  it('A11Y: dovrebbe invocare onSelectAction al click', () => {
    fixture.detectChanges();
    const cardEl = fixture.debugElement.query(By.css('.result-card'));

    cardEl.triggerEventHandler('click', null);
    expect(mockAction).toHaveBeenCalledWith(mockAggregate);
  });
});
