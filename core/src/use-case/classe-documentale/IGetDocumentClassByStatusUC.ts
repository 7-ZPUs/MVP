import { DocumentClass } from "../../entity/DocumentClass";
import { IntegrityStatusEnum } from "../../value-objects/IntegrityStatusEnum";

export interface IGetDocumentClassByStatusUC {
    execute(status: IntegrityStatusEnum): DocumentClass[];
}