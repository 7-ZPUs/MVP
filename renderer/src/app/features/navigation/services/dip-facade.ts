import { Injectable, signal, Signal, WritableSignal, inject } from "@angular/core";
import { IpcGateway } from "./ipc-gateway";
import { IpcErrorHandlerService } from "../../../shared/services/ipc-error-handler.service";
import { DipTreeNode } from "../contracts/dip-tree-node";
import { AppError } from "../../../shared/domain";
import { NodeId } from "../domain/types";

export interface DipState {
  phase: 'ready' | 'loading' | 'idle';
  rootNodes: DipTreeNode[];
  nodeCache: Map<NodeId, DipTreeNode[]>;
  loadingNodeIds: Set<NodeId>;           // caricamenti parziali per nodo
  nodeChildrenErrors: Map<NodeId, AppError>;
  rootError?: AppError;
}

@Injectable({ providedIn: 'root' })
export class DipFacade {
  private readonly ipcGateway = inject(IpcGateway);

  private readonly _state: WritableSignal<DipState> = signal({
    phase: 'idle',
    rootNodes: [],
    nodeCache: new Map<NodeId, DipTreeNode[]>(),
    loadingNodeIds: new Set<NodeId>(),
    nodeChildrenErrors: new Map<NodeId, AppError>(),
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

  public async loadChildren(nodeId: NodeId): Promise<void> {
    // 1. Trova il nodo intero (serve il type per il gateway)
    const node = this.findNode(nodeId);
    if (!node) return;

    // 2. Segna il nodo come in caricamento (non tocca phase globale)
    this._state.update(s => ({
      ...s,
      loadingNodeIds: new Set(s.loadingNodeIds).add(nodeId),
      // rimuove eventuale errore precedente sullo stesso nodo
      nodeChildrenErrors: new Map(
        [...s.nodeChildrenErrors].filter(([id]) => id !== nodeId)
      ),
    }));

    try {
      const children: DipTreeNode[] = await this.ipcGateway.getChildren(node);

      this._state.update(s => {
        const newCache = new Map(s.nodeCache).set(nodeId, children);
        const newLoading = new Set(s.loadingNodeIds);
        newLoading.delete(nodeId);
        return { ...s, nodeCache: newCache, loadingNodeIds: newLoading };
      });
    } catch (error) {
      this._state.update(s => {
        const newLoading = new Set(s.loadingNodeIds);
        newLoading.delete(nodeId);
        const newErrors = new Map(s.nodeChildrenErrors).set(nodeId, error as AppError);
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