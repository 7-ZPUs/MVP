import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';

import { AppShellComponent } from './app-shell.component';
import { DipFacade } from '../../services/dip-facade';
import { Router } from '@angular/router';
import { DipTreeNode } from '../../contracts/dip-tree-node';

describe('AppShellComponent', () => {
  let component: AppShellComponent;
  let fixture: ComponentFixture<AppShellComponent>;

  const mockNodes: DipTreeNode[] = [
    { id: 1, name: 'Nodo 1', type: 'document', hasChildren: false },
  ];

  const mockState = signal({
    phase: 'loading' as 'loading' | 'ready' | 'idle',
    rootNodes: mockNodes,
    nodeCache: new Map(),
    loadingNodeIds: new Set(),
    nodeChildrenErrors: new Map(),
  });

  const dipFacadeMock = {
    getState: vi.fn(() => mockState),
    loadRootNodes: vi.fn(),
  };

  const routerMock = {
    navigate: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppShellComponent],
      providers: [
        { provide: DipFacade, useValue: dipFacadeMock },
        { provide: Router, useValue: routerMock },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AppShellComponent);
    component = fixture.componentInstance;
  });

  // ─────────────────────────────────────────────

  it('dovrebbe creare il componente', () => {
    expect(component).toBeTruthy();
  });

  // ─────────────────────────────────────────────

  it('dovrebbe mostrare loading quando phase === loading', () => {
    mockState.set({
      ...mockState(),
      phase: 'loading',
    });

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Caricamento');
  });

  // ─────────────────────────────────────────────

  it('dovrebbe navigare al dettaglio DOCUMENT', () => {
    const node: DipTreeNode = {
      id: 1,
      name: 'Doc',
      type: 'document',
      hasChildren: false,
    };

    component.onNodeSelected(node);

    expect(routerMock.navigate).toHaveBeenCalledWith(['/detail', 'DOCUMENT', '1']);
  });

  it('dovrebbe navigare al dettaglio PROCESS per nodo process', () => {
    const node: DipTreeNode = {
      id: 42,
      name: 'Process',
      type: 'process',
      hasChildren: true,
    };

    component.onNodeSelected(node);

    expect(routerMock.navigate).toHaveBeenCalledWith(['/detail', 'PROCESS', '42']);
  });

  it('dovrebbe navigare al dettaglio DIP per nodo dip', () => {
    const node: DipTreeNode = {
      id: 7,
      name: 'DIP 7',
      type: 'dip',
      hasChildren: true,
    };

    component.onNodeSelected(node);

    expect(routerMock.navigate).toHaveBeenCalledWith(['/detail', 'DIP', '7']);
  });

  it('dovrebbe navigare al dettaglio DOCUMENT_CLASS per nodo documentClass', () => {
    const node: DipTreeNode = {
      id: 9,
      name: 'Classe Contratti',
      type: 'documentClass',
      hasChildren: true,
    };

    component.onNodeSelected(node);

    expect(routerMock.navigate).toHaveBeenCalledWith(['/detail', 'DOCUMENT_CLASS', '9']);
  });

  it('dovrebbe navigare al dettaglio FILE per nodo file', () => {
    const node: DipTreeNode = {
      id: 11,
      name: 'allegato.pdf',
      type: 'file',
      hasChildren: false,
    };

    component.onNodeSelected(node);

    expect(routerMock.navigate).toHaveBeenCalledWith(['/detail', 'FILE', '11']);
  });
});