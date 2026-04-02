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
import { SQLITE_DB_TOKEN } from "../../../db/DatabaseBootstrap";
import {
  DocumentMapper,
  DocumentPersistenceRow,
} from "./mappers/DocumentMapper";
import { Document } from "../entity/Document";
import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";
import { loadMetadata, saveMetadata } from "./MetadataHelper";
import { IDocumentDAO } from "./IDocumentDAO";
import { SearchFilters } from "../../../shared/domain/metadata";

const METADATA_TABLE = "document_metadata";
const METADATA_FK = "document_id";

@injectable()
export class DocumentDAO implements IDocumentDAO {
  constructor(
    @inject(SQLITE_DB_TOKEN)
    private readonly db: Database.Database,
  ) {}

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private rowToEntity(row: DocumentPersistenceRow): Document {
    const metadata = loadMetadata(this.db, METADATA_TABLE, METADATA_FK, row.id);
    return DocumentMapper.fromPersistence(row, metadata);
  }

  private toBuffer(vector: Float32Array): Buffer {
    // converte un Float32Array in Buffer per sqlite-vss
    return Buffer.from(vector.buffer);
  }

  // -------------------------------------------------------------------------
  // IDocumentRepository implementation
  // -------------------------------------------------------------------------

  getById(id: number): Document | null {
    const row = this.db
      .prepare<[number], DocumentPersistenceRow>(
        `SELECT id, uuid, integrity_status as integrityStatus, process_id as processId 
                 FROM document WHERE id = ?`,
      )
      .get(id);
    return row ? this.rowToEntity(row) : null;
  }

  getByProcessId(processId: number): Document[] {
    const rows = this.db
      .prepare<[number], DocumentPersistenceRow>(
        `SELECT id, uuid, integrity_status as integrityStatus, process_id as processId
                 FROM document WHERE process_id = ? ORDER BY id`,
      )
      .all(processId);
    return rows.map((r) => this.rowToEntity(r));
  }

  getByStatus(status: IntegrityStatusEnum): Document[] {
    const rows = this.db
      .prepare<[string], DocumentPersistenceRow>(
        `SELECT id, uuid, integrity_status as integrityStatus, process_id as processId
                 FROM document WHERE integrity_status = ? ORDER BY id`,
      )
      .all(status);
    return rows.map((r) => this.rowToEntity(r));
  }



  searchDocument(filters: SearchFilters): Document[] {
    const conditions: string[] = [];
    const values: unknown[] = [];
    const documentTypes = [
      "DocumentoInformatico",
      "DocumentoAmministrativoInformatico",
      "AggregazioneDocumentale",
    ];

    const addMeta = (key: string, value: unknown) => {
      if (
        value === null ||
        value === undefined ||
        (!documentTypes.includes(key) && value === "")
      )
        return;
      conditions.push(`
            EXISTS (
                SELECT 1 FROM document_metadata
                WHERE document_id = document.id
                AND name = ?
            AND value = ? COLLATE NOCASE
            )
        `);
      values.push(key, String(value));
    };

    if (filters.filters) {
      for (const filter of filters.filters) {
        addMeta(filter.key, filter.value);
      }
    }

    // Qui andrebbe gestito il subject se necessario dal database
    // per ora manteniamo la logica precedente intatta se il DB lo cercava, ma il DB prima non cercava il subject apparentemente (non gestito nel vecchio codice).

    if (conditions.length === 0) return [];

    const sql = `
            SELECT id, uuid,
                integrity_status as integrityStatus,
                process_id as processId
            FROM document
            WHERE ${conditions.join(" AND ")}
        `;

    const rows = this.db
      .prepare<unknown[], DocumentPersistenceRow>(sql)
      .all(...values);
    return rows.map((row) => this.rowToEntity(row));
  }

  async searchDocumentSemantic(
    queryVector: Float32Array,
  ): Promise<Array<{ document: Document; score: number }>> {
    const rows = this.db // interroga la tabella virtuale usando vss_search per trovare i documenti più simili al vettore di query
      .prepare<[Buffer, number], { rowid: number; distance: number }>(
        `SELECT rowid, distance
                 FROM vss_documents
                 WHERE vss_search(embedding, ?)
                 LIMIT ?`,
      )
      .all(this.toBuffer(queryVector), 10); // to buffer perchè sqlite-vss si aspetta un buffer, non un Float32Array.

    return rows // per ogni risultato, recupera il documento originale usando getById e calcola un punteggio di similarità (1 - distanza)
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
}
