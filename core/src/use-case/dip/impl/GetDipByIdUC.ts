import { inject, injectable } from "tsyringe";
import { Dip } from "../../../entity/Dip";
import { DIP_REPOSITORY_TOKEN, IDipRepository } from "../../../repo/IDipRepository";
import { IGetDipByIdUC } from "../IGetDipByIdUC";

@injectable()
export class GetDipByIdUC implements IGetDipByIdUC {
    constructor(
        @inject(DIP_REPOSITORY_TOKEN)
        private readonly repo: IDipRepository
    ) { }
    
    execute(id: number): Dip | null {
        return this.repo.getById(id);
    }
}