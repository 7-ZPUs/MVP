import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProcessDetail } from '../../domain/process.models';
import { OptionalFieldAbsentComponent } from '../../../../shared/components/optional-field-absent/optional-field-absent.component';

@Component({
  selector: 'app-process-metadata',
  standalone: true,
  imports: [CommonModule, OptionalFieldAbsentComponent],
  template: `
    <div class="metadata-card" data-testid="process-metadata-card-anagrafica">
      <h3 data-testid="process-metadata-heading-anagrafica">Anagrafica Processo</h3>
      <div class="data-row" data-testid="process-metadata-row-process-id">
        <span class="label">ID interno:</span>
        <span class="value">{{ data().metadata.processId }}</span>
      </div>
      <div class="data-row" data-testid="process-metadata-row-process-uuid">
        <span class="label">UUID Processo:</span>
        <span class="value">{{ data().metadata.processUuid }}</span>
      </div>
      <div class="data-row" data-testid="process-metadata-row-integrity-status">
        <span class="label">Stato verifica:</span>
        <span class="value">{{ data().metadata.integrityStatus }}</span>
      </div>
      <div class="data-row" data-testid="process-metadata-row-document-class-name">
        <span class="label">Classe documentale:</span>
        <span class="value">{{ data().metadata.documentClassName }}</span>
      </div>
      <div class="data-row" data-testid="process-metadata-row-document-class-uuid">
        <span class="label">UUID Classe:</span>
        <span class="value">{{ data().metadata.documentClassUuid }}</span>
      </div>
      <div class="data-row" data-testid="process-metadata-row-document-class-timestamp">
        <span class="label">Timestamp Classe:</span>
        <span class="value">{{ data().metadata.documentClassTimestamp }}</span>
      </div>
    </div>

    @if (hasOverviewContext()) {
      <div class="metadata-card" data-testid="process-metadata-card-overview">
        <h3 data-testid="process-metadata-heading-overview">Contesto del Processo</h3>
        <div class="data-row" data-testid="process-metadata-row-overview-oggetto">
          <span class="label">Oggetto:</span>
          <span class="value">{{ data().overview.oggetto }}</span>
        </div>
        <div class="data-row" data-testid="process-metadata-row-overview-procedimento">
          <span class="label">Procedimento:</span>
          <span class="value">{{ data().overview.procedimento }}</span>
        </div>
        <div class="data-row" data-testid="process-metadata-row-overview-materia">
          <span class="label">Materia/Argomento:</span>
          <span class="value">{{ data().overview.materiaArgomentoStruttura }}</span>
        </div>
      </div>
    } @else {
      <div data-testid="process-metadata-overview-empty">
        <app-optional-field-absent
          message="Nessun contesto del processo disponibile nei metadati"
        ></app-optional-field-absent>
      </div>
    }

    <div class="metadata-card" data-testid="process-metadata-card-submission">
      <h3 data-testid="process-metadata-heading-submission">Processo di Versamento</h3>
      <div class="data-row" data-testid="process-metadata-row-submission-processo">
        <span class="label">Processo:</span>
        <span class="value">{{ data().submission.processo }}</span>
      </div>
      <div class="data-row" data-testid="process-metadata-row-submission-sessione">
        <span class="label">Sessione:</span>
        <span class="value">{{ data().submission.sessione }}</span>
      </div>
      <div class="data-row" data-testid="process-metadata-row-submission-data-inizio">
        <span class="label">Data inizio:</span>
        <span class="value">{{ data().submission.dataInizio }}</span>
      </div>

      @if (data().submission.dataFine) {
        <div class="data-row" data-testid="process-metadata-row-submission-data-fine">
          <span class="label">Data fine:</span>
          <span class="value">{{ data().submission.dataFine }}</span>
        </div>
      }

      @if (data().submission.uuidTerminatore) {
        <div class="data-row" data-testid="process-metadata-row-submission-uuid-terminatore">
          <span class="label">UUID terminatore:</span>
          <span class="value">{{ data().submission.uuidTerminatore }}</span>
        </div>
      }

      @if (data().submission.canaleTerminazione) {
        <div class="data-row" data-testid="process-metadata-row-submission-canale-terminazione">
          <span class="label">Canale terminazione:</span>
          <span class="value">{{ data().submission.canaleTerminazione }}</span>
        </div>
      }
    </div>

    <div class="metadata-card" data-testid="process-metadata-card-conservation">
      <h3 data-testid="process-metadata-heading-conservation">Processo di Conservazione</h3>
      <div class="data-row" data-testid="process-metadata-row-conservation-processo">
        <span class="label">Processo:</span>
        <span class="value">{{ data().conservation.processo }}</span>
      </div>
      <div class="data-row" data-testid="process-metadata-row-conservation-sessione">
        <span class="label">Sessione:</span>
        <span class="value">{{ data().conservation.sessione }}</span>
      </div>
      <div class="data-row" data-testid="process-metadata-row-conservation-data-inizio">
        <span class="label">Data inizio:</span>
        <span class="value">{{ data().conservation.dataInizio }}</span>
      </div>

      @if (data().conservation.dataFine) {
        <div class="data-row" data-testid="process-metadata-row-conservation-data-fine">
          <span class="label">Data fine:</span>
          <span class="value">{{ data().conservation.dataFine }}</span>
        </div>
      }

      @if (data().conservation.uuidTerminatore) {
        <div class="data-row" data-testid="process-metadata-row-conservation-uuid-terminatore">
          <span class="label">UUID terminatore:</span>
          <span class="value">{{ data().conservation.uuidTerminatore }}</span>
        </div>
      }

      @if (data().conservation.canaleTerminazione) {
        <div class="data-row" data-testid="process-metadata-row-conservation-canale-terminazione">
          <span class="label">Canale terminazione:</span>
          <span class="value">{{ data().conservation.canaleTerminazione }}</span>
        </div>
      }
    </div>
  `,
  styleUrl: './process-metadata.component.scss',
})
export class ProcessMetadataComponent {
  data = input.required<ProcessDetail>();

  protected hasOverviewContext(): boolean {
    const overview = this.data().overview;
    return [overview.oggetto, overview.procedimento, overview.materiaArgomentoStruttura].some(
      (value) => this.isMeaningfulValue(value),
    );
  }

  private isMeaningfulValue(value: string | undefined): boolean {
    const normalized = (value ?? '').trim();
    return normalized.length > 0 && normalized.toUpperCase() !== 'N/A';
  }
}
