import { injectable, inject } from "tsyringe";
import { Dip } from "../../../entity/Dip";
import { DIP_REPOSITORY_TOKEN, IDipRepository } from "../../../repo/IDipRepository";
import { ICreateDipUC } from "../ICreateDipUC";
import { CreateDipDTO } from "../../../dto/DipDTO";

@injectable()
export class CreateDipUC implements ICreateDipUC {
    constructor(
        @inject(DIP_REPOSITORY_TOKEN)
        private readonly repo: IDipRepository
    ) { }

    execute(dto: CreateDipDTO): Dip {
        return this.repo.save(dto);
    }
}