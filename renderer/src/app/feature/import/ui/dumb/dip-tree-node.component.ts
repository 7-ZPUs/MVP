import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DipTreeNode }  from '../../domain/models';
import { NodeType }     from '../../domain/enums';
 
@Component({
  selector:   'app-dip-tree-node',
  standalone: true,
  imports:    [CommonModule],
  template: `
    <div class="tree-node"
         role="treeitem"
         [attr.aria-expanded]="node.hasChildren ? isExpanded : null"
         [attr.aria-selected]="false"
         [attr.aria-busy]="isLoading"
         [attr.aria-label]="nodeAriaLabel"
         [attr.aria-level]="level + 1"
         [class.is-expanded]="isExpanded"
         [class.is-loading]="isLoading"
         [attr.data-type]="node.type"
         tabindex="0"
         (click)="onClick()"
         (keydown.enter)="onClick()"
         (keydown.space)="onClick(); $event.preventDefault()">
 
      <span class="indent" [style.width.px]="level * 16" aria-hidden="true"></span>
 
      @if (node.hasChildren) {
        <button class="toggle-btn"
                [attr.aria-label]="isExpanded ? 'Comprimi ' + node.label : 'Espandi ' + node.label"
                (click)="onToggle(); $event.stopPropagation()"
                (keydown.enter)="onToggle(); $event.stopPropagation()">
          {{ isExpanded ? '▾' : '▸' }}
        </button>
      } @else {
        <span class="leaf-spacer" aria-hidden="true"></span>
      }
 
      @if (isLoading) {
        <span class="spinner" role="status" aria-label="Caricamento figli in corso"></span>
      }
 
      <span class="node-icon" aria-hidden="true">
        @switch (node.type) {
          @case (NodeType.CLASSE_DOCUMENTALE) { 📁 }
          @case (NodeType.PROCESSO)           { 🔄 }
          @case (NodeType.DOCUMENTO)          { 📄 }
        }
      </span>
 
      <span class="node-label">{{ node.label }}</span>
 
    </div>
  `,
})
export class DipTreeNodeComponent {
  @Input({ required: true }) node!:       DipTreeNode;
  @Input()                   isExpanded = false;
  @Input()                   isLoading  = false;
  @Input()                   level      = 0;
 
  @Output() toggle       = new EventEmitter<string>();
  @Output() nodeSelected = new EventEmitter<DipTreeNode>();
 
  protected readonly NodeType = NodeType;
 
  get nodeAriaLabel(): string {
    const typeLabel: Record<NodeType, string> = {
      [NodeType.CLASSE_DOCUMENTALE]: 'Classe documentale',
      [NodeType.PROCESSO]:           'Processo',
      [NodeType.DOCUMENTO]:          'Documento',
    };
    return `${typeLabel[this.node.type]}: ${this.node.label}`;
  }
 
  onToggle(): void { this.toggle.emit(this.node.id); }
  onClick():  void { this.nodeSelected.emit(this.node); }
}