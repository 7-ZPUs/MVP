import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";

export interface CreateFileDTO {
    documentId: number;
    filename: string;
    path: string;
    isMain: boolean;
    hash: string;
}

export interface FileDTO {
    id: number;
    /** Chiave esterna verso Documento. */
    documentId: number;
    filename: string;
    path: string;
    hash: string;
    integrityStatus: IntegrityStatusEnum;
    isMain: boolean;
}