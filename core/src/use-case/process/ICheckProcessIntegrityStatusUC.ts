import { IntegrityStatusEnum } from '../../value-objects/IntegrityStatusEnum';

export interface ICheckProcessIntegrityStatusUC {
    execute(processId: number): IntegrityStatusEnum;
}
