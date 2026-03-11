import type { File } from '../../entity/File';
import { IntegrityStatusEnum } from '../../value-objects/IntegrityStatusEnum';

export interface IGetFilesByStatusUC {
    execute(status: IntegrityStatusEnum): File[];
}
