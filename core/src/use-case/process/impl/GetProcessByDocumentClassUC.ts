import { inject, injectable } from "tsyringe";
import { IProcessRepository, PROCESS_REPOSITORY_TOKEN } from "../../../repo/IProcessRepository";
import { Process } from "../../../entity/Process";
import { IGetProcessByDocumentClassUC } from "../IGetProcessByDocumentClassUC";

@injectable()
export class GetProcessByDocumentClassUC implements IGetProcessByDocumentClassUC {
    constructor(
        @inject(PROCESS_REPOSITORY_TOKEN)
        private readonly repo: IProcessRepository
    ) {}

    execute(documentClassId: number): Process[] {
        return this.repo.getByDocumentClassId(documentClassId);
    }
}