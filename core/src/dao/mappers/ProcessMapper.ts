import { ProcessDTO } from "../../dto/ProcessDTO";
import { Process } from "../../entity/Process";
import { IntegrityStatusEnum } from "../../value-objects/IntegrityStatusEnum";
import { Metadata } from "../../value-objects/Metadata";
import { MetadataPersistenceRow, MetadataMapper } from "./MetadataMapper";
import { ProcessSearchResult } from "../../../../shared/domain/metadata/search.models";

export interface ProcessPersistenceRow {
  id: number;
  documentClassId: number;
  uuid: string;
  documentClassUuid: string;
  integrityStatus?: string;
}

export interface ProcessPersistenceModel {
  documentClassUuid: string;
  uuid: string;
  integrityStatus: IntegrityStatusEnum;
  metadata: Metadata[];
}

export class ProcessMapper {
  static fromPersistence(
    row: ProcessPersistenceRow,
    metadata: MetadataPersistenceRow[],
  ): Process {
    return new Process(
      row.documentClassUuid,
      row.uuid,
      MetadataMapper.fromFlatRows(metadata),
      row.integrityStatus
        ? IntegrityStatusEnum[
            row.integrityStatus as keyof typeof IntegrityStatusEnum
          ] || IntegrityStatusEnum.UNKNOWN
        : IntegrityStatusEnum.UNKNOWN,
      row.id,
      row.documentClassId,
    );
  }

  static toDTO(process: Process): ProcessDTO {
    const id = process.getId();
    if (id === null) {
      throw new Error(
        "Cannot convert to DTO: Process entity is not yet persisted and has no ID.",
      );
    }

    return {
      id,
      documentClassId: process.getDocumentClassId() ?? -1,
      uuid: process.getUuid(),
      integrityStatus: process.getIntegrityStatus(),
      metadata: MetadataMapper.toDTO(process.getMetadata()),
    };
  }

  static toPersistence(process: Process): ProcessPersistenceModel {
    return {
      documentClassUuid: process.getDocumentClassUuid(),
      uuid: process.getUuid(),
      integrityStatus: process.getIntegrityStatus(),
      metadata: MetadataMapper.flatten(process.getMetadata()),
    };
  }

  static toSearchResult(process: Process): ProcessSearchResult {
    const id = process.getId();
    if (id === null) {
      throw new Error(
        "Cannot convert to SearchResult: Process entity is not yet persisted and has no ID.",
      );
    }

    return {
      id,
      uuid: process.getUuid(),
      integrityStatus: process.getIntegrityStatus(),
      type: "PROCESSO",
    };
  }
}
