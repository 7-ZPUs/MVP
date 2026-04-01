import { Process } from "../entity/Process";
import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";

export const PROCESS_DAO_TOKEN = Symbol("IProcessDAO");

export interface IProcessDAO {
  getById(id: number): Process | null;
  getByDocumentClassId(documentClassId: number): Process[];
  getByStatus(status: IntegrityStatusEnum): Process[];
  save(process: Process): Process;
  updateIntegrityStatus(id: number, status: IntegrityStatusEnum): void;
}
