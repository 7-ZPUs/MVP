import { inject, Component } from "@angular/core";
import { DipFacade } from "../../service/dip-facade";
import { DipTree } from "./dip-tree.component";
import { DipTreeNode } from "../../contracts/dip-tree-node";


@Component ({
    selector: 'app-dip-explorer',
    standalone: true,
    imports: [DipTree],
    templateUrl: './dip-explorer.html',
})

export class DipExplorerComponent {
    private readonly dipFacade = inject(DipFacade);

    get rootNodes(): DipTreeNode[] {
        return this.dipFacade.getState()().rootNodes;
    }
}