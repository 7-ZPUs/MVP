import { inject, injectable } from "tsyringe";
import type { Document } from "../../../entity/Document";
import {
  DOCUMENT_GET_BY_STATUS_PORT_TOKEN,
  IGetDocumentByStatusPort,
} from "../../../repo/IDocumentRepository";
import { IntegrityStatusEnum } from "../../../value-objects/IntegrityStatusEnum";
import type { IGetDocumentByStatusUC } from "../IGetDocumentByStatusUC";

@injectable()
export class GetDocumentByStatusUC implements IGetDocumentByStatusUC {
  constructor(
    @inject(DOCUMENT_GET_BY_STATUS_PORT_TOKEN)
    private readonly repo: IGetDocumentByStatusPort,
  ) {}

  execute(status: IntegrityStatusEnum): Document[] {
    return this.repo.getByStatus(status);
  }
}
