import { inject, injectable } from "tsyringe";
import { Dip } from "../../../entity/Dip";
import {
  DIP_GET_BY_STATUS_PORT_TOKEN,
  IGetDipByStatusPort,
} from "../../../repo/IDipRepository";
import { IntegrityStatusEnum } from "../../../value-objects/IntegrityStatusEnum";
import { IGetDipByStatusUC } from "../IGetDipByStatusUC";

@injectable()
export class GetDipByStatusUC implements IGetDipByStatusUC {
  constructor(
    @inject(DIP_GET_BY_STATUS_PORT_TOKEN)
    private readonly repo: IGetDipByStatusPort,
  ) {}

  execute(status: IntegrityStatusEnum): Dip[] {
    return this.repo.getByStatus(status);
  }
}
