import { IntegrityStatusEnum } from '../../value-objects/IntegrityStatusEnum';

export interface ICheckDocumentClassIntegrityStatusUC {
    execute(documentClassId: number): Proces<IntegrityStatusEnum>;
}
