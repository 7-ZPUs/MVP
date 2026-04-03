import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppError } from '../../../../shared/domain';
import { MimeType } from '../../domain/document.models';
import { PreviewRendererComponent } from '../preview-renderer/preview-renderer.component';

@Component({
  selector: 'app-preview-panel',
  standalone: true,
  imports: [CommonModule, PreviewRendererComponent],
  template: `
    <div class="panel-container">
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Caricamento file in corso...</p>
        </div>
      } @else if (src() && !error()) {
        <app-preview-renderer
          [src]="src()!"
          [mimeType]="mimeType()"
          (unsupportedFormat)="unsupportedFormat.emit()"
        >
        </app-preview-renderer>
      }
    </div>
  `,
  styles: [
    `
      .panel-container {
        height: 100%;
        width: 100%;
        background: #e2e8f0;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }
      .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        color: #64748b;
      }
      .spinner {
        border: 3px solid #cbd5e1;
        border-top: 3px solid #3b82f6;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        animation: spin 1s linear infinite;
        margin-bottom: 1rem;
      }
      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class PreviewPanelComponent {
  src = input<Uint8Array | null>(null);
  loading = input<boolean>(false);
  error = input<AppError | null>(null);
  mimeType = input.required<MimeType>();

  unsupportedFormat = output<void>();
}
