import { inject, injectable } from 'tsyringe';
import Database from 'better-sqlite3';

import { Dip, DipRow } from '../../entity/Dip';
import { IntegrityStatusEnum } from '../../value-objects/IntegrityStatusEnum';
import { IDipRepository } from '../IDipRepository';
import { DATABASE_PROVIDER_TOKEN, DatabaseProvider } from './DatabaseProvider';

@injectable()
export class DipRepository implements IDipRepository {
    private readonly db: Database.Database;

    constructor(
        @inject(DATABASE_PROVIDER_TOKEN)
        private readonly dbProvider: DatabaseProvider
    ) {
        this.db = dbProvider.db;
        this.createSchema();
    }

    private createSchema(): void {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS dip (
                id               INTEGER PRIMARY KEY AUTOINCREMENT,
                uuid             TEXT    NOT NULL UNIQUE,
                integrity_status TEXT    NOT NULL DEFAULT 'UNKNOWN'
            );

            CREATE INDEX IF NOT EXISTS idx_dip_integrity_status
                ON dip (integrity_status);
        `);
    }

    getById(id: number): Dip | null {
        const row = this.db
            .prepare<[number], DipRow>(
                `SELECT id, uuid, integrity_status as integrityStatus FROM dip WHERE id = ?`
            )
            .get(id);
        return row ? Dip.fromDB(row) : null;
    }

    getByUuid(uuid: string): Dip | null {
        const row = this.db
            .prepare<[string], DipRow>(
                `SELECT id, uuid, integrity_status as integrityStatus FROM dip WHERE uuid = ?`
            )
            .get(uuid);
        return row ? Dip.fromDB(row) : null;
    }

    save(dip: Dip): Dip {
        const result = this.db
            .prepare(`INSERT INTO dip (uuid, integrity_status) VALUES (?, ?)`)
            .run(dip.getUuid(), IntegrityStatusEnum.UNKNOWN);

        return Dip.fromDB({
            id: result.lastInsertRowid as number,
            uuid: dip.getUuid(),
            integrityStatus: IntegrityStatusEnum.UNKNOWN,
        });
    }

    getByStatus(status: IntegrityStatusEnum): Dip[] {
        const rows = this.db
            .prepare<[string], DipRow>(
                `SELECT id, uuid, integrity_status as integrityStatus FROM dip WHERE integrity_status = ?`
            )
            .all(status);
        return rows.map(Dip.fromDB);
    }

    updateIntegrityStatus(id: number, status: IntegrityStatusEnum): void {
        this.db
            .prepare<[string, number]>(
                `UPDATE dip SET integrity_status = ? WHERE id = ?`
            )
            .run(status, id);
    }
}