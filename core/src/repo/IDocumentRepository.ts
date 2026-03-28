import type { Document } from '../entity/Document';
import { IntegrityStatusEnum } from '../value-objects/IntegrityStatusEnum';

export const DOCUMENTO_REPOSITORY_TOKEN = Symbol('IDocumentRepository');

export interface IDocumentRepository {
    getById(id: number): Document | null;
    getByProcessId(processId: number): Document[];
    getByStatus(status: IntegrityStatusEnum): Document[];

    save(document: Document): Document;

    updateIntegrityStatus(id: number, status: IntegrityStatusEnum): void;
    getAggregatedIntegrityStatusByProcessId(processId: number): IntegrityStatusEnum;
}
