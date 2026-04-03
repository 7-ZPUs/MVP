import { ComponentFixture, TestBed } from "@angular/core/testing";
import { signal } from "@angular/core";
import { ScrollingModule } from "@angular/cdk/scrolling";
import { vi } from "vitest";
import { DipTree } from "./dip-tree.component";
import { DipFacade, DipState } from "../../services/dip-facade";
import { DipTreeNode } from "../../contracts/dip-tree-node";
import { AppError, ErrorCategory, ErrorCode, ErrorSeverity } from "../../../../shared/domain";
import { NodeId } from "../../domain/types";
import { buildNodeKey } from "../../domain/node-key";
// ── Fixtures ─────────────────────────────────────────────────────────────────

const makeNode = (partial: Partial<DipTreeNode> & { id: NodeId }): DipTreeNode => ({
  name: `Node ${partial.id}`,
  type: 'documentClass',
  hasChildren: false,
  ...partial,
});

const makeError = (nodeId: NodeId): AppError => ({
  code: ErrorCode.IPC_ERROR,
    message: `Errore nodo ${nodeId}`,
    recoverable: true,
    category: ErrorCategory.DOMAIN,
    severity: ErrorSeverity.ERROR,
    source: 'IPC Gateway',
    context: null,
    detail: null,
  });

const makeState = (partial: Partial<DipState> = {}): DipState => ({
  phase: 'ready',
  rootNodes: [],
  nodeCache: new Map(),
  loadingNodeIds: new Set(),
  nodeChildrenErrors: new Map(),
  ...partial,
});

const keyFor = (node: DipTreeNode) => buildNodeKey(node);

// ── Mock Facade ───────────────────────────────────────────────────────────────

const makeFacadeMock = (initialState: DipState) => {
  const _state = signal(initialState);
  return {
    getState: () => _state.asReadonly(),
    setState: (s: DipState) => _state.set(s),
    loadChildren: vi.fn().mockResolvedValue(undefined),
    loadRootNodes: vi.fn().mockResolvedValue(undefined),
  };
};

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('DipTree', () => {
  let fixture: ComponentFixture<DipTree>;
  let component: DipTree;
  let facadeMock: ReturnType<typeof makeFacadeMock>;

  const setup = async (
    initialState: Partial<DipState> = {},
    rootNodesInput?: DipTreeNode[]
  ) => {
    facadeMock = makeFacadeMock(makeState(initialState));

    await TestBed.configureTestingModule({
      imports: [DipTree, ScrollingModule],
      providers: [{ provide: DipFacade, useValue: facadeMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(DipTree);
    component = fixture.componentInstance;

    if (rootNodesInput !== undefined) {
      component.rootNodes = rootNodesInput;
    }

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

  // ── Sorgente dati rootNodes ───────────────────────────────────────────────

  describe('flatNodes — sorgente dati', () => {
    it('usa rootNodes dal facade se @Input non è fornito', async () => {
      const node = makeNode({ id: 1 });
      await setup({ rootNodes: [node] });

      expect(component.flatNodes()[0].node).toBe(node);
    });

    it('usa @Input rootNodes se fornito, ignorando il facade', async () => {
      const facadeNode = makeNode({ id: 1, name: 'Facade' });
      const inputNode  = makeNode({ id: 2, name: 'Input' });
      await setup({ rootNodes: [facadeNode] }, [inputNode]);

      const ids = component.flatNodes().map(f => f.node.id);
      expect(ids).toContain(2);
      expect(ids).not.toContain(1);
    });

    it('ritorna array vuoto se non ci sono nodi', async () => {
      await setup({ rootNodes: [] });
      expect(component.flatNodes()).toHaveLength(0);
    });
  });

  // ── Struttura FlatNode ────────────────────────────────────────────────────

  describe('flatNodes — struttura FlatNode', () => {
    it('assegna depth=0 ai nodi radice', async () => {
      await setup({ rootNodes: [makeNode({ id: 1 })] });
      expect(component.flatNodes()[0].depth).toBe(0);
    });

    it('assegna isLoading=true se il nodo è in loadingNodeIds', async () => {
      const node = makeNode({ id: 1 });
      await setup({ rootNodes: [node], loadingNodeIds: new Set([keyFor(node)]) });

      expect(component.flatNodes()[0].isLoading).toBe(true);
    });

    it('assegna isLoading=false se il nodo non è in loadingNodeIds', async () => {
      await setup({ rootNodes: [makeNode({ id: 1 })] });
      expect(component.flatNodes()[0].isLoading).toBe(false);
    });

    it('assegna childrenError se presente nella mappa errori', async () => {
      const node  = makeNode({ id: 1 });
      const error = makeError(1);
      await setup({
        rootNodes: [node],
        nodeChildrenErrors: new Map([[keyFor(node), error]]),
      });

      expect(component.flatNodes()[0].childrenError).toBe(error);
    });

    it('assegna childrenError=undefined se non ci sono errori', async () => {
      await setup({ rootNodes: [makeNode({ id: 1 })] });
      expect(component.flatNodes()[0].childrenError).toBeUndefined();
    });
  });

  // ── Espansione nodi ───────────────────────────────────────────────────────

  describe('toggleNode — espansione', () => {
    it('non include figli se il nodo non è espanso', async () => {
      const parent = makeNode({ id: 1, hasChildren: true });
      await setup({
        rootNodes: [parent],
        nodeCache: new Map([[keyFor(parent), [makeNode({ id: 2 })]]])
      });

      expect(component.flatNodes()).toHaveLength(1);
    });

    it('include i figli con depth=1 dopo toggleNode', async () => {
      const parent = makeNode({ id: 1, hasChildren: true });
      const child  = makeNode({ id: 2 });
      await setup({
        rootNodes: [parent],
        nodeCache: new Map([[keyFor(parent), [child]]])
      });

      component.toggleNode(parent);
      fixture.detectChanges();

      const flat = component.flatNodes();
      expect(flat).toHaveLength(2);
      expect(flat[1].node.id).toBe(2);
      expect(flat[1].depth).toBe(1);
    });

    it('collassa i figli al secondo toggle sullo stesso nodo', async () => {
      const parent = makeNode({ id: 1, hasChildren: true });
      await setup({
        rootNodes: [parent],
        nodeCache: new Map([[keyFor(parent), [makeNode({ id: 2 })]]])
      });

      component.toggleNode(parent);
      fixture.detectChanges();
      expect(component.flatNodes()).toHaveLength(2);

      component.toggleNode(parent);
      fixture.detectChanges();
      expect(component.flatNodes()).toHaveLength(1);
    });

    it('segna isExpanded=true dopo il toggle', async () => {
      const parent = makeNode({ id: 1, hasChildren: true });
      await setup({ rootNodes: [parent] });

      component.toggleNode(parent);
      fixture.detectChanges();

      expect(component.flatNodes()[0].isExpanded).toBe(true);
    });

    it('segna isExpanded=false dopo il secondo toggle', async () => {
      const parent = makeNode({ id: 1, hasChildren: true });
      await setup({
        rootNodes: [parent],
        nodeCache: new Map([[keyFor(parent), []]])
      });

      component.toggleNode(parent);
      component.toggleNode(parent);
      fixture.detectChanges();

      expect(component.flatNodes()[0].isExpanded).toBe(false);
    });

    it('gestisce nodi con stesso id ma tipo diverso senza collisioni', async () => {
      const root = makeNode({ id: 1, type: 'dip', hasChildren: true });
      const child = makeNode({ id: 1, type: 'documentClass', hasChildren: true });

      await setup({
        rootNodes: [root],
        nodeCache: new Map([[keyFor(root), [child]]]),
      });

      component.toggleNode(root);
      fixture.detectChanges();

      expect(component.flatNodes()).toHaveLength(2);
      expect(component.flatNodes()[0].isExpanded).toBe(true);
      expect(component.flatNodes()[1].isExpanded).toBe(false);

      component.toggleNode(child);

      expect(facadeMock.loadChildren).toHaveBeenCalledWith(child);
    });
  });

  // ── loadChildren ─────────────────────────────────────────────────────────

  describe('toggleNode — loadChildren', () => {
    it('chiama facade.loadChildren se i figli non sono in cache', async () => {
      const parent = makeNode({ id: 1, hasChildren: true });
      await setup({ rootNodes: [parent] });

      component.toggleNode(parent);

      expect(facadeMock.loadChildren).toHaveBeenCalledWith(parent);
    });

    it('non chiama facade.loadChildren se i figli sono già in cache', async () => {
      const parent = makeNode({ id: 1, hasChildren: true });
      await setup({
        rootNodes: [parent],
        nodeCache: new Map([[keyFor(parent), [makeNode({ id: 2 })]]])
      });

      component.toggleNode(parent);

      expect(facadeMock.loadChildren).not.toHaveBeenCalled();
    });

    it('non chiama facade.loadChildren quando si collassa un nodo', async () => {
      const parent = makeNode({ id: 1, hasChildren: true });
      await setup({
        rootNodes: [parent],
        nodeCache: new Map([[keyFor(parent), []]])
      });

      component.toggleNode(parent); // espandi
      component.toggleNode(parent); // collassa

      expect(facadeMock.loadChildren).not.toHaveBeenCalled();
    });
  });

  // ── Reattività Signal ─────────────────────────────────────────────────────

  describe('reattività — Signal facade', () => {
    it('aggiorna flatNodes quando il facade aggiunge figli alla cache', async () => {
      const parent = makeNode({ id: 1, hasChildren: true });
      await setup({ rootNodes: [parent] });

      component.toggleNode(parent);
      fixture.detectChanges();
      expect(component.flatNodes()).toHaveLength(1); // nessun figlio ancora

      // il facade aggiorna lo stato (simula risposta IPC)
      facadeMock.setState(makeState({
        rootNodes: [parent],
        nodeCache: new Map([[keyFor(parent), [makeNode({ id: 2 })]]])
      }));
      fixture.detectChanges();

      expect(component.flatNodes()).toHaveLength(2);
    });

    it('mostra isLoading=true quando facade aggiunge nodo a loadingNodeIds', async () => {
      const node = makeNode({ id: 1 });
      await setup({ rootNodes: [node] });

      facadeMock.setState(makeState({
        rootNodes: [node],
        loadingNodeIds: new Set([keyFor(node)])
      }));
      fixture.detectChanges();

      expect(component.flatNodes()[0].isLoading).toBe(true);
    });
  });

  // ── Output nodeSelected ───────────────────────────────────────────────────

  describe('selectNode — @Output', () => {
    it('emette nodeSelected quando si chiama selectNode', async () => {
      const node = makeNode({ id: 1 });
      await setup({ rootNodes: [node] });

      const spy = vi.spyOn(component.nodeSelected, 'emit');
      component.selectNode(node);

      expect(spy).toHaveBeenCalledWith(node);
    });

    it('emette il nodo corretto tra più nodi presenti', async () => {
      const nodes = [makeNode({ id: 1 }), makeNode({ id: 2 }), makeNode({ id: 3 })];
      await setup({ rootNodes: nodes });

      const spy = vi.spyOn(component.nodeSelected, 'emit');
      component.selectNode(nodes[1]);

      expect(spy).toHaveBeenCalledWith(nodes[1]);
      expect(spy).not.toHaveBeenCalledWith(nodes[0]);
    });
  });
});