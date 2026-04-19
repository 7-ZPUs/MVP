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
import { DipDAO } from "../../dao/DipDAO";
import { DipMapper, DipPersistenceRow } from "../../dao/mappers/DipMapper";

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
    @inject(DipDAO)
    private readonly dao: DipDAO,
  ) {}

  private toEntity(row: DipPersistenceRow): Dip {
    return DipMapper.fromPersistence(row);
  }

  getById(id: number): Dip | null {
    const row = this.dao.getById(id);
    return row ? this.toEntity(row) : null;
  }

  getByUuid(uuid: string): Dip | null {
    const row = this.dao.getByUuid(uuid);
    return row ? this.toEntity(row) : null;
  }

  save(dip: Dip): Dip {
    return this.toEntity(this.dao.save(dip));
  }

  getByStatus(status: IntegrityStatusEnum): Dip[] {
    return this.dao.getByStatus(status).map((row) => this.toEntity(row));
  }

  updateIntegrityStatus(id: number, status: IntegrityStatusEnum): void {
    return this.dao.updateIntegrityStatus(id, status);
  }
}
