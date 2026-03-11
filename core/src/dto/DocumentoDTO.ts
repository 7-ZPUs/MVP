import { MetadataDTO } from "./MetadataDTO";
import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";

export interface DocumentoDTO {
    /** null se l'entità non è ancora stata persistita. */
    id: number | null;
    uuid: string;
    integrityStatus: IntegrityStatusEnum;
    metadata: MetadataDTO[];
}