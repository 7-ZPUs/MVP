import { Injectable, signal, Signal, WritableSignal, inject } from "@angular/core";
import { IpcGateway } from "./ipc-gateway";
import { DipTreeNode } from "../contracts/dip-tree-node";
import { AppError } from "../../../shared/domain";
import { NodeId } from "../domain/types";
import { buildNodeKey, NodeKey } from "../domain/node-key";

export interface DipState {
  phase: 'ready' | 'loading' | 'idle';
  rootNodes: DipTreeNode[];
  nodeCache: Map<NodeKey, DipTreeNode[]>;
  loadingNodeIds: Set<NodeKey>;           // caricamenti parziali per nodo
  nodeChildrenErrors: Map<NodeKey, AppError>;
  rootError?: AppError;
}

@Injectable({ providedIn: 'root' })
export class DipFacade {
  private readonly ipcGateway = inject(IpcGateway);

  private readonly _state: WritableSignal<DipState> = signal({
    phase: 'idle',
    rootNodes: [],
    nodeCache: new Map<NodeKey, DipTreeNode[]>(),
    loadingNodeIds: new Set<NodeKey>(),
    nodeChildrenErrors: new Map<NodeKey, AppError>(),
  });

  public getState(): Signal<DipState> {
    return this._state.asReadonly();
  }

  // ── Root ──────────────────────────────────────────────────

  public async loadRootNodes(dipId: number): Promise<void> {
    this._state.update(s => ({ ...s, phase: 'loading', rootError: undefined }));

    try {
      const rootNode: DipTreeNode = await this.ipcGateway.getRootDip(dipId);

      this._state.update(s => ({
        ...s,
        phase: 'ready',
        rootNodes: [rootNode],   // getRootDip ritorna un nodo solo
      }));
    } catch (error) {
      // IpcGateway rilancia già un AppError tradotto
      this._state.update(s => ({
        ...s,
        phase: 'idle',
        rootError: error as AppError,
      }));
    }
  }

  // ── Children ──────────────────────────────────────────────

  public async loadChildren(target: NodeId | DipTreeNode): Promise<void> {
    // In produzione viene passato il nodo completo; il supporto per NodeId
    // resta per compatibilita` con test legacy.
    const node = typeof target === 'number' ? this.findNode(target) : target;
    if (!node) return;
    const nodeKey = buildNodeKey(node);

    // 2. Segna il nodo come in caricamento (non tocca phase globale)
    this._state.update(s => ({
      ...s,
      loadingNodeIds: new Set(s.loadingNodeIds).add(nodeKey),
      // rimuove eventuale errore precedente sullo stesso nodo
      nodeChildrenErrors: (() => {
        const next = new Map(s.nodeChildrenErrors);
        next.delete(nodeKey);
        return next;
      })(),
    }));

    try {
      const children: DipTreeNode[] = await this.ipcGateway.getChildren(node);

      this._state.update(s => {
        const newCache = new Map(s.nodeCache).set(nodeKey, children);
        const newLoading = new Set(s.loadingNodeIds);
        newLoading.delete(nodeKey);
        return { ...s, nodeCache: newCache, loadingNodeIds: newLoading };
      });
    } catch (error) {
      this._state.update(s => {
        const newLoading = new Set(s.loadingNodeIds);
        newLoading.delete(nodeKey);
        const newErrors = new Map(s.nodeChildrenErrors).set(nodeKey, error as AppError);
        return { ...s, loadingNodeIds: newLoading, nodeChildrenErrors: newErrors };
      });
    }
  }

  // ── Helpers ───────────────────────────────────────────────

  /**
   * Cerca un nodo prima nei rootNodes, poi nella nodeCache.
   * Necessario perché getChildren ha bisogno del tipo del nodo.
   */
  private findNode(nodeId: NodeId): DipTreeNode | undefined {
    const state = this._state();

    const inRoot = state.rootNodes.find(n => n.id === nodeId);
    if (inRoot) return inRoot;

    for (const children of state.nodeCache.values()) {
      const found = children.find(n => n.id === nodeId);
      if (found) return found;
    }

    return undefined;
  }
}