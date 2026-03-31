import { inject, injectable } from "tsyringe";

import { Dip } from "../../entity/Dip";
import { IntegrityStatusEnum } from "../../value-objects/IntegrityStatusEnum";
import { IDipRepository } from "../IDipRepository";
import { DipDAO } from "../../dao/DipDAO";
import { DIP_DAO_TOKEN } from "../../dao/IDipDAO";

@injectable()
export class DipRepository implements IDipRepository {
  constructor(
    @inject(DIP_DAO_TOKEN)
    private readonly dao: DipDAO
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
