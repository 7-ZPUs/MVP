import { IpcMain } from 'electron';
import { container } from 'tsyringe';

import { IpcChannels } from '../../../shared/ipc-channels';


import type { ISearchDocumentalClassUC } from '../use-case/classe-documentale/ISearchDocumentalClassUC';
import type { ISearchProcessUC } from '../use-case/process/ISearchProcessUC';
import type { ISearchDocumentsUC } from '../use-case/document/ISearchDocumentsUC';
import type { ISearchSemanticUC } from '../use-case/document/ISearchSemanticUC';
import type { IWordEmbedding } from '../repo/IWordEmbedding';
import type { IDocumentRepository } from '../repo/IDocumentRepository';
import { IndexingStatus, SearchQueryType } from '../../../shared/domain/metadata/search.enum';

import { DocumentClassUC } from '../use-case/classe-documentale/tokens';
import { ProcessUC } from '../use-case/process/token';
import { DocumentoUC } from '../use-case/document/tokens';
import { WORD_EMBEDDING_PORT_TOKEN } from '../repo/IWordEmbedding';
import { DOCUMENTO_REPOSITORY_TOKEN } from '../repo/IDocumentRepository';
import { DocumentClassMapper } from '../dao/mappers/DocumentClassMapper';
import { ProcessMapper } from '../dao/mappers/ProcessMapper';
import { SearchFilters, SearchQuery } from '../../../shared/domain/metadata';

// Filtri vuoti usati come base per la ricerca full-text
const emptyFilters: SearchFilters = {
    common: { chiaveDescrittiva: null, classificazione: null, conservazione: null, note: null, tipoDocumento: null },
    diDai: { nome: null, versione: null, idPrimario: null, tipologia: null, modalitaFormazione: null, riservatezza: null, identificativoFormato: null, verifica: null, registrazione: null, tracciatureModifiche: null },
    aggregate: { tipoAggregazione: null, idAggregazione: null, tipoFascicolo: null, dataApertura: null, dataChiusura: null, procedimento: null, assegnazione: null },
    subject: null,
    custom: null,
};

export class SearchIpcAdapter {
    static register(ipcMain: IpcMain): void {
        const searchClassesUC = container.resolve<ISearchDocumentalClassUC>(DocumentClassUC.SEARCH_BY_DOCUMENTAL_CLASS_NAME);
        const searchProcessiUC = container.resolve<ISearchProcessUC>(ProcessUC.SEARCH_BY_PROCESS_UUID);
        const searchDocumentsUC = container.resolve<ISearchDocumentsUC>(DocumentoUC.SEARCH_BY_FILTERS);
        const searchSemanticUC = container.resolve<ISearchSemanticUC>(DocumentoUC.SEARCH_SEMANTIC);
        const aiAdapter = container.resolve<IWordEmbedding>(WORD_EMBEDDING_PORT_TOKEN);
        const documentRepo = container.resolve<IDocumentRepository>(DOCUMENTO_REPOSITORY_TOKEN);

        ipcMain.handle(IpcChannels.SEARCH_CLASSES, (_event, name?: string) => {
            return searchClassesUC.execute(name ?? '').map((dc) => DocumentClassMapper.toDTO(dc));
        });

        ipcMain.handle(IpcChannels.SEARCH_PROCESSES, (_event, uuid?: string) => {
            return searchProcessiUC.execute(uuid ?? '').map((p) => ProcessMapper.toDTO(p));
        });

        // Ricerca avanzata con filtri strutturati
        ipcMain.handle(IpcChannels.SEARCH_DOCUMENTS, (_event, filters: SearchFilters) => {
            return searchDocumentsUC.execute(filters);
        });

        // Ricerca semantica tramite embedding AI
        ipcMain.handle(IpcChannels.SEARCH_SEMANTIC, async (_event, query: SearchQuery) => {
            return searchSemanticUC.execute(query.text);
        });

        ipcMain.handle(IpcChannels.SEARCH_FULLTEXT, async (_event, query: SearchQuery) => {
            switch (query.type) {
                case SearchQueryType.PROCESS_ID:
                    return searchProcessiUC.execute(query.text).map(p => ProcessMapper.toDTO(p));
                case SearchQueryType.CLASS_NAME:
                    return searchClassesUC.execute(query.text).map(dc => DocumentClassMapper.toDTO(dc));
                case SearchQueryType.FREE:
                default: {
                    const filters: SearchFilters = {
                        ...emptyFilters,
                        diDai: { ...emptyFilters.diDai, nome: query.text },
                    };
                    return searchDocumentsUC.execute(filters);
                }
            }
        });

        // Stato del motore AI — modello inizializzato e documenti indicizzati
        ipcMain.handle(IpcChannels.SEARCH_GET_AI_STATE, () => {
            const initialized = aiAdapter.isInitialized();
            const indexedDocuments = documentRepo.getIndexedDocumentsCount();

            // TODO: aggiungere logica INDEXING/READY quando sarà disponibile getTotalDocumentsCount()
            let status: IndexingStatus;
            if (!initialized) {
                status = IndexingStatus.IDLE;
            } else {
                status = IndexingStatus.READY;
            }

            return {
                status,
                progressPercentage: initialized ? 100 : 0,
                lastIndexedAt: null,
                indexedDocuments,
            };
        });
    }
}