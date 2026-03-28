import { inject, injectable } from "tsyringe";
import { DocumentClass } from "../../../entity/DocumentClass";
import { DOCUMENT_CLASS_REPOSITORY_TOKEN, IDocumentClassRepository } from "../../../repo/IDocumentClassRepository";
import { IGetDocumentClassByIdUC } from "../IGetDocumentClassByIdUC";

@injectable()
export class GetDocumentClassByIdUC implements IGetDocumentClassByIdUC {
    constructor(
        @inject(DOCUMENT_CLASS_REPOSITORY_TOKEN)
        private readonly repo: IDocumentClassRepository
    ) {}

    execute(id: number): DocumentClass | null {
        return this.repo.getById(id);
    }
}