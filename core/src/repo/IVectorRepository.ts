import { Vector } from "../entity/Vector";

export const VECTOR_SAVE_PORT_TOKEN = Symbol("ISaveVectorPort");
export const VECTOR_GET_BY_DOCUMENT_ID_PORT_TOKEN = Symbol(
  "IGetVectorByDocumentIdPort",
);
export const VECTOR_SEARCH_SIMILAR_PORT_TOKEN = Symbol(
  "ISearchSimilarVectorsPort",
);

export interface ISaveVectorPort {
  saveVector(vector: Vector): Promise<void>;
}

export interface IGetVectorByDocumentIdPort {
  getVector(documentId: number): Promise<Float32Array | null>;
}

export interface ISearchSimilarVectorsPort {
  searchSimilarVectors(
    queryVector: Float32Array,
    topK: number,
  ): Promise<Array<{ documentId: number; score: number }>>;
}
