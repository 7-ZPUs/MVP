import { injectable, inject } from "tsyringe";
import { DocumentClass } from "../../../entity/DocumentClass";
import { DOCUMENT_CLASS_REPOSITORY_TOKEN, IDocumentClassRepository } from "../../../repo/IDocumentClassRepository";
import { IntegrityStatusEnum } from "../../../value-objects/IntegrityStatusEnum";
import { IGetDocumentClassByStatusUC } from "../IGetDocumentClassByStatusUC";


@injectable()
export class GetDocumentClassByStatusUC implements IGetDocumentClassByStatusUC {
    constructor(
        @inject(DOCUMENT_CLASS_REPOSITORY_TOKEN)
        private readonly repo: IDocumentClassRepository
    ) {}

    execute(status: IntegrityStatusEnum): DocumentClass[] {
        return this.repo.getByStatus(status);
    }
}