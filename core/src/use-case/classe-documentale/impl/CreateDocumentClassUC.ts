import { inject, injectable } from "tsyringe";
import { DocumentClass } from "../../../entity/DocumentClass";
import {
  DOCUMENT_CLASS_REPOSITORY_TOKEN,
  IDocumentClassRepository,
} from "../../../repo/IDocumentClassRepository";
import { ICreateDocumentClassUC } from "../ICreateDocumentClassUC";

@injectable()
export class CreateDocumentClassUC implements ICreateDocumentClassUC {
  constructor(
    @inject(DOCUMENT_CLASS_REPOSITORY_TOKEN)
    private readonly repo: IDocumentClassRepository,
  ) {}

  execute(documentClass: DocumentClass): DocumentClass {
    return this.repo.save(documentClass);
  }
}
