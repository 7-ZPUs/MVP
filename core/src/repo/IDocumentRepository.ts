import type { Document } from "../entity/Document";
import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";
import { SearchFilters } from "../../../shared/domain/metadata";

export const DOCUMENTO_REPOSITORY_TOKEN = Symbol("IDocumentRepository");

export interface IDocumentRepository {
  getById(id: number): Document | null;
  getByProcessId(processId: number): Document[];
  getByStatus(status: IntegrityStatusEnum): Document[];

  save(document: Document): Document;

  updateIntegrityStatus(id: number, status: IntegrityStatusEnum): void;

  searchDocument(filters: SearchFilters): Document[];

  searchDocumentSemantic(
    queryVector: Float32Array,
  ): Promise<Array<{ document: Document; score: number }>>;

  getIndexedDocumentsCount(): number;
}
