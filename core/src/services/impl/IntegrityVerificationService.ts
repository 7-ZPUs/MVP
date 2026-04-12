import { inject, injectable } from "tsyringe";
import { IntegrityStatusEnum } from "../../value-objects/IntegrityStatusEnum";
import {
  IIntegrityVerificationService,
} from "../IIntegrityVerificationService";
import {
  FILE_REPOSITORY_TOKEN,
  IFileRepository,
} from "../../repo/IFileRepository";
import {
  DOCUMENTO_REPOSITORY_TOKEN,
  IDocumentRepository,
} from "../../repo/IDocumentRepository";
import {
  PROCESS_REPOSITORY_TOKEN,
  IProcessRepository,
} from "../../repo/IProcessRepository";
import {
  DOCUMENT_CLASS_REPOSITORY_TOKEN,
  IDocumentClassRepository,
} from "../../repo/IDocumentClassRepository";
import { DIP_REPOSITORY_TOKEN, IDipRepository } from "../../repo/IDipRepository";
import { HASHING_SERVICE_TOKEN, IHashingService } from "../IHashingService";
import {
  ITransactionManager,
  TRANSACTION_MANAGER_TOKEN,
} from "../../repo/ITransactionManager";
import { File } from "../../entity/File";
import { Document } from "../../entity/Document";
import { Process } from "../../entity/Process";
import { DocumentClass } from "../../entity/DocumentClass";

@injectable()
export class IntegrityVerificationService
  implements IIntegrityVerificationService
{
  constructor(
    @inject(FILE_REPOSITORY_TOKEN)
    private readonly fileRepo: IFileRepository,

    @inject(DOCUMENTO_REPOSITORY_TOKEN)
    private readonly documentRepo: IDocumentRepository,

    @inject(PROCESS_REPOSITORY_TOKEN)
    private readonly processRepo: IProcessRepository,

    @inject(DOCUMENT_CLASS_REPOSITORY_TOKEN)
    private readonly documentClassRepo: IDocumentClassRepository,

    @inject(DIP_REPOSITORY_TOKEN)
    private readonly dipRepo: IDipRepository,

    @inject(HASHING_SERVICE_TOKEN)
    private readonly hashingService: IHashingService,
    
    @inject(TRANSACTION_MANAGER_TOKEN)
    private readonly transactionManager: ITransactionManager,
    
    @inject("DIP_PATH_TOKEN")
    private readonly dipPath: string,
  ) {}

  checkFileIntegrityStatus(fileId: number): Promise<IntegrityStatusEnum> {
    return this.transactionManager.runInTransaction(async () => {
      const file = this.fileRepo.getById(fileId);
      if (!file) {
        throw new Error(`File with id ${fileId} not found`);
      }
      return this.checkFileEntity(file);
    });
  }

  checkDocumentIntegrityStatus(documentId: number): Promise<IntegrityStatusEnum> {
    return this.transactionManager.runInTransaction(async () => {
      const document = this.documentRepo.getById(documentId);
      if (!document) {
        throw new Error(`Document with id ${documentId} not found`);
      }
      return this.checkDocumentEntity(document);
    });
  }

  checkProcessIntegrityStatus(processId: number): Promise<IntegrityStatusEnum> {
    return this.transactionManager.runInTransaction(async () => {
      const process = this.processRepo.getById(processId);
      if (!process) {
        throw new Error(`Process with id ${processId} not found`);
      }
      return this.checkProcessEntity(process);
    });
  }

  checkDocumentClassIntegrityStatus(
    documentClassId: number,
  ): Promise<IntegrityStatusEnum> {
    return this.transactionManager.runInTransaction(async () => {
      const documentClass = this.documentClassRepo.getById(documentClassId);
      if (!documentClass) {
        throw new Error(`DocumentClass with id ${documentClassId} not found`);
      }
      return this.checkDocumentClassEntity(documentClass);
    });
  }

  checkDipIntegrityStatus(dipId: number): Promise<IntegrityStatusEnum> {
    return this.transactionManager.runInTransaction(async () => {
      const dip = this.dipRepo.getById(dipId);
      if (!dip) {
        throw new Error(`Dip with id ${dipId} not found`);
      }

      const rootDipId = this.requirePersistedId(dip.getId(), "Dip");
      const documentClasses = this.documentClassRepo.getByDipId(rootDipId);
      const childStatuses: IntegrityStatusEnum[] = [];

      for (const documentClass of documentClasses) {
        childStatuses.push(await this.checkDocumentClassEntity(documentClass));
      }

      const status = this.aggregateStatuses(childStatuses);
      dip.setIntegrityStatus(status);
      this.dipRepo.updateIntegrityStatus(rootDipId, status);

      return status;
    });
  }

  private async checkDocumentClassEntity(
    documentClass: DocumentClass,
  ): Promise<IntegrityStatusEnum> {
    const documentClassId = this.requirePersistedId(
      documentClass.getId(),
      "DocumentClass",
    );
    const processes = this.processRepo.getByDocumentClassId(documentClassId);
    const childStatuses: IntegrityStatusEnum[] = [];

    for (const process of processes) {
      childStatuses.push(await this.checkProcessEntity(process));
    }

    const status = this.aggregateStatuses(childStatuses);
    documentClass.setIntegrityStatus(status);
    this.documentClassRepo.updateIntegrityStatus(documentClassId, status);

    return status;
  }

  private async checkProcessEntity(process: Process): Promise<IntegrityStatusEnum> {
    const processId = this.requirePersistedId(process.getId(), "Process");
    const documents = this.documentRepo.getByProcessId(processId);
    const childStatuses: IntegrityStatusEnum[] = [];

    for (const document of documents) {
      childStatuses.push(await this.checkDocumentEntity(document));
    }

    const status = this.aggregateStatuses(childStatuses);
    process.setIntegrityStatus(status);
    this.processRepo.updateIntegrityStatus(processId, status);

    return status;
  }

  private async checkDocumentEntity(document: Document): Promise<IntegrityStatusEnum> {
    const documentId = this.requirePersistedId(document.getId(), "Document");
    const files = this.fileRepo.getByDocumentId(documentId);
    const childStatuses: IntegrityStatusEnum[] = [];

    for (const file of files) {
      childStatuses.push(await this.checkFileEntity(file));
    }

    const status = this.aggregateStatuses(childStatuses);
    document.setIntegrityStatus(status);
    this.documentRepo.updateIntegrityStatus(documentId, status);

    return status;
  }

  private async checkFileEntity(file: File): Promise<IntegrityStatusEnum> {
    const fileId = this.requirePersistedId(file.getId(), "File");
    const path = require("path");
    const absolutePath = path.resolve(this.dipPath, file.getPath());
    const status = await this.hashingService.checkFileIntegrity(
      absolutePath,
      file.getHash(),
    );

    file.setIntegrityStatus(status);
    this.fileRepo.updateIntegrityStatus(fileId, status);

    return status;
  }

  private aggregateStatuses(statuses: IntegrityStatusEnum[]): IntegrityStatusEnum {
    if (statuses.length === 0) {
      return IntegrityStatusEnum.VALID;
    }
    if (statuses.includes(IntegrityStatusEnum.INVALID)) {
      return IntegrityStatusEnum.INVALID;
    }
    if (statuses.includes(IntegrityStatusEnum.UNKNOWN)) {
      return IntegrityStatusEnum.UNKNOWN;
    }
    return IntegrityStatusEnum.VALID;
  }

  private requirePersistedId(
    id: number | null,
    entityName: string,
  ): number {
    if (id === null) {
      throw new Error(
        `${entityName} has not been saved yet, cannot check integrity`,
      );
    }
    return id;
  }
}