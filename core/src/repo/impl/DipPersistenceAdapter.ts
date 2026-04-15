import { inject, injectable } from "tsyringe";

import { Dip } from "../../entity/Dip";
import { IntegrityStatusEnum } from "../../value-objects/IntegrityStatusEnum";
import type {
  IGetDipByIdPort,
  IGetDipByStatusPort,
  IGetDipByUuidPort,
  ISaveDipPort,
  IUpdateDipIntegrityStatusPort,
} from "../IDipRepository";
import { DIP_DAO_TOKEN, IDipDAO } from "../../dao/IDipDAO";

@injectable()
export class DipPersistenceAdapter
  implements
    IGetDipByIdPort,
    IGetDipByUuidPort,
    ISaveDipPort,
    IGetDipByStatusPort,
    IUpdateDipIntegrityStatusPort
{
  constructor(
    @inject(DIP_DAO_TOKEN)
    private readonly dao: IDipDAO,
  ) {}

  getById(id: number): Dip | null {
    return this.dao.getById(id);
  }

  getByUuid(uuid: string): Dip | null {
    return this.dao.getByUuid(uuid);
  }

  save(dip: Dip): Dip {
    return this.dao.save(dip);
  }

  getByStatus(status: IntegrityStatusEnum): Dip[] {
    return this.dao.getByStatus(status);
  }

  updateIntegrityStatus(id: number, status: IntegrityStatusEnum): void {
    return this.dao.updateIntegrityStatus(id, status);
  }
}
