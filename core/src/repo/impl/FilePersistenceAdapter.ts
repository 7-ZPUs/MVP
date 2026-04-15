import { inject, injectable } from "tsyringe";
import { File } from "../../entity/File";
import { IntegrityStatusEnum } from "../../value-objects/IntegrityStatusEnum";
import type {
  IGetFileByDocumentIdPort,
  IGetFileByIdPort,
  IGetFileByStatusPort,
  ISaveFilePort,
  IUpdateFileIntegrityStatusPort,
} from "../IFileRepository";
import { FileDAO } from "../../dao/FileDAO";
import { FILE_DAO_TOKEN } from "../../dao/IFileDAO";

@injectable()
export class FilePersistenceAdapter
  implements
    IGetFileByIdPort,
    IGetFileByDocumentIdPort,
    IGetFileByStatusPort,
    ISaveFilePort,
    IUpdateFileIntegrityStatusPort
{
  constructor(
    @inject(FILE_DAO_TOKEN)
    private readonly dao: FileDAO,
  ) {}

  getById(id: number): File | null {
    return this.dao.getById(id);
  }

  getByDocumentId(documentId: number): File[] {
    return this.dao.getByDocumentId(documentId);
  }

  getByStatus(status: IntegrityStatusEnum): File[] {
    return this.dao.getByStatus(status);
  }

  save(file: File): File {
    return this.dao.save(file);
  }

  updateIntegrityStatus(id: number, status: IntegrityStatusEnum): void {
    return this.dao.updateIntegrityStatus(id, status);
  }
}
