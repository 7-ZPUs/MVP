import { TestBed } from "@angular/core/testing";
import { vi } from "vitest";
import { DipFacade } from "./dip-facade";
import { IpcGateway } from "./ipc-gateway";
import { DipTreeNode } from "../contracts/dip-tree-node";
import { AppError } from "../../../shared/domain";
import { ErrorCode, ErrorCategory, ErrorSeverity } from "../../../shared/domain/error.enum";
import { buildNodeKey } from "../domain/node-key";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const makeNode = (id: number, type: DipTreeNode['type'] = 'documentClass'): DipTreeNode => ({
  id,
  name: `Node ${id}`,
  type,
  hasChildren: false,
});

const makeError = (): AppError => ({
  code: ErrorCode.IPC_ERROR,
  message: 'Errore test',
  category: ErrorCategory.DOMAIN,
  severity: ErrorSeverity.ERROR,
  recoverable: true,
  source: 'IPC Gateway',
  context: null,
  detail: null,
});

const makeGatewayMock = () => ({
  getRootDip: vi.fn(),
  getChildren: vi.fn(),
});

const keyFor = (node: DipTreeNode) => buildNodeKey(node);

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('DipFacade', () => {
  let facade: DipFacade;
  let gatewayMock: ReturnType<typeof makeGatewayMock>;

  const setup = () => {
    gatewayMock = makeGatewayMock();

    TestBed.configureTestingModule({
      providers: [
        DipFacade,
        { provide: IpcGateway, useValue: gatewayMock },
      ],
    });

    facade = TestBed.inject(DipFacade);
  };

  afterEach(() => TestBed.resetTestingModule());

  // ── Stato iniziale ────────────────────────────────────────────────────────

  describe('stato iniziale', () => {
    it('phase è idle', () => {
      setup();
      expect(facade.getState()().phase).toBe('idle');
    });

    it('rootNodes è array vuoto', () => {
      setup();
      expect(facade.getState()().rootNodes).toHaveLength(0);
    });

    it('nodeCache è mappa vuota', () => {
      setup();
      expect(facade.getState()().nodeCache.size).toBe(0);
    });

    it('loadingNodeIds è set vuoto', () => {
      setup();
      expect(facade.getState()().loadingNodeIds.size).toBe(0);
    });

    it('nodeChildrenErrors è mappa vuota', () => {
      setup();
      expect(facade.getState()().nodeChildrenErrors.size).toBe(0);
    });
  });

  // ── loadRootNodes — successo ───────────────────────────────────────────────

  describe('loadRootNodes — successo', () => {
    it('imposta phase=loading durante il caricamento', async () => {
      setup();
      const rootNode = makeNode(1);
      // non risolve subito — cattura lo stato intermedio
      let phaseWhileLoading: string | undefined;
      gatewayMock.getRootDip.mockImplementation(() => {
        phaseWhileLoading = facade.getState()().phase;
        return Promise.resolve(rootNode);
      });

      await facade.loadRootNodes(1);

      expect(phaseWhileLoading).toBe('loading');
    });

    it('imposta phase=ready dopo il successo', async () => {
      setup();
      gatewayMock.getRootDip.mockResolvedValue(makeNode(1));

      await facade.loadRootNodes(1);

      expect(facade.getState()().phase).toBe('ready');
    });

    it('popola rootNodes con il nodo ritornato dal gateway', async () => {
      setup();
      const rootNode = makeNode(1);
      gatewayMock.getRootDip.mockResolvedValue(rootNode);

      await facade.loadRootNodes(1);

      expect(facade.getState()().rootNodes).toEqual([rootNode]);
    });

    it('chiama getRootDip con il dipId corretto', async () => {
      setup();
      gatewayMock.getRootDip.mockResolvedValue(makeNode(1));

      await facade.loadRootNodes(42);

      expect(gatewayMock.getRootDip).toHaveBeenCalledWith(42);
    });

    it('azzera rootError al nuovo caricamento', async () => {
      setup();
      // prima simula un errore
      gatewayMock.getRootDip.mockRejectedValueOnce(makeError());
      await facade.loadRootNodes(1);
      expect(facade.getState()().rootError).toBeDefined();

      // poi ricarica con successo
      gatewayMock.getRootDip.mockResolvedValue(makeNode(1));
      await facade.loadRootNodes(1);

      expect(facade.getState()().rootError).toBeUndefined();
    });
  });

  // ── loadRootNodes — errore ────────────────────────────────────────────────

  describe('loadRootNodes — errore', () => {
    it('imposta phase=idle dopo un errore', async () => {
      setup();
      gatewayMock.getRootDip.mockRejectedValue(makeError());

      await facade.loadRootNodes(1);

      expect(facade.getState()().phase).toBe('idle');
    });

    it('popola rootError con l\'AppError ricevuto', async () => {
      setup();
      const error = makeError();
      gatewayMock.getRootDip.mockRejectedValue(error);

      await facade.loadRootNodes(1);

      expect(facade.getState()().rootError).toEqual(error);
    });

    it('non modifica rootNodes in caso di errore', async () => {
      setup();
      gatewayMock.getRootDip.mockRejectedValue(makeError());

      await facade.loadRootNodes(1);

      expect(facade.getState()().rootNodes).toHaveLength(0);
    });
  });

  // ── loadChildren — nodo non trovato ───────────────────────────────────────

  describe('loadChildren — nodo non trovato', () => {
    it('non chiama getChildren se il nodo non esiste nel cache né in rootNodes', async () => {
      setup();

      await facade.loadChildren(999);

      expect(gatewayMock.getChildren).not.toHaveBeenCalled();
    });

    it('non modifica lo stato se il nodo non esiste', async () => {
      setup();
      const stateBefore = facade.getState()();

      await facade.loadChildren(999);

      expect(facade.getState()().phase).toBe(stateBefore.phase);
    });
  });

  // ── loadChildren — successo ───────────────────────────────────────────────

  describe('loadChildren — successo', () => {
    it('aggiunge il nodeId a loadingNodeIds durante il caricamento', async () => {
      setup();
      const parent = makeNode(1);
      gatewayMock.getRootDip.mockResolvedValue(parent);
      await facade.loadRootNodes(1);

      let loadingDuringCall = false;
      gatewayMock.getChildren.mockImplementation(() => {
        loadingDuringCall = facade.getState()().loadingNodeIds.has(keyFor(parent));
        return Promise.resolve([]);
      });

      await facade.loadChildren(parent);

      expect(loadingDuringCall).toBe(true);
    });

    it('rimuove il nodeId da loadingNodeIds dopo il successo', async () => {
      setup();
      const parent = makeNode(1);
      gatewayMock.getRootDip.mockResolvedValue(parent);
      await facade.loadRootNodes(1);
      gatewayMock.getChildren.mockResolvedValue([]);

      await facade.loadChildren(parent);

      expect(facade.getState()().loadingNodeIds.has(keyFor(parent))).toBe(false);
    });

    it('aggiunge i figli alla nodeCache', async () => {
      setup();
      const parent = makeNode(1);
      const children = [makeNode(2), makeNode(3)];
      gatewayMock.getRootDip.mockResolvedValue(parent);
      await facade.loadRootNodes(1);
      gatewayMock.getChildren.mockResolvedValue(children);

      await facade.loadChildren(parent);

      expect(facade.getState()().nodeCache.get(keyFor(parent))).toEqual(children);
    });

    it('rimuove l\'errore precedente sullo stesso nodo prima di ricaricare', async () => {
      setup();
      const parent = makeNode(1);
      gatewayMock.getRootDip.mockResolvedValue(parent);
      await facade.loadRootNodes(1);

      // primo caricamento fallisce
      gatewayMock.getChildren.mockRejectedValueOnce(makeError());
      await facade.loadChildren(parent);
      expect(facade.getState()().nodeChildrenErrors.has(keyFor(parent))).toBe(true);

      // secondo caricamento ha successo
      gatewayMock.getChildren.mockResolvedValue([makeNode(2)]);
      await facade.loadChildren(parent);

      expect(facade.getState()().nodeChildrenErrors.has(keyFor(parent))).toBe(false);
    });

    it('trova il nodo nella nodeCache (non solo in rootNodes)', async () => {
      setup();
      const root = makeNode(1);
      const child = makeNode(2);
      const grandchild = makeNode(3);
      gatewayMock.getRootDip.mockResolvedValue(root);
      await facade.loadRootNodes(1);
      gatewayMock.getChildren.mockResolvedValueOnce([child]);
      await facade.loadChildren(root);
      gatewayMock.getChildren.mockResolvedValue([grandchild]);

      await facade.loadChildren(child); // nodo nella cache, non in rootNodes

      expect(facade.getState()().nodeCache.get(keyFor(child))).toEqual([grandchild]);
    });
  });

  // ── loadChildren — errore ─────────────────────────────────────────────────

  describe('loadChildren — errore', () => {
    it('rimuove il nodeId da loadingNodeIds dopo un errore', async () => {
      setup();
      const parent = makeNode(1);
      gatewayMock.getRootDip.mockResolvedValue(parent);
      await facade.loadRootNodes(1);
      gatewayMock.getChildren.mockRejectedValue(makeError());

      await facade.loadChildren(parent);

      expect(facade.getState()().loadingNodeIds.has(keyFor(parent))).toBe(false);
    });

    it('popola nodeChildrenErrors con l\'errore del nodo specifico', async () => {
      setup();
      const parent = makeNode(1);
      const error = makeError();
      gatewayMock.getRootDip.mockResolvedValue(parent);
      await facade.loadRootNodes(1);
      gatewayMock.getChildren.mockRejectedValue(error);

      await facade.loadChildren(parent);

      expect(facade.getState()().nodeChildrenErrors.get(keyFor(parent))).toEqual(error);
    });

    it('non modifica la phase globale in caso di errore parziale', async () => {
      setup();
      const parent = makeNode(1);
      gatewayMock.getRootDip.mockResolvedValue(parent);
      await facade.loadRootNodes(1);
      gatewayMock.getChildren.mockRejectedValue(makeError());

      await facade.loadChildren(parent);

      // phase rimane 'ready' — l'errore è parziale, non blocca l'albero
      expect(facade.getState()().phase).toBe('ready');
    });

    it('un errore su un nodo non contamina gli altri nodi', async () => {
      setup();
      const root = makeNode(1);
      const child2 = makeNode(2);
      gatewayMock.getRootDip.mockResolvedValue(root);
      await facade.loadRootNodes(1);
      // carica nodo 2 con successo
      gatewayMock.getChildren.mockResolvedValueOnce([child2]);
      await facade.loadChildren(root);
      // nodo 2 fallisce
      gatewayMock.getChildren.mockRejectedValue(makeError());
      await facade.loadChildren(child2);

      expect(facade.getState()().nodeChildrenErrors.has(keyFor(child2))).toBe(true);
      expect(facade.getState()().nodeChildrenErrors.has(keyFor(root))).toBe(false);
    });
  });
});