import { inject, injectable } from "tsyringe";

import { IProcessRepository } from "../IProcessRepository";
import { Process } from "../../entity/Process";
import { IntegrityStatusEnum } from "../../value-objects/IntegrityStatusEnum";
import { ProcessDAO } from "../../dao/ProcessDAO";
import { PROCESS_DAO_TOKEN } from "../../dao/IProcessDAO";

@injectable()
export class ProcessRepository implements IProcessRepository {
  constructor(
    @inject(PROCESS_DAO_TOKEN)
    private readonly dao: ProcessDAO,
  ) {}

  getById(id: number): Process | null {
    return this.dao.getById(id);
  }

  getByDocumentClassId(documentClassId: number): Process[] {
    return this.dao.getByDocumentClassId(documentClassId);
  }

  getByStatus(status: IntegrityStatusEnum): Process[] {
    return this.dao.getByStatus(status);
  }

  save(process: Process): Process {
    return this.dao.save(process);
  }

  updateIntegrityStatus(id: number, status: IntegrityStatusEnum): void {
    return this.dao.updateIntegrityStatus(id, status);
  }
}
