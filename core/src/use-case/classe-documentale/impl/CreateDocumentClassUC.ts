import { inject, injectable } from "tsyringe";
import { CreateDocumentClassDTO } from "../../../dto/DocumentClassDTO";
import { DocumentClass } from "../../../entity/DocumentClass";
import { DOCUMENT_CLASS_REPOSITORY_TOKEN, IDocumentClassRepository } from "../../../repo/IDocumentClassRepository";
import { ICreateDocumentClassUC } from "../ICreateDocumentClassUC";

@injectable()
export class CreateDocumentClassUC implements ICreateDocumentClassUC {
    constructor(
        @inject(DOCUMENT_CLASS_REPOSITORY_TOKEN)
        private readonly repo: IDocumentClassRepository
    ) {}

    execute(dto: CreateDocumentClassDTO): DocumentClass {
        return this.repo.save(dto);
    }
}