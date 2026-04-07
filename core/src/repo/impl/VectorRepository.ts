import { inject, injectable } from "tsyringe";

import { IVectorRepository } from "../IVectorRepository";
import { IVectorDAO, VECTOR_DAO_TOKEN } from "../../dao/IVectorDAO";
import { Vector } from "../../entity/Vector";

@injectable()
export class VectorRepository implements IVectorRepository {
  constructor(
    @inject(VECTOR_DAO_TOKEN)
    private readonly dao: IVectorDAO,
  ) {}

  async saveVector(documentId: number, vector: Float32Array): Promise<void> {
    this.dao.save(new Vector(documentId, vector));
  }

  async getVector(documentId: number): Promise<Float32Array | null> {
    return this.dao.getByDocumentId(documentId)?.getEmbedding() ?? null;
  }

  async searchSimilarVectors(
    queryVector: Float32Array,
    topK: number,
  ): Promise<Array<{ documentId: number; score: number }>> {
    return this.dao.searchSimilar(queryVector, topK);
  }
}
