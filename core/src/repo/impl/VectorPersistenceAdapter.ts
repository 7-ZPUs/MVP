import { inject, injectable } from "tsyringe";

import type {
  IGetVectorByDocumentIdPort,
  ISaveVectorPort,
  ISearchSimilarVectorsPort,
} from "../IVectorRepository";
import { IVectorDAO, VECTOR_DAO_TOKEN } from "../../dao/IVectorDAO";
import { Vector } from "../../entity/Vector";

@injectable()
export class VectorPersistenceAdapter
  implements
    ISaveVectorPort,
    IGetVectorByDocumentIdPort,
    ISearchSimilarVectorsPort
{
  constructor(
    @inject(VECTOR_DAO_TOKEN)
    private readonly dao: IVectorDAO,
  ) {}

  async saveVector(vector: Vector): Promise<void> {
    if (!vector) throw new Error("Vector cannot be null or undefined");
    this.dao.save(vector);
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
