import { DocumentDTO } from "../../dto/DocumentDTO";
import { Document } from "../../entity/Document";
import { IntegrityStatusEnum } from "../../value-objects/IntegrityStatusEnum";
import { Metadata } from "../../value-objects/Metadata";
import { MetadataPersistenceRow, MetadataMapper } from "./MetadataMapper";

export interface DocumentPersistenceRow {
  id: number;
  uuid: string;
  integrityStatus?: string;
  processId: number;
  processUuid: string;
}

export interface DocumentPersistenceModel {
  uuid: string;
  integrityStatus: IntegrityStatusEnum;
  processUuid: string;
  metadata: Metadata[];
}

export class DocumentMapper {
  static fromPersistence(
    row: DocumentPersistenceRow,
    metadata: MetadataPersistenceRow[],
  ): Document {
    return new Document(
      row.uuid,
      MetadataMapper.fromFlatRows(metadata),
      row.processUuid,
      row.integrityStatus
        ? IntegrityStatusEnum[
            row.integrityStatus as keyof typeof IntegrityStatusEnum
          ] || IntegrityStatusEnum.UNKNOWN
        : IntegrityStatusEnum.UNKNOWN,
      row.id,
      row.processId,
    );
  }

  static toDTO(document: Document): DocumentDTO {
    const id = document.getId();
    if (id === null) {
      throw new Error(
        "Cannot convert to DTO: Document entity is not yet persisted and has no ID.",
      );
    }

    return {
      id,
      uuid: document.getUuid(),
      integrityStatus: document.getIntegrityStatus(),
      metadata: MetadataMapper.toDTO(document.getMetadata()),
      processId: document.getProcessId() ?? -1,
    };
  }

  static toPersistence(document: Document): DocumentPersistenceModel {
    return {
      uuid: document.getUuid(),
      integrityStatus: document.getIntegrityStatus(),
      processUuid: document.getProcessUuid(),
      metadata: MetadataMapper.flatten(document.getMetadata()),
    };
  }
}
