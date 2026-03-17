import { inject, injectable } from "tsyringe";
import { Dip } from "../../../entity/Dip";
import { DIP_REPOSITORY_TOKEN, IDipRepository } from "../../../repo/IDipRepository";
import { IntegrityStatusEnum } from "../../../value-objects/IntegrityStatusEnum";
import { IGetDipByStatusUC } from "../IGetDipByStatusUC";

@injectable()
export class GetDipByStatusUC implements IGetDipByStatusUC {
    constructor(
        @inject(DIP_REPOSITORY_TOKEN)
        private readonly repo: IDipRepository
    ) { }
    
    execute(status: IntegrityStatusEnum): Dip[] {
        return this.repo.getByStatus(status);
    }
}