import { inject, injectable } from "tsyringe";
import { DocumentClass } from "../../../entity/DocumentClass";
import {
  DOCUMENT_CLASS_GET_BY_ID_PORT_TOKEN,
  IGetDocumentClassByIdPort,
} from "../../../repo/IDocumentClassRepository";
import { IGetDocumentClassByIdUC } from "../IGetDocumentClassByIdUC";

@injectable()
export class GetDocumentClassByIdUC implements IGetDocumentClassByIdUC {
  constructor(
    @inject(DOCUMENT_CLASS_GET_BY_ID_PORT_TOKEN)
    private readonly repo: IGetDocumentClassByIdPort,
  ) {}

  execute(id: number): DocumentClass | null {
    return this.repo.getById(id);
  }
}
