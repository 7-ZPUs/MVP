import { Injectable, Signal, computed, signal } from '@angular/core';
import { AppError }                             from '../../../shared/domain/app-error';
import { DipTreeNode }                          from './models';
import { ImportPhase, StatoIndicizzazione }     from './enums';
 
export interface ImportStateSnapshot {
  phase:              ImportPhase;
  rootNodes:          DipTreeNode[];
  nodeCache:          Map<string, DipTreeNode[]>;
  nodeChildrenErrors: Map<string, AppError>;
  selectedDocument:   DipTreeNode | null;
  indicizzazione:     StatoIndicizzazione;
  loading:            boolean;
  error:              AppError | null;
}
 
const INITIAL: ImportStateSnapshot = {
  phase:              ImportPhase.IDLE,
  rootNodes:          [],
  nodeCache:          new Map(),
  nodeChildrenErrors: new Map(),
  selectedDocument:   null,
  indicizzazione:     StatoIndicizzazione.NON_COMPLETATA,
  loading:            false,
  error:              null,
};
 
@Injectable({ providedIn: 'root' })
export class ImportState {
  private readonly _state = signal<ImportStateSnapshot>({ ...INITIAL });
 
  readonly rootNodes:          Signal<DipTreeNode[]>         = computed(() => this._state().rootNodes);
  readonly selectedDocument:   Signal<DipTreeNode | null>    = computed(() => this._state().selectedDocument);
  readonly phase:              Signal<ImportPhase>           = computed(() => this._state().phase);
  readonly loading:            Signal<boolean>               = computed(() => this._state().loading);
  readonly error:              Signal<AppError | null>       = computed(() => this._state().error);
  readonly indicizzazione:     Signal<StatoIndicizzazione>   = computed(() => this._state().indicizzazione);
  readonly nodeCache:          Signal<Map<string, DipTreeNode[]>> = computed(() => this._state().nodeCache);
  readonly nodeChildrenErrors: Signal<Map<string, AppError>> = computed(() => this._state().nodeChildrenErrors);
 
  /** UC-6 */
  isEmpty(): boolean { return this._state().phase === ImportPhase.EMPTY; }
 
  setRootNodes(nodes: DipTreeNode[]): void {
    this._state.update(s => ({
      ...s,
      rootNodes: nodes,
      phase:     nodes.length === 0 ? ImportPhase.EMPTY : ImportPhase.READY,
      loading:   false,
      error:     null,
    }));
  }
 
  setChildrenForNode(nodeId: string, children: DipTreeNode[]): void {
    const next = new Map(this._state().nodeCache);
    next.set(nodeId, children);
    this._state.update(s => ({ ...s, nodeCache: next }));
  }
 
  setChildrenError(nodeId: string, error: AppError): void {
    const next = new Map(this._state().nodeChildrenErrors);
    next.set(nodeId, error);
    this._state.update(s => ({ ...s, nodeChildrenErrors: next }));
  }
 
  setSelectedDocument(node: DipTreeNode | null): void {
    this._state.update(s => ({ ...s, selectedDocument: node }));
  }
 
  setLoading(loading: boolean): void {
    this._state.update(s => ({
      ...s, loading,
      phase: loading ? ImportPhase.LOADING : s.phase,
    }));
  }
 
  setError(error: AppError): void {
    this._state.update(s => ({ ...s, error, phase: ImportPhase.ERROR, loading: false }));
  }
 
  setIndicizzazione(stato: StatoIndicizzazione): void {
    this._state.update(s => ({ ...s, indicizzazione: stato }));
  }
 
  getSnapshot(): ImportStateSnapshot { return this._state(); }
 
  reset(): void {
    this._state.set({ ...INITIAL, nodeCache: new Map(), nodeChildrenErrors: new Map() });
  }
}