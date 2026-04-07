export const DOCUMENT_CHUNKER_TOKEN = Symbol("IDocumentChunker");

export interface IDocumentChunker {
  generateDocumentEmbedding(filePath: string): Promise<Float32Array | null>;
}
