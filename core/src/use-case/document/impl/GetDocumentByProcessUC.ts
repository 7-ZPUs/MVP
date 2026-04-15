import { inject, injectable } from "tsyringe";
import type { Document } from "../../../entity/Document";
import {
  DOCUMENT_GET_BY_PROCESS_ID_PORT_TOKEN,
  IGetDocumentByProcessIdPort,
} from "../../../repo/IDocumentRepository";
import type { IGetDocumentByProcessUC } from "../IGetDocumentByProcessUC";

@injectable()
export class GetDocumentByProcessUC implements IGetDocumentByProcessUC {
  constructor(
    @inject(DOCUMENT_GET_BY_PROCESS_ID_PORT_TOKEN)
    private readonly repo: IGetDocumentByProcessIdPort,
  ) {}

  execute(processId: number): Document[] {
    return this.repo.getByProcessId(processId);
  }
}
