import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";
import { MetadataDTO } from "./MetadataDTO";

export interface ProcessDTO {
    id: number | null;
    documentClassId: number;
    uuid: string;
    integrityStatus: IntegrityStatusEnum;
    metadata: MetadataDTO[];
}