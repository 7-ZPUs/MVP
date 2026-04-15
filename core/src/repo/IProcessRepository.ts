import { Process } from "../entity/Process";
import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";

export const PROCESS_GET_BY_ID_PORT_TOKEN = Symbol("IGetProcessByIdPort");
export const PROCESS_GET_BY_DOCUMENT_CLASS_ID_PORT_TOKEN = Symbol(
  "IGetProcessByDocumentClassIdPort",
);
export const PROCESS_GET_BY_STATUS_PORT_TOKEN = Symbol(
  "IGetProcessByStatusPort",
);
export const PROCESS_SAVE_PORT_TOKEN = Symbol("ISaveProcessPort");
export const PROCESS_UPDATE_INTEGRITY_STATUS_PORT_TOKEN = Symbol(
  "IUpdateProcessIntegrityStatusPort",
);
export const PROCESS_SEARCH_PORT_TOKEN = Symbol("ISearchProcessesPort");

export interface IGetProcessByIdPort {
  getById(id: number): Process | null;
}

export interface IGetProcessByDocumentClassIdPort {
  getByDocumentClassId(documentClassId: number): Process[];
}

export interface IGetProcessByStatusPort {
  getByStatus(status: IntegrityStatusEnum): Process[];
}

export interface ISaveProcessPort {
  save(process: Process): Process;
}

export interface IUpdateProcessIntegrityStatusPort {
  updateIntegrityStatus(id: number, status: IntegrityStatusEnum): void;
}

export interface ISearchProcessesPort {
  searchProcesses(uuid: string): Process[];
}
