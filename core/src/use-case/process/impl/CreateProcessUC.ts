import { inject, injectable } from "tsyringe";
import type { Process } from "../../../entity/Process";
import type { IProcessRepository } from "../../../repo/IProcessRepository";
import { PROCESS_REPOSITORY_TOKEN } from "../../../repo/IProcessRepository";
import { ICreateProcessUC } from "../ICreateProcessUC";

@injectable()
export class CreateProcessUC implements ICreateProcessUC {
  constructor(
    @inject(PROCESS_REPOSITORY_TOKEN)
    private readonly repo: IProcessRepository,
  ) {}

  execute(process: Process): Process {
    return this.repo.save(process);
  }
}
