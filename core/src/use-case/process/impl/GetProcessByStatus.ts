import { inject, injectable } from "tsyringe";
import { IntegrityStatusEnum } from "../../../value-objects/IntegrityStatusEnum";
import { Process } from "../../../entity/Process";
import {
  IGetProcessByStatusPort,
  PROCESS_GET_BY_STATUS_PORT_TOKEN,
} from "../../../repo/IProcessRepository";
import { IGetProcessByStatusUC } from "../IGetProcessByStatusUC";

@injectable()
export class GetProcessByStatusUC implements IGetProcessByStatusUC {
  constructor(
    @inject(PROCESS_GET_BY_STATUS_PORT_TOKEN)
    private readonly repo: IGetProcessByStatusPort,
  ) {}

  execute(status: IntegrityStatusEnum): Process[] {
    return this.repo.getByStatus(status);
  }
}
