import { inject, injectable } from "tsyringe";

import {
  IPackageReaderPort,
  PACKAGE_READER_PORT_TOKEN,
} from "../../repo/IPackageReaderPort";
import {
  IWordEmbedding,
  WORD_EMBEDDING_PORT_TOKEN,
} from "../../repo/IWordEmbedding";
import { IDocumentChunker } from "../IDocumentChunker";

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;
const MAX_TEXT_BYTES = 400_000;
const MAX_EMBEDDING_CHUNKS = 8;

@injectable()
export class DocumentChunker implements IDocumentChunker {
  constructor(
    @inject(PACKAGE_READER_PORT_TOKEN)
    private readonly packageReader: IPackageReaderPort,
    @inject(WORD_EMBEDDING_PORT_TOKEN)
    private readonly embeddingAdapter: IWordEmbedding,
  ) {}

  async generateDocumentEmbedding(
    filePath: string,
  ): Promise<Float32Array | null> {
    const text = await this.readTextFromStream(filePath);
    if (!text) {
      return null;
    }

    const chunks = this.chunkText(text, CHUNK_SIZE, CHUNK_OVERLAP);
    const limitedChunks = chunks.slice(0, MAX_EMBEDDING_CHUNKS);
    if (limitedChunks.length === 0) {
      return null;
    }

    const chunkEmbeddings: Float32Array[] = [];
    for (const chunk of limitedChunks) {
      const embedding = await this.embeddingAdapter.generateEmbedding(chunk);
      if (embedding.length > 0) {
        chunkEmbeddings.push(embedding);
      }
    }

    return this.meanEmbedding(chunkEmbeddings);
  }

  private async readTextFromStream(filePath: string): Promise<string> {
    const stream = await this.packageReader.readFileBytes(filePath);
    const textParts: string[] = [];
    let processedBytes = 0;

    for await (const rawChunk of stream) {
      const remainingBytes = MAX_TEXT_BYTES - processedBytes;
      if (remainingBytes <= 0) {
        break;
      }

      const chunkBuffer =
        typeof rawChunk === "string"
          ? Buffer.from(rawChunk)
          : Buffer.from(rawChunk as Uint8Array);

      const boundedChunk =
        chunkBuffer.byteLength > remainingBytes
          ? chunkBuffer.subarray(0, remainingBytes)
          : chunkBuffer;
      processedBytes += boundedChunk.byteLength;

      const normalizedChunk = boundedChunk
        .toString("utf-8")
        .replaceAll(/\s+/g, " ")
        .trim();

      if (normalizedChunk.length > 0) {
        textParts.push(normalizedChunk);
      }
    }

    const text = textParts.join(" ").trim();

    return text;
  }

  private chunkText(text: string, size: number, overlap: number): string[] {
    if (text.length === 0 || size <= 0 || overlap < 0 || overlap >= size) {
      return [];
    }

    const chunks: string[] = [];
    const step = size - overlap;

    for (let start = 0; start < text.length; start += step) {
      const end = Math.min(start + size, text.length);
      const chunk = text.slice(start, end).trim();
      if (chunk.length > 0) {
        chunks.push(chunk);
      }
      if (end >= text.length) {
        break;
      }
    }

    return chunks;
  }

  private meanEmbedding(embeddings: Float32Array[]): Float32Array | null {
    if (embeddings.length === 0) {
      return null;
    }

    const dimension = embeddings[0].length;
    const compatible = embeddings.filter(
      (embedding) => embedding.length === dimension,
    );
    if (compatible.length === 0) {
      return null;
    }

    const accumulator = new Float32Array(dimension);
    for (const embedding of compatible) {
      for (let i = 0; i < dimension; i += 1) {
        accumulator[i] += embedding[i];
      }
    }

    for (let i = 0; i < dimension; i += 1) {
      accumulator[i] /= compatible.length;
    }

    return accumulator;
  }
}
