import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  computed,
  signal,
  ViewChild,
  effect,
} from "@angular/core";
  import { DipFacade } from "../../services/dip-facade";
  import { DipTreeNode } from "../../contracts/dip-tree-node";
  import { FlatNode } from "../../contracts/flat-node";
  import { CommonModule } from "@angular/common";
  import { DipTreeNodeComponent } from "../dumb/dip-tree-node.component";
  import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
  import { AppError } from "../../contracts/app-error";
  import { NodeKey, buildNodeKey } from "../../domain/node-key";
  
  @Component({
    selector: 'app-dip-tree',
    standalone: true,
    imports: [
      CommonModule,
      CdkVirtualScrollViewport,
      ScrollingModule,
      DipTreeNodeComponent,
    ],
    templateUrl: './dip-tree.html',
    styleUrl: './dip-tree.component.scss',
  })
  export class DipTree {
    // Se assente usa i rootNodes dal facade (pagina /dip)
    // Se presente usa quelli passati dal padre (sidebar AppShell)
    @Input() rootNodes?: DipTreeNode[];
    @Output() nodeSelected = new EventEmitter<DipTreeNode>();
  
    private readonly dipFacade = inject(DipFacade);
  
    @ViewChild(CdkVirtualScrollViewport)
    private viewport?: CdkVirtualScrollViewport;

    // Signal locali al componente — modificarli triggera il ricalcolo
    private readonly expandedNodeKeys = signal<Set<NodeKey>>(new Set());
    private readonly selectedNodeKey = signal<NodeKey | null>(null);

    constructor() {
      effect(() => {
        this.flatNodes().length;
        queueMicrotask(() => this.viewport?.checkViewportSize());
      });
    }
  
    // computed() reagisce sia ai Signal locali che al Signal del facade
    readonly flatNodes = computed<FlatNode[]>(() => {
      const state = this.dipFacade.getState()();
      const expanded = this.expandedNodeKeys();
      const selectedNodeKey = this.selectedNodeKey();
      const effectiveRoots = this.rootNodes ?? state.rootNodes;
  
      return this.buildFlatTree(
        effectiveRoots,
        expanded,
        state.nodeCache,
        state.loadingNodeIds,
        state.nodeChildrenErrors,
        selectedNodeKey,
        0
      );
    });
  
    private buildFlatTree(
      nodes: DipTreeNode[],
      expandedNodeKeys: Set<NodeKey>,
      nodeCache: Map<NodeKey, DipTreeNode[]>,
      loadingNodeIds: Set<NodeKey>,
      errors: Map<NodeKey, AppError>,
      selectedNodeKey: NodeKey | null,
      depth: number
    ): FlatNode[] {
      const result: FlatNode[] = [];
  
      for (const node of nodes) {
        const nodeKey = buildNodeKey(node);
        result.push({
          node,
          depth,
          hasChildren: node.hasChildren,
          isLoading: loadingNodeIds.has(nodeKey),
          isExpanded: expandedNodeKeys.has(nodeKey),
          isSelected: selectedNodeKey === nodeKey,
          childrenError: errors.get(nodeKey),
        });
  
        if (expandedNodeKeys.has(nodeKey)) {
          const children = nodeCache.get(nodeKey) ?? [];
          result.push(...this.buildFlatTree(
            children,
            expandedNodeKeys,
            nodeCache,
            loadingNodeIds,
            errors,
            selectedNodeKey,
            depth + 1,
          ));
        }
      }
  
      return result;
    }
  
    public toggleNode(node: DipTreeNode): void {
      // Aggiorna il Set in modo immutabile per triggerare il Signal
      const state = this.dipFacade.getState()();
      const nodeKey = buildNodeKey(node);
      const isExpanded = this.expandedNodeKeys().has(nodeKey);

      this.expandedNodeKeys.update(keys => {
        const next = new Set(keys);
        if (next.has(nodeKey)) {
          next.delete(nodeKey);
        } else {
          next.add(nodeKey);
        }
        return next;
      });

      // Carica i figli solo quando si espande e se non gia` in cache.
      if (!isExpanded && !state.nodeCache.has(nodeKey)) {
        void this.dipFacade.loadChildren(node).catch(() => {
          // DipFacade aggiorna gia` lo stato error/loading per nodo.
        });
      }
    }
  
    public retryNode(node: DipTreeNode): void {
      void this.dipFacade.loadChildren(node).catch(() => {
        // DipFacade gestisce error state.
      });
    }

    public selectNode(node: DipTreeNode): void {
      this.selectedNodeKey.set(buildNodeKey(node));
      this.nodeSelected.emit(node);
    }

    trackByFlatNode(_index: number, flatNode: FlatNode): string {
      return buildNodeKey(flatNode.node);
    }
  }