import { beforeEach, describe, expect, it, vi } from "vitest";

import { DocumentRepository } from "../../../src/repo/impl/DocumentRepository";
import { DocumentDAO } from "../../../src/dao/DocumentDAO";
import { Document } from "../../../src/entity/Document";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";
import { Metadata, MetadataType } from "../../../src/value-objects/Metadata";

const metadata = new Metadata("root", [], MetadataType.COMPOSITE);

describe("searchDocumentSemantic — delega al DAO", () => {
  let dao: {
    searchDocumentSemantic: ReturnType<typeof vi.fn>;
  };
  let repo: DocumentRepository;

  beforeEach(() => {
    dao = {
      searchDocumentSemantic: vi.fn(),
    };

    repo = new DocumentRepository(dao as unknown as DocumentDAO);
  });

  it("propaga la query invariata al DAO", async () => {
    dao.searchDocumentSemantic.mockResolvedValue([]);
    const queryVector = new Float32Array([0.1, 0.2, 0.3]);

    await repo.searchDocumentSemantic(queryVector);

    expect(dao.searchDocumentSemantic).toHaveBeenCalledWith(queryVector);
    expect(dao.searchDocumentSemantic).toHaveBeenCalledTimes(1);
  });

  it("ritorna i risultati semantici senza alterazioni", async () => {
    const semanticResults = [
      {
        document: new Document(
          "doc-1",
          metadata,
          "proc-1",
          IntegrityStatusEnum.UNKNOWN,
          1,
          1,
        ),
        score: 0.91,
      },
      {
        document: new Document(
          "doc-2",
          metadata,
          "proc-1",
          IntegrityStatusEnum.UNKNOWN,
          2,
          1,
        ),
        score: 0.77,
      },
    ];

    dao.searchDocumentSemantic.mockResolvedValue(semanticResults);

    const result = await repo.searchDocumentSemantic(
      new Float32Array([0.4, 0.5, 0.6]),
    );

    expect(result).toBe(semanticResults);
    expect(result).toHaveLength(2);
    expect(result[0].score).toBe(0.91);
    expect(result[1].document.getUuid()).toBe("doc-2");
  });

  it("propaga errori sollevati dal DAO", async () => {
    dao.searchDocumentSemantic.mockRejectedValue(new Error("semantic failed"));

    await expect(
      repo.searchDocumentSemantic(new Float32Array([0.7, 0.8, 0.9])),
    ).rejects.toThrow("semantic failed");
  });

  it("supporta chiamate multiple indipendenti", async () => {
    dao.searchDocumentSemantic
      .mockResolvedValueOnce([
        {
          document: new Document("doc-a", metadata, "proc-a"),
          score: 0.5,
        },
      ])
      .mockResolvedValueOnce([]);

    const first = await repo.searchDocumentSemantic(
      new Float32Array([1, 2, 3]),
    );
    const second = await repo.searchDocumentSemantic(
      new Float32Array([4, 5, 6]),
    );

    expect(first).toHaveLength(1);
    expect(second).toHaveLength(0);
    expect(dao.searchDocumentSemantic).toHaveBeenCalledTimes(2);
  });
});
