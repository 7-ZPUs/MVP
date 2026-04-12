import type { Document } from "../entity/Document";
import { SearchDocumentsQuery } from "../entity/search/SearchQuery.model";
import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";

export const DOCUMENTO_REPOSITORY_TOKEN = Symbol("IDocumentRepository");

export interface IDocumentRepository {
  getById(id: number): Document | null;
  getByProcessId(processId: number): Document[];
  getByStatus(status: IntegrityStatusEnum): Document[];

  save(document: Document): Document;

  updateIntegrityStatus(id: number, status: IntegrityStatusEnum): void;

  searchDocument(filters: SearchDocumentsQuery): Document[];

  searchDocumentSemantic(
    queryVector: Float32Array,
  ): Promise<Array<{ document: Document; score: number }>>;

  getDistinctCustomMetadataKeys(dipId: number | null): string[];

  getIndexedDocumentsCount(): number;
}
