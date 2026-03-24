import { Component, input, output } from '@angular/core';
import { CommonModule, KeyValuePipe } from '@angular/common';

@Component({
  selector: 'app-metadata-panel',
  standalone: true,
  imports: [CommonModule, KeyValuePipe],
  template: `
    <div class="metadata-container">
      <div class="metadata-header">
        <h3>Dettagli</h3>
      </div>

      <div class="metadata-actions">
        <button type="button" class="preview-button" (click)="previewRequested.emit()">
          Anteprima
        </button>
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

                        @if (isObject(subItem.value)) {
                          <div class="grouped-block">
                            @for (deepItem of subItem.value | keyvalue; track deepItem.key) {
                              <div class="deep-row">
                                <span class="deep-key">{{ formatKey(deepItem.key) }}:</span>

                                @if (isObject(deepItem.value)) {
                                  <div class="ultra-block">
                                    @for (
                                      ultraItem of deepItem.value | keyvalue;
                                      track ultraItem.key
                                    ) {
                                      <div class="ultra-row">
                                        <span class="ultra-key"
                                          >{{ formatKey(ultraItem.key) }}:</span
                                        >

                                        @if (isObject(ultraItem.value)) {
                                          <span class="ultra-value">{{
                                            formatInlineObject(ultraItem.value)
                                          }}</span>
                                        } @else if (isArray(ultraItem.value)) {
                                          <span class="ultra-value">{{
                                            formatArray(ultraItem.value)
                                          }}</span>
                                        } @else {
                                          <span class="ultra-value">{{
                                            formatValue(ultraItem.value)
                                          }}</span>
                                        }
                                      </div>
                                    }
                                  </div>
                                } @else if (isArray(deepItem.value)) {
                                  <ul class="array-list">
                                    @for (entry of deepItem.value; track $index) {
                                      <li>{{ formatValue(entry) }}</li>
                                    }
                                  </ul>
                                } @else {
                                  <span class="deep-value">{{ formatValue(deepItem.value) }}</span>
                                }
                              </div>
                            }
                          </div>
                        } @else if (isArray(subItem.value)) {
                          <ul class="array-list">
                            @for (entry of subItem.value; track $index) {
                              <li>{{ formatValue(entry) }}</li>
                            }
                          </ul>
                        } @else {
                          <span class="nested-value">{{ formatValue(subItem.value) }}</span>
                        }
                      </div>
                    }
                  </div>
                } @else {
                  <span class="metadata-value">{{ formatValue(item.value) }}</span>
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
        background: #f4f7fb;
        border-left: 1px solid #d9e2ec;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }
      .metadata-header {
        padding: 1.1rem 1rem;
        background: linear-gradient(90deg, #1f4e79 0%, #2b6cb0 100%);
        border-bottom: 1px solid #d9e2ec;
      }
      .metadata-header h3 {
        margin: 0;
        font-size: 1.05rem;
        color: #ffffff;
        letter-spacing: 0.03em;
        font-weight: 700;
      }
      .metadata-content {
        flex: 1;
        overflow-y: auto;
        padding: 0.9rem;
      }

      .metadata-actions {
        padding: 0.75rem 1rem;
        border-bottom: 1px solid #d9e2ec;
        background: #f8fbff;
      }
      .preview-button {
        cursor: pointer;
        border: 1px solid #1f4e79;
        background: #1f4e79;
        color: #fff;
        border-radius: 999px;
        padding: 0.45rem 0.95rem;
        font-weight: 600;
        letter-spacing: 0.02em;
      }
      .preview-button:hover {
        background: #173a5c;
      }

      .metadata-row {
        margin-bottom: 0.75rem;
        padding: 0.75rem;
        border: 1px solid #dce5ef;
        border-radius: 10px;
        background: #ffffff;
      }
      .metadata-key {
        display: block;
        font-size: 0.76rem;
        color: #35516d;
        text-transform: uppercase;
        font-weight: 700;
        margin-bottom: 0.35rem;
        letter-spacing: 0.05em;
      }
      .metadata-value {
        display: block;
        font-size: 0.95rem;
        color: #1f2d3a;
        word-break: break-word;
        white-space: pre-wrap;
      }

      .nested-object {
        background: #f7fbff;
        padding: 0.6rem;
        border-radius: 8px;
        margin-top: 0.3rem;
        border: 1px solid #dce8f5;
      }
      .nested-row {
        display: flex;
        flex-direction: column;
        margin-bottom: 0.65rem;
      }
      .nested-row:last-child {
        margin-bottom: 0;
      }
      .nested-key {
        font-size: 0.78rem;
        color: #35516d;
        font-weight: 700;
      }
      .nested-value {
        font-size: 0.9rem;
        color: #243544;
        white-space: pre-wrap;
        word-break: break-word;
      }
      .grouped-block {
        margin-top: 0.35rem;
        border: 1px solid #d5e3f0;
        border-radius: 8px;
        background: #ffffff;
        padding: 0.55rem;
      }
      .deep-row {
        display: grid;
        grid-template-columns: minmax(140px, 220px) 1fr;
        gap: 0.5rem;
        align-items: start;
        padding: 0.4rem 0;
        border-bottom: 1px dashed #dfe9f3;
      }
      .deep-row:last-child {
        border-bottom: none;
      }
      .deep-key {
        font-size: 0.78rem;
        color: #2f4a63;
        font-weight: 700;
        text-transform: uppercase;
      }
      .deep-value {
        font-size: 0.9rem;
        color: #203546;
        word-break: break-word;
      }
      .array-list {
        margin: 0;
        padding-left: 1.1rem;
        color: #203546;
      }
      .array-list li {
        margin: 0.15rem 0;
      }
      .ultra-block {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }
      .ultra-row {
        display: grid;
        grid-template-columns: minmax(120px, 180px) 1fr;
        gap: 0.4rem;
        background: #f3f8fd;
        border: 1px solid #dde9f4;
        border-radius: 6px;
        padding: 0.35rem 0.45rem;
      }
      .ultra-key {
        font-size: 0.74rem;
        font-weight: 700;
        text-transform: uppercase;
        color: #2f4a63;
      }
      .ultra-value {
        font-size: 0.86rem;
        color: #1f3344;
        word-break: break-word;
      }

      .no-data {
        color: #6b7f93;
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
  previewRequested = output<void>();

  // Utility per capire se un valore è un oggetto annidato (per stampare i sotto-livelli)
  isObject(val: any): boolean {
    return val !== null && typeof val === 'object' && !Array.isArray(val);
  }

  isArray(val: unknown): val is unknown[] {
    return Array.isArray(val);
  }

  // Utility per rendere le chiavi camelCase leggibili (es: "dataCreazione" -> "Data Creazione")
  formatKey(key: string | number | symbol): string {
    const strKey = String(key);
    let result = '';

    for (const char of strKey) {
      result += char >= 'A' && char <= 'Z' ? ` ${char}` : char;
    }

    return result.charAt(0).toUpperCase() + result.slice(1);
  }

  formatValue(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return 'N/D';
    }

    if (Array.isArray(value)) {
      return this.formatArray(value);
    }

    if (typeof value === 'object') {
      return this.formatInlineObject(value);
    }

    if (typeof value === 'symbol') {
      return value.description ? `Symbol(${value.description})` : 'Symbol';
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return `${value}`;
    }

    if (typeof value === 'bigint') {
      return value.toString();
    }

    return 'N/D';
  }

  formatArray(values: unknown[]): string {
    if (!values.length) {
      return 'N/D';
    }

    return values
      .map((item) => {
        if (this.isObject(item)) {
          return this.formatInlineObject(item);
        }

        return this.formatValue(item);
      })
      .join(' • ');
  }

  formatInlineObject(value: unknown): string {
    if (!this.isObject(value)) {
      return this.formatValue(value);
    }

    const entries = Object.entries(value as Record<string, unknown>);

    if (!entries.length) {
      return 'N/D';
    }

    return entries
      .map(([key, itemValue]) => {
        if (this.isObject(itemValue)) {
          return `${this.formatKey(key)}: ${this.formatInlineObject(itemValue)}`;
        }

        if (Array.isArray(itemValue)) {
          return `${this.formatKey(key)}: ${this.formatArray(itemValue)}`;
        }

        return `${this.formatKey(key)}: ${this.formatValue(itemValue)}`;
      })
      .join(' | ');
  }
}
