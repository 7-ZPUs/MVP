/**
 * DocumentRepository — Infrastructure Repository (SQLite)
 *
 * Implementa IDocumentRepository usando better-sqlite3.
 * Zero business logic: solo persistenza.
 *
 * Schema gestito:
 *   document            (id, uuid, integrity_status, process_id, metadata)
 */
import { inject, injectable } from "tsyringe";
import Database from "better-sqlite3";
import { SQLITE_DB_TOKEN } from "../../../db/DatabaseBootstrap";
import { Document } from "../entity/Document";
import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";
import { IDocumentDAO } from "./IDocumentDAO";
import { DocumentMetadataQueryBuilder } from "./query/DocumentMetadataQueryBuilder";
import {
  DocumentJsonPersistenceRow,
  DocumentMapper,
} from "./mappers/DocumentMapper";
import { SearchDocumentsQuery } from "../entity/search/SearchQuery.model";

@injectable()
export class DocumentDAO implements IDocumentDAO {
  private readonly queryBuilder = new DocumentMetadataQueryBuilder();

  constructor(
    @inject(SQLITE_DB_TOKEN)
    private readonly db: Database.Database,
  ) {}

  private toBuffer(vector: Float32Array): Buffer {
    return Buffer.from(vector.buffer);
  }

  private rowToEntity(row: DocumentJsonPersistenceRow): Document {
    return DocumentMapper.fromJsonPersistence(row);
  }

  getById(id: number): Document | null {
    const row = this.db
      .prepare<[number], DocumentJsonPersistenceRow>(
        `SELECT id, uuid, integrity_status as integrityStatus, process_id as processId,
                metadata as metadataJson
                 FROM document WHERE id = ?`,
      )
      .get(id);
    return row ? this.rowToEntity(row) : null;
  }

  getByProcessId(processId: number): Document[] {
    const rows = this.db
      .prepare<[number], DocumentJsonPersistenceRow>(
        `SELECT id, uuid, integrity_status as integrityStatus, process_id as processId,
                metadata as metadataJson
                 FROM document WHERE process_id = ? ORDER BY id`,
      )
      .all(processId);
    return rows.map((row) => this.rowToEntity(row));
  }

  getByStatus(status: IntegrityStatusEnum): Document[] {
    const rows = this.db
      .prepare<[string], DocumentJsonPersistenceRow>(
        `SELECT id, uuid, integrity_status as integrityStatus, process_id as processId,
                metadata as metadataJson
                 FROM document WHERE integrity_status = ? ORDER BY id`,
      )
      .all(status);
    return rows.map((row) => this.rowToEntity(row));
  }

  searchDocument(filters: SearchDocumentsQuery): Document[] {
    const builtQuery = this.queryBuilder.build(filters);
    if (builtQuery.sql.length === 0) {
      return [];
    }

    const sql = `
            SELECT id, uuid,
                integrity_status as integrityStatus,
                process_id as processId,
                metadata as metadataJson
            FROM document
            WHERE ${builtQuery.sql}
        `;

    const rows = this.db
      .prepare<unknown[], DocumentJsonPersistenceRow>(sql)
      .all(...builtQuery.params);
    return rows.map((row) => this.rowToEntity(row));
  }

  async searchDocumentSemantic(
    queryVector: Float32Array,
  ): Promise<Array<{ document: Document; score: number }>> {
    const rows = this.db
      .prepare<[Buffer, number], { rowid: number; distance: number }>(
        `SELECT rowid, distance
                 FROM vss_documents
                 WHERE vss_search(embedding, ?)
                 LIMIT ?`,
      )
      .all(this.toBuffer(queryVector), 10);

    return rows
      .map(({ rowid, distance }) => {
        const doc = this.getById(rowid);
        if (!doc) return null;
        return { document: doc, score: 1 - distance };
      })
      .filter((r): r is { document: Document; score: number } => r !== null);
  }

  getIndexedDocumentsCount(): number {
    const row = this.db
      .prepare<
        [],
        { count: number }
      >("SELECT count(*) as count FROM vss_documents")
      .get();
    return row?.count ?? 0;
  }

  save(document: Document): Document {
    const metadataJson = JSON.stringify(
      DocumentMapper.metadataToJson(document.getMetadata()),
    );

    const result = this.db
      .prepare(
        `
                INSERT INTO document (uuid, integrity_status, process_id, metadata) 
                VALUES (?, ?, (SELECT id FROM process WHERE uuid = ?), ?)
            `,
      )
      .run(
        document.getUuid(),
        IntegrityStatusEnum.UNKNOWN,
        document.getProcessUuid(),
        metadataJson,
      );

    document.setId(Number(result.lastInsertRowid));
    return document;
  }

  updateIntegrityStatus(id: number, status: IntegrityStatusEnum): void {
    this.db
      .prepare("UPDATE document SET integrity_status = ? WHERE id = ?")
      .run(status, id);
  }
}
