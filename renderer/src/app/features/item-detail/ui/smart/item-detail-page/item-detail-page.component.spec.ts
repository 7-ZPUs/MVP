import { TestBed, ComponentFixture } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signal } from '@angular/core';

import { ItemDetailPageComponent } from './item-detail-page.component';

// Importiamo i token che causano l'errore
import { AGGREGATE_FACADE_TOKEN } from '../../../../aggregate/contracts/IAggregateFacade';
import { DOCUMENT_FACADE_TOKEN } from '../../../../document/contracts/IDocumentFacade';

describe('ItemDetailPageComponent', () => {
  let component: ItemDetailPageComponent;
  let fixture: ComponentFixture<ItemDetailPageComponent>;

  // 1. Creiamo le "controfigure" (Mock) dei nostri Facade
  // Usiamo 'any' per bypassare i controlli rigidi di TypeScript nei test
  let mockAggregateFacade: any;
  let mockDocumentFacade: any;

  beforeEach(async () => {
    // 2. Istruiamo le controfigure su cosa devono rispondere
    mockAggregateFacade = {
      // Il componente si aspetta un signal da getState()
      getState: vi.fn().mockReturnValue(signal({ detail: null, loading: false, error: null })),
      loadAggregate: vi.fn(),
    };

    mockDocumentFacade = {
      getState: vi.fn().mockReturnValue(signal({ detail: null, loading: false, error: null })),
      loadDocument: vi.fn(),
    };

    await TestBed.configureTestingModule({
      // Importiamo il componente standalone
      imports: [ItemDetailPageComponent],

      // 3. LA SOLUZIONE ALL'ERRORE DI INJECTION:
      // Diciamo al TestBed: "Quando il componente chiede questo Token, passagli il mock!"
      providers: [
        { provide: AGGREGATE_FACADE_TOKEN, useValue: mockAggregateFacade },
        { provide: DOCUMENT_FACADE_TOKEN, useValue: mockDocumentFacade },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ItemDetailPageComponent);
    component = fixture.componentInstance;

    // 4. In Angular 17+, i Signal Input (input.required) vanno valorizzati
    // PRIMA di chiamare detectChanges(), altrimenti Angular va in crash!
    fixture.componentRef.setInput('itemId', '123');
    fixture.componentRef.setInput('itemType', 'AGGREGATE');

    fixture.detectChanges();
  });

  it('dovrebbe crearsi correttamente senza errori di Injection', () => {
    expect(component).toBeTruthy();
  });

  it('dovrebbe chiamare loadAggregate se itemType è AGGREGATE', () => {
    // Abbiamo impostato itemType = 'AGGREGATE' nel beforeEach,
    // quindi l'effect nel constructor dovrebbe aver chiamato questo metodo
    expect(mockAggregateFacade.loadAggregate).toHaveBeenCalledWith('123');
    expect(mockDocumentFacade.loadDocument).not.toHaveBeenCalled();
  });
});
