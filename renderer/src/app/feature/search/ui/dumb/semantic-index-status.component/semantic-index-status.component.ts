import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SemanticIndexState } from '../../../../../../../../shared/domain/metadata/semantic-filter-models';

@Component({
  selector: 'app-semantic-index-status',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './semantic-index-status.component.html',
})
export class SemanticIndexStatusComponent {
  @Input() state: SemanticIndexState | null = null;

  public get statusClass(): string {
    if (!this.state) return 'status-unknown';

    switch (this.state.status) {
      case 'READY':
        return 'status-ready';
      case 'INDEXING':
        return 'status-indexing';
      case 'ERROR':
        return 'status-error';
      default:
        return 'status-unknown';
    }
  }

  public get statusLabel(): string {
    if (!this.state) return 'Sconosciuto';

    switch (this.state.status) {
      case 'READY':
        return 'Pronto';
      case 'INDEXING':
        return 'In Aggiornamento...';
      case 'ERROR':
        return 'Errore Indice';
      default:
        return this.state.status;
    }
  }
}
