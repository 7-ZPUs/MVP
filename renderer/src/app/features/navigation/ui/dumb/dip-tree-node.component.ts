import { Input, Component, Output, EventEmitter} from "@angular/core";
import { FlatNode } from "../../contracts/flat-node";
import { DipTreeNode } from "../../contracts/dip-tree-node";


@Component({
    selector: 'app-dip-tree-node',
    standalone: true,
    templateUrl: './dip-tree-node.html',  
})
export class DipTreeNodeComponent {
    @Input() flatNode!: FlatNode;
    @Output() toggle = new EventEmitter<string>();
    @Output() nodeSelected = new EventEmitter<DipTreeNode>();

    public onToggle(event: MouseEvent): void {
        event.stopPropagation();
        this.toggle.emit(this.flatNode.node.id);
    }

    public onClick(): void {
        this.nodeSelected.emit(this.flatNode.node);
    }
}