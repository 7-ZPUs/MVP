/**
 * DocumentRepository — Infrastructure Repository (SQLite)
 *
 * Implementa IDocumentRepository usando better-sqlite3.
 * Zero business logic: solo persistenza.
 *
 * Schema gestito:
 *   document            (id, uuid, integrity_status, process_id)
 *   document_metadata   (id, document_id, name, value, type)
 */
import { inject, injectable } from "tsyringe";
import Database from "better-sqlite3";

import { Document, DocumentRow } from "../../entity/Document";
import { IntegrityStatusEnum } from "../../value-objects/IntegrityStatusEnum";
import type { IDocumentRepository } from "../IDocumentRepository";
import { DatabaseProvider, DATABASE_PROVIDER_TOKEN } from "./DatabaseProvider";
import { loadMetadata, saveMetadata } from "./MetadataHelper";

const METADATA_TABLE = "document_metadata";
const METADATA_FK = "document_id";

@injectable()
export class DocumentRepository implements IDocumentRepository {
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
            CREATE TABLE IF NOT EXISTS document (
                id               INTEGER PRIMARY KEY AUTOINCREMENT,
                uuid             TEXT    NOT NULL UNIQUE,
                integrity_status TEXT    NOT NULL DEFAULT 'UNKNOWN',
                process_id       INTEGER NOT NULL REFERENCES process(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS document_metadata (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                document_id INTEGER NOT NULL REFERENCES document(id) ON DELETE CASCADE,
                parent_id   INTEGER REFERENCES document_metadata(id) ON DELETE CASCADE,
                name        TEXT    NOT NULL,
                value       TEXT    NOT NULL,
                type        TEXT    NOT NULL DEFAULT 'string'
            );

            CREATE INDEX IF NOT EXISTS idx_document_process_id
                ON document (process_id);

            CREATE INDEX IF NOT EXISTS idx_document_integrity_status
                ON document (integrity_status);

            CREATE INDEX IF NOT EXISTS idx_document_metadata_document_id
                ON document_metadata (document_id);
        `);
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private rowToEntity(row: DocumentRow): Document {
    const metadata = loadMetadata(this.db, METADATA_TABLE, METADATA_FK, row.id);
    return Document.fromDB(row, metadata);
  }

  // -------------------------------------------------------------------------
  // IDocumentRepository implementation
  // -------------------------------------------------------------------------

  getById(id: number): Document | null {
    const row = this.db
      .prepare<[number], DocumentRow>(
        `SELECT id, uuid, integrity_status as integrityStatus, process_id as processId 
                 FROM document WHERE id = ?`,
      )
      .get(id);
    return row ? this.rowToEntity(row) : null;
  }

  getByProcessId(processId: number): Document[] {
    const rows = this.db
      .prepare<[number], DocumentRow>(
        `SELECT id, uuid, integrity_status as integrityStatus, process_id as processId
                 FROM document WHERE process_id = ? ORDER BY id`,
      )
      .all(processId);
    return rows.map((r) => this.rowToEntity(r));
  }

  getByStatus(status: IntegrityStatusEnum): Document[] {
    const rows = this.db
      .prepare<[string], DocumentRow>(
        `SELECT id, uuid, integrity_status as integrityStatus, process_id as processId
                 FROM document WHERE integrity_status = ? ORDER BY id`,
      )
      .all(status);
    return rows.map((r) => this.rowToEntity(r));
  }

  save(document: Document): Document {
    const metadata = document.getMetadata();

    const result = this.db
      .prepare(
        `
                INSERT INTO document (uuid, integrity_status, process_id) 
                VALUES (?, ?, (SELECT id FROM process WHERE uuid = ?))
                ON CONFLICT(uuid) DO UPDATE SET 
                    process_id = excluded.process_id,
                    integrity_status = excluded.integrity_status
            `,
      )
      .run(
        document.getUuid(),
        IntegrityStatusEnum.UNKNOWN,
        document.getProcessUuid(),
      );

    let id = result.lastInsertRowid as number;
    if (!id) {
      const row = this.db
        .prepare("SELECT id FROM document WHERE uuid = ?")
        .get(document.getUuid()) as { id: number };
      if (row) {
        id = row.id;
      }
    }

    // Clean up old metadata before inserting new set
    this.db
      .prepare(`DELETE FROM ${METADATA_TABLE} WHERE ${METADATA_FK} = ?`)
      .run(id);

    saveMetadata(this.db, METADATA_TABLE, METADATA_FK, id, metadata);

    return this.getById(id)!;
  }

  updateIntegrityStatus(id: number, status: IntegrityStatusEnum): void {
    this.db
      .prepare("UPDATE document SET integrity_status = ? WHERE id = ?")
      .run(status, id);
  }

  getAggregatedIntegrityStatusByProcessId(
    processId: number,
  ): IntegrityStatusEnum {
    const row = this.db
      .prepare<
        [number],
        { total: number; invalidCount: number; unknownCount: number }
      >(
        `SELECT
                    COUNT(*) AS total,
                    SUM(CASE WHEN integrity_status = 'INVALID' THEN 1 ELSE 0 END) AS invalidCount,
                    SUM(CASE WHEN integrity_status = 'UNKNOWN' THEN 1 ELSE 0 END) AS unknownCount
                 FROM document
                 WHERE process_id = ?`,
      )
      .get(processId);

    const total = row?.total ?? 0;
    const invalidCount = row?.invalidCount ?? 0;
    const unknownCount = row?.unknownCount ?? 0;

    if (!total) {
      return IntegrityStatusEnum.UNKNOWN;
    }

    if (invalidCount) {
      return IntegrityStatusEnum.INVALID;
    }

    if (unknownCount) {
      return IntegrityStatusEnum.UNKNOWN;
    }

    return IntegrityStatusEnum.VALID;
  }
}
