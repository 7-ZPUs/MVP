import { inject, injectable } from "tsyringe";
import { IntegrityStatusEnum } from "../../../value-objects/IntegrityStatusEnum";
import { Process } from "../../../entity/Process";
import { PROCESS_REPOSITORY_TOKEN, IProcessRepository } from "../../../repo/IProcessRepository";

@injectable()
export class GetProcessByStatusUC {
    constructor(
        @inject(PROCESS_REPOSITORY_TOKEN)
        private readonly repo: IProcessRepository
    ) {}
    
    execute(status: IntegrityStatusEnum): Process[] {
        return this.repo.getByStatus(status);
    }
}