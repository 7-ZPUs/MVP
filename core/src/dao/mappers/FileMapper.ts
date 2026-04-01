import { FileDTO } from "../../dto/FileDTO";
import { File } from "../../entity/File";
import { IntegrityStatusEnum } from "../../value-objects/IntegrityStatusEnum";

export interface FilePersistenceRow {
  id: number;
  uuid: string;
  filename: string;
  path: string;
  hash: string;
  integrityStatus: string;
  isMain: number;
  documentId: number;
  documentUuid: string;
}

export interface FilePersistenceModel {
  filename: string;
  path: string;
  hash: string;
  integrityStatus: IntegrityStatusEnum;
  isMain: number;
  uuid: string;
  documentUuid: string;
}

export class FileMapper {
  static fromPersistence(row: FilePersistenceRow): File {
    return new File(
      row.filename,
      row.path,
      row.hash,
      row.isMain === 1,
      row.uuid,
      row.documentUuid,
      IntegrityStatusEnum[
        row.integrityStatus as keyof typeof IntegrityStatusEnum
      ] || IntegrityStatusEnum.UNKNOWN,
      row.id,
      row.documentId,
    );
  }

  static toDTO(file: File): FileDTO {
    const id = file.getId();
    if (id === null) {
      throw new Error(
        "Cannot convert to DTO: File entity is not yet persisted and has no ID.",
      );
    }

    return {
      id,
      documentId: file.getDocumentId() ?? -1,
      filename: file.getFilename(),
      path: file.getPath(),
      hash: file.getHash(),
      integrityStatus: file.getIntegrityStatus(),
      isMain: file.getIsMain(),
    };
  }

  static toPersistence(file: File): FilePersistenceModel {
    return {
      filename: file.getFilename(),
      path: file.getPath(),
      hash: file.getHash(),
      integrityStatus: file.getIntegrityStatus(),
      isMain: file.getIsMain() ? 1 : 0,
      uuid: file.getUuid(),
      documentUuid: file.getDocumentUuid(),
    };
  }
}
