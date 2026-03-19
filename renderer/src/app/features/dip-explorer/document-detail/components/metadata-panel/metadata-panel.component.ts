import { Component, input } from '@angular/core';
import { CommonModule, KeyValuePipe } from '@angular/common';

@Component({
  selector: 'app-metadata-panel',
  standalone: true,
  imports: [CommonModule, KeyValuePipe],
  template: `
    <div class="metadata-container">
      <div class="metadata-header">
        <h3>Metadati Documento</h3>
      </div>

      <div class="metadata-content">
        @if (metadata()) {
          <div class="metadata-list">
            @for (item of metadata() | keyvalue; track item.key) {
              <div class="metadata-row">
                <span class="metadata-key">{{ formatKey(item.key) }}</span>

                @if (isObject(item.value)) {
                  <div class="nested-object">
                    @for (subItem of item.value | keyvalue; track subItem.key) {
                      <div class="nested-row">
                        <span class="nested-key">{{ formatKey(subItem.key) }}:</span>
                        <span class="nested-value">{{ subItem.value || 'N/D' }}</span>
                      </div>
                    }
                  </div>
                } @else {
                  <span class="metadata-value">{{ item.value || 'N/D' }}</span>
                }
              </div>
            }
          </div>
        } @else {
          <p class="no-data">Nessun metadato disponibile.</p>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .metadata-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: #ffffff;
        border-left: 1px solid #e0e0e0;
      }
      .metadata-header {
        padding: 1rem;
        background: #f8f9fa;
        border-bottom: 1px solid #e0e0e0;
      }
      .metadata-header h3 {
        margin: 0;
        font-size: 1.1rem;
        color: #333;
      }
      .metadata-content {
        flex: 1;
        overflow-y: auto;
        padding: 1rem;
      }

      .metadata-row {
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid #f0f0f0;
      }
      .metadata-key {
        display: block;
        font-size: 0.85rem;
        color: #666;
        text-transform: uppercase;
        font-weight: bold;
        margin-bottom: 0.25rem;
      }
      .metadata-value {
        display: block;
        font-size: 1rem;
        color: #222;
        word-break: break-word;
      }

      .nested-object {
        background: #f8f9fa;
        padding: 0.5rem;
        border-radius: 4px;
        margin-top: 0.25rem;
        border: 1px solid #eee;
      }
      .nested-row {
        display: flex;
        flex-direction: column;
        margin-bottom: 0.5rem;
      }
      .nested-row:last-child {
        margin-bottom: 0;
      }
      .nested-key {
        font-size: 0.8rem;
        color: #555;
        font-weight: 600;
      }
      .nested-value {
        font-size: 0.9rem;
        color: #333;
      }

      .no-data {
        color: #999;
        font-style: italic;
        text-align: center;
        margin-top: 2rem;
      }
    `,
  ],
})
export class MetadataPanelComponent {
  // Riceve l'oggetto dei metadati dalla Smart Page
  metadata = input.required<any>();

  // Utility per capire se un valore è un oggetto annidato (per stampare i sotto-livelli)
  isObject(val: any): boolean {
    return val !== null && typeof val === 'object' && !Array.isArray(val);
  }

  // Utility per rendere le chiavi camelCase leggibili (es: "dataCreazione" -> "Data Creazione")
  formatKey(key: string | number): string {
    const strKey = String(key);
    const result = strKey.replace(/([A-Z])/g, ' $1');
    return result.charAt(0).toUpperCase() + result.slice(1);
  }
}
