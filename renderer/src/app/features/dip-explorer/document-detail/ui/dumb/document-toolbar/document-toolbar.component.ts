import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-document-toolbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toolbar-container">
      <div class="title-section">
        <h3>{{ titolo() }}</h3>
        <span class="badge">{{ formato() }}</span>
      </div>

      <div class="actions-section">
        <button (click)="zoomOut.emit()" title="Riduci Zoom">-</button>
        <span class="zoom-level">{{ zoomLevel() * 100 | number: '1.0-0' }}%</span>
        <button (click)="zoomIn.emit()" title="Aumenta Zoom">+</button>
        <button (click)="resetZoom.emit()" title="Ripristina Zoom">Reset</button>
      </div>
    </div>
  `,
  styles: [
    `
      .toolbar-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 1rem;
        background: #ffffff;
        border-bottom: 1px solid #e0e0e0;
      }
      .title-section {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      .title-section h3 {
        margin: 0;
        font-size: 1.2rem;
        color: #333;
      }
      .badge {
        background: #e3f2fd;
        color: #1976d2;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.8rem;
        font-weight: bold;
      }
      .actions-section {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      button {
        cursor: pointer;
        padding: 0.5rem 0.75rem;
        border: 1px solid #ccc;
        background: #f9f9f9;
        border-radius: 4px;
        font-weight: bold;
      }
      button:hover {
        background: #e0e0e0;
      }
      .zoom-level {
        min-width: 3rem;
        text-align: center;
        font-size: 0.9rem;
      }
    `,
  ],
})
export class DocumentToolbarComponent {
  // Input ricevuti dal genitore (Smart Page)
  titolo = input.required<string>();
  formato = input.required<string>();
  zoomLevel = input.required<number>();

  // Eventi emessi verso il genitore
  zoomIn = output<void>();
  zoomOut = output<void>();
  resetZoom = output<void>();
}
