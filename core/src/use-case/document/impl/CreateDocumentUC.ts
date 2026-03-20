import { inject, injectable } from "tsyringe";
import type { Document } from "../../../entity/Document";
import type { IDocumentRepository } from "../../../repo/IDocumentRepository";
import { DOCUMENTO_REPOSITORY_TOKEN } from "../../../repo/IDocumentRepository";
import { ICreateDocumentUC } from "../ICreateDocumentUC";

@injectable()
export class CreateDocumentUC implements ICreateDocumentUC {
  constructor(
    @inject(DOCUMENTO_REPOSITORY_TOKEN)
    private readonly repo: IDocumentRepository,
  ) {}

  execute(document: Document): Document {
    return this.repo.save(document);
  }
}
