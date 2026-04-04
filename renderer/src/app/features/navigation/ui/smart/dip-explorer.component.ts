import { inject, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DipFacade } from '../../services/dip-facade';
import { DipTree } from './dip-tree.component';
import { DipTreeNode } from '../../contracts/dip-tree-node';
import { InlineErrorComponent } from '../dumb/inline-error.component';
import { AsyncStateWrapperComponent } from '../dumb/async-state-wrapper.component';
import { CommonModule } from '@angular/common';
import { EmptyStateComponent } from '../../../../shared/ui/dumb/empty-state.component/empty-state.component';
import {
    buildDetailRoute,
    mapDipNodeTypeToDetailItemType,
} from '../../domain/navigation-routing';

@Component ({
    selector: 'app-dip-explorer',
    standalone: true,
    imports: [DipTree,InlineErrorComponent, AsyncStateWrapperComponent, CommonModule, EmptyStateComponent],
    templateUrl: './dip-explorer.html',
})

export class DipExplorerComponent implements OnInit {
    private readonly defaultDipId = 1;
    private readonly dipFacade = inject(DipFacade);
    private readonly router = inject(Router);

    readonly state = this.dipFacade.getState();

    ngOnInit(): void {
        this.initializeRootNodes();
    }

    get rootNodes(): DipTreeNode[] {
        return this.dipFacade.getState()().rootNodes;
    }

    onNodeSelected(node: DipTreeNode): void {
        const targetItemType = mapDipNodeTypeToDetailItemType(node.type);
        if (!targetItemType) {
            return;
        }

        void this.router.navigate(buildDetailRoute(targetItemType, node.id));
    }

    private initializeRootNodes(force = false): void {
        const currentState = this.state();
        if (!force && (currentState.phase === 'loading' || currentState.rootNodes.length > 0)) {
            return;
        }

        void this.dipFacade.loadRootNodes(this.defaultDipId);
    }
}