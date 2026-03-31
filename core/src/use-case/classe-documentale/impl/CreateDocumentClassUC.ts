import { inject, injectable } from "tsyringe";
import { DocumentClass } from "../../../entity/DocumentClass";
import { DOCUMENT_CLASS_REPOSITORY_TOKEN, IDocumentClassRepository } from "../../../repo/IDocumentClassRepository";
import type { CreateDocumentClassInput, ICreateDocumentClassUC } from "../ICreateDocumentClassUC";

@injectable()
export class CreateDocumentClassUC implements ICreateDocumentClassUC {
    constructor(
        @inject(DOCUMENT_CLASS_REPOSITORY_TOKEN)
        private readonly repo: IDocumentClassRepository
    ) { }

    execute(input: CreateDocumentClassInput): DocumentClass {
        const documentClass = new DocumentClass(input.dipId, input.uuid, input.name, input.timestamp);
        return this.repo.save(documentClass);
    }
}