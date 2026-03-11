import type { Documento } from '../../entity/Document';
import { IntegrityStatusEnum } from '../../value-objects/IntegrityStatusEnum';

export interface IGetDocumentiByStatusUC {
    execute(status: IntegrityStatusEnum): Documento[];
}
