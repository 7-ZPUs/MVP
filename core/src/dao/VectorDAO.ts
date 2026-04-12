import Database from "better-sqlite3";
import { inject, injectable } from "tsyringe";

import { SQLITE_DB_TOKEN } from "../../../db/DatabaseBootstrap";
import { Vector } from "../entity/Vector";
import { IVectorDAO } from "./IVectorDAO";

const VSS_TABLE = "document_vector_vss";

@injectable()
export class VectorDAO implements IVectorDAO {
  constructor(
    @inject(SQLITE_DB_TOKEN)
    private readonly db: Database.Database,
  ) {}

  save(vector: Vector): void {
    const embedding = this.toBuffer(vector.getEmbedding());
    this.db
      .prepare(
        `INSERT INTO document_vector (document_id, embedding)
         VALUES (?, ?)
         ON CONFLICT(document_id) DO UPDATE SET
           embedding = excluded.embedding`,
      )
      .run(vector.getDocumentId(), embedding);

    this.db
      .prepare(`DELETE FROM ${VSS_TABLE} WHERE rowid = ?`)
      .run(vector.getDocumentId());
    this.db
      .prepare(`INSERT INTO ${VSS_TABLE}(rowid, embedding) VALUES (?, ?)`)
      .run(vector.getDocumentId(), embedding);
  }

  getByDocumentId(documentId: number): Vector | null {
    const row = this.db
      .prepare<
        [number],
        { embedding: Buffer }
      >("SELECT embedding FROM document_vector WHERE document_id = ?")
      .get(documentId);

    if (!row) {
      return null;
    }

    return new Vector(documentId, this.bufferToVector(row.embedding));
  }

  searchSimilar(
    queryVector: Float32Array,
    topK: number,
  ): Array<{ documentId: number; score: number }> {
    if (topK <= 0 || queryVector.length === 0) {
      return [];
    }

    const rows = this.db
      .prepare<[Buffer, number], { documentId: number; distance: number }>(
        `SELECT rowid as documentId, distance
         FROM ${VSS_TABLE}
         WHERE vss_search(embedding, ?)
         LIMIT ?`,
      )
      .all(this.toBuffer(queryVector), topK);

    return rows.map((row) => ({
      documentId: row.documentId,
      // sqlite-vss returns distance (lower is better); convert to a monotonic similarity score.
      score: 1 / (1 + row.distance),
    }));
  }

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
}
