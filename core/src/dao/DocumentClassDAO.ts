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
    return DocumentClassMapper.toDomain(row);
  }

  getById(id: number): DocumentClass | null {
    const row = this.db
      .prepare<
        [number],
        DocumentClassPersistenceRow
      >(
        `SELECT dc.id,
                dc.dip_id as dipId,
                d.uuid as dipUuid,
                dc.uuid,
                dc.integrity_status as integrityStatus,
                dc.name,
                dc.timestamp
         FROM document_class dc
         JOIN dip d ON d.id = dc.dip_id
         WHERE dc.id = ?`,
      )
      .get(id);
    return row ? this.rowToEntity(row) : null;
  }

  getByDipId(dipId: number): DocumentClass[] {
    const rows = this.db
      .prepare<
        [number],
        DocumentClassPersistenceRow
      >(
        `SELECT dc.id,
                dc.dip_id as dipId,
                d.uuid as dipUuid,
                dc.uuid,
                dc.integrity_status as integrityStatus,
                dc.name,
                dc.timestamp
         FROM document_class dc
         JOIN dip d ON d.id = dc.dip_id
         WHERE dc.dip_id = ?`,
      )
      .all(dipId);
    return rows.map((row) => this.rowToEntity(row));
  }

  getByStatus(status: IntegrityStatusEnum): DocumentClass[] {
    const rows = this.db
      .prepare<
        [string],
        DocumentClassPersistenceRow
      >(
        `SELECT dc.id,
                dc.dip_id as dipId,
                d.uuid as dipUuid,
                dc.uuid,
                dc.integrity_status as integrityStatus,
                dc.name,
                dc.timestamp
         FROM document_class dc
         JOIN dip d ON d.id = dc.dip_id
         WHERE dc.integrity_status = ?`,
      )
      .all(status);
    return rows.map((row) => this.rowToEntity(row));
  }

  save(documentClass: DocumentClass): DocumentClass {
    this.db
      .prepare(
        `
                INSERT INTO document_class (dip_id, uuid, name, timestamp) 
                VALUES ((SELECT id FROM dip WHERE uuid = ?), ?, ?, ?)
                ON CONFLICT(uuid) DO UPDATE SET 
                    dip_id = excluded.dip_id,
                    name = excluded.name,
                    timestamp = excluded.timestamp
            `,
      )
      .run(
        documentClass.getDipUuid(),
        documentClass.getUuid(),
        documentClass.getName(),
        documentClass.getTimestamp(),
      );

    const row = this.db
      .prepare("SELECT id FROM document_class WHERE uuid = ?")
      .get(documentClass.getUuid()) as { id: number } | undefined;

    const id = row?.id;
    if (!id) {
      throw new Error(
        `Failed to save DocumentClass with uuid=${documentClass.getUuid()}`,
      );
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
        `SELECT dc.id,
                dc.dip_id as dipId,
                d.uuid as dipUuid,
                dc.uuid,
                dc.integrity_status as integrityStatus,
                dc.name,
                dc.timestamp
         FROM document_class dc
         JOIN dip d ON d.id = dc.dip_id
         WHERE dc.name LIKE ?`,
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

  getAggregatedIntegrityStatusByDipId(dipId: number): IntegrityStatusEnum {
    const row = this.db
      .prepare<
        [number],
        { total: number; invalidCount: number; unknownCount: number }
      >(
        `SELECT
                    COUNT(*) AS total,
                    SUM(CASE WHEN integrity_status = 'INVALID' THEN 1 ELSE 0 END) AS invalidCount,
                    SUM(CASE WHEN integrity_status = 'UNKNOWN' THEN 1 ELSE 0 END) AS unknownCount
                 FROM document_class
                 WHERE dip_id = ?`,
      )
      .get(dipId);

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
