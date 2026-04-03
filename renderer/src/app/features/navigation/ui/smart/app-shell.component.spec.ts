import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { CUSTOM_ELEMENTS_SCHEMA,signal } from '@angular/core';

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
    nodeChildrenErrors: new Map(),
  });

  const dipFacadeMock = {
    getState: vi.fn(() => mockState),
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

  it('dovrebbe mostrare loading quando phase !== ready', () => {
    mockState.set({
      ...mockState(),
      phase: 'loading',
    });

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Caricamento');
  });

  // ─────────────────────────────────────────────

  it('dovrebbe navigare a /document', () => {
    const node: DipTreeNode = {
      id: 1,
      name: 'Doc',
      type: 'document',
      hasChildren: false,
    };

    component.onNodeSelected(node);

    expect(routerMock.navigate).toHaveBeenCalledWith(['/document', 1]);
  });
});