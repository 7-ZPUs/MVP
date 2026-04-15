import { inject, injectable } from "tsyringe";

import type {
  IGetDocumentClassByDipIdPort,
  IGetDocumentClassByIdPort,
  IGetDocumentClassByStatusPort,
  ISaveDocumentClassPort,
  ISearchDocumentClassPort,
  IUpdateDocumentClassIntegrityStatusPort,
} from "../IDocumentClassRepository";
import { DocumentClass } from "../../entity/DocumentClass";
import { IntegrityStatusEnum } from "../../value-objects/IntegrityStatusEnum";
import { DocumentClassDAO } from "../../dao/DocumentClassDAO";
import { DOCUMENT_CLASS_DAO_TOKEN } from "../../dao/IDocumentClassDAO";

@injectable()
export class DocumentClassPersistenceAdapter
  implements
    IGetDocumentClassByIdPort,
    IGetDocumentClassByDipIdPort,
    IGetDocumentClassByStatusPort,
    ISaveDocumentClassPort,
    IUpdateDocumentClassIntegrityStatusPort,
    ISearchDocumentClassPort
{
  constructor(
    @inject(DOCUMENT_CLASS_DAO_TOKEN)
    private readonly dao: DocumentClassDAO,
  ) {}

  getById(id: number): DocumentClass | null {
    return this.dao.getById(id);
  }

  getByDipId(dipId: number): DocumentClass[] {
    return this.dao.getByDipId(dipId);
  }

  getByStatus(status: IntegrityStatusEnum): DocumentClass[] {
    return this.dao.getByStatus(status);
  }

  save(documentClass: DocumentClass): DocumentClass {
    return this.dao.save(documentClass);
  }

  updateIntegrityStatus(id: number, status: IntegrityStatusEnum): void {
    return this.dao.updateIntegrityStatus(id, status);
  }

  searchDocumentalClasses(name: string): DocumentClass[] {
    return this.dao.search(name);
  }
}
