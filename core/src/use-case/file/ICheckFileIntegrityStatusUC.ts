import { IntegrityStatusEnum } from '../../value-objects/IntegrityStatusEnum';

export interface ICheckFileIntegrityStatusUC {
    execute(fileId: number): Promise<IntegrityStatusEnum>;
}
