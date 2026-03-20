import { injectable, inject } from "tsyringe";
import { Dip } from "../../../entity/Dip";
import { DIP_REPOSITORY_TOKEN, IDipRepository } from "../../../repo/IDipRepository";
import type { CreateDipInput, ICreateDipUC } from "../ICreateDipUC";

@injectable()
export class CreateDipUC implements ICreateDipUC {
  constructor(
    @inject(DIP_REPOSITORY_TOKEN)
    private readonly repo: IDipRepository,
  ) {}

    execute(input: CreateDipInput): Dip {
        const dip = new Dip(input.uuid);
        return this.repo.save(dip);
    }
}
