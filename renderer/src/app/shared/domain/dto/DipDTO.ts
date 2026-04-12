import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";

export interface CreateDipDTO {
    dipId: number;
    uuid: string;
    integrityStatus: IntegrityStatusEnum;
}

export interface DipDTO {
    id: number;
    dipId: number;
    uuid: string;
    integrityStatus: IntegrityStatusEnum;
}