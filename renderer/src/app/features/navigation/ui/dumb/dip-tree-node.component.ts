import { Input, Component, Output, EventEmitter} from "@angular/core";
import { FlatNode } from "../../contracts/flat-node";
import { DipTreeNode } from "../../contracts/dip-tree-node";
import { CommonModule } from "@angular/common";
import { InlineErrorComponent } from "./inline-error.component";
import { NodeId } from "../../domain/types";

@Component({
    selector: 'app-dip-tree-node',
    standalone: true,
    templateUrl: './dip-tree-node.html',  
    imports: [CommonModule, InlineErrorComponent],
})
export class DipTreeNodeComponent {
    @Input() flatNode!: FlatNode;
    @Output() toggle = new EventEmitter<NodeId>();
    @Output() nodeSelected = new EventEmitter<DipTreeNode>();

    public onToggle(event: MouseEvent): void {
        event.stopPropagation();
        this.toggle.emit(this.flatNode.node.id);
    }

    public onClick(): void {
        this.nodeSelected.emit(this.flatNode.node);
    }
}