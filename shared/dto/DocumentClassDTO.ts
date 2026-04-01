import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";

export interface CreateDocumentClassDTO {
    dipId: number;
    uuid: string;
    name: string;
    timestamp: string;
    integrityStatus: IntegrityStatusEnum;
}

export interface DocumentClassDTO {
    id: number;
    dipId: number;
    uuid: string;
    name: string;
    timestamp: string;
    integrityStatus: IntegrityStatusEnum;
}