import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';

import { DipFacade } from '../../services/dip-facade';
import { DipTree } from './dip-tree.component';
import { DipTreeNode } from '../../contracts/dip-tree-node';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, DipTree],
  templateUrl: './app-shell.html',
})
export class AppShellComponent {
  private readonly dipFacade = inject(DipFacade);
  private readonly router = inject(Router);

  readonly state = this.dipFacade.getState();

  get rootNodes(): DipTreeNode[] {
    return this.state().rootNodes;
  }

  onNodeSelected(node: DipTreeNode) {
    if (node.type === 'document') {
      this.router.navigate(['/document', node.id]);
    }
    //TODO aggiungere le altre rotte (aggregate)
  }
}