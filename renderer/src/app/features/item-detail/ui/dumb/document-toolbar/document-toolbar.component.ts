import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-document-toolbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toolbar-container">
      <div class="title-section">
        <div class="title-info">
          <span class="badge" [class.badge-doc]="formato() !== 'FASCICOLO'">{{ formato() }}</span>
          <h2 class="title">{{ titolo() }}</h2>
        </div>
      </div>

      <div class="actions-section">
        @if (isPreviewVisible()) {
          <!-- <div class="zoom-controls">
            <button
              class="icon-btn"
              (click)="zoomOut.emit()"
              aria-label="Riduci zoom"
              title="Riduci zoom"
            >
              -
            </button>
            <span class="zoom-label">{{ zoomLevel() * 100 | number: '1.0-0' }}%</span>
            <button
              class="icon-btn"
              (click)="zoomIn.emit()"
              aria-label="Aumenta zoom"
              title="Aumenta zoom"
            >
              +
            </button>
            <button class="icon-btn reset-btn" (click)="resetZoom.emit()" title="Ripristina zoom">
              Ripristina
            </button>
          </div> -->

          <button
            class="close-btn"
            (click)="closePreview.emit()"
            aria-label="Chiudi anteprima"
            title="Chiudi anteprima"
          >
            <i class="bi bi-x-lg" aria-hidden="true"></i>
          </button>
        } @else {
          <button
            class="btn-back"
            style="border-color: #3b82f6; color: #3b82f6;"
            (click)="openPreview.emit()"
            title="Apri anteprima"
          >
            <i class="bi bi-eye" aria-hidden="true"></i>
            Apri Anteprima
          </button>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .toolbar-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 1.5rem;
        background: #ffffff;
        border-bottom: 1px solid #e2e8f0;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      }
      .title-section {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      .btn-back {
        background: transparent;
        border: 1px solid #cbd5e1;
        color: #475569;
        padding: 0.4rem 0.8rem;
        border-radius: 6px;
        font-size: 0.85rem;
        cursor: pointer;
        transition: all 0.2s;
        font-weight: 500;
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
      }
      .btn-back:hover {
        background: #f1f5f9;
        color: #0f172a;
        border-color: #94a3b8;
      }
      .title-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
      .badge {
        background: #e0e7ff;
        color: #3730a3;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 700;
      }
      .badge-doc {
        background: #fef3c7;
        color: #92400e;
      }
      .title {
        margin: 0;
        font-size: 1.1rem;
        color: #1e293b;
        font-weight: 600;
      }
      .actions-section {
        display: flex;
        align-items: center;
        gap: 1.5rem;
      }
      .zoom-controls {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: #f8fafc;
        padding: 0.25rem;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
      }
      .icon-btn {
        background: #ffffff;
        border: 1px solid #cbd5e1;
        border-radius: 4px;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: #475569;
        font-weight: bold;
      }
      .icon-btn:hover {
        background: #f1f5f9;
      }
      .reset-btn {
        width: auto;
        padding: 0 0.5rem;
        font-size: 0.8rem;
        font-weight: 500;
      }
      .zoom-label {
        font-size: 0.85rem;
        font-weight: 600;
        color: #475569;
        min-width: 45px;
        text-align: center;
      }
      .close-btn {
        background: transparent;
        border: none;
        font-size: 1.25rem;
        color: #94a3b8;
        cursor: pointer;
        padding: 0.25rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .close-btn:hover {
        color: #ef4444;
      }
    `,
  ],
})
export class DocumentToolbarComponent {
  // API Moderne basate su Signal
  titolo = input.required<string>();
  formato = input.required<string>();
  zoomLevel = input.required<number>();

  // Indica se la preview è visibile
  isPreviewVisible = input<boolean>(true);

  // Output moderni (senza EventEmitter)
  zoomIn = output<void>();
  zoomOut = output<void>();
  resetZoom = output<void>();
  closePreview = output<void>();
  openPreview = output<void>();
}
