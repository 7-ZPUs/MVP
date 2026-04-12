export const DOCUMENT_CHUNKER_TOKEN = Symbol("IEmbeddingService");

export interface IEmbeddingService {
  generateDocumentEmbedding(filePath: string): Promise<Float32Array | null>;
}
