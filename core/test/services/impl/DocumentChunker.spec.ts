import { describe, it, expect, vi } from "vitest";
import { Readable } from "node:stream";

import { DocumentChunker } from "../../../src/services/impl/DocumentChunker";
import { IPackageReaderPort } from "../../../src/repo/IPackageReaderPort";
import { IWordEmbedding } from "../../../src/repo/IWordEmbedding";

describe("DocumentChunker", () => {
  it("limits streamed text size to avoid huge string allocations", async () => {
    const oneMb = Buffer.alloc(1024 * 1024, "a");
    const stream = Readable.from(Array.from({ length: 20 }, () => oneMb));

    const packageReader = {
      readFileBytes: vi.fn().mockResolvedValue(stream),
    } as unknown as IPackageReaderPort;

    const embeddingAdapter = {
      generateEmbedding: vi.fn(),
      isInitialized: vi.fn(),
    } as unknown as IWordEmbedding;

    const chunker = new DocumentChunker(packageReader, embeddingAdapter);
    const text = await (chunker as any).readTextFromStream(
      "/tmp/huge-file.pdf",
    );

    expect(typeof text).toBe("string");
    expect(text.length).toBeGreaterThan(0);
    expect(text.length).toBeLessThan(10_000_000);
    expect(packageReader.readFileBytes).toHaveBeenCalledTimes(1);
  });

  it("generates embedding for small streamed content", async () => {
    const stream = Readable.from(["hello world from stream"]);

    const packageReader = {
      readFileBytes: vi.fn().mockResolvedValue(stream),
    } as unknown as IPackageReaderPort;

    const embeddingAdapter = {
      generateEmbedding: vi.fn().mockResolvedValue(new Float32Array([1, 2, 3])),
      isInitialized: vi.fn(),
    } as unknown as IWordEmbedding;

    const chunker = new DocumentChunker(packageReader, embeddingAdapter);
    const embedding = await chunker.generateDocumentEmbedding("/tmp/small.txt");

    expect(embedding).toBeInstanceOf(Float32Array);
    expect(embeddingAdapter.generateEmbedding).toHaveBeenCalled();
  });

  it("caps embedding chunk count for large content", async () => {
    const oneMb = Buffer.alloc(1024 * 1024, "b");
    const stream = Readable.from(Array.from({ length: 4 }, () => oneMb));

    const packageReader = {
      readFileBytes: vi.fn().mockResolvedValue(stream),
    } as unknown as IPackageReaderPort;

    const embeddingAdapter = {
      generateEmbedding: vi.fn().mockResolvedValue(new Float32Array([1, 2, 3])),
      isInitialized: vi.fn(),
    } as unknown as IWordEmbedding;

    const chunker = new DocumentChunker(packageReader, embeddingAdapter);
    const embedding = await chunker.generateDocumentEmbedding("/tmp/large.txt");

    expect(embedding).toBeInstanceOf(Float32Array);
    expect(embeddingAdapter.generateEmbedding).toHaveBeenCalledTimes(8);
  });
});
