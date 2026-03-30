import { inject, injectable } from "tsyringe";
import Database from "better-sqlite3";

import { Dip } from "../entity/Dip";
import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";
import {
  DATABASE_PROVIDER_TOKEN,
  DatabaseProvider,
} from "../repo/impl/DatabaseProvider";
import { DipMapper, DipPersistenceRow } from "./mappers/DipMapper";
import { IDipDAO } from "./IDipDAO";

@injectable()
export class DipDAO implements IDipDAO {
  private readonly db: Database.Database;

  constructor(
    @inject(DATABASE_PROVIDER_TOKEN)
    private readonly dbProvider: DatabaseProvider,
  ) {
    this.db = dbProvider.db;
  }

  getById(id: number): Dip | null {
    const row = this.db
      .prepare<
        [number],
        DipPersistenceRow
      >(`SELECT id, uuid, integrity_status as integrityStatus FROM dip WHERE id = ?`)
      .get(id);
    return row ? DipMapper.toDomain(row) : null;
  }

  getByUuid(uuid: string): Dip | null {
    const row = this.db
      .prepare<
        [string],
        DipPersistenceRow
      >(`SELECT id, uuid, integrity_status as integrityStatus FROM dip WHERE uuid = ?`)
      .get(uuid);
    return row ? DipMapper.toDomain(row) : null;
  }

  save(dip: Dip): Dip {
    this.db
      .prepare(
        `
                INSERT INTO dip (uuid, integrity_status) 
                VALUES (?, ?)
                ON CONFLICT(uuid) DO UPDATE SET integrity_status = excluded.integrity_status
            `,
      )
      .run(dip.getUuid(), IntegrityStatusEnum.UNKNOWN);

    const saved = this.getByUuid(dip.getUuid());
    if (!saved) {
      throw new Error(`Failed to save Dip with uuid=${dip.getUuid()}`);
    }
    return saved;
  }

  getByStatus(status: IntegrityStatusEnum): Dip[] {
    const rows = this.db
      .prepare<
        [string],
        DipPersistenceRow
      >(`SELECT id, uuid, integrity_status as integrityStatus FROM dip WHERE integrity_status = ?`)
      .all(status);
    return rows.map(DipMapper.toDomain);
  }

  updateIntegrityStatus(id: number, status: IntegrityStatusEnum): void {
    this.db
      .prepare<
        [string, number]
      >(`UPDATE dip SET integrity_status = ? WHERE id = ?`)
      .run(status, id);
  }
}
