import { inject, injectable } from "tsyringe";
import type { Document } from "../../../entity/Document";
import type { IGetDocumentByIdPort } from "../../../repo/IDocumentRepository";
import { DOCUMENT_GET_BY_ID_PORT_TOKEN } from "../../../repo/IDocumentRepository";
import type { IGetDocumentByIdUC } from "../IGetDocumentByIdUC";

@injectable()
export class GetDocumentByIdUC implements IGetDocumentByIdUC {
  constructor(
    @inject(DOCUMENT_GET_BY_ID_PORT_TOKEN)
    private readonly repo: IGetDocumentByIdPort,
  ) {}

  execute(id: number): Document | null {
    return this.repo.getById(id);
  }
}
