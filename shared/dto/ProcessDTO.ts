import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";
import { MetadataDTO } from "./MetadataDTO";

export interface CreateProcessDTO {
    documentClassId: number;
    uuid: string;
    metadata: MetadataDTO[];
}

export interface ProcessDTO {
    id: number;
    documentClassId: number;
    uuid: string;
    integrityStatus: IntegrityStatusEnum;
    metadata: MetadataDTO[];
}