import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes, UrlTree } from '@angular/router';
import { ItemDetailPageComponent } from './ui/smart/item-detail-page/item-detail-page.component';

// 1. Importiamo i Token (I Contratti che la UI si aspetta di ricevere)
import { AGGREGATE_FACADE_TOKEN } from '../aggregate/contracts/IAggregateFacade';
import { DOCUMENT_FACADE_TOKEN } from '../document/contracts/IDocumentFacade';
import { OUTPUT_FACADE_TOKEN } from '../../shared/interfaces/output.interfaces';
import { INTEGRITY_FACADE_TOKEN } from '../../shared/interfaces/integrity.interfaces';
import { NODE_FALLBACK_FACADE_TOKEN } from './contracts/INodeFallbackFacade';
import { PROCESS_FACADE_TOKEN } from '../process/contracts/IProcessFacade';
import { IPC_GATEWAY_TOKEN } from '../../shared/interfaces/ipc-gateway.interfaces';
import { IpcChannels } from '../../../../../shared/ipc-channels';
import { MetadataExtractor } from '../../shared/utils/metadata-extractor.util';
import { normalizeMetadataNodes } from '../../shared/utils/metadata-nodes.util';

// 2. Importiamo le Classi Concrete (I motori reali che abbiamo scritto)
import { AggregateFacade } from '../aggregate/services/aggregate.facade';
import { DocumentFacade } from '../document/services/document.facade';
import { OutputFacade } from '../document/services/output.facade';
import { IntegrityFacade } from '../verification/services/integrity.facade';
import { NodeFallbackFacade } from './services/node-fallback.facade';
import { ProcessFacade } from '../process/services/process.facade';

interface ProcessProbe {
  id?: unknown;
  metadata?: unknown;
}

const AGGREGATE_METADATA_MARKERS = ['TipoAggregazione', 'TipologiaFascicolo', 'IdAggregazione'];

const legacyAggregateToProcessGuard: CanActivateFn = async (route): Promise<boolean | UrlTree> => {
  const itemType = route.paramMap.get('itemType');
  const itemId = route.paramMap.get('itemId');

  if (itemType !== 'AGGREGATE' || !itemId) {
    return true;
  }

  const numericId = Number(itemId);
  if (!Number.isFinite(numericId)) {
    return true;
  }

  const ipcGateway = inject(IPC_GATEWAY_TOKEN);
  const router = inject(Router);

  try {
    const process = await ipcGateway.invoke<ProcessProbe | null>(
      IpcChannels.BROWSE_GET_PROCESS_BY_ID,
      numericId,
      null,
    );
    if (process && process.id !== undefined && process.id !== null) {
      const extractor = new MetadataExtractor(normalizeMetadataNodes(process.metadata));
      const hasAggregateMarkers = AGGREGATE_METADATA_MARKERS.some(
        (key) => extractor.getString(key, '').trim().length > 0,
      );

      if (!hasAggregateMarkers) {
        return router.createUrlTree(['/detail', 'PROCESS', itemId]);
      }
    }
  } catch {
    return true;
  }

  return true;
};

export const itemDetailRoutes: Routes = [
  {
    // Il path URL: es. /dettaglio/AGGREGATE/123 oppure /dettaglio/DOCUMENT/456
    // I nomi dei parametri (:itemType e :itemId) DEVONO corrispondere ai nomi degli input() nel componente!
    path: ':itemType/:itemId',
    component: ItemDetailPageComponent,
    canActivate: [legacyAggregateToProcessGuard],

    // 3. IL CUORE DELL'INVERSIONE DELLE DIPENDENZE (DIP)
    // Diciamo ad Angular: "Se questo componente (o i suoi figli) chiede il Token X, passagli un'istanza della Classe Y"
    providers: [
      { provide: AGGREGATE_FACADE_TOKEN, useClass: AggregateFacade },
      { provide: PROCESS_FACADE_TOKEN, useClass: ProcessFacade },
      { provide: DOCUMENT_FACADE_TOKEN, useClass: DocumentFacade },
      { provide: NODE_FALLBACK_FACADE_TOKEN, useClass: NodeFallbackFacade },
      { provide: OUTPUT_FACADE_TOKEN, useClass: OutputFacade },
      { provide: INTEGRITY_FACADE_TOKEN, useClass: IntegrityFacade },
    ],
  },
];
