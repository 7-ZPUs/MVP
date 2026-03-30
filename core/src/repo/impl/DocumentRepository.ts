import { inject, injectable } from "tsyringe";

import { Document } from "../../entity/Document";
import { IntegrityStatusEnum } from "../../value-objects/IntegrityStatusEnum";
import type { IDocumentRepository } from "../IDocumentRepository";
import { DocumentDAO } from "../../dao/DocumentDAO";
import { DOCUMENT_DAO_TOKEN } from "../../dao/IDocumentDAO";

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

  getAggregatedIntegrityStatusByProcessId(
    processId: number,
  ): IntegrityStatusEnum {
    return this.dao.getAggregatedIntegrityStatusByProcessId(processId);
  }
}
