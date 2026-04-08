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
        styleUrl: './dip-tree-node.component.scss',
})
export class DipTreeNodeComponent {
    @Input() flatNode!: FlatNode;
        @Output() toggle = new EventEmitter<DipTreeNode>();
        @Output() retry = new EventEmitter<DipTreeNode>();
    @Output() nodeSelected = new EventEmitter<DipTreeNode>();

    public onToggle(event: MouseEvent): void {
        event.stopPropagation();
            this.nodeSelected.emit(this.flatNode.node);
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