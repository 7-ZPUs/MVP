import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";

export interface CreateDipDTO {
    uuid: string;
    integrityStatus: IntegrityStatusEnum;
}

export interface DipDTO {
    id: number | null;
    uuid: string;
    integrityStatus: IntegrityStatusEnum;
}