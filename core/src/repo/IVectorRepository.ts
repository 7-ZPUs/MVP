export interface IVectorRepository {
  saveVector(documentId: number, vector: Float32Array): Promise<void>;
  getVector(documentId: number): Promise<Float32Array | null>;
  searchSimilarVectors(
    queryVector: Float32Array,
    topK: number,
  ): Promise<Array<{ documentId: number; score: number }>>;
}
