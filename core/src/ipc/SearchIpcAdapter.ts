import { IpcMain } from "electron";
import { container } from "tsyringe";

import { IpcChannels } from "../../../shared/ipc-channels";

import type { ISearchDocumentalClassUC } from "../use-case/classe-documentale/ISearchDocumentalClassUC";
import type { ISearchProcessUC } from "../use-case/process/ISearchProcessUC";
import type { ISearchDocumentsUC } from "../use-case/document/ISearchDocumentsUC";
import type { ISearchSemanticUC } from "../use-case/document/ISearchSemanticUC";
import type { IGetCustomMetadataKeysUC } from "../use-case/document/IGetCustomMetadataKeysUC";
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
import { DocumentMapper } from "../dao/mappers/DocumentMapper";
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
    const getCustomMetadataKeysUC: IGetCustomMetadataKeysUC =
      container.resolve<IGetCustomMetadataKeysUC>(
        DocumentoUC.GET_CUSTOM_METADATA_KEYS,
      );
    const aiAdapter: IWordEmbedding = container.resolve<IWordEmbedding>(
      WORD_EMBEDDING_PORT_TOKEN,
    );
    const documentRepo: IDocumentRepository =
      container.resolve<IDocumentRepository>(DOCUMENTO_REPOSITORY_TOKEN);

    ipcMain.handle(
      IpcChannels.SEARCH_CLASSES,
      async (_event, name?: string) => {
        console.log(
          "SearchIpcAdapter: received search classes request with name =",
          name,
        );
        const results = searchClassesUC.execute(name ?? "");
        return results.map((dc) => DocumentClassMapper.toSearchResult(dc));
      },
    );

    ipcMain.handle(IpcChannels.SEARCH_PROCESSES, (_event, uuid?: string) => {
      const results = searchProcessiUC.execute(uuid ?? "");
      return results.map((proc) => ProcessMapper.toSearchResult(proc));
    });

    // Ricerca avanzata con filtri strutturati
    ipcMain.handle(
      IpcChannels.SEARCH_DOCUMENTS,
      async (_event, filters: SearchRequestDTO) => {
        const validDTO = SearchRequestSchema.parse(filters);

        const domainMetadataGroup = validDTO.filter
          ? MetadataKeyMapper.mapGroup(validDTO.filter)
          : null;

        if (!domainMetadataGroup) {
          throw new Error(
            "Invalid search filters: no valid metadata group could be constructed",
          );
        }

        const domainQuery = new SearchDocumentsQuery(domainMetadataGroup);

        // 4. ESECUZIONE USE CASE
        const results = await Promise.resolve(
          searchDocumentsUC.execute(domainQuery),
        );
        return results.map((doc) => DocumentMapper.toSearchResult(doc, null));
      },
    );

    // Ricerca semantica tramite embedding AI
    ipcMain.handle(
      IpcChannels.SEARCH_SEMANTIC,
      async (_event, query: SearchQuery) => {
        const matches = await searchSemanticUC.execute(query.text);
        return matches.map(({ document, score }) =>
          DocumentMapper.toSearchResult(document, score),
        );
      },
    );

    ipcMain.handle(
      IpcChannels.SEARCH_FULLTEXT,
      async (_event, query: SearchQuery) => {
        switch (query.type) {
          case SearchQueryType.PROCESS_ID: {
            const results = searchProcessiUC.execute(query.text);
            return results.map((proc) => ProcessMapper.toSearchResult(proc));
          }
          case SearchQueryType.CLASS_NAME: {
            const results = searchClassesUC.execute(query.text);
            return results.map((dc) => DocumentClassMapper.toSearchResult(dc));
          }
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
            const results = await Promise.resolve(
              searchDocumentsUC.execute(searchDocsQuery),
            );
            return results.map((doc) =>
              DocumentMapper.toSearchResult(doc, null),
            );
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

    ipcMain.handle(
      IpcChannels.SEARCH_CUSTOM_METADATA_KEYS,
      (_event, dipId?: number) => {
        const dipIdentifier = Number.isFinite(dipId) ? Number(dipId) : null;
        return getCustomMetadataKeysUC.execute(dipIdentifier);
      },
    );
  }
}
