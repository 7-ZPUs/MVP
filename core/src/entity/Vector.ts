export class Vector {
  constructor(
    private readonly documentId: number,
    private readonly embedding: Float32Array,
  ) {}

  public getDocumentId(): number {
    return this.documentId;
  }

  public getEmbedding(): Float32Array {
    return this.embedding;
  }
}
