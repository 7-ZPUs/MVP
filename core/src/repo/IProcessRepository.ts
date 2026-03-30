import { Process } from "../entity/Process";
import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";

export const PROCESS_REPOSITORY_TOKEN = Symbol("IProcessRepository");

export interface IProcessRepository {
  getById(id: number): Process | null;
  getByDocumentClassId(documentClassId: number): Process[];
  getByStatus(status: IntegrityStatusEnum): Process[];

  save(process: Process): Process;

  updateIntegrityStatus(id: number, status: IntegrityStatusEnum): void;
  getAggregatedIntegrityStatusByDocumentClassId(documentClassId: number): IntegrityStatusEnum;
  searchProcesses(uuid: string): Process[];
}
