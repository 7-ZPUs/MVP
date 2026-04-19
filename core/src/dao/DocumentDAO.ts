/**
 * DocumentPersistenceAdapter — Infrastructure Repository (SQLite)
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
import { DocumentMetadataQueryBuilder } from "./query/DocumentMetadataQueryBuilder";
import {
  DocumentJsonPersistenceRow,
  DocumentMapper,
} from "./mappers/DocumentMapper";
import { SearchDocumentsQuery } from "../entity/search/SearchQuery.model";

@injectable()
export class DocumentDAO {
  private readonly queryBuilder = new DocumentMetadataQueryBuilder();

  constructor(
    @inject(SQLITE_DB_TOKEN)
    private readonly db: Database.Database,
  ) {}

  private toBuffer(vector: Float32Array): Buffer {
    return Buffer.from(vector.buffer, vector.byteOffset, vector.byteLength);
  }

  private bufferToVector(buffer: Buffer): Float32Array {
    const view = new Float32Array(
      buffer.buffer,
      buffer.byteOffset,
      buffer.byteLength / Float32Array.BYTES_PER_ELEMENT,
    );
    
    return new Float32Array(view);
  }

  private cosineSimilarity(a: Float32Array, b: Float32Array): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i += 1) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private hasTable(tableName: string): boolean {
    const row = this.db
      .prepare<[string], { present: number }>(
        `SELECT 1 as present
         FROM sqlite_master
         WHERE type = 'table' AND name = ?
         LIMIT 1`,
      )
      .get(tableName);

    return row?.present === 1;
  }

  getById(id: number): DocumentJsonPersistenceRow | null {
    const row = this.db
      .prepare<[number], DocumentJsonPersistenceRow>(
        `SELECT id, uuid, integrity_status as integrityStatus, process_id as processId,
                metadata as metadataJson
                 FROM document WHERE id = ?`,
      )
      .get(id);
    return row ?? null;
  }

  getByProcessId(processId: number): DocumentJsonPersistenceRow[] {
    const rows = this.db
      .prepare<[number], DocumentJsonPersistenceRow>(
        `SELECT id, uuid, integrity_status as integrityStatus, process_id as processId,
                metadata as metadataJson
                 FROM document WHERE process_id = ? ORDER BY id`,
      )
      .all(processId);
    return rows;
  }

  getByStatus(status: IntegrityStatusEnum): DocumentJsonPersistenceRow[] {
    const rows = this.db
      .prepare<[string], DocumentJsonPersistenceRow>(
        `SELECT id, uuid, integrity_status as integrityStatus, process_id as processId,
                metadata as metadataJson
                 FROM document WHERE integrity_status = ? ORDER BY id`,
      )
      .all(status);
    return rows;
  }

  searchDocument(filters: SearchDocumentsQuery): DocumentJsonPersistenceRow[] {
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
    return rows;
  }

  async searchDocumentSemantic(
    queryVector: Float32Array,
  ): Promise<Array<{ row: DocumentJsonPersistenceRow; score: number }>> {
    if (queryVector.length === 0 || !this.hasTable("document_vector")) {
      return [];
    }

    const rows = this.db
      .prepare<
        [],
        { documentId: number; embedding: Buffer }
      >("SELECT document_id as documentId, embedding FROM document_vector")
      .all();

    return rows
      .map(({ documentId, embedding }) => {
        const candidateVector = this.bufferToVector(embedding);
        if (candidateVector.length !== queryVector.length) {
          return null;
        }

        const row = this.getById(documentId);
        if (!row) return null;

        return {
          row,
          score: this.cosineSimilarity(queryVector, candidateVector),
        };
      })
      .sort((a, b) => (b?.score ?? -Infinity) - (a?.score ?? -Infinity))
      .slice(0, 10)
      .filter(
        (r): r is { row: DocumentJsonPersistenceRow; score: number } =>
          r !== null,
      );
  }

  getDistinctCustomMetadataKeys(dipId: number | null): string[] {
    const rows = this.db
      .prepare<
        [number | null, number | null, number | null, number | null],
        { keyName: string }
      >(
        `
          WITH direct_custom_keys AS (
            SELECT DISTINCT dm.name AS keyName
            FROM document_metadata dm
            JOIN document_metadata parent_dm ON parent_dm.id = dm.parent_id
            JOIN document d ON d.id = dm.document_id
            JOIN process p ON p.id = d.process_id
            JOIN document_class dc ON dc.id = p.document_class_id
            WHERE (? IS NULL OR dc.dip_id = ?)
              AND parent_dm.name IN ('CustomMetadata', 'ArchimemoData')

            UNION

            SELECT DISTINCT pm.name AS keyName
            FROM process_metadata pm
            JOIN process_metadata parent_pm ON parent_pm.id = pm.parent_id
            JOIN process p ON p.id = pm.process_id
            JOIN document_class dc ON dc.id = p.document_class_id
            WHERE (? IS NULL OR dc.dip_id = ?)
              AND parent_pm.name IN ('CustomMetadata', 'ArchimemoData')
          )
          SELECT DISTINCT TRIM(keyName) AS keyName
          FROM direct_custom_keys
          WHERE keyName IS NOT NULL
            AND TRIM(keyName) <> ''
            AND keyName NOT IN ('CustomMetadata', 'ArchimemoData')
          ORDER BY keyName COLLATE NOCASE ASC
        `,
      )
      .all(dipId, dipId, dipId, dipId);

    const directKeys = rows.map((row) => row.keyName);

    const documentJsonRows = this.db
      .prepare<[number | null, number | null], { metadataJson: string }>(
        `
          SELECT d.metadata as metadataJson
          FROM document d
          JOIN process p ON p.id = d.process_id
          JOIN document_class dc ON dc.id = p.document_class_id
          WHERE (? IS NULL OR dc.dip_id = ?)
        `,
      )
      .all(dipId, dipId);

    const jsonDerivedKeys = new Set<string>();
    for (const row of documentJsonRows) {
      DocumentDAO.collectCustomKeysFromDocumentJson(
        row.metadataJson,
        jsonDerivedKeys,
      );
    }

    return Array.from(
      new Set([...directKeys, ...Array.from(jsonDerivedKeys)]),
    ).sort((a, b) => a.localeCompare(b));
  }

  getIndexedDocumentsCount(): number {
    if (!this.hasTable("document_vector")) {
      return 0;
    }

    const row = this.db
      .prepare<
        [],
        { count: number }
      >("SELECT count(*) as count FROM document_vector")
      .get();
    return row?.count ?? 0;
  }

  save(document: Document): DocumentJsonPersistenceRow {
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

    const id = Number(result.lastInsertRowid);
    document.setId(id);

    const saved = this.getById(id);
    if (!saved) {
      throw new Error(
        `Failed to save Document with uuid=${document.getUuid()}`,
      );
    }
    return saved;
  }

  updateIntegrityStatus(id: number, status: IntegrityStatusEnum): void {
    this.db
      .prepare("UPDATE document SET integrity_status = ? WHERE id = ?")
      .run(status, id);
  }

  private static collectCustomKeysFromDocumentJson(
    metadataJson: string,
    out: Set<string>,
  ): void {
    if (!metadataJson || typeof metadataJson !== "string") {
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(metadataJson);
    } catch {
      return;
    }

    const customContainers = new Set(["CustomMetadata", "ArchimemoData"]);
    DocumentDAO.walkAndCollectCustomKeys(parsed, customContainers, out);
  }

  private static walkAndCollectCustomKeys(
    node: unknown,
    customContainers: Set<string>,
    out: Set<string>,
  ): void {
    if (Array.isArray(node)) {
      for (const child of node) {
        DocumentDAO.walkAndCollectCustomKeys(child, customContainers, out);
      }
      return;
    }

    if (!DocumentDAO.isPlainObject(node)) {
      return;
    }

    for (const [key, value] of Object.entries(node)) {
      if (customContainers.has(key)) {
        DocumentDAO.addDirectKeysFromCustomContainer(
          value,
          customContainers,
          out,
        );
      }
      DocumentDAO.walkAndCollectCustomKeys(value, customContainers, out);
    }
  }

  private static addDirectKeysFromCustomContainer(
    value: unknown,
    customContainers: Set<string>,
    out: Set<string>,
  ): void {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (DocumentDAO.isPlainObject(item)) {
          DocumentDAO.addObjectKeys(item, customContainers, out);
        }
      }
      return;
    }

    if (DocumentDAO.isPlainObject(value)) {
      DocumentDAO.addObjectKeys(value, customContainers, out);
    }
  }

  private static addObjectKeys(
    value: Record<string, unknown>,
    customContainers: Set<string>,
    out: Set<string>,
  ): void {
    for (const key of Object.keys(value)) {
      const trimmed = key.trim();
      if (trimmed.length > 0 && !customContainers.has(trimmed)) {
        out.add(trimmed);
      }
    }
  }

  private static isPlainObject(
    value: unknown,
  ): value is Record<string, unknown> {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }
}
