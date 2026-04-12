import { inject, injectable } from "tsyringe";

import { Document } from "../../entity/Document";
import { IntegrityStatusEnum } from "../../value-objects/IntegrityStatusEnum";
import type { IDocumentRepository } from "../IDocumentRepository";

import { DOCUMENT_DAO_TOKEN } from "../../dao/IDocumentDAO";
import { DocumentDAO } from "../../dao/DocumentDAO";
import { SearchDocumentsQuery } from "../../entity/search/SearchQuery.model";

const METADATA_TABLE = "document_metadata";
const METADATA_FK = "document_id";

@injectable()
export class DocumentRepository implements IDocumentRepository {
  constructor(
    @inject(DOCUMENT_DAO_TOKEN)
    private readonly dao: DocumentDAO,
  ) {}

  getById(id: number): Document | null {
    return this.dao.getById(id);
  }

  getByProcessId(processId: number): Document[] {
    return this.dao.getByProcessId(processId);
  }

  getByStatus(status: IntegrityStatusEnum): Document[] {
    return this.dao.getByStatus(status);
  }

  save(document: Document): Document {
    return this.dao.save(document);
  }

  updateIntegrityStatus(id: number, status: IntegrityStatusEnum): void {
    return this.dao.updateIntegrityStatus(id, status);
  }

  searchDocument(filters: SearchDocumentsQuery): Document[] {
    return this.dao.searchDocument(filters);
  }

  async searchDocumentSemantic(
    queryVector: Float32Array,
  ): Promise<Array<{ document: Document; score: number }>> {
    return this.dao.searchDocumentSemantic(queryVector);
  }

  getDistinctCustomMetadataKeys(dipId: number | null): string[] {
    return this.dao.getDistinctCustomMetadataKeys(dipId);
  }

  getIndexedDocumentsCount(): number {
    return this.dao.getIndexedDocumentsCount();
  }
}
