import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

import { DipFacade } from '../../services/dip-facade';
import { DipTree } from './dip-tree.component';
import { DipTreeNode } from '../../contracts/dip-tree-node';
import { buildDetailRoute, mapDipNodeTypeToDetailItemType } from '../../domain/navigation-routing';
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
  readonly currentRoute = signal<string>('browse');

  readonly isIntegrityActive = computed(() => this.currentRoute() === 'integrity-dashboard');
  readonly isBrowseActive = computed(() => this.currentRoute() === 'browse');
  readonly isSearchActive = computed(() => this.currentRoute() === 'search');

  ngOnInit(): void {
    this.initializeRootNodes();
    this.trackRouteChanges();
  }

  private trackRouteChanges(): void {
    // Set initial route
    this.updateCurrentRoute(this.router.url);

    // Listen to route changes
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateCurrentRoute(event.url);
      });
  }

  private updateCurrentRoute(url: string): void {
    if (url.includes('integrity-dashboard')) {
      this.currentRoute.set('integrity-dashboard');
    } else if (url.includes('search')) {
      this.currentRoute.set('search');
    } else {
      this.currentRoute.set('browse');
    }
  }

  get rootNodes(): DipTreeNode[] {
    return this.state().rootNodes;
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed.update((collapsed) => !collapsed);
  }

  navigateToIntegrity(): void {
    void this.router.navigate(['/integrity-dashboard']);
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
