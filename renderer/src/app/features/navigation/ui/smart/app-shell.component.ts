import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';

import { DipFacade } from '../../services/dip-facade';
import { DipTree } from './dip-tree.component';
import { DipTreeNode } from '../../contracts/dip-tree-node';
import {
  buildDetailRoute,
  mapDipNodeTypeToDetailItemType,
} from '../../domain/navigation-routing';
import { InlineErrorComponent } from '../dumb/inline-error.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, DipTree, InlineErrorComponent],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
})
export class AppShellComponent implements OnInit {
  private readonly defaultDipId = 1;
  private readonly dipFacade = inject(DipFacade);
  private readonly router = inject(Router);

  readonly state = this.dipFacade.getState();
  readonly isSidebarCollapsed = signal(false);

  ngOnInit(): void {
    this.initializeRootNodes();
  }

  get rootNodes(): DipTreeNode[] {
    return this.state().rootNodes;
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed.update((collapsed) => !collapsed);
  }

  navigateToBrowse(): void {
    void this.router.navigate(['/browse']);
  }

  navigateToSearch(): void {
    void this.router.navigate(['/search']);
  }

  retryLoadRootNodes(): void {
    this.initializeRootNodes(true);
  }

  onNodeSelected(node: DipTreeNode): void {
    const targetItemType = mapDipNodeTypeToDetailItemType(node.type);
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