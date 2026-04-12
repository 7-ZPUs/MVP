import { IntegrityStatusEnum } from '../../value-objects/IntegrityStatusEnum';

export interface ICheckDipIntegrityStatusUC {
    execute(dipId: number): Promise<IntegrityStatusEnum>;
}
