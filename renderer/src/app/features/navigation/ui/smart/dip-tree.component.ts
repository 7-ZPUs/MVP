import {
    Component, Input, Output, EventEmitter,
    inject, computed, signal
  } from "@angular/core";
  import { DipFacade } from "../../service/dip-facade";
  import { DipTreeNode } from "../../contracts/dip-tree-node";
  import { FlatNode } from "../../contracts/flat-node";
  import { CommonModule } from "@angular/common";
  import { DipTreeNodeComponent } from "../dumb/dip-tree-node.component";
  import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
  import { InlineErrorComponent } from "../dumb/inline-error.component";
  import { NodeId } from "../../domain/types";
  import { AppError } from "../../contracts/app-error";
  
  @Component({
    selector: 'app-dip-tree',
    standalone: true,
    imports: [
      CommonModule,
      CdkVirtualScrollViewport,
      ScrollingModule,
      DipTreeNodeComponent,
      InlineErrorComponent
    ],
    templateUrl: './dip-tree.html',
  })
  export class DipTree {
    // Se assente usa i rootNodes dal facade (pagina /dip)
    // Se presente usa quelli passati dal padre (sidebar AppShell)
    @Input() rootNodes?: DipTreeNode[];
    @Output() nodeSelected = new EventEmitter<DipTreeNode>();
  
    private readonly dipFacade = inject(DipFacade);
  
    // Signal locali al componente — modificarli triggera il ricalcolo
    private readonly expandedIds = signal<Set<NodeId>>(new Set());
  
    // computed() reagisce sia ai Signal locali che al Signal del facade
    readonly flatNodes = computed<FlatNode[]>(() => {
      const state = this.dipFacade.getState()();
      const expanded = this.expandedIds();
      const effectiveRoots = this.rootNodes ?? state.rootNodes;
  
      return this.buildFlatTree(
        effectiveRoots,
        expanded,
        state.nodeCache,
        state.loadingNodeIds,
        state.nodeChildrenErrors,
        0
      );
    });
  
    private buildFlatTree(
      nodes: DipTreeNode[],
      expandedIds: Set<NodeId>,
      nodeCache: Map<NodeId, DipTreeNode[]>,
      loadingNodeIds: Set<NodeId>,
      errors: Map<NodeId, AppError>,
      depth: number
    ): FlatNode[] {
      const result: FlatNode[] = [];
  
      for (const node of nodes) {
        result.push({
          node,
          depth,
          hasChildren: node.hasChildren,
          isLoading: loadingNodeIds.has(node.id),
          isExpanded: expandedIds.has(node.id),
          childrenError: errors.get(node.id),
        });
  
        if (expandedIds.has(node.id)) {
          const children = nodeCache.get(node.id) ?? [];
          result.push(...this.buildFlatTree(
            children, expandedIds, nodeCache, loadingNodeIds, errors, depth + 1
          ));
        }
      }
  
      return result;
    }
  
    public toggleNode(nodeId: NodeId): void {
      // Aggiorna il Set in modo immutabile per triggerare il Signal
      this.expandedIds.update(ids => {
        const next = new Set(ids);
        if (next.has(nodeId)) {
          next.delete(nodeId);
        } else {
          next.add(nodeId);
          // Carica i figli solo se non già in cache
          const state = this.dipFacade.getState()();
          if (!state.nodeCache.has(nodeId)) {
            this.dipFacade.loadChildren(nodeId);
          }
        }
        return next;
      });
    }
  
    public selectNode(node: DipTreeNode): void {
      this.nodeSelected.emit(node);
    }
  }