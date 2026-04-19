import { inject, injectable } from "tsyringe";
import Database from "better-sqlite3";

import { Dip } from "../entity/Dip";
import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";
import { DipPersistenceRow } from "./mappers/DipMapper";
import { SQLITE_DB_TOKEN } from "../../../db/DatabaseBootstrap";

@injectable()
export class DipDAO {
  constructor(
    @inject(SQLITE_DB_TOKEN)
    private readonly db: Database.Database,
  ) {}

  getById(id: number): DipPersistenceRow | null {
    const row = this.db
      .prepare<
        [number],
        DipPersistenceRow
      >(`SELECT id, uuid, integrity_status as integrityStatus FROM dip WHERE id = ?`)
      .get(id);
    return row ?? null;
  }

  getByUuid(uuid: string): DipPersistenceRow | null {
    const row = this.db
      .prepare<
        [string],
        DipPersistenceRow
      >(`SELECT id, uuid, integrity_status as integrityStatus FROM dip WHERE uuid = ?`)
      .get(uuid);
    return row ?? null;
  }

  save(dip: Dip): DipPersistenceRow {
    const result = this.db
      .prepare(
        `
                INSERT INTO dip (uuid, integrity_status) 
                VALUES (?, ?)
                ON CONFLICT(uuid) DO UPDATE SET integrity_status = excluded.integrity_status
            `,
      )
      .run(dip.getUuid(), IntegrityStatusEnum.UNKNOWN);

    let id = Number(result.lastInsertRowid);
    if (!id) {
      const existing = this.getByUuid(dip.getUuid());
      if (existing) {
        return existing;
      }
    }

    return {
      id: id,
      uuid: dip.getUuid(),
      integrityStatus: IntegrityStatusEnum.UNKNOWN,
    };
  }

  getByStatus(status: IntegrityStatusEnum): DipPersistenceRow[] {
    const rows = this.db
      .prepare<
        [string],
        DipPersistenceRow
      >(`SELECT id, uuid, integrity_status as integrityStatus FROM dip WHERE integrity_status = ?`)
      .all(status);
    return rows;
  }

  updateIntegrityStatus(id: number, status: IntegrityStatusEnum): void {
    this.db
      .prepare<
        [string, number]
      >(`UPDATE dip SET integrity_status = ? WHERE id = ?`)
      .run(status, id);
  }
}
