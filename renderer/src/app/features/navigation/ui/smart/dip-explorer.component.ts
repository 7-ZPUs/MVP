import { inject, Component } from "@angular/core";
import { DipFacade } from "../../services/dip-facade";
import { DipTree } from "./dip-tree.component";
import { DipTreeNode } from "../../contracts/dip-tree-node";
import { InlineErrorComponent } from "../dumb/inline-error.component";
import { AsyncStateWrapperComponent } from "../dumb/async-state-wrapper.component";
import { CommonModule } from "@angular/common";
import { EmptyStateComponent } from "../../../../shared/ui/dumb/empty-state.component/empty-state.component";

@Component ({
    selector: 'app-dip-explorer',
    standalone: true,
    imports: [DipTree,InlineErrorComponent, AsyncStateWrapperComponent, CommonModule, EmptyStateComponent],
    templateUrl: './dip-explorer.html',
})

export class DipExplorerComponent {
    private readonly dipFacade = inject(DipFacade);

    readonly state = this.dipFacade.getState();

    get rootNodes(): DipTreeNode[] {
        return this.dipFacade.getState()().rootNodes;
    }
}