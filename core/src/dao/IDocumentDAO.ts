import { SearchFilters } from "../../../shared/domain/metadata/search.models";
import { Document } from "../entity/Document";
import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";

export const DOCUMENT_DAO_TOKEN = Symbol("IDocumentDAO");

export interface IDocumentDAO {
  getById(id: number): Document | null;
  getByProcessId(processId: number): Document[];
  getByStatus(status: IntegrityStatusEnum): Document[];
  searchDocument(filters: SearchFilters): Document[];
  searchDocumentSemantic(
    queryVector: Float32Array,
  ): Promise<Array<{ document: Document; score: number }>>;
  getIndexedDocumentsCount(): number;
  save(document: Document): Document;
  updateIntegrityStatus(id: number, status: IntegrityStatusEnum): void;
}
