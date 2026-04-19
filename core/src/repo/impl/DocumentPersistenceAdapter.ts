import { inject, injectable } from "tsyringe";

import { Document } from "../../entity/Document";
import { IntegrityStatusEnum } from "../../value-objects/IntegrityStatusEnum";
import type {
  IGetDistinctDocumentCustomMetadataKeysPort,
  IGetDocumentByIdPort,
  IGetDocumentByProcessIdPort,
  IGetDocumentByStatusPort,
  IGetIndexedDocumentsCountPort,
  ISaveDocumentPort,
  ISearchDocumentPort,
  ISearchDocumentSemanticPort,
  IUpdateDocumentIntegrityStatusPort,
} from "../IDocumentRepository";

import { DocumentDAO } from "../../dao/DocumentDAO";
import {
  DocumentJsonPersistenceRow,
  DocumentMapper,
} from "../../dao/mappers/DocumentMapper";
import { SearchDocumentsQuery } from "../../entity/search/SearchQuery.model";

@injectable()
export class DocumentPersistenceAdapter
  implements
    IGetDocumentByIdPort,
    IGetDocumentByProcessIdPort,
    IGetDocumentByStatusPort,
    ISaveDocumentPort,
    IUpdateDocumentIntegrityStatusPort,
    ISearchDocumentPort,
    ISearchDocumentSemanticPort,
    IGetDistinctDocumentCustomMetadataKeysPort,
    IGetIndexedDocumentsCountPort
{
  constructor(
    @inject(DocumentDAO)
    private readonly dao: DocumentDAO,
  ) {}

  private toEntity(row: DocumentJsonPersistenceRow): Document {
    return DocumentMapper.fromJsonPersistence(row);
  }

  getById(id: number): Document | null {
    const row = this.dao.getById(id);
    return row ? this.toEntity(row) : null;
  }

  getByProcessId(processId: number): Document[] {
    return this.dao.getByProcessId(processId).map((row) => this.toEntity(row));
  }

  getByStatus(status: IntegrityStatusEnum): Document[] {
    return this.dao.getByStatus(status).map((row) => this.toEntity(row));
  }

  save(document: Document): Document {
    return this.toEntity(this.dao.save(document));
  }

  updateIntegrityStatus(id: number, status: IntegrityStatusEnum): void {
    return this.dao.updateIntegrityStatus(id, status);
  }

  searchDocument(filters: SearchDocumentsQuery): Document[] {
    return this.dao.searchDocument(filters).map((row) => this.toEntity(row));
  }

  async searchDocumentSemantic(
    queryVector: Float32Array,
  ): Promise<Array<{ document: Document; score: number }>> {
    const results = await this.dao.searchDocumentSemantic(queryVector);
    return results.map((result) => ({
      document: this.toEntity(result.row),
      score: result.score,
    }));
  }

  getDistinctCustomMetadataKeys(dipId: number | null): string[] {
    return this.dao.getDistinctCustomMetadataKeys(dipId);
  }

  getIndexedDocumentsCount(): number {
    return this.dao.getIndexedDocumentsCount();
  }
}
