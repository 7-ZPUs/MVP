import { MetadataDTO } from "./MetadataDTO";
import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";

export interface DocumentDTO {
    /** null se l'entità non è ancora stata persistita. */
    id: number | null;
    processId: number;
    uuid: string;
    integrityStatus: IntegrityStatusEnum;
    metadata: MetadataDTO[];
}