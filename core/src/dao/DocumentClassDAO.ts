import { inject, injectable } from "tsyringe";
import Database from "better-sqlite3";
import { SQLITE_DB_TOKEN } from "../../../db/DatabaseBootstrap";
import { DocumentClass } from "../entity/DocumentClass";
import { DocumentClassPersistenceRow } from "./mappers/DocumentClassMapper";
import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";

@injectable()
export class DocumentClassDAO {
  constructor(
    @inject(SQLITE_DB_TOKEN)
    private readonly db: Database.Database,
  ) {}

  getById(id: number): DocumentClassPersistenceRow | null {
    const row = this.db
      .prepare<
        [number],
        DocumentClassPersistenceRow
      >("SELECT id, dip_id as dipId, dipUuid, uuid, integrity_status as integrityStatus, name, timestamp FROM document_class WHERE id = ?")
      .get(id);
    return row ?? null;
  }

  getByDipId(dipId: number): DocumentClassPersistenceRow[] {
    const rows = this.db
      .prepare<
        [number],
        DocumentClassPersistenceRow
      >("SELECT id, dip_id as dipId, uuid, integrity_status as integrityStatus, name, timestamp FROM document_class WHERE dip_id = ?")
      .all(dipId);
    return rows;
  }

  getByStatus(status: IntegrityStatusEnum): DocumentClassPersistenceRow[] {
    const rows = this.db
      .prepare<
        [string],
        DocumentClassPersistenceRow
      >("SELECT id, dip_id as dipId, uuid, integrity_status as integrityStatus, name, timestamp FROM document_class WHERE integrity_status = ?")
      .all(status);
    return rows;
  }

  save(documentClass: DocumentClass): DocumentClassPersistenceRow {
    const result = this.db
      .prepare(
        `
                INSERT INTO document_class (dip_id, uuid, dipUuid, name, timestamp) 
                VALUES ((SELECT id FROM dip WHERE uuid = ?), ?, ?, ?, ?)
                ON CONFLICT(uuid) DO UPDATE SET 
                    dip_id = excluded.dip_id,
                    dipUuid = excluded.dipUuid,
                    name = excluded.name,
                    timestamp = excluded.timestamp
            `,
      )
      .run(
        documentClass.getDipUuid(),
        documentClass.getUuid(),
        documentClass.getDipUuid(),
        documentClass.getName(),
        documentClass.getTimestamp(),
      );

    let id = result.lastInsertRowid as number;

    if (!id) {
      const row = this.db
        .prepare("SELECT id FROM document_class WHERE uuid = ?")
        .get(documentClass.getUuid()) as { id: number };
      if (row) {
        id = row.id;
      }
    }

    const saved = this.getById(id);
    if (!saved) {
      throw new Error(
        `Failed to save DocumentClass with uuid=${documentClass.getUuid()}`,
      );
    }
    return saved;
  }

  search(name: string): DocumentClassPersistenceRow[] {
    const result = this.db
      .prepare<[string], DocumentClassPersistenceRow>(
        `SELECT id, dip_id as dipId, uuid, integrity_status as integrityStatus, name, timestamp 
                 FROM document_class 
                 WHERE name LIKE ?`,
      )
      .all(`%${name}%`);

    return result;
  }

  updateIntegrityStatus(id: number, status: IntegrityStatusEnum): void {
    this.db
      .prepare("UPDATE document_class SET integrity_status = ? WHERE id = ?")
      .run(status, id);
  }
}
