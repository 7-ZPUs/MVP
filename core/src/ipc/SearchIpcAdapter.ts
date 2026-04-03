import { IpcMain } from "electron";
import { container } from "tsyringe";

import { IpcChannels } from "../../../shared/ipc-channels";

import type { ISearchDocumentalClassUC } from "../use-case/classe-documentale/ISearchDocumentalClassUC";
import type { ISearchProcessUC } from "../use-case/process/ISearchProcessUC";
import type { ISearchDocumentsUC } from "../use-case/document/ISearchDocumentsUC";
import type { ISearchSemanticUC } from "../use-case/document/ISearchSemanticUC";
import type { IWordEmbedding } from "../repo/IWordEmbedding";
import type { IDocumentRepository } from "../repo/IDocumentRepository";
import {
  IndexingStatus,
  SearchQueryType,
} from "../../../shared/domain/metadata/search.enum";

import { DocumentClassUC } from "../use-case/classe-documentale/tokens";
import { ProcessUC } from "../use-case/process/token";
import { DocumentoUC } from "../use-case/document/tokens";
import { WORD_EMBEDDING_PORT_TOKEN } from "../repo/IWordEmbedding";
import { DOCUMENTO_REPOSITORY_TOKEN } from "../repo/IDocumentRepository";
import { DocumentClassMapper } from "../dao/mappers/DocumentClassMapper";
import { ProcessMapper } from "../dao/mappers/ProcessMapper";
import { MetadataKeyMapper } from "../dao/mappers/MetadataKeyMapper";
import {
  SearchQuery,
  SearchRequestDTO,
  SearchRequestSchema,
} from "../../../shared/domain/metadata/search.models";
import { SearchDocumentsQuery } from "../entity/search/SearchQuery.model";

export class SearchIpcAdapter {
  static register(ipcMain: IpcMain): void {
    const searchClassesUC: ISearchDocumentalClassUC =
      container.resolve<ISearchDocumentalClassUC>(
        DocumentClassUC.SEARCH_BY_DOCUMENTAL_CLASS_NAME,
      );
    const searchProcessiUC: ISearchProcessUC =
      container.resolve<ISearchProcessUC>(ProcessUC.SEARCH_BY_PROCESS_UUID);
    const searchDocumentsUC: ISearchDocumentsUC =
      container.resolve<ISearchDocumentsUC>(DocumentoUC.SEARCH_BY_FILTERS);
    const searchSemanticUC: ISearchSemanticUC =
      container.resolve<ISearchSemanticUC>(DocumentoUC.SEARCH_SEMANTIC);
    const aiAdapter: IWordEmbedding = container.resolve<IWordEmbedding>(
      WORD_EMBEDDING_PORT_TOKEN,
    );
    const documentRepo: IDocumentRepository =
      container.resolve<IDocumentRepository>(DOCUMENTO_REPOSITORY_TOKEN);

    ipcMain.handle(IpcChannels.SEARCH_CLASSES, (_event, name?: string) => {
      console.log(
        "SearchIpcAdapter: received search classes request with name =",
        name,
      );
      return searchClassesUC
        .execute(name ?? "")
        .map((dc) => DocumentClassMapper.toDTO(dc));
    });

    ipcMain.handle(IpcChannels.SEARCH_PROCESSES, (_event, uuid?: string) => {
      return searchProcessiUC
        .execute(uuid ?? "")
        .map((p) => ProcessMapper.toDTO(p));
    });

    // Ricerca avanzata con filtri strutturati
    ipcMain.handle(
      IpcChannels.SEARCH_DOCUMENTS,
      async (_event, filters: SearchRequestDTO) => {
        const validDTO = SearchRequestSchema.parse(filters);

        const domainMetadataGroup = validDTO.filter
          ? MetadataKeyMapper.mapGroup(validDTO.filter)
          : null;

        if(!domainMetadataGroup) {
          throw new Error("Invalid search filters: no valid metadata group could be constructed");
        }

        const domainQuery = new SearchDocumentsQuery(domainMetadataGroup);

        // 4. ESECUZIONE USE CASE
        return await searchDocumentsUC.execute(domainQuery);
      },
    );

    // Ricerca semantica tramite embedding AI
    ipcMain.handle(
      IpcChannels.SEARCH_SEMANTIC,
      async (_event, query: SearchQuery) => {
        return searchSemanticUC.execute(query.text);
      },
    );

    ipcMain.handle(
      IpcChannels.SEARCH_FULLTEXT,
      async (_event, query: SearchQuery) => {
        switch (query.type) {
          case SearchQueryType.PROCESS_ID:
            return searchProcessiUC
              .execute(query.text)
              .map((p) => ProcessMapper.toDTO(p));
          case SearchQueryType.CLASS_NAME:
            return searchClassesUC
              .execute(query.text)
              .map((dc) => DocumentClassMapper.toDTO(dc));
          case SearchQueryType.FREE:
          default: {
            const searchDocsQuery = new SearchDocumentsQuery({
              logicOperator: "AND",
              items: [
                {
                  path: "NomeDelDocumento",
                  operator: "LIKE",
                  value: `%${query.text}%`,
                },
              ],
            });
            return searchDocumentsUC.execute(searchDocsQuery);
          }
        }
      },
    );

    // Stato del motore AI — modello inizializzato e documenti indicizzati
    ipcMain.handle(IpcChannels.SEARCH_GET_AI_STATE, () => {
      const initialized = aiAdapter.isInitialized();
      const indexedDocuments = documentRepo.getIndexedDocumentsCount();
      const status = initialized ? IndexingStatus.READY : IndexingStatus.IDLE;

      return {
        status,
        progressPercentage: initialized ? 100 : 0,
        lastIndexedAt: null,
        indexedDocuments,
      };
    });
  }
}
