import Database from "better-sqlite3";
import { inject, injectable } from "tsyringe";

import { SQLITE_DB_TOKEN } from "../../../db/DatabaseBootstrap";
import { Vector } from "../entity/Vector";
import { IVectorDAO } from "./IVectorDAO";

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
    if (topK <= 0) {
      return [];
    }

    const rows = this.db
      .prepare<
        [],
        { documentId: number; embedding: Buffer }
      >("SELECT document_id as documentId, embedding FROM document_vector")
      .all();

    const candidates = rows
      .map((row) => {
        const candidateVector = this.bufferToVector(row.embedding);
        if (candidateVector.length !== queryVector.length) {
          return null;
        }

        return {
          documentId: row.documentId,
          score: this.cosineSimilarity(queryVector, candidateVector),
        };
      })
      .filter(
        (candidate): candidate is { documentId: number; score: number } =>
          candidate !== null,
      )
      .sort((a, b) => b.score - a.score);

    return candidates.slice(0, topK);
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
}
