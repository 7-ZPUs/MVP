import { injectable, inject } from "tsyringe";
import { Process } from "../../../entity/Process";
import { PROCESS_REPOSITORY_TOKEN, IProcessRepository } from "../../../repo/IProcessRepository";
import { IGetProcessByIdUC } from "../IGetProcessByIdUC";

@injectable()
export class GetProcessByIdUC implements IGetProcessByIdUC {
    constructor(
        @inject(PROCESS_REPOSITORY_TOKEN)
        private readonly repo: IProcessRepository
    ) {}

    execute(id: number): Process | null {
        return this.repo.getById(id);
    }
}