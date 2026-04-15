import { inject, injectable } from "tsyringe";
import {
  DOCUMENT_CLASS_GET_BY_DIP_ID_PORT_TOKEN,
  IGetDocumentClassByDipIdPort,
} from "../../../repo/IDocumentClassRepository";
import { DocumentClass } from "../../../entity/DocumentClass";
import { IGetDocumentClassByDipIdUC } from "../IGetDocumentClassByDipUC";

@injectable()
export class GetDocumentClassByDipIdUC implements IGetDocumentClassByDipIdUC {
  constructor(
    @inject(DOCUMENT_CLASS_GET_BY_DIP_ID_PORT_TOKEN)
    private readonly repo: IGetDocumentClassByDipIdPort,
  ) {}

  execute(dipId: number): DocumentClass[] {
    return this.repo.getByDipId(dipId);
  }
}
