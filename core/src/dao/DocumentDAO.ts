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
import {
  DATABASE_PROVIDER_TOKEN,
  DatabaseProvider,
} from "../repo/impl/DatabaseProvider";
import {
  DocumentMapper,
  DocumentPersistenceRow,
} from "./mappers/DocumentMapper";
import { Document } from "../entity/Document";
import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";
import { loadMetadata, saveMetadata } from "./MetadataHelper";
import { IDocumentDAO } from "./IDocumentDAO";

const METADATA_TABLE = "document_metadata";
const METADATA_FK = "document_id";

@injectable()
export class DocumentDAO implements IDocumentDAO {
  private readonly db: Database.Database;

  constructor(
    @inject(DATABASE_PROVIDER_TOKEN)
    private readonly dbProvider: DatabaseProvider,
  ) {
    this.db = dbProvider.db;
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private rowToEntity(row: DocumentPersistenceRow): Document {
    const metadata = loadMetadata(this.db, METADATA_TABLE, METADATA_FK, row.id);
    return DocumentMapper.toDomain(row, metadata);
  }

  // -------------------------------------------------------------------------
  // IDocumentRepository implementation
  // -------------------------------------------------------------------------

  getById(id: number): Document | null {
    const row = this.db
      .prepare<[number], DocumentPersistenceRow>(
        `SELECT d.id,
                d.uuid,
                d.integrity_status as integrityStatus,
                d.process_id as processId,
                p.uuid as processUuid
         FROM document d
         JOIN process p ON p.id = d.process_id
         WHERE d.id = ?`,
      )
      .get(id);
    return row ? this.rowToEntity(row) : null;
  }

  getByProcessId(processId: number): Document[] {
    const rows = this.db
      .prepare<[number], DocumentPersistenceRow>(
        `SELECT d.id,
                d.uuid,
                d.integrity_status as integrityStatus,
                d.process_id as processId,
                p.uuid as processUuid
         FROM document d
         JOIN process p ON p.id = d.process_id
         WHERE d.process_id = ?
         ORDER BY d.id`,
      )
      .all(processId);
    return rows.map((r) => this.rowToEntity(r));
  }

  getByStatus(status: IntegrityStatusEnum): Document[] {
    const rows = this.db
      .prepare<[string], DocumentPersistenceRow>(
        `SELECT d.id,
                d.uuid,
                d.integrity_status as integrityStatus,
                d.process_id as processId,
                p.uuid as processUuid
         FROM document d
         JOIN process p ON p.id = d.process_id
         WHERE d.integrity_status = ?
         ORDER BY d.id`,
      )
      .all(status);
    return rows.map((r) => this.rowToEntity(r));
  }

  save(document: Document): Document {
    const metadata = document.getMetadata();

    this.db
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

    const row = this.db
      .prepare("SELECT id FROM document WHERE uuid = ?")
      .get(document.getUuid()) as { id: number } | undefined;

    const id = row?.id;
    if (!id) {
      throw new Error(`Failed to save Document with uuid=${document.getUuid()}`);
    }

    // Clean up old metadata before inserting new set
    this.db
      .prepare(`DELETE FROM ${METADATA_TABLE} WHERE ${METADATA_FK} = ?`)
      .run(id);

    saveMetadata(this.db, METADATA_TABLE, METADATA_FK, id, metadata);

    const saved = this.getById(id);
    if (!saved) {
      throw new Error(`Failed to rehydrate Document with id=${id}`);
    }
    return saved;
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
