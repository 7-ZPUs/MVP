import { Dip } from "../entity/Dip";
import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";

export const DIP_GET_BY_ID_PORT_TOKEN = Symbol("IGetDipByIdPort");
export const DIP_GET_BY_UUID_PORT_TOKEN = Symbol("IGetDipByUuidPort");
export const DIP_SAVE_PORT_TOKEN = Symbol("ISaveDipPort");
export const DIP_GET_BY_STATUS_PORT_TOKEN = Symbol("IGetDipByStatusPort");
export const DIP_UPDATE_INTEGRITY_STATUS_PORT_TOKEN = Symbol(
  "IUpdateDipIntegrityStatusPort",
);

export interface IGetDipByIdPort {
  getById(id: number): Dip | null;
}

export interface IGetDipByUuidPort {
  getByUuid(uuid: string): Dip | null;
}

export interface ISaveDipPort {
  save(dip: Dip): Dip;
}

export interface IGetDipByStatusPort {
  getByStatus(status: IntegrityStatusEnum): Dip[];
}

export interface IUpdateDipIntegrityStatusPort {
  updateIntegrityStatus(id: number, status: IntegrityStatusEnum): void;
}
