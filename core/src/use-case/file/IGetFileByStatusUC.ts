import type { File } from '../../entity/File';
import { IntegrityStatusEnum } from '../../value-objects/IntegrityStatusEnum';

export interface IGetFileByStatusUC {
    execute(status: IntegrityStatusEnum): File[];
}
