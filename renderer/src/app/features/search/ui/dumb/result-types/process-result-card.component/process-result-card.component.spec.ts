import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ProcessResultCardComponent } from './process-result-card.component';
import { IProcessSearchResult } from '../../../../../../../../../shared/domain/metadata/search-result.models';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ElementType } from '../../../../../../../../../shared/domain/metadata/search.enum';
import { IntegrityStatusEnum } from '../../../../../../../../../core/src/value-objects/IntegrityStatusEnum';

describe('ProcessResultCardComponent', () => {
  let component: ProcessResultCardComponent;
  let fixture: ComponentFixture<ProcessResultCardComponent>;
  const mockAction = vi.fn();

  const mockProcess: IProcessSearchResult = {
    id: '12345',
    uuid: 'PRC-123',
    type: ElementType.PROCESS,
    name: 'Approvazione Bilancio',
    integrityStatus: IntegrityStatusEnum.VALID,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProcessResultCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProcessResultCardComponent);
    component = fixture.componentInstance;

    component.result = mockProcess;
    component.onSelectAction = mockAction;
  });

  it("dovrebbe renderizzare il nome e l'UUID del processo", () => {
    fixture.detectChanges();

    const nameEl = fixture.debugElement.query(By.css('.document-name')).nativeElement;
    const idEl = fixture.debugElement.query(By.css('.document-id')).nativeElement;
    const badgeEl = fixture.debugElement.query(By.css('.process-badge')).nativeElement;

    expect(nameEl.textContent).toContain('Approvazione Bilancio');
    expect(idEl.textContent).toContain('ID Processo: PRC-123');
    expect(badgeEl.textContent).toContain('PROCESS');
  });

  it('A11Y: dovrebbe invocare onSelectAction al click', () => {
    fixture.detectChanges();
    const cardEl = fixture.debugElement.query(By.css('.result-card'));

    cardEl.triggerEventHandler('click', null);
    expect(mockAction).toHaveBeenCalledWith(mockProcess);
  });

  it('A11Y: dovrebbe invocare onSelectAction premendo Invio (keydown.enter)', () => {
    fixture.detectChanges();
    const cardEl = fixture.debugElement.query(By.css('.result-card'));

    cardEl.triggerEventHandler('keydown.enter', null);
    expect(mockAction).toHaveBeenCalledWith(mockProcess);
  });
});
