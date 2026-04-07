import { Vector } from "../entity/Vector";

export const VECTOR_DAO_TOKEN = Symbol("IVectorDAO");

export interface IVectorDAO {
  save(vector: Vector): void;
  getByDocumentId(documentId: number): Vector | null;
  searchSimilar(
    queryVector: Float32Array,
    topK: number,
  ): Array<{ documentId: number; score: number }>;
}
