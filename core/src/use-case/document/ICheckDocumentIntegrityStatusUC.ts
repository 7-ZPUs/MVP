import { IntegrityStatusEnum } from '../../value-objects/IntegrityStatusEnum';

export interface ICheckDocumentIntegrityStatusUC {
    execute(documentId: number): Promise<IntegrityStatusEnum>;
}
