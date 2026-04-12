import { SearchDocumentsQuery } from "../entity/search/SearchQuery.model";
import { Document } from "../entity/Document";
import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";

export const DOCUMENT_DAO_TOKEN = Symbol("IDocumentDAO");

export interface IDocumentDAO {
  getById(id: number): Document | null;
  getByProcessId(processId: number): Document[];
  getByStatus(status: IntegrityStatusEnum): Document[];
  searchDocument(filters: SearchDocumentsQuery): Document[];
  searchDocumentSemantic(
    queryVector: Float32Array,
  ): Promise<Array<{ document: Document; score: number }>>;
  getDistinctCustomMetadataKeys(dipId: number | null): string[];
  getIndexedDocumentsCount(): number;
  save(document: Document): Document;
  updateIntegrityStatus(id: number, status: IntegrityStatusEnum): void;
}
