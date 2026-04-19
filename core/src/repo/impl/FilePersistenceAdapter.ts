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
import { FileMapper, FilePersistenceRow } from "../../dao/mappers/FileMapper";

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
    @inject(FileDAO)
    private readonly dao: FileDAO,
  ) {}

  private toEntity(row: FilePersistenceRow): File {
    return FileMapper.fromPersistence(row);
  }

  getById(id: number): File | null {
    const row = this.dao.getById(id);
    return row ? this.toEntity(row) : null;
  }

  getByDocumentId(documentId: number): File[] {
    return this.dao
      .getByDocumentId(documentId)
      .map((row) => this.toEntity(row));
  }

  getByStatus(status: IntegrityStatusEnum): File[] {
    return this.dao.getByStatus(status).map((row) => this.toEntity(row));
  }

  save(file: File): File {
    return this.toEntity(this.dao.save(file));
  }

  updateIntegrityStatus(id: number, status: IntegrityStatusEnum): void {
    return this.dao.updateIntegrityStatus(id, status);
  }
}
