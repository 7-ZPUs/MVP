import { inject, injectable } from "tsyringe";
import { Dip } from "../../../entity/Dip";
import {
  DIP_GET_BY_ID_PORT_TOKEN,
  IGetDipByIdPort,
} from "../../../repo/IDipRepository";
import { IGetDipByIdUC } from "../IGetDipByIdUC";

@injectable()
export class GetDipByIdUC implements IGetDipByIdUC {
  constructor(
    @inject(DIP_GET_BY_ID_PORT_TOKEN)
    private readonly repo: IGetDipByIdPort,
  ) {}

  execute(id: number): Dip | null {
    return this.repo.getById(id);
  }
}
