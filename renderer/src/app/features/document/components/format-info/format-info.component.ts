import { Component, input } from '@angular/core';
import { FormatInfo } from '../../domain/document.models';

@Component({
  selector: 'app-format-info',
  standalone: true,
  template: `
    <div class="metadata-card">
      <h3>Formato File</h3>
      <div class="data-row">
        <span class="label">Tipo/MIME:</span> <span class="value">{{ data().tipo }}</span>
      </div>
      <div class="data-row">
        <span class="label">Prodotto:</span>
        <span class="value">{{ data().prodotto }} {{ data().versione }}</span>
      </div>
      <div class="data-row">
        <span class="label">Produttore:</span> <span class="value">{{ data().produttore }}</span>
      </div>
    </div>
  `,
})
export class FormatInfoComponent {
  data = input.required<FormatInfo>();
}
