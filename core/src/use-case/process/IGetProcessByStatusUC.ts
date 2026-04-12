import { Process } from "../../entity/Process";
import { IntegrityStatusEnum } from "../../value-objects/IntegrityStatusEnum";

export interface IGetProcessByStatusUC {
    execute(status: IntegrityStatusEnum): Process[];
}