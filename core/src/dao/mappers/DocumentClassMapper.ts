import { DocumentClassDTO } from "../../dto/DocumentClassDTO";
import { DocumentClass } from "../../entity/DocumentClass";
import { IntegrityStatusEnum } from "../../value-objects/IntegrityStatusEnum";

export interface DocumentClassPersistenceRow {
    id: number;
    dipId: number;
    uuid: string;
    dipUuid: string;
    integrityStatus?: string;
    name: string;
    timestamp: string;
}

export interface DocumentClassPersistenceModel {
    dipUuid: string;
    uuid: string;
    integrityStatus: IntegrityStatusEnum;
    name: string;
    timestamp: string;
}

export class DocumentClassMapper {
    static toDomain(row: DocumentClassPersistenceRow): DocumentClass {
        return new DocumentClass(
            row.dipUuid,
            row.uuid,
            row.name,
            row.timestamp,
            (row.integrityStatus as IntegrityStatusEnum) ?? IntegrityStatusEnum.UNKNOWN,
            row.id,
            row.dipId
        );
    }

    static toDTO(documentClass: DocumentClass): DocumentClassDTO {
        const id = documentClass.getId();
        if (id === null) {
            throw new Error("Cannot convert to DTO: DocumentClass entity is not yet persisted and has no ID.");
        }

        return {
            id,
            dipId: documentClass.getDipId() ?? -1,
            uuid: documentClass.getUuid(),
            name: documentClass.getName(),
            timestamp: documentClass.getTimestamp(),
            integrityStatus: documentClass.getIntegrityStatus(),
        };
    }

    static toPersistence(documentClass: DocumentClass): DocumentClassPersistenceModel {
        return {
            dipUuid: documentClass.getDipUuid(),
            uuid: documentClass.getUuid(),
            integrityStatus: documentClass.getIntegrityStatus(),
            name: documentClass.getName(),
            timestamp: documentClass.getTimestamp(),
        };
    }
}
