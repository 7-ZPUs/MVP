import { describe, it, expect, vi } from "vitest";
import { Readable } from "node:stream";

import { EmbeddingService } from "../../../src/services/impl/EmbeddingService";
import { IFileSystemPort } from "../../../src/repo/impl/utils/IFileSystemProvider";
import { IWordEmbedding } from "../../../src/repo/IWordEmbedding";
import { File } from "../../../src/entity/File";

describe("EmbeddingService", () => {
  it("limits streamed text size to avoid huge string allocations", async () => {
    const oneMb = Buffer.alloc(1024 * 1024, "a");
    const stream = Readable.from(Array.from({ length: 20 }, () => oneMb));

    const fileSystemProvider = {
      openReadStream: vi.fn().mockResolvedValue(stream),
    } as unknown as IFileSystemPort;

    const embeddingAdapter = {
      generateEmbedding: vi.fn(),
      isInitialized: vi.fn(),
    } as unknown as IWordEmbedding;

    const chunker = new EmbeddingService(embeddingAdapter, fileSystemProvider);
    const text = await (chunker as any).readTextFromStream(
      "/tmp/huge-file.pdf",
    );

    expect(typeof text).toBe("string");
    expect(text.length).toBeGreaterThan(0);
    expect(text.length).toBeLessThan(10_000_000);
    expect(fileSystemProvider.openReadStream).toHaveBeenCalledTimes(1);
  });

  it("generates embedding for small streamed content", async () => {
    const stream = Readable.from(["hello world from stream"]);

    const fileSystemProvider = {
      openReadStream: vi.fn().mockResolvedValue(stream),
    } as unknown as IFileSystemPort;

    const embeddingAdapter = {
      generateEmbedding: vi.fn().mockResolvedValue(new Float32Array([1, 2, 3])),
      isInitialized: vi.fn(),
    } as unknown as IWordEmbedding;

    const chunker = new EmbeddingService(embeddingAdapter, fileSystemProvider);
    const file = new File(
      "small.txt",
      "small.txt",
      "hash",
      true,
      "file-1",
      "doc-1",
    );
    const embedding = await chunker.generateDocumentEmbedding(file);

    expect(embedding).toBeInstanceOf(Float32Array);
    expect(embeddingAdapter.generateEmbedding).toHaveBeenCalled();
  });

  it("caps embedding chunk count for large content", async () => {
    const oneMb = Buffer.alloc(1024 * 1024, "b");
    const stream = Readable.from(Array.from({ length: 4 }, () => oneMb));

    const fileSystemProvider = {
      openReadStream: vi.fn().mockResolvedValue(stream),
    } as unknown as IFileSystemPort;

    const embeddingAdapter = {
      generateEmbedding: vi.fn().mockResolvedValue(new Float32Array([1, 2, 3])),
      isInitialized: vi.fn(),
    } as unknown as IWordEmbedding;

    const chunker = new EmbeddingService(embeddingAdapter, fileSystemProvider);
    chunker.setEmbeddingConfiguration({
      chunkSize: 500,
      chunkOverlap: 50,
      maxEmbeddingChunks: 8,
    });
    const file = new File(
      "large.txt",
      "large.txt",
      "hash",
      true,
      "file-2",
      "doc-2",
    );
    const embedding = await chunker.generateDocumentEmbedding(file);

    expect(embedding).toBeInstanceOf(Float32Array);
    expect(embeddingAdapter.generateEmbedding).toHaveBeenCalledTimes(8);
  });
});
