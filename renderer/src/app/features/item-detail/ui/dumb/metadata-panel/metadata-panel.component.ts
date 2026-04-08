import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AggregateDetailDTO } from '../../../../../shared/domain/dto/AggregateDTO';
import { DocumentDetail } from '../../../../document/domain/document.models';
import { ProcessDetail } from '../../../../process/domain/process.models';

// Importiamo i Dumb Component di Epica 1
import { AdminProcedureComponent } from '../../../../aggregate/components/admin-procedure/admin-procedure.component';
import { AggregateMetadataComponent } from '../../../../aggregate/components/aggregate-metadata/aggregate-metadata.component';
import { RegistrationDataComponent } from '../../../../document/components/registration-data/registration-data.component';
import { OptionalFieldAbsentComponent } from '../../../../../shared/components/optional-field-absent/optional-field-absent.component';
// (Importa qui gli altri componenti come FormatInfo, VerificationInfo ecc.)
import { AipInfoComponent } from '../../../../document/components/aip-info/aip-info.component';
import { AttachmentsComponent } from '../../../../document/components/attachments/attachments.component';
import { ChangeTrackingComponent } from '../../../../document/components/change-tracking/change-tracking.component';
import { ClassificationInfoComponent } from '../../../../document/components/classification-info/classification-info.component';
import { ConservationProcessComponent } from '../../../../document/components/conservation-process/conservation-process.component';
import { CustomMetadataComponent } from '../../../../document/components/custom-metadata/custom-metadata.component';
import { DocumentMetadataComponent } from '../../../../document/components/document-metadata/document-metadata.component';
import { FormatInfoComponent } from '../../../../document/components/format-info/format-info.component';
import { SubjectListComponent } from '../../../../document/components/subject-list/subject-list.component';
import { VerificationInfoComponent } from '../../../../document/components/verification-info/verification-info.component';
import { ProcessMetadataComponent } from '../../../../process/components/process-metadata/process-metadata.component';

@Component({
  selector: 'app-metadata-panel',
  standalone: true,
  imports: [
    CommonModule,
    AdminProcedureComponent,
    RegistrationDataComponent,
    OptionalFieldAbsentComponent,
    AipInfoComponent,
    AttachmentsComponent,
    ChangeTrackingComponent,
    ClassificationInfoComponent,
    ConservationProcessComponent,
    CustomMetadataComponent,
    DocumentMetadataComponent,
    FormatInfoComponent,
    SubjectListComponent,
    VerificationInfoComponent,
    AggregateMetadataComponent,
    ProcessMetadataComponent,
  ],
  template: `
    <div class="metadata-container">
      @switch (itemType()) {
        @case ('AGGREGATE') {
          @if (aggregateData(); as agg) {
            <h2 class="section-title">Dettaglio Fascicolo</h2>

            @if (agg) {
              <app-aggregate-metadata [data]="agg"></app-aggregate-metadata>
            } @else {
              <app-optional-field-absent
                message="Nessun metadato presente per questo fascicolo"
              ></app-optional-field-absent>
            }

            @if (agg.procedimentoAmministrativo) {
              <app-admin-procedure [data]="agg"></app-admin-procedure>
            } @else {
              <app-optional-field-absent
                message="Nessun procedimento amministrativo associato"
              ></app-optional-field-absent>
            }
          }
        }

        @case ('PROCESS') {
          @if (processData(); as process) {
            <h2 class="section-title">Dettaglio Processo</h2>
            <app-process-metadata [data]="process"></app-process-metadata>
          } @else {
            <app-optional-field-absent
              message="Nessun metadato presente per questo processo"
            ></app-optional-field-absent>
          }
        }

        @case ('DOCUMENT') {
          @if (documentData(); as doc) {
            <h2 class="section-title">Dettaglio Documento</h2>

            @if (doc.metadata) {
              <app-document-metadata [data]="doc.metadata"></app-document-metadata>
            } @else {
              <app-optional-field-absent
                message="Nessun metadato documentale presente"
              ></app-optional-field-absent>
            }

            @if (
              doc.idAggregazione || (doc.documentiCollegati && doc.documentiCollegati.length > 0)
            ) {
              <div class="metadata-card relation-card">
                <h3>Relazioni</h3>
                @if (doc.idAggregazione) {
                  <div class="data-row">
                    <span class="label">Aggregazione collegata:</span>
                    <span class="value">{{ doc.idAggregazione }}</span>
                  </div>
                }
                @if (doc.documentiCollegati && doc.documentiCollegati.length > 0) {
                  <div class="data-row">
                    <span class="label">Documenti Collegati:</span>
                    <span class="value">{{ doc.documentiCollegati.join(', ') }}</span>
                  </div>
                }
              </div>
            }

            @if (doc.registration) {
              <app-registration-data [data]="doc.registration"></app-registration-data>
            }
            @if (doc.classification) {
              <app-classification-info [data]="doc.classification"></app-classification-info>
            }
            @if (doc.format) {
              <app-format-info [data]="doc.format"></app-format-info>
            }
            @if (doc.verification) {
              <app-verification-info [data]="doc.verification"></app-verification-info>
            }
            @if (doc.attachments) {
              <app-attachments [data]="doc.attachments"></app-attachments>
            }
            @if (doc.changeTracking) {
              <app-change-tracking [data]="doc.changeTracking"></app-change-tracking>
            }
            @if (doc.aipInfo) {
              <app-aip-info [data]="doc.aipInfo"></app-aip-info>
            }
            @if (doc.conservationProcess) {
              <app-conservation-process [data]="doc.conservationProcess"></app-conservation-process>
            }

            @if (doc.customMetadata?.length) {
              <app-custom-metadata [entries]="doc.customMetadata"></app-custom-metadata>
            } @else {
              <app-optional-field-absent
                message="Nessuna metadato personalizzato presente"
              ></app-optional-field-absent>
            }

            @if (doc.subjects?.length) {
              <app-subject-list [subjects]="doc.subjects"></app-subject-list>
            } @else {
              <app-optional-field-absent
                message="Nessun soggetto associato al documento"
              ></app-optional-field-absent>
            }
          }
        }
      }
    </div>
  `,
  styleUrl: './metadata-panel.component.scss',
})
export class MetadataPanelComponent {
  itemType = input.required<'AGGREGATE' | 'DOCUMENT' | 'PROCESS'>();
  aggregateData = input<AggregateDetailDTO | null>(null);
  documentData = input<DocumentDetail | null>(null);
  processData = input<ProcessDetail | null>(null);
}
