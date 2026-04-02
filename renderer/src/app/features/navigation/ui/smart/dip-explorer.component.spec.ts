import { ComponentFixture, TestBed } from "@angular/core/testing";
import { signal,NO_ERRORS_SCHEMA } from "@angular/core";
import { vi } from "vitest";
import { DipExplorerComponent } from "./dip-explorer.component";
import { DipFacade, DipState } from "../../services/dip-facade";
import { DipTreeNode } from "../../contracts/dip-tree-node";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const makeNode = (id: number): DipTreeNode => ({
  id,
  name: `Node ${id}`,
  type: 'documentClass',
  hasChildren: false,
});

const makeState = (partial: Partial<DipState> = {}): DipState => ({
  phase: 'ready',
  rootNodes: [],
  nodeCache: new Map(),
  loadingNodeIds: new Set(),
  nodeChildrenErrors: new Map(),
  ...partial,
});

const makeFacadeMock = (initialState: DipState) => {
  const _state = signal(initialState);
  return {
    getState: () => _state.asReadonly(),
    setState: (s: DipState) => _state.set(s),
    loadRootNodes: vi.fn().mockResolvedValue(undefined),
    loadChildren: vi.fn().mockResolvedValue(undefined),
  };
};

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('DipExplorerComponent', () => {
  let fixture: ComponentFixture<DipExplorerComponent>;
  let component: DipExplorerComponent;
  let facadeMock: ReturnType<typeof makeFacadeMock>;

  const setup = async (initialState: Partial<DipState> = {}) => {
    facadeMock = makeFacadeMock(makeState(initialState));

    await TestBed.configureTestingModule({
      imports: [DipExplorerComponent],
      providers: [{ provide: DipFacade, useValue: facadeMock }],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideTemplate(DipExplorerComponent, '<div></div>')
    .compileComponents();

    fixture = TestBed.createComponent(DipExplorerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  afterEach(() => TestBed.resetTestingModule());

  // ── Creazione ─────────────────────────────────────────────────────────────

  describe('creazione', () => {
    it('dovrebbe creare il componente', async () => {
      await setup();
      expect(component).toBeTruthy();
    });
  });

  // ── rootNodes ─────────────────────────────────────────────────────────────

  describe('rootNodes', () => {
    it('ritorna i rootNodes dallo stato del facade', async () => {
      const nodes = [makeNode(1), makeNode(2)];
      await setup({ rootNodes: nodes });

      expect(component.rootNodes).toEqual(nodes);
    });

    it('ritorna array vuoto se il facade non ha nodi', async () => {
      await setup({ rootNodes: [] });

      expect(component.rootNodes).toHaveLength(0);
    });

    it('si aggiorna quando il facade cambia i rootNodes', async () => {
      await setup({ rootNodes: [] });
      expect(component.rootNodes).toHaveLength(0);

      const nodes = [makeNode(1)];
      facadeMock.setState(makeState({ rootNodes: nodes }));

      expect(component.rootNodes).toEqual(nodes);
    });
  });

  // ── state Signal ──────────────────────────────────────────────────────────

  describe('state', () => {
    it('espone il Signal del facade', async () => {
      await setup({ phase: 'ready' });

      expect(component.state()).toMatchObject({ phase: 'ready' });
    });

    it('riflette il phase loading quando il facade è in caricamento', async () => {
      await setup({ phase: 'loading' });

      expect(component.state().phase).toBe('loading');
    });

    it('si aggiorna reattivamente al cambio di phase', async () => {
      await setup({ phase: 'idle' });
      expect(component.state().phase).toBe('idle');

      facadeMock.setState(makeState({ phase: 'ready' }));

      expect(component.state().phase).toBe('ready');
    });
  });
});