export const WORD_EMBEDDING_PORT_TOKEN = Symbol("IWordEmbedding");

export interface IWordEmbedding {
  generateEmbedding(text: string): Promise<Float32Array>;

  isInitialized(): boolean;
}
