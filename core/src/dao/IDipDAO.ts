import { Dip } from "../entity/Dip";
import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";

export const DIP_DAO_TOKEN = Symbol("IDipDAO");

export interface IDipDAO {
  getById(id: number): Dip | null;
  getByUuid(uuid: string): Dip | null;
  save(dip: Dip): Dip;
  getByStatus(status: IntegrityStatusEnum): Dip[];
  updateIntegrityStatus(id: number, status: IntegrityStatusEnum): void;
}
