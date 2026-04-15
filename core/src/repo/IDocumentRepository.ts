import type { Document } from "../entity/Document";
import { SearchDocumentsQuery } from "../entity/search/SearchQuery.model";
import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";

export const DOCUMENT_GET_BY_ID_PORT_TOKEN = Symbol("IGetDocumentByIdPort");
export const DOCUMENT_GET_BY_PROCESS_ID_PORT_TOKEN = Symbol(
  "IGetDocumentByProcessIdPort",
);
export const DOCUMENT_GET_BY_STATUS_PORT_TOKEN = Symbol(
  "IGetDocumentByStatusPort",
);
export const DOCUMENT_SAVE_PORT_TOKEN = Symbol("ISaveDocumentPort");
export const DOCUMENT_UPDATE_INTEGRITY_STATUS_PORT_TOKEN = Symbol(
  "IUpdateDocumentIntegrityStatusPort",
);
export const DOCUMENT_SEARCH_PORT_TOKEN = Symbol("ISearchDocumentPort");
export const DOCUMENT_SEARCH_SEMANTIC_PORT_TOKEN = Symbol(
  "ISearchDocumentSemanticPort",
);
export const DOCUMENT_GET_DISTINCT_CUSTOM_METADATA_KEYS_PORT_TOKEN = Symbol(
  "IGetDistinctDocumentCustomMetadataKeysPort",
);
export const DOCUMENT_GET_INDEXED_COUNT_PORT_TOKEN = Symbol(
  "IGetIndexedDocumentsCountPort",
);

export interface IGetDocumentByIdPort {
  getById(id: number): Document | null;
}

export interface IGetDocumentByProcessIdPort {
  getByProcessId(processId: number): Document[];
}

export interface IGetDocumentByStatusPort {
  getByStatus(status: IntegrityStatusEnum): Document[];
}

export interface ISaveDocumentPort {
  save(document: Document): Document;
}

export interface IUpdateDocumentIntegrityStatusPort {
  updateIntegrityStatus(id: number, status: IntegrityStatusEnum): void;
}

export interface ISearchDocumentPort {
  searchDocument(filters: SearchDocumentsQuery): Document[];
}

export interface ISearchDocumentSemanticPort {
  searchDocumentSemantic(
    queryVector: Float32Array,
  ): Promise<Array<{ document: Document; score: number }>>;
}

export interface IGetDistinctDocumentCustomMetadataKeysPort {
  getDistinctCustomMetadataKeys(dipId: number | null): string[];
}

export interface IGetIndexedDocumentsCountPort {
  getIndexedDocumentsCount(): number;
}
