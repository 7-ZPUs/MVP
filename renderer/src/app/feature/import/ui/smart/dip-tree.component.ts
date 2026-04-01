import { Component, EventEmitter, OnInit, Output, Signal } from '@angular/core';
import { CommonModule }               from '@angular/common';
import { ImportFacade }               from '../../services/import.facade';
import { DipTreeNode, FlatNode }      from '../../domain/models';
import { ImportPhase }                from '../../domain/enums';
import { AppError }                   from '../../../../shared/domain/app-error';
import { DipTreeNodeComponent }       from '../dumb/dip-tree-node.component';
import { AsyncStateWrapperComponent } from '../../../../shared/ui/dumb/empty-state.component/async-state-wrapper.component';
 
@Component({
  selector:   'app-dip-tree',
  standalone: true,
  imports:    [CommonModule, DipTreeNodeComponent, AsyncStateWrapperComponent],
  template: `
    <app-async-state-wrapper
      [loading]="loading()"
      [error]="error()"
      [empty]="phase() === ImportPhase.EMPTY"
      [ariaLabel]="'Albero documenti DIP'"
      (retry)="onRetry()">
 
      <div slot="loading"
           role="status"
           aria-live="polite"
           aria-label="Caricamento albero DIP in corso">
        <span>Caricamento albero DIP…</span>
      </div>
 
      <div slot="empty"
           role="status"
           aria-live="polite"
           aria-label="Nessun documento presente">
        <span>Nessun documento presente nel DIP.</span>
      </div>
 
      <!-- UC-1/2/3: albero navigabile da tastiera -->
      <div role="tree" aria-label="Albero documenti DIP">
        @for (node of rootNodes(); track node.id) {
 
          <div role="group">
            <app-dip-tree-node
              [node]="node"
              [isExpanded]="expandedIds.has(node.id)"
              [isLoading]="loadingNodes.has(node.id)"
              [level]="0"
              (toggle)="toggleNode($event)"
              (nodeSelected)="onNodeSelected($event)"
            />
 
            @if (expandedIds.has(node.id)) {
              <div role="group" [attr.aria-label]="'Figli di ' + node.label">
                @for (child of getChildren(node.id); track child.id) {
                  <app-dip-tree-node
                    [node]="child"
                    [isExpanded]="expandedIds.has(child.id)"
                    [isLoading]="loadingNodes.has(child.id)"
                    [level]="1"
                    (toggle)="toggleNode($event)"
                    (nodeSelected)="onNodeSelected($event)"
                  />
                }
              </div>
            }
          </div>
 
        }
      </div>
 
    </app-async-state-wrapper>
  `,
})
export class DipTreeComponent implements OnInit {
 
  @Output() nodeSelected = new EventEmitter<DipTreeNode>();
 
  protected readonly ImportPhase = ImportPhase;
 
  readonly rootNodes: Signal<DipTreeNode[]>;
  readonly loading:   Signal<boolean>;
  readonly phase:     Signal<ImportPhase>;
  readonly error:     Signal<AppError | null>;
 
  expandedIds  = new Set<string>();
  loadingNodes = new Set<string>();
 
  constructor(private readonly facade: ImportFacade) {
    this.rootNodes = this.facade.rootNodes;
    this.loading   = this.facade.loading;
    this.phase     = this.facade.phase;
    this.error     = this.facade['importState'].error;
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
    this.facade.loadChildren(nodeId)
      .finally(() => this.loadingNodes.delete(nodeId));
  }
 
  onNodeSelected(node: DipTreeNode): void {
    this.facade.selectDocument(node);
    this.nodeSelected.emit(node);
  }
 
  onRetry(): void {
    this.facade.retryLoad();
  }
 
  getChildren(nodeId: string): DipTreeNode[] {
    return this.facade['importState'].nodeCache().get(nodeId) ?? [];
  }
 
  computeFlatNodes(): FlatNode[] {
    return [];
  }
}