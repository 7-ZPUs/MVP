import { Dip } from "../../entity/Dip";
import { IntegrityStatusEnum } from "../../value-objects/IntegrityStatusEnum";

export interface IGetDipByStatusUC {
    execute(status: IntegrityStatusEnum): Dip[];
}