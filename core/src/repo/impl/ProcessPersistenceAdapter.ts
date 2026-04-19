import { inject, injectable } from "tsyringe";

import type {
  IGetProcessByDocumentClassIdPort,
  IGetProcessByIdPort,
  IGetProcessByStatusPort,
  ISaveProcessPort,
  ISearchProcessesPort,
  IUpdateProcessIntegrityStatusPort,
} from "../IProcessRepository";
import { Process } from "../../entity/Process";
import { IntegrityStatusEnum } from "../../value-objects/IntegrityStatusEnum";
import { ProcessDAO, ProcessPersistenceAggregate } from "../../dao/ProcessDAO";
import { ProcessMapper } from "../../dao/mappers/ProcessMapper";

@injectable()
export class ProcessPersistenceAdapter
  implements
    IGetProcessByIdPort,
    IGetProcessByDocumentClassIdPort,
    IGetProcessByStatusPort,
    ISaveProcessPort,
    IUpdateProcessIntegrityStatusPort,
    ISearchProcessesPort
{
  constructor(
    @inject(ProcessDAO)
    private readonly dao: ProcessDAO,
  ) {}

  private toEntity(aggregate: ProcessPersistenceAggregate): Process {
    return ProcessMapper.fromPersistence(aggregate.row, aggregate.metadata);
  }

  getById(id: number): Process | null {
    const aggregate = this.dao.getById(id);
    return aggregate ? this.toEntity(aggregate) : null;
  }

  getByDocumentClassId(documentClassId: number): Process[] {
    return this.dao
      .getByDocumentClassId(documentClassId)
      .map((aggregate) => this.toEntity(aggregate));
  }

  getByStatus(status: IntegrityStatusEnum): Process[] {
    return this.dao
      .getByStatus(status)
      .map((aggregate) => this.toEntity(aggregate));
  }

  save(process: Process): Process {
    return this.toEntity(this.dao.save(process));
  }

  updateIntegrityStatus(id: number, status: IntegrityStatusEnum): void {
    return this.dao.updateIntegrityStatus(id, status);
  }

  searchProcesses(uuid: string): Process[] {
    return this.dao
      .searchProcesses(uuid)
      .map((aggregate) => this.toEntity(aggregate));
  }
}
