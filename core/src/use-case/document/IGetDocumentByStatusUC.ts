import type { Document } from '../../entity/Document';
import { IntegrityStatusEnum } from '../../value-objects/IntegrityStatusEnum';

export interface IGetDocumentByStatusUC {
    execute(status: IntegrityStatusEnum): Document[];
}
