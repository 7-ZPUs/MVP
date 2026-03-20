import { inject, injectable } from "tsyringe";
import { IDocumentClassRepository } from "../IDocumentClassRepository";
import Database from "better-sqlite3";
import { DATABASE_PROVIDER_TOKEN, DatabaseProvider } from "./DatabaseProvider";
import { DocumentClassRow, DocumentClass } from "../../entity/DocumentClass";
import { IntegrityStatusEnum } from "../../value-objects/IntegrityStatusEnum";

@injectable()
export class DocumentClassRepository implements IDocumentClassRepository {
  private readonly db: Database.Database;

  constructor(
    @inject(DATABASE_PROVIDER_TOKEN)
    private readonly dbProvider: DatabaseProvider,
  ) {
    this.db = dbProvider.db;
    this.createSchema();
  }

  private createSchema(): void {
    this.db.exec(`
            CREATE TABLE IF NOT EXISTS document_class (
                id               INTEGER PRIMARY KEY AUTOINCREMENT,
                dip_id           INTEGER NOT NULL REFERENCES dip(id) ON DELETE CASCADE,
                uuid             TEXT    NOT NULL UNIQUE,
                integrity_status TEXT    NOT NULL DEFAULT 'UNKNOWN',
                name             TEXT    NOT NULL,
                timestamp        TEXT    NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_document_class_dip_id
                ON document_class (dip_id);

            CREATE INDEX IF NOT EXISTS idx_document_class_integrity_status
                ON document_class (integrity_status);
        `);
  }

  private rowToEntity(row: DocumentClassRow): DocumentClass {
    return DocumentClass.fromDB(row);
  }

  getById(id: number): DocumentClass | null {
    const row = this.db
      .prepare<
        [number],
        DocumentClassRow
      >("SELECT id, dip_id as dipId, uuid, integrity_status as integrityStatus, name, timestamp FROM document_class WHERE id = ?")
      .get(id);
    return row ? this.rowToEntity(row) : null;
  }

  getByDipId(dipId: number): DocumentClass[] {
    const rows = this.db
      .prepare<
        [number],
        DocumentClassRow
      >("SELECT id, dip_id as dipId, uuid, integrity_status as integrityStatus, name, timestamp FROM document_class WHERE dip_id = ?")
      .all(dipId);
    return rows.map((row) => this.rowToEntity(row));
  }

  getByStatus(status: IntegrityStatusEnum): DocumentClass[] {
    const rows = this.db
      .prepare<
        [string],
        DocumentClassRow
      >("SELECT id, dip_id as dipId, uuid, integrity_status as integrityStatus, name, timestamp FROM document_class WHERE integrity_status = ?")
      .all(status);
    return rows.map((row) => this.rowToEntity(row));
  }

  save(documentClass: DocumentClass): DocumentClass {
    const result = this.db
      .prepare(
        "INSERT INTO document_class (dip_id, uuid, name, timestamp) VALUES (?, ?, ?, ?)",
      )
      .run(
        documentClass.getProcessId(),
        documentClass.getUuid(),
        documentClass.getName(),
        documentClass.getTimestamp(),
      );
    save(documentClass: DocumentClass): DocumentClass {
        const result = this.db
            .prepare('INSERT INTO document_class (dip_id, uuid, name, timestamp) VALUES (?, ?, ?, ?)')
            .run(documentClass.getProcessId(), documentClass.getUuid(), documentClass.getName(), documentClass.getTimestamp());

    return DocumentClass.fromDB({
      id: result.lastInsertRowid as number,
      dipId: documentClass.getProcessId(),
      uuid: documentClass.getUuid(),
      integrityStatus: IntegrityStatusEnum.UNKNOWN,
      name: documentClass.getName(),
      timestamp: documentClass.getTimestamp(),
    });
  }
        return DocumentClass.fromDB({
            id: result.lastInsertRowid as number,
            dipId: documentClass.getProcessId(),
            uuid: documentClass.getUuid(),
            integrityStatus: IntegrityStatusEnum.UNKNOWN,
            name: documentClass.getName(),
            timestamp: documentClass.getTimestamp(),
        });
    }

    search(query: string): DocumentClass[] | null {
        const result = this.db
            .prepare<[string], DocumentClassRow>(
                `SELECT id, dip_id as dipId, uuid, integrity_status as integrityStatus, name, timestamp 
                 FROM document_class 
                 WHERE name LIKE ?`
            )
            .all(`%${query}%`);

        return result.length > 0 ? result.map(row => this.rowToEntity(row)) : null;
    }

  updateIntegrityStatus(id: number, status: IntegrityStatusEnum): void {
    this.db
      .prepare("UPDATE document_class SET integrity_status = ? WHERE id = ?")
      .run(status, id);
  }
}
