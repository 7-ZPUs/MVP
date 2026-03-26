import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MetadataNodeVM } from '../../../domain/detail.view-models';

@Component({
  selector: 'app-metadata-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="metadata-container">
      <div class="metadata-header">
        <h3>Dettagli</h3>
        <button class="preview-btn" (click)="previewRequested.emit()">Vedi Anteprima</button>
      </div>

      <div class="metadata-content">
        @if (tree() && tree().length > 0) {
          <ng-container
            *ngTemplateOutlet="recursiveTree; context: { $implicit: tree() }"
          ></ng-container>
        } @else {
          <p class="no-data">Nessun metadato disponibile.</p>
        }
      </div>
    </div>

    <ng-template #recursiveTree let-nodes>
      <ul class="tree-list">
        @for (node of nodes; track node.name) {
          <li class="tree-node">
            <div class="node-header">
              <span class="node-name">{{ formatName(node.name) }}</span>
              <span class="node-type">{{ node.type }}</span>
            </div>

            @if (node.children && node.children.length > 0) {
              <div class="node-children">
                <ng-container
                  *ngTemplateOutlet="recursiveTree; context: { $implicit: node.children }"
                ></ng-container>
              </div>
            } @else {
              <div class="node-value">{{ node.value || 'N/D' }}</div>
            }
          </li>
        }
      </ul>
    </ng-template>
  `,
  styles: [
    `
      /* Il contenitore principale occupa tutta l'altezza passata dal genitore */
      :host {
        display: block;
        height: 100%;
        width: 100%;
      }

      .metadata-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: #ffffff;
      }

      .metadata-header {
        padding: 1.5rem;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-shrink: 0; /* Impedisce all'header di schiacciarsi */
      }

      .metadata-header h3 {
        margin: 0;
        color: #0f172a;
        font-size: 1.1rem;
      }

      .preview-btn {
        background: #e0e7ff;
        color: #3730a3;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        font-size: 0.85rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
      }

      .preview-btn:hover {
        background: #c7d2fe;
      }

      /* IL FIX È QUI: Questa parte si allunga e scrolla! */
      .metadata-content {
        flex: 1;
        overflow-y: auto; /* Fa comparire la scrollbar verticale */
        padding: 1.5rem;
      }

      /* Stili dell'albero (puoi mantenere i tuoi se li avevi personalizzati) */
      .tree-list {
        list-style: none;
        padding-left: 0;
        margin: 0;
      }
      .tree-node {
        margin-bottom: 0.5rem;
      }
      .node-header {
        display: flex;
        justify-content: space-between;
        padding: 0.5rem;
        background: #f1f5f9;
        border-radius: 4px;
        font-weight: 500;
        font-size: 0.9rem;
      }
      .node-name {
        color: #334155;
      }
      .node-type {
        color: #94a3b8;
        font-size: 0.8rem;
      }
      .node-children {
        padding-left: 1.5rem;
        margin-top: 0.5rem;
        border-left: 2px solid #e2e8f0;
      }
      .node-value {
        padding: 0.5rem;
        padding-left: 1rem;
        color: #0f172a;
        font-size: 0.9rem;
        word-break: break-all;
      }
      .no-data {
        color: #64748b;
        font-style: italic;
        text-align: center;
        margin-top: 2rem;
      }
    `,
  ],
})
export class MetadataPanelComponent {
  tree = input.required<MetadataNodeVM[]>();
  ispreviewOpen = input.required<boolean>();
  previewRequested = output<void>();

  // Utility per separare il CamelCase: "DataRegistrazione" -> "Data Registrazione"
  formatName(name: string): string {
    if (!name) return 'Sconosciuto';
    const result = name.replace(/([A-Z])/g, ' $1').trim();
    return result.charAt(0).toUpperCase() + result.slice(1);
  }
}
