import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
// Assicurati che il percorso verso i modelli sia corretto!
// Se non hai esportato un'interfaccia specifica per RegistrationData,
// usa semplicemente 'any' o crea l'interfaccia nel file document.models.ts
import { DocumentDetail } from '../../../../document/domain/document.models';

@Component({
  selector: 'app-registration-data',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="registration-card">
      <h3 class="section-title">Dati di Registrazione</h3>

      @if (data()) {
        <div class="data-grid">
          <div class="data-item">
            <span class="label">Numero</span>
            <span class="value">{{ data()!.numero }}</span>
          </div>
          <div class="data-item">
            <span class="label">Data</span>
            <span class="value">{{ data()!.data }}</span>
          </div>
          <div class="data-item">
            <span class="label">Tipo Registro</span>
            <span class="value">{{ data()!.tipoRegistro }}</span>
          </div>
          <div class="data-item">
            <span class="label">Flusso</span>
            <span class="value">{{ data()!.flusso }}</span>
          </div>

          @if (data()!.codice) {
            <div class="data-item">
              <span class="label">Codice</span>
              <span class="value">{{ data()!.codice }}</span>
            </div>
          }
        </div>
      } @else {
        <p class="empty-state">Nessun dato di registrazione presente per questo documento.</p>
      }
    </div>
  `,
  styles: [
    `
      .registration-card {
        background-color: #ffffff;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
      }

      .section-title {
        margin-top: 0;
        margin-bottom: 16px;
        font-size: 1.1rem;
        color: #333;
        border-bottom: 2px solid #f0f0f0;
        padding-bottom: 8px;
      }

      .data-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 16px;
      }

      .data-item {
        display: flex;
        flex-direction: column;
      }

      .label {
        font-size: 0.75rem;
        text-transform: uppercase;
        color: #666;
        font-weight: 600;
        margin-bottom: 4px;
      }

      .value {
        flex: 1;
        min-width: 0;
        word-break: break-word;
        overflow-wrap: anywhere;
        font-size: 0.95rem;
        color: #222;
      }

      .empty-state {
        color: #888;
        font-style: italic;
        margin: 0;
        font-size: 0.9rem;
      }
    `,
  ],
})
export class RegistrationDataComponent {
  // Tipizziamo l'input estraendo il tipo della proprietà 'registration' dal DocumentDetail.
  // Se TypeScript si lamenta, puoi temporaneamente usare: data = input<any>();
  data = input<DocumentDetail['registration']>();
}
