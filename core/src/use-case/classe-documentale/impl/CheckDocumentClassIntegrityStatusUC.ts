import { inject, injectable } from "tsyringe";
import { IntegrityStatusEnum } from "../../../value-objects/IntegrityStatusEnum";
import type { IDocumentClassRepository } from "../../../repo/IDocumentClassRepository";
import { DOCUMENT_CLASS_REPOSITORY_TOKEN } from "../../../repo/IDocumentClassRepository";
import type { IProcessRepository } from "../../../repo/IProcessRepository";
import { PROCESS_REPOSITORY_TOKEN } from "../../../repo/IProcessRepository";
import type { ICheckDocumentClassIntegrityStatusUC } from "../ICheckDocumentClassIntegrityStatusUC";
import {
  HASHING_SERVICE_TOKEN,
  IHashingService,
} from "../../../services/IHashingService";

@injectable()
export class CheckDocumentClassIntegrityStatusUC implements ICheckDocumentClassIntegrityStatusUC {
  constructor(
    @inject(DOCUMENT_CLASS_REPOSITORY_TOKEN)
    private readonly documentClassRepo: IDocumentClassRepository,

    @inject(PROCESS_REPOSITORY_TOKEN)
    private readonly processRepo: IProcessRepository,

    @inject(HASHING_SERVICE_TOKEN)
    private readonly hashingService: IHashingService,
  ) {}

  execute(documentClassId: number): Promise<IntegrityStatusEnum> {
    const documentClass = this.documentClassRepo.getById(documentClassId);
    if (!documentClass) {
      throw new Error(`DocumentClass with id ${documentClassId} not found`);
    }

    if (documentClass.getId() === null) {
      throw new Error(`DocumentClass has not been saved yet, cannot check integrity`);
    }

    return this.hashingService.checkDocumentClassIntegrity(
      documentClass.getId() as number,
    );
  }
}
