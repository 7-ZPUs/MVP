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
import {
  DocumentClassMapper,
  DocumentClassPersistenceRow,
} from "../../dao/mappers/DocumentClassMapper";

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
    @inject(DocumentClassDAO)
    private readonly dao: DocumentClassDAO,
  ) {}

  private toEntity(row: DocumentClassPersistenceRow): DocumentClass {
    return DocumentClassMapper.fromPersistence(row);
  }

  getById(id: number): DocumentClass | null {
    const row = this.dao.getById(id);
    return row ? this.toEntity(row) : null;
  }

  getByDipId(dipId: number): DocumentClass[] {
    return this.dao.getByDipId(dipId).map((row) => this.toEntity(row));
  }

  getByStatus(status: IntegrityStatusEnum): DocumentClass[] {
    return this.dao.getByStatus(status).map((row) => this.toEntity(row));
  }

  save(documentClass: DocumentClass): DocumentClass {
    return this.toEntity(this.dao.save(documentClass));
  }

  updateIntegrityStatus(id: number, status: IntegrityStatusEnum): void {
    return this.dao.updateIntegrityStatus(id, status);
  }

  searchDocumentalClasses(name: string): DocumentClass[] {
    return this.dao.search(name).map((row) => this.toEntity(row));
  }
}
