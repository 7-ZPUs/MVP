import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DipTreeComponent } from './dip-tree.component';
import { ImportFacade } from '../../../services/import.facade';
import { ImportPhase } from '../../../domain/enums';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signal } from '@angular/core';

describe('DipTreeComponent', () => {
  let component: DipTreeComponent;
  let fixture: ComponentFixture<DipTreeComponent>;

  const mockFacade = {
    rootNodes: signal([{ id: '1', label: 'Root Node', hasChildren: true }]),
    loading: signal(false),
    phase: signal(ImportPhase.READY),
    loadRootNodes: vi.fn(),
    loadChildren: vi.fn().mockResolvedValue([]),
    selectDocument: vi.fn(),
    retryLoad: vi.fn(),
    // Mock dello stato interno
    importState: {
      error: signal(null),
      nodeCache: signal(new Map())
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DipTreeComponent],
      providers: [{ provide: ImportFacade, useValue: mockFacade }]
    }).compileComponents();

    fixture = TestBed.createComponent(DipTreeComponent);
    component = fixture.componentInstance;
  });

  it('dovrebbe caricare i nodi radice all\'avvio (ngOnInit)', () => {
    fixture.detectChanges();
    expect(mockFacade.loadRootNodes).toHaveBeenCalled();
  });

  it('dovrebbe gestire l\'espansione di un nodo', () => {
    fixture.detectChanges();
    component.toggleNode('1');
    expect(component.expandedIds.has('1')).toBe(true);
    expect(mockFacade.loadChildren).toHaveBeenCalledWith('1');
  });

  it('dovrebbe emettere la selezione del nodo', () => {
    const spy = vi.spyOn(component.nodeSelected, 'emit');
    const testNode = { id: '1', label: 'Test' } as any;
    component.onNodeSelected(testNode);
    expect(mockFacade.selectDocument).toHaveBeenCalledWith(testNode);
    expect(spy).toHaveBeenCalledWith(testNode);
  });
});