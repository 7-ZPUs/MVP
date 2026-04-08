import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProcessDetail } from '../../domain/process.models';
import { OptionalFieldAbsentComponent } from '../../../../shared/components/optional-field-absent/optional-field-absent.component';
import { simplifyCustomMetadataLabel } from '../../../../shared/utils/custom-metadata-label.util';

@Component({
  selector: 'app-process-metadata',
  standalone: true,
  imports: [CommonModule, OptionalFieldAbsentComponent],
  template: `
    <div class="metadata-card">
      <h3>Anagrafica Processo</h3>
      <div class="data-row">
        <span class="label">ID interno:</span>
        <span class="value">{{ data().processId }}</span>
      </div>
      <div class="data-row">
        <span class="label">UUID Processo:</span>
        <span class="value">{{ data().processUuid }}</span>
      </div>
      <div class="data-row">
        <span class="label">Stato verifica:</span>
        <span class="value">{{ data().integrityStatus }}</span>
      </div>
      <div class="data-row">
        <span class="label">Classe documentale:</span>
        <span class="value">{{ data().documentClass.name || 'N/D' }}</span>
      </div>
      <div class="data-row">
        <span class="label">UUID Classe:</span>
        <span class="value">{{ data().documentClass.uuid || 'N/D' }}</span>
      </div>
      <div class="data-row">
        <span class="label">Timestamp Classe:</span>
        <span class="value">{{ data().documentClass.timestamp || 'N/D' }}</span>
      </div>
    </div>

    <div class="metadata-card">
      <h3>Contesto Procedimentale</h3>
      <div class="data-row">
        <span class="label">Oggetto:</span>
        <span class="value">{{ data().overview.oggetto }}</span>
      </div>
      <div class="data-row">
        <span class="label">Procedimento:</span>
        <span class="value">{{ data().overview.procedimento }}</span>
      </div>
      <div class="data-row">
        <span class="label">Materia/Argomento:</span>
        <span class="value">{{ data().overview.materiaArgomentoStruttura }}</span>
      </div>
    </div>

    <div class="metadata-card">
      <h3>Processo di Conservazione</h3>
      <div class="data-row">
        <span class="label">Processo:</span>
        <span class="value">{{ data().conservation.processo }}</span>
      </div>
      <div class="data-row">
        <span class="label">Sessione:</span>
        <span class="value">{{ data().conservation.sessione }}</span>
      </div>
      <div class="data-row">
        <span class="label">Data inizio:</span>
        <span class="value">{{ data().conservation.dataInizio }}</span>
      </div>
      @if (data().conservation.dataFine) {
        <div class="data-row">
          <span class="label">Data fine:</span>
          <span class="value">{{ data().conservation.dataFine }}</span>
        </div>
      }
      @if (data().conservation.uuidTerminatore) {
        <div class="data-row">
          <span class="label">UUID terminatore:</span>
          <span class="value">{{ data().conservation.uuidTerminatore }}</span>
        </div>
      }
      @if (data().conservation.canaleTerminazione) {
        <div class="data-row">
          <span class="label">Canale terminazione:</span>
          <span class="value">{{ data().conservation.canaleTerminazione }}</span>
        </div>
      }
    </div>

    @if (data().customMetadata.length > 0) {
      <div class="metadata-card">
        <h3>Metadati Aggiuntivi</h3>
        @for (entry of data().customMetadata; track entry.nome + '-' + entry.valore) {
          <div class="data-row">
            <span class="label" [title]="entry.nome"
              >{{ simplifyCustomMetadataLabel(entry.nome) }}:</span
            >
            <span class="value">{{ entry.valore }}</span>
          </div>
        }
      </div>
    } @else {
      <app-optional-field-absent
        message="Nessun metadato aggiuntivo presente per questo processo"
      ></app-optional-field-absent>
    }
  `,
  styleUrl: './process-metadata.component.scss',
})
export class ProcessMetadataComponent {
  data = input.required<ProcessDetail>();
  protected readonly simplifyCustomMetadataLabel = simplifyCustomMetadataLabel;
}
