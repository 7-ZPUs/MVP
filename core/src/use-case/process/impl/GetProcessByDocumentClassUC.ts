import { inject, injectable } from "tsyringe";
import {
  IGetProcessByDocumentClassIdPort,
  PROCESS_GET_BY_DOCUMENT_CLASS_ID_PORT_TOKEN,
} from "../../../repo/IProcessRepository";
import { Process } from "../../../entity/Process";
import { IGetProcessByDocumentClassUC } from "../IGetProcessByDocumentClassUC";

@injectable()
export class GetProcessByDocumentClassUC implements IGetProcessByDocumentClassUC {
  constructor(
    @inject(PROCESS_GET_BY_DOCUMENT_CLASS_ID_PORT_TOKEN)
    private readonly repo: IGetProcessByDocumentClassIdPort,
  ) {}

  execute(documentClassId: number): Process[] {
    return this.repo.getByDocumentClassId(documentClassId);
  }
}
