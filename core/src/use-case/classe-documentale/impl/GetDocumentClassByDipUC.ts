import { inject, injectable } from "tsyringe";
import { DOCUMENT_CLASS_REPOSITORY_TOKEN, IDocumentClassRepository } from "../../../repo/IDocumentClassRepository";
import { DocumentClass } from "../../../entity/DocumentClass";
import { IGetDocumentClassByDipIdUC } from "../IGetDocumentClassByDipUC";

@injectable()
export class GetDocumentClassByDipIdUC implements IGetDocumentClassByDipIdUC {
    constructor(
        @inject(DOCUMENT_CLASS_REPOSITORY_TOKEN)
        private readonly repo: IDocumentClassRepository
    ) {}
    
    execute(dipId: number): DocumentClass[] {
        return this.repo.getByDipId(dipId);
    }
}