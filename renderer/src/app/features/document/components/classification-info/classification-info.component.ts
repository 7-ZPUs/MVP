import { Component, input } from '@angular/core';
import { ClassificationInfo } from '../../domain/document.models';

@Component({
  selector: 'app-classification-info',
  standalone: true,
  template: `
    <div class="metadata-card">
      <h3>Classificazione</h3>
      <div class="data-row">
        <span class="label">Indice:</span> <span class="value">{{ data().indice }}</span>
      </div>
      <div class="data-row">
        <span class="label">Descrizione:</span> <span class="value">{{ data().descrizione }}</span>
      </div>
      <div class="data-row">
        <span class="label">Piano (URI):</span> <span class="value">{{ data().uriPiano }}</span>
      </div>
    </div>
  `,
})
export class ClassificationInfoComponent {
  data = input.required<ClassificationInfo>();
}
