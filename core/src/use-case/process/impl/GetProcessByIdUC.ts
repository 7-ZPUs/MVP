import { injectable, inject } from "tsyringe";
import { Process } from "../../../entity/Process";
import {
  IGetProcessByIdPort,
  PROCESS_GET_BY_ID_PORT_TOKEN,
} from "../../../repo/IProcessRepository";
import { IGetProcessByIdUC } from "../IGetProcessByIdUC";

@injectable()
export class GetProcessByIdUC implements IGetProcessByIdUC {
  constructor(
    @inject(PROCESS_GET_BY_ID_PORT_TOKEN)
    private readonly repo: IGetProcessByIdPort,
  ) {}

  execute(id: number): Process | null {
    return this.repo.getById(id);
  }
}
