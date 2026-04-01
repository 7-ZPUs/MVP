import { Input, Output, EventEmitter, inject, Component, effect } from "@angular/core";
import { DipFacade } from "../../service/dip-facade";
import { DipTreeNode } from "../../contracts/dip-tree-node";
import { FlatNode } from "../../contracts/flat-node";
import { CommonModule } from "@angular/common";
import { DipTreeNodeComponent } from "../dumb/dip-tree-node.component";
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { InlineErrorComponent } from "../dumb/inline-error.component";
import { NodeId } from "../../domain/types";

@Component ({
    selector: 'app-dip-tree',
    standalone: true,
    imports: [CommonModule,
    CdkVirtualScrollViewport,
    ScrollingModule,
    DipTreeNodeComponent,
    InlineErrorComponent],
    templateUrl: './dip-tree.html',
})
export class DipTree {
    @Input() rootNodes!: DipTreeNode[];
    @Output() nodeSelected = new EventEmitter<DipTreeNode>();

    flatNodes: FlatNode[] = [];
    private readonly loadingNodes: Set<NodeId> = new Set<NodeId>();
    private readonly expandedIds : Set<NodeId> = new Set<NodeId>();
    private readonly dipFacade = inject(DipFacade);

    ngOnInit() {
        effect(() => {
            this.flatNodes = this.computeFlatNodes();
        })

        this.dipFacade.loadRootNodes();
    }

    public async toggleNode(nodeId: NodeId): Promise<void> {

        if (this.expandedIds.has(nodeId)) {
          this.expandedIds.delete(nodeId);
        } else {
        
          this.expandedIds.add(nodeId);
      
          const state = this.dipFacade.getState()();
      
          if (!state.nodeCache.has(nodeId)) {
            this.loadingNodes.add(nodeId);
      
            await this.dipFacade.loadChildren(nodeId);
      
            this.loadingNodes.delete(nodeId);
          }
        }
    }

    public computeFlatNodes(): FlatNode[] {
        const result: FlatNode[] = [];
        const state = this.dipFacade.getState()();
    
        const visit = (nodes: DipTreeNode[], depth: number) => {
            for (const node of nodes) {
                const nodeId = node.id;
    
                result.push({
                    node,
                    depth,
                    hasChildren: node.hasChildren,
                    isLoading: this.loadingNodes.has(nodeId),
                    isExpanded: this.expandedIds.has(nodeId),
                    childrenError: state.nodeChildrenErrors.get(nodeId),
                });
        
                if (this.expandedIds.has(nodeId)) {
                    const children = state.nodeCache.get(nodeId);
        
                    if (children) {
                        visit(children, depth + 1);
                    }
                }
            }
        };
        
        visit(this.rootNodes, 0);
        
        return result;
    }

    public selectNode(node: DipTreeNode): void {
        this.nodeSelected.emit(node);
    }
}