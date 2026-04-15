import { inject, injectable } from "tsyringe";
import path from "node:path";
import { IntegrityStatusEnum } from "../../value-objects/IntegrityStatusEnum";
import { IIntegrityVerificationService } from "../IIntegrityVerificationService";
import {
  FILE_GET_BY_DOCUMENT_ID_PORT_TOKEN,
  FILE_GET_BY_ID_PORT_TOKEN,
  FILE_UPDATE_INTEGRITY_STATUS_PORT_TOKEN,
  IGetFileByDocumentIdPort,
  IGetFileByIdPort,
  IUpdateFileIntegrityStatusPort,
} from "../../repo/IFileRepository";
import {
  DOCUMENT_GET_BY_ID_PORT_TOKEN,
  DOCUMENT_GET_BY_PROCESS_ID_PORT_TOKEN,
  DOCUMENT_UPDATE_INTEGRITY_STATUS_PORT_TOKEN,
  IGetDocumentByIdPort,
  IGetDocumentByProcessIdPort,
  IUpdateDocumentIntegrityStatusPort,
} from "../../repo/IDocumentRepository";
import {
  PROCESS_GET_BY_DOCUMENT_CLASS_ID_PORT_TOKEN,
  PROCESS_GET_BY_ID_PORT_TOKEN,
  PROCESS_UPDATE_INTEGRITY_STATUS_PORT_TOKEN,
  IGetProcessByDocumentClassIdPort,
  IGetProcessByIdPort,
  IUpdateProcessIntegrityStatusPort,
} from "../../repo/IProcessRepository";
import {
  DOCUMENT_CLASS_GET_BY_DIP_ID_PORT_TOKEN,
  DOCUMENT_CLASS_GET_BY_ID_PORT_TOKEN,
  DOCUMENT_CLASS_UPDATE_INTEGRITY_STATUS_PORT_TOKEN,
  IGetDocumentClassByDipIdPort,
  IGetDocumentClassByIdPort,
  IUpdateDocumentClassIntegrityStatusPort,
} from "../../repo/IDocumentClassRepository";
import {
  DIP_GET_BY_ID_PORT_TOKEN,
  DIP_UPDATE_INTEGRITY_STATUS_PORT_TOKEN,
  IGetDipByIdPort,
  IUpdateDipIntegrityStatusPort,
} from "../../repo/IDipRepository";
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
export class IntegrityVerificationService implements IIntegrityVerificationService {
  constructor(
    @inject(FILE_GET_BY_ID_PORT_TOKEN)
    private readonly fileReadByIdPort: IGetFileByIdPort,

    @inject(FILE_GET_BY_DOCUMENT_ID_PORT_TOKEN)
    private readonly fileReadByDocumentIdPort: IGetFileByDocumentIdPort,

    @inject(FILE_UPDATE_INTEGRITY_STATUS_PORT_TOKEN)
    private readonly fileUpdateIntegrityPort: IUpdateFileIntegrityStatusPort,

    @inject(DOCUMENT_GET_BY_ID_PORT_TOKEN)
    private readonly documentReadByIdPort: IGetDocumentByIdPort,

    @inject(DOCUMENT_GET_BY_PROCESS_ID_PORT_TOKEN)
    private readonly documentReadByProcessIdPort: IGetDocumentByProcessIdPort,

    @inject(DOCUMENT_UPDATE_INTEGRITY_STATUS_PORT_TOKEN)
    private readonly documentUpdateIntegrityPort: IUpdateDocumentIntegrityStatusPort,

    @inject(PROCESS_GET_BY_ID_PORT_TOKEN)
    private readonly processReadByIdPort: IGetProcessByIdPort,

    @inject(PROCESS_GET_BY_DOCUMENT_CLASS_ID_PORT_TOKEN)
    private readonly processReadByDocumentClassIdPort: IGetProcessByDocumentClassIdPort,

    @inject(PROCESS_UPDATE_INTEGRITY_STATUS_PORT_TOKEN)
    private readonly processUpdateIntegrityPort: IUpdateProcessIntegrityStatusPort,

    @inject(DOCUMENT_CLASS_GET_BY_ID_PORT_TOKEN)
    private readonly documentClassReadByIdPort: IGetDocumentClassByIdPort,

    @inject(DOCUMENT_CLASS_GET_BY_DIP_ID_PORT_TOKEN)
    private readonly documentClassReadByDipIdPort: IGetDocumentClassByDipIdPort,

    @inject(DOCUMENT_CLASS_UPDATE_INTEGRITY_STATUS_PORT_TOKEN)
    private readonly documentClassUpdateIntegrityPort: IUpdateDocumentClassIntegrityStatusPort,

    @inject(DIP_GET_BY_ID_PORT_TOKEN)
    private readonly dipReadByIdPort: IGetDipByIdPort,

    @inject(DIP_UPDATE_INTEGRITY_STATUS_PORT_TOKEN)
    private readonly dipUpdateIntegrityPort: IUpdateDipIntegrityStatusPort,

    @inject(HASHING_SERVICE_TOKEN)
    private readonly hashingService: IHashingService,

    @inject(TRANSACTION_MANAGER_TOKEN)
    private readonly transactionManager: ITransactionManager,

    @inject("DIP_PATH_TOKEN")
    private readonly dipPath: string,
  ) {}

  checkFileIntegrityStatus(fileId: number): Promise<IntegrityStatusEnum> {
    return this.transactionManager.runInTransaction(async () => {
      const file = this.fileReadByIdPort.getById(fileId);
      if (!file) {
        throw new Error(`File with id ${fileId} not found`);
      }
      return this.checkFileEntity(file);
    });
  }

  checkDocumentIntegrityStatus(
    documentId: number,
  ): Promise<IntegrityStatusEnum> {
    return this.transactionManager.runInTransaction(async () => {
      const document = this.documentReadByIdPort.getById(documentId);
      if (!document) {
        throw new Error(`Document with id ${documentId} not found`);
      }
      return this.checkDocumentEntity(document);
    });
  }

  checkProcessIntegrityStatus(processId: number): Promise<IntegrityStatusEnum> {
    return this.transactionManager.runInTransaction(async () => {
      const process = this.processReadByIdPort.getById(processId);
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
      const documentClass =
        this.documentClassReadByIdPort.getById(documentClassId);
      if (!documentClass) {
        throw new Error(`DocumentClass with id ${documentClassId} not found`);
      }
      return this.checkDocumentClassEntity(documentClass);
    });
  }

  checkDipIntegrityStatus(dipId: number): Promise<IntegrityStatusEnum> {
    return this.transactionManager.runInTransaction(async () => {
      const dip = this.dipReadByIdPort.getById(dipId);
      if (!dip) {
        throw new Error(`Dip with id ${dipId} not found`);
      }

      const rootDipId = this.requirePersistedId(dip.getId(), "Dip");
      const documentClasses =
        this.documentClassReadByDipIdPort.getByDipId(rootDipId);
      const childStatuses: IntegrityStatusEnum[] = [];

      for (const documentClass of documentClasses) {
        childStatuses.push(await this.checkDocumentClassEntity(documentClass));
      }

      const status = this.aggregateStatuses(childStatuses);
      dip.setIntegrityStatus(status);
      this.dipUpdateIntegrityPort.updateIntegrityStatus(rootDipId, status);

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
    const processes =
      this.processReadByDocumentClassIdPort.getByDocumentClassId(
        documentClassId,
      );
    const childStatuses: IntegrityStatusEnum[] = [];

    for (const process of processes) {
      childStatuses.push(await this.checkProcessEntity(process));
    }

    const status = this.aggregateStatuses(childStatuses);
    documentClass.setIntegrityStatus(status);
    this.documentClassUpdateIntegrityPort.updateIntegrityStatus(
      documentClassId,
      status,
    );

    return status;
  }

  private async checkProcessEntity(
    process: Process,
  ): Promise<IntegrityStatusEnum> {
    const processId = this.requirePersistedId(process.getId(), "Process");
    const documents =
      this.documentReadByProcessIdPort.getByProcessId(processId);
    const childStatuses: IntegrityStatusEnum[] = [];

    for (const document of documents) {
      childStatuses.push(await this.checkDocumentEntity(document));
    }

    const status = this.aggregateStatuses(childStatuses);
    process.setIntegrityStatus(status);
    this.processUpdateIntegrityPort.updateIntegrityStatus(processId, status);

    return status;
  }

  private async checkDocumentEntity(
    document: Document,
  ): Promise<IntegrityStatusEnum> {
    const documentId = this.requirePersistedId(document.getId(), "Document");
    const files = this.fileReadByDocumentIdPort.getByDocumentId(documentId);
    const childStatuses: IntegrityStatusEnum[] = [];

    for (const file of files) {
      childStatuses.push(await this.checkFileEntity(file));
    }

    const status = this.aggregateStatuses(childStatuses);
    document.setIntegrityStatus(status);
    this.documentUpdateIntegrityPort.updateIntegrityStatus(documentId, status);

    return status;
  }

  private async checkFileEntity(file: File): Promise<IntegrityStatusEnum> {
    const fileId = this.requirePersistedId(file.getId(), "File");
    const absolutePath = path.resolve(this.dipPath, file.getPath());
    const status = await this.hashingService.checkFileIntegrity(
      absolutePath,
      file.getHash(),
    );

    file.setIntegrityStatus(status);
    this.fileUpdateIntegrityPort.updateIntegrityStatus(fileId, status);

    return status;
  }

  private aggregateStatuses(
    statuses: IntegrityStatusEnum[],
  ): IntegrityStatusEnum {
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

  private requirePersistedId(id: number | null, entityName: string): number {
    if (id === null) {
      throw new Error(
        `${entityName} has not been saved yet, cannot check integrity`,
      );
    }
    return id;
  }
}
