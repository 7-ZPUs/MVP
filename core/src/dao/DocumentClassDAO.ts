import { inject, injectable } from "tsyringe";
import Database from "better-sqlite3";
import {
  DATABASE_PROVIDER_TOKEN,
  DatabaseProvider,
} from "../repo/impl/DatabaseProvider";
import { DocumentClass } from "../entity/DocumentClass";
import {
  DocumentClassMapper,
  DocumentClassPersistenceRow,
} from "./mappers/DocumentClassMapper";
import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";
import { IDocumentClassDAO } from "./IDocumentClassDAO";

@injectable()
export class DocumentClassDAO implements IDocumentClassDAO {
  private readonly db: Database.Database;

  constructor(
    @inject(DATABASE_PROVIDER_TOKEN)
    private readonly dbProvider: DatabaseProvider,
  ) {
    this.db = dbProvider.db;
  }

  private rowToEntity(row: DocumentClassPersistenceRow): DocumentClass {
    return DocumentClassMapper.fromPersistence(row);
  }

  getById(id: number): DocumentClass | null {
    const row = this.db
      .prepare<
        [number],
        DocumentClassPersistenceRow
      >("SELECT id, dip_id as dipId, dipUuid, uuid, integrity_status as integrityStatus, name, timestamp FROM document_class WHERE id = ?")
      .get(id);
    return row ? this.rowToEntity(row) : null;
  }

  getByDipId(dipId: number): DocumentClass[] {
    const rows = this.db
      .prepare<
        [number],
        DocumentClassPersistenceRow
      >("SELECT id, dip_id as dipId, uuid, integrity_status as integrityStatus, name, timestamp FROM document_class WHERE dip_id = ?")
      .all(dipId);
    return rows.map((row) => this.rowToEntity(row));
  }

  getByStatus(status: IntegrityStatusEnum): DocumentClass[] {
    const rows = this.db
      .prepare<
        [string],
        DocumentClassPersistenceRow
      >("SELECT id, dip_id as dipId, uuid, integrity_status as integrityStatus, name, timestamp FROM document_class WHERE integrity_status = ?")
      .all(status);
    return rows.map((row) => this.rowToEntity(row));
  }

  save(documentClass: DocumentClass): DocumentClass {
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

  search(query: string): DocumentClass[] | null {
    const result = this.db
      .prepare<[string], DocumentClassPersistenceRow>(
        `SELECT id, dip_id as dipId, uuid, integrity_status as integrityStatus, name, timestamp 
                 FROM document_class 
                 WHERE name LIKE ?`,
      )
      .all(`%${query}%`);

    return result.length > 0
      ? result.map((row) => this.rowToEntity(row))
      : null;
  }

  updateIntegrityStatus(id: number, status: IntegrityStatusEnum): void {
    this.db
      .prepare("UPDATE document_class SET integrity_status = ? WHERE id = ?")
      .run(status, id);
  }
}
