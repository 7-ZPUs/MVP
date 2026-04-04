import { Input, Component, Output, EventEmitter, ChangeDetectionStrategy } from "@angular/core";
import { FlatNode } from "../../contracts/flat-node";
import { DipTreeNode } from "../../contracts/dip-tree-node";
import { CommonModule } from "@angular/common";
import { InlineErrorComponent } from "./inline-error.component";

@Component({
    selector: 'app-dip-tree-node',
    standalone: true,
    templateUrl: './dip-tree-node.html',  
    imports: [CommonModule, InlineErrorComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        styles: [
            `
                .tree-node {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    min-height: 40px;
                    border-radius: 6px;
                    margin: 2px 6px;
                    padding-right: 8px;
                    cursor: pointer;
                    user-select: none;
                }

                .tree-node:hover {
                    background: #f8fafc;
                }

                .tree-node.tree-node-selected {
                    background: #e2e8f0;
                }

                .toggle-icon {
                    width: 24px;
                    height: 24px;
                    border: none;
                    border-radius: 4px;
                    background: transparent;
                    color: #334155;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0;
                }

                .toggle-icon:disabled {
                    cursor: progress;
                    opacity: 0.7;
                }

                .leaf-placeholder {
                    width: 24px;
                    height: 24px;
                    display: inline-block;
                }

                .node-name {
                    flex: 1;
                    min-width: 0;
                    color: #0f172a;
                    font-size: 0.92rem;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .node-error {
                    margin-left: 8px;
                }
            `,
        ],
})
export class DipTreeNodeComponent {
    @Input() flatNode!: FlatNode;
        @Output() toggle = new EventEmitter<DipTreeNode>();
        @Output() retry = new EventEmitter<DipTreeNode>();
    @Output() nodeSelected = new EventEmitter<DipTreeNode>();

    public onToggle(event: MouseEvent): void {
        event.stopPropagation();
                this.toggle.emit(this.flatNode.node);
        }

        public onRetry(): void {
                this.retry.emit(this.flatNode.node);
    }

    public onClick(): void {
        this.nodeSelected.emit(this.flatNode.node);
    }

        public onKeydown(event: KeyboardEvent): void {
                if (!this.flatNode.hasChildren || this.flatNode.isLoading) {
                        return;
                }

                if (event.key === 'ArrowRight' && !this.flatNode.isExpanded) {
                        event.preventDefault();
                        this.toggle.emit(this.flatNode.node);
                }

                if (event.key === 'ArrowLeft' && this.flatNode.isExpanded) {
                        event.preventDefault();
                        this.toggle.emit(this.flatNode.node);
                }
        }
}