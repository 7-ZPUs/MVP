import { Component, EventEmitter, OnInit, Output, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImportFacade } from '../../../services/import.facade';
import { DipTreeNode, FlatNode } from '../../../domain/models';
import { ImportPhase } from '../../../domain/enums';
import { AppError } from '../../../../../shared/domain';
import { DipTreeNodeComponent } from '../../dumb/dip-tree-node/dip-tree-node.component';
import { AsyncStateWrapperComponent } from '../../../../../shared/ui/dumb/empty-state.component/async-state-wrapper.component';

@Component({
  selector: 'app-dip-tree',
  standalone: true,
  imports: [CommonModule, DipTreeNodeComponent, AsyncStateWrapperComponent],
  templateUrl: './dip-tree.component.html',
  styleUrls: ['./dip-tree.component.scss'],
})
export class DipTreeComponent implements OnInit {
  @Output() nodeSelected = new EventEmitter<DipTreeNode>();

  protected readonly ImportPhase = ImportPhase;

  readonly rootNodes: Signal<DipTreeNode[]>;
  readonly loading: Signal<boolean>;
  readonly phase: Signal<ImportPhase>;
  readonly error: Signal<AppError | null>;

  expandedIds = new Set<string>();
  loadingNodes = new Set<string>();

  constructor(private readonly facade: ImportFacade) {
    this.rootNodes = this.facade.rootNodes;
    this.loading = this.facade.loading;
    this.phase = this.facade.phase;
    // @ts-ignore - Accesso allo stato interno per scopi di UI
    this.error = this.facade['importState'].error;
  }

  ngOnInit(): void {
    this.facade.loadRootNodes();
  }

  toggleNode(nodeId: string): void {
    if (this.expandedIds.has(nodeId)) {
      this.expandedIds.delete(nodeId);
    } else {
      this.expandedIds.add(nodeId);
      this.loadChildrenFor(nodeId);
    }
  }

  private loadChildrenFor(nodeId: string): void {
    this.loadingNodes.add(nodeId);
    this.facade.loadChildren(nodeId).finally(() => this.loadingNodes.delete(nodeId));
  }

  onNodeSelected(node: DipTreeNode): void {
    this.facade.selectDocument(node);
    this.nodeSelected.emit(node);
  }

  onRetry(): void {
    this.facade.retryLoad();
  }

  getChildren(nodeId: string): DipTreeNode[] {
    // @ts-ignore
    return this.facade['importState'].nodeCache().get(nodeId) ?? [];
  }

  computeFlatNodes(): FlatNode[] {
    return [];
  }
}
