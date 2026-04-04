import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ClassResultCardComponent } from './class-result-card.component';
import { IClassSearchResult } from '../../../../../../../../../shared/domain/metadata/search-result.models';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ElementType } from '../../../../../../../../../shared/domain/metadata/search.enum';
import { IntegrityStatusEnum } from '../../../../../../../../../core/src/value-objects/IntegrityStatusEnum';

describe('ClassResultCardComponent', () => {
  let component: ClassResultCardComponent;
  let fixture: ComponentFixture<ClassResultCardComponent>;
  const mockAction = vi.fn();

  const mockClass: IClassSearchResult = {
    id: '12345',
    uuid: 'CLS-789',
    type: ElementType.CLASS,
    name: 'Risorse Umane',
    integrityStatus: IntegrityStatusEnum.VALID,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClassResultCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ClassResultCardComponent);
    component = fixture.componentInstance;

    component.result = mockClass;
    component.onSelectAction = mockAction;
  });

  it("dovrebbe renderizzare il nome e l'UUID della classe", () => {
    fixture.detectChanges();

    const nameEl = fixture.debugElement.query(By.css('.document-name')).nativeElement;
    const idEl = fixture.debugElement.query(By.css('.document-id')).nativeElement;
    const badgeEl = fixture.debugElement.query(By.css('.class-badge')).nativeElement;

    expect(nameEl.textContent).toContain('Risorse Umane');
    expect(idEl.textContent).toContain('ID Classe: CLS-789');
    expect(badgeEl.textContent).toContain('CLASSE');
  });

  it('A11Y: dovrebbe invocare onSelectAction premendo Invio (keydown.enter)', () => {
    fixture.detectChanges();
    const cardEl = fixture.debugElement.query(By.css('.result-card'));

    cardEl.triggerEventHandler('keydown.enter', null);
    expect(mockAction).toHaveBeenCalledWith(mockClass);
  });
});
