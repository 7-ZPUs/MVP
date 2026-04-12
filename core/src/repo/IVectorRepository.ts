import { Vector } from "../entity/Vector";

export interface IVectorRepository {
  saveVector(vector: Vector): Promise<void>;
  getVector(documentId: number): Promise<Float32Array | null>;
  searchSimilarVectors(
    queryVector: Float32Array,
    topK: number,
  ): Promise<Array<{ documentId: number; score: number }>>;
}
