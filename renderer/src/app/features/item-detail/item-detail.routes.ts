import { Routes } from '@angular/router';
import { ItemDetailPageComponent } from './ui/smart/item-detail-page/item-detail-page.component';

// 1. Importiamo i Token (I Contratti che la UI si aspetta di ricevere)
import { AGGREGATE_FACADE_TOKEN } from '../aggregate/contracts/IAggregateFacade';
import { DOCUMENT_FACADE_TOKEN } from '../document/contracts/IDocumentFacade';
import { OUTPUT_FACADE_TOKEN } from '../../shared/interfaces/output.interfaces';
import { INTEGRITY_FACADE_TOKEN } from '../../shared/interfaces/integrity.interfaces';
import { NODE_FALLBACK_FACADE_TOKEN } from './contracts/INodeFallbackFacade';

// 2. Importiamo le Classi Concrete (I motori reali che abbiamo scritto)
import { AggregateFacade } from '../aggregate/services/aggregate.facade';
import { DocumentFacade } from '../document/services/document.facade';
import { OutputFacade } from '../document/services/output.facade';
import { IntegrityFacade } from '../verification/services/integrity.facade';
import { NodeFallbackFacade } from './services/node-fallback.facade';

export const itemDetailRoutes: Routes = [
  {
    // Il path URL: es. /dettaglio/AGGREGATE/123 oppure /dettaglio/DOCUMENT/456
    // I nomi dei parametri (:itemType e :itemId) DEVONO corrispondere ai nomi degli input() nel componente!
    path: ':itemType/:itemId',
    component: ItemDetailPageComponent,

    // 3. IL CUORE DELL'INVERSIONE DELLE DIPENDENZE (DIP)
    // Diciamo ad Angular: "Se questo componente (o i suoi figli) chiede il Token X, passagli un'istanza della Classe Y"
    providers: [
      { provide: AGGREGATE_FACADE_TOKEN, useClass: AggregateFacade },
      { provide: DOCUMENT_FACADE_TOKEN, useClass: DocumentFacade },
      { provide: NODE_FALLBACK_FACADE_TOKEN, useClass: NodeFallbackFacade },
      { provide: OUTPUT_FACADE_TOKEN, useClass: OutputFacade },
      { provide: INTEGRITY_FACADE_TOKEN, useClass: IntegrityFacade },
    ],
  },
];
